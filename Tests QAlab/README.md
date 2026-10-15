# Testes API QAlab Postman

Este repositório contém uma collection do Postman para validar o fluxo principal da API QAlab e um teste smoke em Node.js para verificar rapidamente se a API está respondendo corretamente.

## Estrutura do projeto

```text
Teste API QAlab Postman/
└── tests/
    ├── api-smoke.js
    └── ValidaçoesQAlab Postaman/
        └── Validações Fluxo principal.postman_collection.json
```

## Pré-requisitos

Antes de rodar os testes, confirme que você tem:

- Node.js instalado.
- Repositório complementar `QA-lab-tests` clonado.
- API rodando localmente.
- Endpoint de saúde respondendo em `http://localhost:3000/api/health`.

## Subir a API complementar

Para que o teste smoke e a collection do Postman funcionem, primeiro é necessário clonar e executar o repositório complementar `QA-lab-tests`, disponível no GitHub.

Clone o repositório:

```powershell
git clone https://github.com/robson-nascimentojr/QA-lab-tests.git
```

Entre na pasta do projeto clonado:

```powershell
cd ".\QA-lab-tests"
```

Suba a API local:

```powershell
npm.cmd start
```

Se preferir, também pode iniciar diretamente com Node:

```powershell
node server.js
```

Mantenha esse terminal aberto. A API precisa continuar rodando enquanto você executa o smoke test ou os testes do Postman em outro terminal.

Para testar se a API está no ar:

```powershell
curl http://localhost:3000/api/health
```

Se a API estiver funcionando, a resposta deve ser um JSON com status `ok`.

## Rodar o teste smoke

O teste smoke é o teste mais simples e rápido. Ele valida se a API está funcionando e se as principais operações de usuário respondem corretamente.

Antes de executar o smoke, deixe a API do repositório `QA-lab-tests` rodando em outro terminal.

Abra o terminal na pasta:

```powershell
cd "C:\Teste API QAlab Postman\tests"
```

Execute:

```powershell
node .\api-smoke.js
```

Resultado esperado:

```text
API smoke test passou.
```

Se você estiver dentro da pasta da collection:

```powershell
cd "C:\Teste API QAlab Postman\tests\ValidaçoesQAlab Postaman"
```

Execute o smoke assim:

```powershell
node ..\api-smoke.js
```

## Rodar os testes do Postman pelo terminal

Os testes do Postman podem ser executados com o Newman, que é o runner de collections do Postman via linha de comando.

Antes de executar a collection, deixe a API do repositório `QA-lab-tests` rodando em outro terminal.

Entre na pasta da collection:

```powershell
cd "C:\Teste API QAlab Postman\tests\ValidaçoesQAlab Postaman"
```

Execute a collection passando a variável `URL`:

```powershell
npx.cmd newman run ".\Validações Fluxo principal.postman_collection.json" --env-var "URL=http://localhost:3000/api/users"
```

No Windows, use `npx.cmd` em vez de apenas `npx`, porque o PowerShell pode bloquear scripts `.ps1`.

## Por que precisa passar a variável URL?

A collection usa a variável:

```text
{{URL}}
```

No Postman, essa variável normalmente vem de um Environment selecionado na interface.

No Newman, esse Environment não é carregado automaticamente. Por isso, se você rodar somente:

```powershell
npx.cmd newman run ".\Validações Fluxo principal.postman_collection.json"
```

os requests podem falhar com erro parecido com:

```text
getaddrinfo ENOTFOUND {{url}}
```

Esse erro significa que o Newman tentou chamar literalmente `{{url}}` ou `{{URL}}`, porque a variável não tinha valor definido.

## Valor correto da variável URL

Para esta collection, a variável `URL` deve apontar diretamente para o endpoint de criação de usuários:

```text
http://localhost:3000/api/users
```

Use:

```powershell
--env-var "URL=http://localhost:3000/api/users"
```

Não use apenas:

```text
http://localhost:3000
```

Se usar apenas a raiz da aplicação, vários testes recebem HTML em vez de JSON e falham com:

```text
Unexpected token '<'
<!DOCTYPE html>
```

Isso acontece porque a raiz `http://localhost:3000` provavelmente retorna uma página HTML, enquanto os testes esperam uma resposta JSON da API.

## Rodar usando o mesmo Environment do Postman

