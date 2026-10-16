*** Settings ***

library    Browser
Library   ../libs/db.py

*** Variables ***
${name}    Robson do Nascimento
${email}    test100@gmail.com
${numberCell}    9892001029
${password}    Te$tesrobot10_192  

*** Keywords ***

Dado que estou na página QA lab
    New Browser    browser=chromium    headless=False

    New Page    http://localhost:3000

    Go To    http://localhost:3000

    Handle Future Dialogs    action=accept
    Click    button#resetDataButton
    Wait For Elements State    css=header.app-header h1    visible    5

    ${header}=    Get Text    css=header.app-header h1
    Should Be Equal As Strings    ${header}    QA Lab de Cadastro

E que desejo apagar o usuário Beta
    ${betaRow}=    Set Variable    css=tr[data-testid="user-row-usr_demo_beta"]
    Wait For Elements State    css=tr[data-testid="user-row-usr_demo_beta"]    visible    5
    ${betaName}=    Get Text    ${betaRow} td:first-child > span.user-name
    Should Be Equal As Strings    ${betaName}    Usuario Demo Beta

Quando Clico no ícone de deletar o usuário
    Click    css=tr[data-testid="user-row-usr_demo_beta"] button[data-action="delete"]

Então o usuário Beta deve ser deletado com sucesso
    Wait For Elements State    css=tr[data-testid="user-row-usr_demo_beta"]    detached    5

