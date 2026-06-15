/**
 * Migrate gateway controllers: TCP ClientProxy -> GrpcRpcService
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'apps', 'api-gateway', 'src');

const CLIENT_MAP = {
  iamClient: 'MICROSERVICES_CLIENTS.IDENTITY_SERVICE',
  identityClient: 'MICROSERVICES_CLIENTS.IDENTITY_SERVICE',
  catalogClient: 'MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE',
  ecommerceClient: 'MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE',
  orderFulfillmentClient: 'MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE',
  gardenClient: 'MICROSERVICES_CLIENTS.BALCONY_SERVICE',
  balconyClient: 'MICROSERVICES_CLIENTS.BALCONY_SERVICE',
  deviceRegistryClient: 'MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE',
  iotEngineClient: 'MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE',
  telemetryClient: 'MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE',
};

const SWAGGER_TAG_MAP = {
  Auth: '01 - Auth',
  Users: '02 - Users',
  RBAC: '03 - RBAC',
  Products: '04 - Products',
  Carts: '05 - Carts',
  Orders: '06 - Orders',
  Payment: '07 - Payment',
  Transactions: '08 - Transactions',
  Shipments: '09 - Shipments',
  Addresses: '09 - Shipments',
  Dashboard: '10 - Dashboard',
  Species: '11 - Plant Wiki',
  Zones: '12 - Balcony Zones',
  'My Plants': '13 - My Plants',
  Devices: '14 - Devices',
  Telemetry: '15 - Telemetry',
  Chat: '16 - Chat',
};

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

function findBalancedParen(s, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function replaceClientCalls(content, clientName, serviceConst) {
  const needle = `this.${clientName}.send`;
  let result = '';
  let cursor = 0;

  while (cursor < content.length) {
    const idx = content.indexOf(needle, cursor);
    if (idx === -1) {
      result += content.slice(cursor);
      break;
    }

    const fvKeyword = 'firstValueFrom(';
    const fvStart = content.lastIndexOf(fvKeyword, idx);
    if (fvStart === -1 || fvStart < cursor) {
      result += content.slice(cursor, idx + needle.length);
      cursor = idx + needle.length;
      continue;
    }

    let replaceStart = fvStart;
    const lineBefore = content.slice(Math.max(0, fvStart - 12), fvStart);
    const awaitMatch = lineBefore.match(/await\s*$/);
    const hasAwait = !!awaitMatch;
    if (hasAwait) {
      replaceStart = fvStart - awaitMatch[0].length;
    }

    const fvOpen = fvStart + fvKeyword.length - 1;
    const fvClose = findBalancedParen(content, fvOpen);
    if (fvClose === -1) {
      result += content.slice(cursor, idx + needle.length);
      cursor = idx + needle.length;
      continue;
    }

    const inner = content.slice(fvOpen + 1, fvClose);
    const sendRel = inner.indexOf(needle);
    if (sendRel === -1) {
      result += content.slice(cursor, idx + needle.length);
      cursor = idx + needle.length;
      continue;
    }

    const sendOpen = sendRel + needle.length;
    if (inner[sendOpen] !== '(') {
      result += content.slice(cursor, idx + needle.length);
      cursor = idx + needle.length;
      continue;
    }

    const sendClose = findBalancedParen(inner, sendOpen);
    if (sendClose === -1) {
      result += content.slice(cursor, idx + needle.length);
      cursor = idx + needle.length;
      continue;
    }

    const sendArgs = inner.slice(sendOpen + 1, sendClose);
    const cmdMatch = sendArgs.match(/\{\s*cmd:\s*'([^']+)'\s*\}/);
    if (!cmdMatch) {
      result += content.slice(cursor, idx + needle.length);
      cursor = idx + needle.length;
      continue;
    }

    const cmd = cmdMatch[1];
    let payload = sendArgs.slice(cmdMatch.index + cmdMatch[0].length).trim();
    if (payload.startsWith(',')) payload = payload.slice(1).trim();

    const replacement = `${hasAwait ? 'await ' : ''}this.grpcRpc.send(${serviceConst}, '${cmd}', ${payload})`;

    result += content.slice(cursor, replaceStart);
    result += replacement;
    cursor = fvClose + 1;
  }

  return result;
}

function ensureGrpcRpc(content) {
  if (!content.includes('this.grpcRpc.send')) return content;

  if (!content.includes('GrpcRpcService')) {
    if (content.includes("from '@app/grpc'")) {
      content = content.replace(/import \{([^}]+)\} from '@app\/grpc';/, (m, imp) => {
        if (imp.includes('GrpcRpcService')) return m;
        const trimmed = imp.trim();
        return `import { GrpcRpcService${trimmed ? `, ${trimmed}` : ''} } from '@app/grpc';`;
      });
    } else if (content.includes("from '@app/common'")) {
      content = content.replace(
        /(import \{[^}]+\} from '@app\/common';)/,
        "$1\nimport { GrpcRpcService } from '@app/grpc';",
      );
    } else if (content.includes("from '@app/common/constants/microservice.constant'")) {
      content = content.replace(
        /(import \{[^}]+\} from '@app\/common\/constants\/microservice\.constant';)/,
        "$1\nimport { GrpcRpcService } from '@app/grpc';",
      );
    }
  }

  if (!content.includes('grpcRpc: GrpcRpcService')) {
    content = content.replace(
      /constructor\(\n(\s*)(@Inject|private|public|protected|readonly)/,
      'constructor(\n$1private readonly grpcRpc: GrpcRpcService,\n$1$2',
    );
  }

  content = content.replace(
    /\s*@Inject\(MICROSERVICES_CLIENTS\.\w+\)\s*\n\s*private readonly \w+: ClientProxy,?\n/g,
    '\n',
  );

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

  if (!content.includes('@Inject(') && content.includes('Inject')) {
    content = content.replace(/,\s*Inject\b/g, '');
    content = content.replace(/\bInject,\s*/g, '');
    content = content.replace(/\{\s*Inject\s*\}/g, '{}');
  }

  return content;
}

for (const file of walk(ROOT)) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const [client, service] of Object.entries(CLIENT_MAP)) {
    if (!content.includes(`this.${client}.send`)) continue;
    const next = replaceClientCalls(content, client, service);
    if (next !== content) {
      content = next;
      changed = true;
    }
  }

  for (const [oldTag, newTag] of Object.entries(SWAGGER_TAG_MAP)) {
    const tagRe = new RegExp(`@ApiTags\\('${oldTag.replace(/'/g, "\\'")}'\\)`);
    if (tagRe.test(content)) {
      content = content.replace(tagRe, `@ApiTags('${newTag}')`);
      changed = true;
    }
  }

  if (content.includes('this.grpcRpc.send')) {
    content = ensureGrpcRpc(content);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated', path.relative(ROOT, file));
  }
}

console.log('Done.');
