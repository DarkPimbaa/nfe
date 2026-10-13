const { execSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

function fail(message) {
  console.error(`check:pub falhou: ${message}`);
  process.exit(1);
}

function checkFile(relPath, mustContain) {
  const abs = join(__dirname, '..', relPath);
  if (!existsSync(abs)) {
    fail(`arquivo ausente: ${relPath} (rode npm run build antes)`);
  }
  const content = readFileSync(abs, 'utf-8');
  for (const needle of mustContain) {
    if (!content.includes(needle)) {
      fail(`${relPath} nao contem "${needle}" — dist stale? Rode npm run build e confira o fonte.`);
    }
  }
  console.log(`ok: ${relPath}`);
}

function main() {
  checkFile('dist/index.js', ['NFeCore']);
  checkFile('dist/index.d.ts', ['NFeCore']);
  // Guarda-chaves da API pública: se o build não os contiver, o pacote saiu stale.
  checkFile('dist/core/NFeCore.d.ts', ['certificado', 'manifestar', 'cancelarSubstituicao']);

  // Garante que o que vai ao npm inclui dist/ + schemas/.
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
  const files = pkg.files || [];
  if (!files.includes('dist') || !files.includes('schemas')) {
    fail(`package.json "files" deve incluir dist e schemas (atual: ${JSON.stringify(files)})`);
  }
  console.log('ok: package.json files inclui dist + schemas');

  // Guarda anti-dependencia local quebrada:
  // (a) package.json nunca pode declarar `file:` — isso iria para o npm e
  // quebraria todos os consumidores do pacote publicado;
  // (b) todo `link` no lock (monorepo: @brasil-fiscal/core -> ./core via
  // workspaces) precisa resolver para um diretorio existente — link dangling
  // quebra tudo com MODULE_NOT_FOUND.
  const fileDeps = Object.entries(pkg.dependencies || {})
    .filter(([, spec]) => typeof spec === 'string' && spec.startsWith('file:'))
    .map(([name]) => name);
  if (fileDeps.length > 0) {
    fail(`package.json com dependencia file: (${fileDeps.join(', ')}) — isso quebraria os consumidores no npm`);
  }
  console.log('ok: package.json sem dependencias file:');

  const lockRaw = readFileSync(join(__dirname, '..', 'package-lock.json'), 'utf-8');
  const lock = JSON.parse(lockRaw);
  const dangling = Object.entries(lock.packages || {})
    .filter(([, entry]) => entry && typeof entry === 'object' && 'link' in entry)
    .map(([key]) => key)
    .filter((key) => {
      const target = (lock.packages[key] || {}).resolved;
      return !target || !existsSync(join(__dirname, '..', target));
    });
  if (dangling.length > 0) {
    fail(`link local dangling no lock: ${dangling.join(', ')} — confira os workspaces (core/ precisa existir), ver CONTRIBUTING.md`);
  }
  console.log('ok: links locais do lock resolvem para diretorios existentes');

  const schemasDir = join(__dirname, '..', 'schemas');
  const requiredSchemas = ['envEventoCancSubst_v1.00.xsd', 'nfe_v4.00.xsd', 'enviNFe_v4.00.xsd'];
  for (const schema of requiredSchemas) {
    if (!existsSync(join(schemasDir, schema))) {
      fail(`schema ausente no pacote: schemas/${schema}`);
    }
  }
  console.log('ok: schemas essenciais presentes');

  // Smoke: o bundle publicado carrega sem erro.
  try {
    execSync('node -e "require(\'./dist/index.js\')"', { cwd: join(__dirname, '..'), stdio: 'pipe' });
  } catch (error) {
    fail(`require('./dist/index.js') quebrou: ${(error && error.message) || error}`);
  }
  console.log('ok: dist/index.js carrega');
  console.log('check:pub verde');
}

main();
