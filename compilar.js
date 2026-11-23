// node compilar.js "src\\MeuFonte.prw"
// Env: PROTHEUS_PSW (obrigatória), PROTHEUS_SERVER (name no servers.json),
//      PROTHEUS_INCLUDES (pastas separadas por ;), PROTHEUS_USER (opcional)
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const barra = s => String(s).replace(/\\/g, '/');
const die = m => { console.error(m); process.exit(1); };

const alvo = process.argv[2];
if (!alvo || !fs.existsSync(alvo)) die('Uso: node compilar.js "<fonte>"');
const psw = process.env.PROTHEUS_PSW, nome = process.env.PROTHEUS_SERVER, inc = process.env.PROTHEUS_INCLUDES;
if (!psw || !nome || !inc) die('Faltam variaveis: PROTHEUS_PSW, PROTHEUS_SERVER, PROTHEUS_INCLUDES');

const servers = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.totvsls', 'servers.json'), 'utf8'));
const lista = servers.configurations || servers.connections || [];
const srv = lista.find(s => s.name === nome);
if (!srv) die(`Servidor "${nome}" nao esta no servers.json`);

const ext = path.join(os.homedir(), '.vscode', 'extensions');
const tds = fs.readdirSync(ext).filter(f => f.startsWith('totvs.tds-vscode-')).sort().reverse()[0];
const advpls = tds && path.join(ext, tds, 'node_modules', '@totvs', 'tds-ls', 'bin', 'windows', 'advpls.exe');
if (!advpls || !fs.existsSync(advpls)) die('advpls.exe nao encontrado (instale a extensao TDS-VSCode)');

const logFile = path.join(os.tmpdir(), `advpl_log_${process.pid}.log`);
const ini = path.join(os.tmpdir(), `advpl_${process.pid}.ini`);
fs.writeFileSync(ini, `showConsoleOutput=true
logToFile=${barra(logFile)}

[authentication]
action=authentication
server=${srv.address}
port=${srv.port}
secure=${srv.secure ? 1 : 0}
build=${srv.buildVersion || 'AUTO'}
environment=${srv.environment}
user=${process.env.PROTHEUS_USER || srv.username}
psw=${psw}

[compile]
action=compile
includes=${inc.split(';').filter(Boolean).map(barra).join(';')}
program=${barra(path.resolve(alvo))}
recompile=T
`);
let r;
try { r = spawnSync(advpls, ['cli', ini], { stdio: 'inherit' }); }
finally { fs.rmSync(ini, { force: true }); }

const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
fs.rmSync(logFile, { force: true });
console.log('--- LOG ---\n' + log);
// Exit 0 do advpls NAO prova compile: exija [SUCCESS] e rejeite [SKIPPED].
const ok = r.status === 0 && /\[SUCCESS\]/.test(log) && !/\[SKIPPED\]/.test(log);
console.log(ok ? 'ACEITE: [SUCCESS]' : 'ACEITE REPROVADO: sem [SUCCESS] ou com [SKIPPED]');
process.exit(ok ? 0 : 2);
