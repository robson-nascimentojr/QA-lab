# QA Lab - Cadastro de Usuarios

Aplicacao de estudo para praticar QA em uma tela de cadastro com validacao no front-end e API local.

## Como rodar

```bash
npm start
```

Depois acesse:

```text
http://localhost:3000
```

## Scripts

```bash
npm start
npm run test:api
```

`npm run test:api` executa um smoke test simples contra a API. Deixe o servidor rodando em outro terminal antes de executar.

## Dados de exemplo

Os usuarios iniciais usam dados ficticios apenas para demonstracao e testes locais.

## O que praticar

- Validacao obrigatoria e mensagens por campo.
- CPF valido/invalido e duplicado.
- E-mail invalido e duplicado.
- Senha fraca, media e forte.
- Cadastro com sucesso usando API.
- Listagem, busca, filtro, ordenacao, status ativo/inativo e exclusao.
- Estado vazio quando filtros nao retornam usuarios.
- Responsividade em desktop, tablet e celular.
- Testes de contrato nos endpoints `/api/health`, `/api/users`, `/api/reset`.
