*** Settings ***

Library    Browser
Library   ../libs/db.py

*** Variables ***
${name}    Robson do Nascimento
${email}    test100@gmail.com
${numberCell}    9892001029
${password}    Te$tesrobot10_192
${cpf}    12345678910
*** Keywords ***

Dado que estou na página QA lab
    New Browser    browser=chromium    headless=False

    New Page    http://localhost:3000

    Go To    http://localhost:3000

    Handle Future Dialogs    action=accept
    Click    button#resetDataButton
    Wait For Elements State   css= header.app-header h1    visible    5

    Get Text    css= header.app-header h1    equal    QA Lab de Cadastro

E preencho os campos obrigátorios com os dados do cliente
    Fill Text    id=fullName    ${name}
    Fill Text    id=email    ${email}
    ${cpf}    Gerar Cpf Valido
    Fill Text    id=cpf    ${cpf}
    Fill Text    id=phone    ${numberCell}
    Fill Text    id=password    ${password}
    Fill Text    id=confirmPassword    ${password}
    Select Options By    id=role    text    Product Owner
    Click    id=terms

Quando clico no botão cadastrar
    Click   id=submitButton

Então devo ver uma mensagem de cadastro com sucesso
    Wait For Elements State    id=toast    visible    5
    Get Text    id=toast    equal    Usuario cadastrado com sucesso.
    
Quando preencho os campos obrigátorios com os dados do cliente
    Fill Text    id=fullName    ${name}
    Fill Text    id=email    ${email}
    Fill Text    id=phone    ${numberCell}
    Fill Text    id=password    ${password}
    Fill Text    id=confirmPassword    ${password}
    Select Options By    id=role    text    Product Owner
    Click    id=terms
E preencho o campo cpf com dados inválidos
    Fill Text    id=cpf    ${cpf}

E clico no botão de cadastrar
    Click   id=submitButton

Então devo as mensagens de erro no campo CPF
    Wait For Elements State    id=cpfError    visible    2
    Get Text    css=p#cpfError    equal    CPF invalido.
E devo ver um popup de error
    Wait For Elements State    css=div#toast    visible    2
    Get Text    div.toast.error.hidden    equal    Revise os campos destacados.
