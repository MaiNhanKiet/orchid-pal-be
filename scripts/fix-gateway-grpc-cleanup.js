const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'apps', 'api-gateway', 'src');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

for (const file of walk(ROOT)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('grpcRpc')) continue;

  content = content.replace(
    /\s*@Inject\(MICROSERVICES_CLIENTS\.\w+\)\s*\n\s*private readonly \w+: ClientProxy,?\n/g,
    '\n',
  );

  if (!content.includes('grpcRpc: GrpcRpcService')) {
    content = content.replace(
      /constructor\(\n(\s*)(@Inject\('AUTOMATION'\)|private|public|protected|readonly)/,
      'constructor(\n$1private readonly grpcRpc: GrpcRpcService,\n$1$2',
    );
    content = content.replace(
      /constructor\(\n(\s*)(private readonly configService)/,
      'constructor(\n$1private readonly grpcRpc: GrpcRpcService,\n$1$2',
    );
  }

  if (!content.includes("GrpcRpcService") && content.includes('this.grpcRpc')) {
    if (content.includes("from '@app/common'")) {
      content = content.replace(
        /(import \{[^}]+\} from '@app\/common';)/,
        "$1\nimport { GrpcRpcService } from '@app/grpc';",
      );
    } else if (content.includes("microservice.constant")) {
      content = content.replace(
        /(import \{[^}]+\} from '@app\/common\/constants\/microservice\.constant';)/,
        "$1\nimport { GrpcRpcService } from '@app/grpc';",
      );
    }
  }

  content = content.replace(/,\s*\);/g, ');');
  content = content.replace(/,\s*,/g, ',');

  if (!content.match(/:\s*ClientProxy/)) {
    content = content.replace(
      /import \{ ClientProxy \} from '@nestjs\/microservices';\n/g,
      '',
    );
    content = content.replace(
      /import \{\s*([^}]*?),\s*ClientProxy\s*,?\s*([^}]*?)\s*\} from '@nestjs\/microservices';/g,
      (m, a, b) => {
        const parts = [a, b].map((p) => p.trim()).filter(Boolean);
        return parts.length
          ? `import { ${parts.join(', ')} } from '@nestjs/microservices';`
          : '';
      },
    );
    content = content.replace(
      /import \{\s*ClientProxy\s*,\s*([^}]+)\s*\} from '@nestjs\/microservices';/g,
      "import { $1 } from '@nestjs/microservices';",
    );
  }

  if (!content.includes('firstValueFrom(')) {
    content = content.replace(/import \{ firstValueFrom \} from 'rxjs';\n/g, '');
    content = content.replace(
      /import \{\s*([^}]*?),\s*firstValueFrom\s*,?\s*([^}]*?)\s*\} from 'rxjs';/g,
      (m, a, b) => {
        const parts = [a, b].map((p) => p.trim()).filter(Boolean);
        return parts.length ? `import { ${parts.join(', ')} } from 'rxjs';` : '';
      },
    );
  }

  if (!content.includes('@Inject(')) {
    content = content.replace(/,\s*Inject\b/g, '');
    content = content.replace(/\bInject,\s*/g, '');
    content = content.replace(/\{\s*Inject\s*,/g, '{');
    content = content.replace(/,\s*Inject\s*\}/g, ' }');
  }

  fs.writeFileSync(file, content);
  console.log('Fixed', path.relative(ROOT, file));
}