Se a collection roda corretamente dentro do Postman, o ideal é exportar o mesmo Environment usado no Postman e passar ele para o Newman.

No Postman:

1. Abra a aba de Environments.
2. Selecione o Environment usado nos testes.
3. Clique nos três pontos.
4. Escolha Export.
5. Salve o arquivo dentro do projeto, por exemplo:

```text
tests/local.postman_environment.json
```

Depois rode:

```powershell
npx.cmd newman run ".\Validações Fluxo principal.postman_collection.json" --environment "..\local.postman_environment.json"
```

Se preferir, também é possível passar a variável diretamente no comando:

```powershell
npx.cmd newman run ".\Validações Fluxo principal.postman_collection.json" --env-var "URL=http://localhost:3000/api/users"
```

Evite commitar arquivos de Environment se eles tiverem tokens, senhas, URLs internas ou dados sensíveis.

## Gerar relatório da execução

Para gerar um relatório JSON:

```powershell
mkdir reports
npx.cmd newman run ".\Validações Fluxo principal.postman_collection.json" --env-var "URL=http://localhost:3000/api/users" --reporters cli,json --reporter-json-export ".\reports\newman-report.json"
```

O relatório será criado em:

```text
reports/newman-report.json
```

## Problemas comuns

### Erro: `getaddrinfo ENOTFOUND {{url}}`

Causa: a variável `URL` não foi definida no Newman.

Como resolver:

```powershell
npx.cmd newman run ".\Validações Fluxo principal.postman_collection.json" --env-var "URL=http://localhost:3000/api/users"
```

Ou exporte o Environment do Postman e rode com `--environment`.

### Erro: `Unexpected token '<'`

Causa: o teste recebeu HTML, mas esperava JSON.

Isso geralmente acontece quando `URL` aponta para:

```text
http://localhost:3000
```

em vez de:

```text
http://localhost:3000/api/users
```

Como resolver:

```powershell
npx.cmd newman run ".\Validações Fluxo principal.postman_collection.json" --env-var "URL=http://localhost:3000/api/users"
```

### Algumas assertions falham mesmo depois da URL correta

Se os requests aparecem como executados, mas algumas assertions falham, o Newman já está conseguindo chamar a API.

Nesse caso, o problema não é mais a execução da collection. Pode ser uma destas situações:

- A API local está com regras diferentes da API usada no Postman.
- O Environment do Postman tem valores diferentes dos passados no terminal.
- A collection espera que alguns dados inválidos sejam rejeitados, mas a API local está aceitando esses dados.
- Algum script de teste da collection precisa ser ajustado.

Exemplo: alguns testes esperam status `400` ou `422`, mas a API local pode responder `201 Created`. Isso indica diferença entre a regra esperada pelo teste e o comportamento atual da API.

## Comandos úteis

Clonar e subir a API complementar:

```powershell
git clone https://github.com/robson-nascimentojr/QA-lab-tests.git
cd ".\QA-lab-tests"
npm.cmd start
```

Rodar smoke:

```powershell
cd "C:\Teste API QAlab Postman\tests"
node .\api-smoke.js
```

Rodar collection Postman:

```powershell
cd "C:\Teste API QAlab Postman\tests\ValidaçoesQAlab Postaman"
npx.cmd newman run ".\Validações Fluxo principal.postman_collection.json" --env-var "URL=http://localhost:3000/api/users"
```

Rodar collection usando Environment exportado:

```powershell
cd "C:\Teste API QAlab Postman\tests\ValidaçoesQAlab Postaman"
npx.cmd newman run ".\Validações Fluxo principal.postman_collection.json" --environment "..\local.postman_environment.json"
```

Gerar relatório JSON:

```powershell
cd "C:\Teste API QAlab Postman\tests\ValidaçoesQAlab Postaman"
mkdir reports
npx.cmd newman run ".\Validações Fluxo principal.postman_collection.json" --env-var "URL=http://localhost:3000/api/users" --reporters cli,json --reporter-json-export ".\reports\newman-report.json"
```

## Observação importante

O teste smoke depende da API do repositório complementar `QA-lab-tests`. Se essa API não estiver rodando em `http://localhost:3000`, o smoke e a collection do Postman podem falhar.

A collection do Postman também consegue executar os requests quando a variável `URL` é informada corretamente. Se ainda houver falhas de assertions, compare o Environment usado no Postman com o comando do Newman e confirme se ambos estão apontando para a mesma API.
