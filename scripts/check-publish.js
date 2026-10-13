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
  checkFile('dist/core/NFeCore.d.ts', ['certificado', 'manifestar']);

  // Garante que o que vai ao npm inclui dist/ + schemas/.
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
  const files = pkg.files || [];
  if (!files.includes('dist') || !files.includes('schemas')) {
    fail(`package.json "files" deve incluir dist e schemas (atual: ${JSON.stringify(files)})`);
  }
  console.log('ok: package.json files inclui dist + schemas');

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
