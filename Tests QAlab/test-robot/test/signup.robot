*** Settings ***

Documentation    Cadastrar usuários

Library    Browser
Resource    ../resources/pages/signup.pages.robot

*** Test Cases ***

Cadastrar usuario com sucesso
    [Tags]    signup-sucess
    Dado que estou na página QA lab

    E preencho os campos obrigátorios com os dados do cliente

    Quando clico no botão cadastrar
    
    Então devo ver uma mensagem de cadastro com sucesso

Cadastro com Cpf inválido
    Dado que estou na página QA lab

    Quando preencho os campos obrigátorios com os dados do cliente

    E preencho o campo cpf com dados inválidos

    E clico no botão de cadastrar

    Então devo as mensagens de erro no campo CPF

    
    