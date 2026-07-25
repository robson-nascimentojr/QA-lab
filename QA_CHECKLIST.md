# Checklist de testes QA

## Funcionais

- Cadastrar usuario valido e conferir se aparece na tabela.
- Tentar cadastrar sem nome, e-mail, CPF, telefone, perfil, senha e termo.
- Tentar cadastrar com nome sem sobrenome.
- Tentar cadastrar com e-mail em formato invalido.
- Tentar cadastrar com CPF invalido.
- Tentar cadastrar com CPF ou e-mail ja existente.
- Tentar senha sem maiuscula, sem numero ou sem simbolo.
- Confirmar senha diferente da senha principal.
- Buscar usuario por nome, e-mail, CPF e telefone.
- Filtrar por status ativo/inativo.
- Filtrar por perfil.
- Ordenar por data e por nome.
- Inativar usuario e validar atualizacao de metricas.
- Reativar usuario e validar atualizacao de metricas.
- Excluir usuario e validar remocao da tabela.
- Resetar massa de dados e conferir retorno aos 3 usuarios iniciais.

## API

- `GET /api/health` deve retornar `status: ok` e `userCount`.
- `GET /api/users` deve retornar lista e `meta`.
- `GET /api/users?status=active` deve retornar apenas ativos.
- `POST /api/users` com payload valido deve retornar `201`.
- `POST /api/users` com e-mail duplicado deve retornar `422`.
- `PATCH /api/users/:id/status` deve alterar status para `active` ou `inactive`.
- `DELETE /api/users/:id` deve remover usuario existente.
- Rota inexistente deve retornar `404`.

## Layout e acessibilidade

- Validar se mensagens de erro nao quebram layout.
- Validar navegacao por teclado nos campos e botoes.
- Validar foco visivel em inputs e selects.
- Validar contraste dos textos, badges e botoes.
- Validar responsividade em 360px, 768px e 1366px.
- Validar tabela em telas pequenas com rolagem horizontal.
- Validar estados de loading e toast.
