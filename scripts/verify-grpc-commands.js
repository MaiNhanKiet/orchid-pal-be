/**
 * Verify gateway grpcRpc.send commands match backend @GrpcCmd handlers.
 * Run: node scripts/verify-grpc-commands.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SERVICE_MAP = {
  IDENTITY_SERVICE: 'identity-service',
  ECOMMERCE_SERVICE: 'ecommerce-service',
  BALCONY_SERVICE: 'balcony-service',
  IOT_ENGINE_SERVICE: 'iot-engine-service',
};

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

function extractGatewayCalls() {
  const calls = [];
  const gatewayDir = path.join(ROOT, 'apps', 'api-gateway', 'src');
  const re =
    /grpcRpc\.send(?:<[^>]+>)?\(\s*MICROSERVICES_CLIENTS\.(\w+)\s*,\s*'([^']+)'/g;

  for (const file of walk(gatewayDir)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const content = lines
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');
    let m;
    while ((m = re.exec(content))) {
      calls.push({
        service: m[1],
        cmd: m[2],
        file: path.relative(ROOT, file),
      });
    }
  }
  return calls;
}

function extractInternalCalls() {
  const calls = [];
  const apps = ['ecommerce-service', 'iot-engine-service'];
  const re =
    /grpcRpc\.send(?:<[^>]+>)?\(\s*MICROSERVICES_CLIENTS\.(\w+)\s*,\s*'([^']+)'/g;

  for (const app of apps) {
    const dir = path.join(ROOT, 'apps', app, 'src');
    for (const file of walk(dir)) {
      const content = fs.readFileSync(file, 'utf8');
      let m;
      while ((m = re.exec(content))) {
        calls.push({
          service: m[1],
          cmd: m[2],
          file: path.relative(ROOT, file),
          internal: true,
        });
      }
    }
  }
  return calls;
}

function extractBackendHandlers() {
  const handlers = {};
  for (const [client, app] of Object.entries(SERVICE_MAP)) {
    handlers[client] = new Set();
    const dir = path.join(ROOT, 'apps', app, 'src');
    const re = /@GrpcCmd\('([^']+)'\)/g;
    for (const file of walk(dir)) {
      const content = fs.readFileSync(file, 'utf8');
      let m;
      while ((m = re.exec(content))) {
        handlers[client].add(m[1]);
      }
    }
  }
  return handlers;
}

const gatewayCalls = extractGatewayCalls();
const internalCalls = extractInternalCalls();
const handlers = extractBackendHandlers();
const allCalls = [...gatewayCalls, ...internalCalls];

const missing = [];
const ok = [];

for (const call of allCalls) {
  const set = handlers[call.service];
  if (!set) {
    missing.push({ ...call, reason: 'unknown service constant' });
  } else if (!set.has(call.cmd)) {
    missing.push({ ...call, reason: 'no @GrpcCmd handler' });
  } else {
    ok.push(call);
  }
}

const usedCmds = new Set(allCalls.map((c) => `${c.service}:${c.cmd}`));
const orphanHandlers = [];
for (const [service, cmds] of Object.entries(handlers)) {
  for (const cmd of cmds) {
    if (!allCalls.some((c) => c.service === service && c.cmd === cmd)) {
      orphanHandlers.push({ service, cmd });
    }
  }
}

console.log('=== gRPC Command Audit ===\n');
console.log(`Gateway + internal calls: ${allCalls.length}`);
console.log(`Matched: ${ok.length}`);
console.log(`Missing handlers: ${missing.length}`);
console.log(`Orphan handlers (not called from gateway/internal): ${orphanHandlers.length}`);

if (missing.length) {
  console.log('\n--- MISSING (will cause Unknown gRPC command) ---');
  for (const m of missing) {
    console.log(`  [${m.service}] ${m.cmd}  <- ${m.file} (${m.reason})`);
  }
  process.exitCode = 1;
} else {
  console.log('\nAll gRPC commands have matching backend handlers.');
}

if (orphanHandlers.length) {
  console.log('\n--- Orphan handlers (OK, internal/RabbitMQ only) ---');
  for (const o of orphanHandlers.slice(0, 15)) {
    console.log(`  [${o.service}] ${o.cmd}`);
  }
  if (orphanHandlers.length > 15) {
    console.log(`  ... and ${orphanHandlers.length - 15} more`);
  }
}
