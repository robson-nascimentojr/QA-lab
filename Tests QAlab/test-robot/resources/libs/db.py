import random
from robot.api.deco import keyword


@keyword
def gerar_cpf_valido() -> str:
    # Gera os 9 primeiros dígitos aleatórios
    nove_digitos = [random.randint(0, 9) for _ in range(9)]

    # Calcula o primeiro dígito verificador
    soma_1 = sum(
        digito * peso
        for digito, peso in zip(nove_digitos, range(10, 1, -1))
    )
    resto_1 = (soma_1 * 10) % 11
    digito_1 = resto_1 if resto_1 < 10 else 0
    dez_digitos = nove_digitos + [digito_1]

    # Calcula o segundo dígito verificador
    soma_2 = sum(
        digito * peso
        for digito, peso in zip(dez_digitos, range(11, 1, -1))
    )
    resto_2 = (soma_2 * 10) % 11
    digito_2 = resto_2 if resto_2 < 10 else 0

    # Junta todos os dígitos em uma única string
    cpf = "".join(map(str, dez_digitos + [digito_2]))

    return cpf
