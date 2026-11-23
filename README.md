# Compilar fonte ADVPL/TLPP no TCloud pelo Claude (sem abrir o VS Code)

Baixe `compilar.js` para a raiz do seu projeto e siga abaixo.

## Como funciona
A extensão **TOTVS Developer Studio (TDS-VSCode)** traz o `advpls.exe`. Ele tem um modo de linha de comando (`advpls cli <arquivo.ini>`) que autentica no AppServer e compila. O Claude gera o `.ini` temporário, roda, lê o log e apaga o `.ini` (tem senha).

## Pré-requisitos (o amigo faz uma vez)
1. VS Code com a extensão **TOTVS Developer Studio for VS Code** instalada (cria `%USERPROFILE%\.vscode\extensions\totvs.tds-vscode-*`).
2. Node.js instalado.
3. Servidor cadastrado no TDS (arquivo `%USERPROFILE%\.totvsls\servers.json`). Para o TCloud: endereço, porta, ambiente e `secure` (normalmente TLS) vêm daí. Teste antes conectando pelo VS Code.
4. Pasta de **includes** do ambiente (`.ch`, `protheus.ch` etc.) no disco local. Sem `includes=` o compile sai com erro 255 mudo.
5. Senha em variável de ambiente `PROTHEUS_PSW` (nunca em arquivo do projeto, nunca na linha de comando, nunca no chat).

## Script
O arquivo [compilar.js](compilar.js) deste repositório fica na raiz do projeto.

Uso (PowerShell):
```powershell
$env:PROTHEUS_SERVER = "nome-no-servers.json"
$env:PROTHEUS_INCLUDES = "C:\protheus\includes"
$env:PROTHEUS_PSW = "<digitar na hora; não colar no chat>"
node compilar.js "src\MeuFonte.prw"
```

## Regras que o Claude deve seguir
1. **Aceite = `[SUCCESS]` no log.** Exit 0 sozinho não prova nada; `[SKIPPED]` significa que o objeto não foi regravado.
2. **Senha**: só em variável de ambiente ou no gerenciador dele. O Claude não lê, ecoa nem grava a senha em arquivo do projeto. O `.ini` temporário é apagado no `finally`.
3. **Ambiente certo**: conferir `environment` impresso antes de compilar. Compilar em produção só com ordem explícita do amigo.
4. **RPO é compartilhado**: uma compilação por vez. Se houver outra em curso no mesmo ambiente, esperar.
5. **Encoding**: fonte ADVPL/TLPP antigo costuma ser CP1252. Ferramentas que assumem UTF-8 (Write/Edit do Claude) corrompem acentos. Editar via PowerShell com `[Text.Encoding]::GetEncoding(1252)` ou converter e reconverter, e conferir os bytes depois.
6. **Erro comum**: `includes=` vazio → o advpls sai 255 sem mensagem. Falha de autenticação → conferir usuário, ambiente e `secure` no servers.json.
7. Antes de escrever a chamada de qualquer API Protheus, validar o símbolo na documentação TOTVS (TDN) ou no fonte padrão; não inferir de memória.

## Teste de aceite do amigo
Criar `src\TESTE01.prw` com `User Function TESTE01()` vazia, compilar, e ver `ACEITE: [SUCCESS]`.
