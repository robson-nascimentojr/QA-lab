*** Settings ***

Documentation    Deletar usuários

Library    Browser
Resource    ../resources/pages/deleteusers.pages.robot

*** Test Cases ***

Deletar usuário com sucesso
    [Tags]    delete-user-sucess
    Dado que estou na página QA lab

    E que desejo apagar o usuário Beta

    Quando Clico no ícone de deletar o usuário

    Então o usuário Beta deve ser deletado com sucesso