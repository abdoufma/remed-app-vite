// Runs inside a packaged Electron Worker, using only the packaged backend dependencies.
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, relative, isAbsolute } = require('node:path');
const { parentPort, workerData } = require('node:worker_threads');

async function check() {
  const backendRequire = createRequire(join(workerData.backendDir, 'package.json'));
  const dependencies = backendRequire('./package.json').dependencies;
  for (const name of Object.keys(dependencies)) {
    const resolved = backendRequire.resolve(name);
    const local = relative(workerData.backendDir, resolved);
    assert(!local.startsWith('..') && !isAbsolute(local), `${name} resolved outside the packaged backend`);
  }
  const directory = mkdtempSync(join(tmpdir(), 'remed-runtime-'));
  try {
    const Database = backendRequire('libsql');
    const path = join(directory, 'test.db');
    let db = new Database(path);
    db.exec('CREATE TABLE smoke (value TEXT);');
    db.prepare('INSERT INTO smoke VALUES (?)').run('packaged-electron');
    db.close();
    db = new Database(path);
    assert.equal(db.prepare('SELECT value FROM smoke').get().value, 'packaged-electron');
    db.close();
    const sharp = backendRequire('sharp');
    const png = await sharp({ create: { width: 2, height: 2, channels: 4, background: '#ff0000' } }).png().toBuffer();
    assert.equal((await sharp(png).metadata()).width, 2);
    const { Resvg } = backendRequire('@resvg/resvg-js');
    assert(new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="red"/></svg>').render().asPng().length > 0);
    // Match the CommonJS require used by the supplied backend bundle.
    const { SuperDocClient } = backendRequire('@superdoc/sdk');
    const client = new SuperDocClient({ startupTimeoutMs: 10000, shutdownTimeoutMs: 3000 });
    try {
      await client.connect();
    } finally {
      await client.dispose();
    }
    const quickjs = backendRequire('@jitl/quickjs-singlefile-mjs-release-sync').default;
    assert.equal(typeof await quickjs.importFFI(), 'function');
    const createModule = await quickjs.importModuleLoader();
    const wasm = await createModule();
    assert.equal(typeof wasm._QTS_NewRuntime, 'function');
    parentPort.postMessage({ ok: true, electron: process.versions.electron, node: process.versions.node, arch: process.arch, dependencies: Object.keys(dependencies) });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

check().catch((error) => { throw error; });
