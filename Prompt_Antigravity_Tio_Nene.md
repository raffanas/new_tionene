# PROMPT MESTRE PARA O ANTIGRAVITY --- SITE E SISTEMA INTERNO TÍO NENÊ

## PAPEL E OBJETIVO

Atue como arquiteto de software sênior, analista de sistemas, engenheiro
full-stack e auditor de código. Estou desenvolvendo o site da Tío Nenê e
um sistema interno de operação/gestão. Já existe bastante código e
funcionalidades implementadas. **Sua primeira tarefa NÃO é sair
programando nem recriar o projeto:** é inspecionar o repositório real,
compreender a arquitetura, mapear o que já existe, comparar com todos os
requisitos abaixo e entregar um plano técnico de implantação por etapas,
com dependências, riscos, critérios de aceite e testes. Evite duplicar
funcionalidades já existentes.

Trabalhe com o repositório aberto no ambiente atual. Não presuma
framework, banco, rotas, tabelas, APIs ou funcionalidades sem
encontrá-los no código. Não altere arquivos nem execute migrações
destrutivas durante a fase de diagnóstico e planejamento.

## RESULTADO ESPERADO DESTA PRIMEIRA FASE

Entregue um relatório em português do Brasil, detalhado e baseado em
evidências do repositório, contendo:

1.  **Inventário técnico:** stack, estrutura de pastas, entry points,
    páginas/rotas, componentes, serviços, APIs,
    autenticação/autorização, banco de dados, migrations, integrações,
    testes, deploy e variáveis de ambiente (listar nomes, nunca expor
    segredos).
2.  **Mapa de funcionalidades existentes:** para cada requisito deste
    documento, classifique como:
    -   Implementado e comprovado;
    -   Parcialmente implementado;
    -   Existe no código, mas não está integrado/operacional;
    -   Não implementado;
    -   Não foi possível verificar. Inclua evidências concretas:
        arquivos, componentes, funções, endpoints, tabelas e/ou
        migrations relevantes.
3.  **Matriz de lacunas:** requisito, situação atual, lacuna exata,
    dependências, risco/prioridade e recomendação.
4.  **Plano de implantação por etapas**, em ordem lógica. Para cada
    etapa: objetivo, escopo, arquivos/módulos prováveis a alterar
    (somente se identificados), dependências, tarefas pequenas,
    critérios de aceite verificáveis, testes automatizados/manuais,
    riscos, estratégia de rollback e definição de pronto.
5.  **Plano de dados e importação:** estratégia segura para importar os
    42 registros do catálogo, validar dados, evitar duplicações e
    preservar reservas históricas. Não importe nada nesta fase.
6.  **Plano de testes:** regras de preço, cenários de reservas,
    pagamentos, moedas, extras, permissões, persistência, regressões e
    casos-limite.
7.  **Perguntas e decisões pendentes:** separe o que bloqueia a
    implementação do que pode ser decidido depois. Não invente
    respostas.
8.  **Resumo executivo:** estado geral, riscos críticos e as primeiras 3
    ações recomendadas.

## REGRAS DE TRABALHO

-   Primeiro leia e rastreie o código existente; procure documentação,
    README, arquivos de configuração, migrations, testes, rotas e
    modelos.
-   Não reescreva o projeto do zero e não substitua tecnologias sem
    justificar com evidências.
-   Não considere uma função implementada apenas porque existe uma tela:
    verifique fluxo completo, persistência, validação, autorização,
    erros e testes.
-   Não crie código, tabelas, rotas ou arquivos nesta fase. Não execute
    migrações, seeders, importações, deploys ou ações irreversíveis.
-   Não faça alterações no banco nem nos dados reais. Se precisar rodar
    comandos, prefira leitura, lint, testes e comandos sem efeitos
    colaterais; informe antes de qualquer comando potencialmente
    destrutivo.
-   Não exponha tokens, senhas, chaves privadas ou valores de `.env`.
    Registre apenas nomes de variáveis e se estão configuradas.
-   Respeite o padrão de arquitetura e estilo já adotado, a menos que
    haja uma razão documentada para mudar.
-   Priorize segurança, integridade financeira, rastreabilidade,
    consistência dos dados e manutenção.
-   Não invente informações comerciais ausentes. Dados faltantes devem
    permanecer vazios, editáveis e marcados como pendentes.
-   O catálogo abaixo contém **custos pagos aos fornecedores, não preços
    de venda ao cliente**. Não use esses custos como preço público do
    site.
-   Não publique preços estimados ou não confirmados como se fossem
    definitivos.
-   Após entregar o diagnóstico e o plano, pare e aguarde minha
    aprovação explícita antes de implementar a primeira etapa.

## CONTEXTO DO NEGÓCIO E ESCOPO

O arquivo mestre informa 9 fornecedores aprovados e 42 opções de
preço/serviço. A aba `Catálogo` é a fonte estruturada; a aba
`Guia (PT-BR)` contém as regras de importação e alertas. Os dados foram
consolidados de documentos individuais de fornecedores de 01/05/2026, da
planilha `TOURS PUBLIC & COST PRICES.xlsx`, da tabela de Miguel e de
confirmações do responsável em chat em 13/10/2026.

Fornecedores incluídos no catálogo atual: - Baktun - Coco Bongo -
Envatours - MTZ Tours - MUSA - Parasailing & Jet Ski - Playamia - Puerto
Maya - Miguel Shuttle

Fornecedores/serviços explicitamente excluídos do catálogo atual por
decisão do responsável: - Xcaret - The Dolphin Company (incluindo
Aquatours) - Lugares Mágicos - Francisco Murrieta - Neftali - Tena
Busses - YachtL2 - Viajero Cibernético - Tamei - TAMYFER

A exclusão significa **não importar para o catálogo atual**, não apagar
dados históricos originais.

## REQUISITOS FUNCIONAIS DO SISTEMA

### A. Catálogo e administração

-   Criar/validar um catálogo interno administrável de fornecedores e
    opções de serviços/passeios.
-   Todos os campos devem poder ser alterados no painel: fornecedor,
    nome, variação/tipo de pacote, custos, moeda, dias e horários,
    duração, descrição, inclusões, exclusões, notas operacionais, notas
    comerciais, taxas/extras, regras de preço, ressalvas, fonte e estado
    de validação.
-   Nada que seja dado de negócio deve ficar hard-coded no frontend ou
    na lógica de negócio. Usar dados persistidos e editáveis.
-   Preservar código estável por opção (ex.: TN-001 até TN-042),
    fornecedor, fonte e estado (revisado, pendente, ressalva, sob
    cotação).
-   Permitir campos vazios quando não há informação confirmada. Exibir
    alertas internos para pendências; não inventar informações.
-   Separar claramente custo de fornecedor de preço de venda ao cliente.
    Se houver módulo de preço de venda, margem ou comissão, mantê-lo
    separado do custo e não inferir regra comercial não fornecida.
-   Pesquisar, filtrar e ordenar por fornecedor, passeio, categoria,
    variação, estado, moeda e disponibilidade/dia quando aplicável.
-   Mudanças de preço/regras devem ter trilha de auditoria (quem,
    quando, valor anterior e novo), se compatível com arquitetura
    existente.

### B. Reservas e cálculo de custos

-   Cada reserva deve indicar fornecedor, passeio/opção específica, data
    do serviço, passageiros e/ou unidades, moeda e custo devido ao
    fornecedor.
-   Para cobrança por pessoa: custo = (adultos × custo adulto) +
    (crianças × custo criança), respeitando a opção e o dia contratado.
-   Custos fixos por embarcação, jet ski ou veículo são cobrados por
    unidade/trecho. Não multiplicar o valor fixo pelo número de
    passageiros.
-   Quando houver quantidade de unidades, registrar a quantidade e
    calcular o total fixo como preço fixo × unidades/trechos
    contratados, conforme regra do produto.
-   Validar capacidade e regras específicas antes de confirmar. Não
    assumir que as faixas etárias são iguais entre fornecedores; a regra
    de idade deve ser configurável por fornecedor/produto e permanecer
    pendente se não for conhecida.
-   Datas sem tarifa confirmada (ex.: Coco Bongo em dias não
    contemplados) devem exigir cotação/confirmação manual. Não
    extrapolar, interpolar ou inventar preço.
-   Para hotel↔hotel de Miguel Shuttle, exigir cotação individual por
    par de hotéis e salvar o valor efetivamente confirmado.
-   Ao salvar a reserva, gravar um **snapshot imutável** dos valores e
    regras aplicados: fornecedor/opção, moeda, custos unitários,
    contagem de adultos/crianças/unidades/trechos, extras aplicados,
    custo final, data e referência da tarifa. Alterações futuras no
    catálogo não podem mudar reservas anteriores.
-   O cálculo deve ser reproduzível e testado. Evitar erros de
    arredondamento e mistura silenciosa de moedas.
-   Não converter moedas automaticamente sem uma regra explícita e
    fonte/taxa de câmbio definida.

### C. Extras, taxas e pagamentos

-   Valores da coluna `Taxas / extras fora da tarifa` são informativos.
    Não incorporá-los automaticamente ao pagamento devido ao fornecedor
    sem regra confirmada.
-   Diferenciar: custo do fornecedor, taxa paga diretamente no
    local/terceiro, extra opcional e valor informativo não confirmado.
-   Para cada extra, guardar valor, moeda, quem cobra/recebe, se é
    obrigatório, se está incluído no custo-base e se entra ou não no
    total devido ao fornecedor. Se esses dados não estiverem
    disponíveis, deixá-los pendentes/editáveis.
-   Pagamentos podem quitar várias reservas. Planejar estrutura de
    pagamentos e alocações entre pagamento e reservas, com saldo por
    reserva e por fornecedor, histórico e prevenção de dupla alocação.
-   Não presumir método de pagamento, fluxo contábil ou política de
    câmbio que não conste no repositório ou neste documento.

### D. Regras específicas obrigatórias

1.  **Puerto Maya --- Jungle Tour:** transporte obrigatório de USD 8 por
    passageiro já está incluído nos totais: adulto USD 33 (passeio USD
    25 + transporte USD 8) e criança USD 23 (passeio USD 15 + transporte
    USD 8). Nunca adicionar USD 8 novamente. Valores estimados e
    precisam ser confirmados com o fornecedor antes de serem tratados
    como definitivos.
2.  **Miguel Shuttle --- transfers de aeroporto:** tarifas por veículo e
    por trecho, capacidade máxima de 7 passageiros; mesma tarifa em
    ambos os sentidos. Ida e volta = dois trechos cobrados duas vezes.
    Valores: Cancún Zona Hoteleira/Centro USD 39; Costa Mujeres USD 60;
    Playa del Carmen USD 65; Tulum Centro USD 120; Tulum Zona Hoteleira
    USD 135. Não multiplicar por passageiro.
3.  **Miguel Shuttle --- hotel↔hotel:** origem/destino variáveis,
    cotação manual individual por veículo e trecho. Não reutilizar
    tarifa de outro percurso.
4.  **Envatours --- embarcações privadas:** preço fixo por embarcação,
    não por pessoa. Barco de vidro Isla Mujeres: USD 200 (nota indica
    privado até 10 passageiros, mas valor original estava truncado como
    "200 to people"; confirmar). Barco de vidro Cozumel: USD 140;
    capacidade física máxima 15 passageiros incluindo crianças, mas
    preço privado documentado para até 10; regras para 11--15 devem ser
    confirmadas. Não extrapolar a tarifa.
5.  **Playamia --- Cozumel El Cielo:** preços por pessoa em MXN, variam
    de acordo com o ponto de saída; não intercambiar preços entre
    saídas. Saída Playa del Carmen: adulto 1660 / criança 1480; saída
    Cancún: adulto 1960 / criança 1780; saída Cozumel: adulto 1350 /
    criança 1170. USD 13 de taxa portuária aparece como extra fora da
    tarifa e precisa de confirmação sobre cobrança/pagador. Horários
    exatos pendentes.
6.  **MTZ Tours --- Tulum Casa Tortuga Silver:** a descrição menciona
    ruínas de Tulum, mas a entrada arqueológica não aparece
    explicitamente nas inclusões; sinalizar para confirmação. A
    taxa/imposto MXN 205 é informativa e não deve ser somada
    automaticamente.
7.  **MTZ Tours --- Tulum + Casa Tortuga + Madre Naturaleza:** não
    inclui acesso às ruínas arqueológicas de Tulum. A taxa/imposto MXN
    205 é informativa e não deve ser somada automaticamente.
8.  **MTZ Tours --- Tulum Dos Ojos e Grand Cenote:** taxa/imposto MXN
    420 informativa; não somar automaticamente.
9.  **Parasailing:** USD 10 de taxa paga no local, fora da tarifa; não
    adicionar automaticamente ao valor devido ao fornecedor.
10. **MUSA:** confirmar operação aos domingos; não tratar domingo como
    confirmado enquanto pendente.
11. **Coco Bongo:** tarifas variam por dia; não aplicar preços a datas
    não contempladas nem calcular preço automaticamente. Há divergência
    em Premium Qui--Sáb: descrição menciona bar nacional, enquanto
    inclusões mencionam premium; preço USD 105 foi mantido, mas a
    divergência precisa ser resolvida.
12. **Baktun --- Chichén Itzá Plus:** é diferente de Deluxe; adulto USD
    61 e criança USD 50; descrição, inclusões, exclusões e agenda
    pendentes.
13. **Puerto Maya --- Jungle Tour:** além da regra de transporte acima,
    descrição, inclusões, exclusões, agenda e regras etárias pendentes.
14. **Faixas etárias:** devem ser configuradas por fornecedor/produto.
    Não presumir a mesma idade-limite para criança em todos os passeios.

## REGRAS DE DADOS, HISTÓRICO E SEGURANÇA

-   Importação deve ser idempotente: executar novamente não pode
    duplicar fornecedores/opções.
-   Usar o código TN como chave de correspondência estável quando
    apropriado; verificar antes se já existem registros equivalentes.
-   Antes de importar, produzir prévia/relatório de validação: número de
    fornecedores, opções, códigos duplicados, campos obrigatórios
    ausentes, tarifas suspeitas, moedas, estados e conflitos.
-   Criar backup/rollback ou estratégia reversível para a importação.
-   Não apagar ou sobrescrever reservas históricas. Ao importar ou
    atualizar catálogo, não alterar snapshots de reservas.
-   Respeitar autenticação e autorização existentes; apenas perfis
    autorizados podem editar custos, confirmar cotações e registrar
    pagamentos.
-   Validar entradas no servidor, não apenas no frontend; tratar erros e
    registrar eventos importantes.
-   Proteger dados pessoais de clientes e segredos de configuração. Não
    imprimir credenciais nos logs.
-   Considerar concorrência: dois usuários editando custos, alocando
    pagamentos ou alterando reservas não podem causar inconsistência
    silenciosa.
-   Não assumir que um recurso está pronto sem testes e verificação de
    persistência.

## CATÁLOGO COMPLETO EXTRAÍDO DA PLANILHA

A seguir estão os registros não vazios da aba `Catálogo`, com os campos
preservados. Campos que não aparecem em um registro estavam vazios na
planilha e devem continuar pendentes até confirmação. Não invente dados
para preenchê-los.

### TN-001

-   **Fornecedor:** Baktun
-   **Passeio / serviço:** Chichén Itzá Clássico
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 57
-   **Custo criança:** 43
-   **Moeda:** USD
-   **Dias de operação:** Segunda a domingo
-   **Horários:** Saída pela manhã
-   **Duração:** Aprox. 12h
-   **Descrição:** Tour cultural para conhecer Chichén Itzá, uma das
    Sete Maravilhas do Mundo Moderno, com visita guiada à zona
    arqueológica, cerimônia maia, nado em cenote e visita à cidade de
    Valladolid.
-   **Inclui:** Transporte redondo; entrada na zona arqueológica de
    Chichén Itzá; guia certificado; cerimônia maia; almoço buffet; nado
    no Cenote Sammal.
-   **Não inclui:** Box lunch; bebidas a bordo; bebidas no restaurante;
    lockers; colete salva-vidas.
-   **Notas operacionais:** Duração média de 12h; ordem do itinerário
    pode variar; sujeito a alterações sem aviso prévio.
-   **Notas comerciais:** Bom custo-benefício; versão mais simples do
    tour; indicar levar dinheiro em espécie.
-   **Fonte:** Baktun.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-002

-   **Fornecedor:** Baktun
-   **Passeio / serviço:** Chichén Itzá Deluxe
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 67
-   **Custo criança:** 55
-   **Moeda:** USD
-   **Dias de operação:** Segunda a domingo
-   **Horários:** Saída pela manhã
-   **Duração:** Aprox. 12h
-   **Descrição:** Versão premium do tour a Chichén Itzá, incluindo
    bebidas, box lunch e almoço buffet com bebidas, além de visita
    guiada, cerimônia maia, cenote e Valladolid.
-   **Inclui:** Transporte redondo; entrada na zona arqueológica de
    Chichén Itzá; guia certificado; cerimônia maia; box lunch; bebidas a
    bordo; almoço buffet; 2 bebidas no restaurante; nado no Cenote
    Sammal.
-   **Não inclui:** Lockers; colete salva-vidas.
-   **Notas operacionais:** Duração média de 12h; ordem do itinerário
    pode variar; sujeito a alterações sem aviso prévio.
-   **Notas comerciais:** Ideal para quem quer conforto; excelente
    custo-benefício pelo que inclui; ótimo para casais.
-   **Fonte:** Baktun.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-003

-   **Fornecedor:** Baktun
-   **Passeio / serviço:** Chichén Itzá 2 Cenotes
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 82
-   **Custo criança:** 61
-   **Moeda:** USD
-   **Dias de operação:** Segunda a domingo
-   **Horários:** Saída pela manhã
-   **Duração:** Aprox. 13h
-   **Descrição:** Tour completo combinando Chichén Itzá com cerimônia
    maia, visita a dois cenotes (Suytun e Ik Kil) e parada em
    Valladolid, unindo cultura e natureza em um único dia.
-   **Inclui:** Transporte redondo; entrada na zona arqueológica de
    Chichén Itzá; guia certificado; cerimônia maia; alimentos na
    cooperativa maia; entrada no Cenote Suytun com colete; entrada no
    Cenote Ik Kil com colete; bebidas a bordo (água, refrigerante e
    cerveja).
-   **Não inclui:** Bebidas no restaurante; lockers.
-   **Notas operacionais:** Duração média de 13h; roteiro mais longo;
    ordem das visitas pode variar; sujeito a alterações sem aviso
    prévio.
-   **Notas comerciais:** Dia mais intenso; ideal para clientes ativos;
    ótimo para quem quer mais cenotes além de Chichén.
-   **Fonte:** Baktun.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-004

-   **Fornecedor:** Coco Bongo
-   **Passeio / serviço:** Coco Bongo --- Drink Pack
-   **Variação / rota / dias:** Dom--Qua
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 64
-   **Moeda:** USD
-   **Regra de preço:** Tarifa específica para os dias indicados; não
    aplicar a dias sem preço cadastrado. Preço por pessoa; tarifa
    infantil não fornecida.
-   **Dias de operação:** Dom--Qua
-   **Horários:** 19:30--01:00
-   **Duração:** Noturno
-   **Descrição:** Entrada na pista regular com 5 bebidas por pessoa.
    Show noturno com performances.
-   **Inclui:** Entrada + 5 bebidas por pessoa.
-   **Não inclui:** Bebidas adicionais.
-   **Notas operacionais:** Show noturno com performances.
-   **Notas comerciais:** Boa opção de entrada.
-   **Fonte:** Coco Bongo.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-005

-   **Fornecedor:** Coco Bongo
-   **Passeio / serviço:** Coco Bongo --- Regular
-   **Variação / rota / dias:** Dom--Qui
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 67.5
-   **Moeda:** USD
-   **Regra de preço:** Tarifa específica para os dias indicados; não
    aplicar a dias sem preço cadastrado. Preço por pessoa; tarifa
    infantil não fornecida.
-   **Dias de operação:** Dom--Qui
-   **Horários:** 19:30--01:00
-   **Duração:** Noturno
-   **Descrição:** Entrada na pista com open bar regular.
-   **Inclui:** Entrada + open bar.
-   **Não inclui:** Bebidas premium.
-   **Notas operacionais:** Show noturno.
-   **Notas comerciais:** Produto mais vendido.
-   **Fonte:** Coco Bongo.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-006

-   **Fornecedor:** Coco Bongo
-   **Passeio / serviço:** Coco Bongo --- Regular
-   **Variação / rota / dias:** Sexta-feira
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 93.75
-   **Moeda:** USD
-   **Regra de preço:** Tarifa específica para os dias indicados; não
    aplicar a dias sem preço cadastrado. Preço por pessoa; tarifa
    infantil não fornecida.
-   **Dias de operação:** Sexta-feira
-   **Horários:** 19:30--01:00
-   **Duração:** Noturno
-   **Descrição:** Entrada na pista com open bar nacional e snacks.
-   **Inclui:** Entrada + open bar nacional + snacks.
-   **Não inclui:** Bebidas premium.
-   **Notas operacionais:** Show noturno.
-   **Notas comerciais:** Sexta-feira.
-   **Fonte:** Coco Bongo.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-007

-   **Fornecedor:** Coco Bongo
-   **Passeio / serviço:** Coco Bongo --- Premium
-   **Variação / rota / dias:** Dom--Qua
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 93.75
-   **Moeda:** USD
-   **Regra de preço:** Tarifa específica para os dias indicados; não
    aplicar a dias sem preço cadastrado. Preço por pessoa; tarifa
    infantil não fornecida.
-   **Dias de operação:** Dom--Qua
-   **Horários:** 19:30--01:00
-   **Duração:** Noturno
-   **Descrição:** Entrada com open bar premium e snacks. Shows
    interativos.
-   **Inclui:** Entrada + open bar premium + snacks.
-   **Não inclui:** ---
-   **Notas operacionais:** Shows interativos.
-   **Notas comerciais:** Melhor visibilidade.
-   **Fonte:** Coco Bongo.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-008

-   **Fornecedor:** Coco Bongo
-   **Passeio / serviço:** Coco Bongo --- Premium
-   **Variação / rota / dias:** Qui--Sab
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 105
-   **Moeda:** USD
-   **Regra de preço:** Tarifa específica para os dias indicados; não
    aplicar a dias sem preço cadastrado. Preço por pessoa; tarifa
    infantil não fornecida.
-   **Dias de operação:** Qui--Sab
-   **Horários:** 19:30--01:00
-   **Duração:** Noturno
-   **Descrição:** Entrada na pista com open bar nacional e snacks.
-   **Inclui:** Entrada + open bar premium + snacks.
-   **Não inclui:** ---
-   **Notas operacionais:** Shows interativos.
-   **Notas comerciais:** Alta demanda.
-   **Pendências / ressalvas:** CONFLITO NA FONTE: descrição menciona
    open bar nacional, inclusões mencionam premium.
-   **Fonte:** Coco Bongo.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Ressalva no conteúdo

### TN-009

-   **Fornecedor:** Coco Bongo
-   **Passeio / serviço:** Coco Bongo --- Royal Service
-   **Variação / rota / dias:** Dom--Qua
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 131.25
-   **Moeda:** USD
-   **Regra de preço:** Tarifa específica para os dias indicados; não
    aplicar a dias sem preço cadastrado. Preço por pessoa; tarifa
    infantil não fornecida.
-   **Dias de operação:** Dom--Qua
-   **Horários:** 19:30--01:00
-   **Duração:** Noturno
-   **Descrição:** Entrada regular, open bar bebidas premium, mesa nas
    laterais (sem sentar) e snack incluso.
-   **Inclui:** Entrada + open bar premium + mesa lateral + snacks.
-   **Não inclui:** ---
-   **Notas operacionais:** Descritivo a confirmar.
-   **Notas comerciais:** Produto específico.
-   **Pendências / ressalvas:** O próprio catálogo diz: descritivo a
    confirmar.
-   **Fonte:** Coco Bongo.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Ressalva no conteúdo

### TN-010

-   **Fornecedor:** Coco Bongo
-   **Passeio / serviço:** Coco Bongo --- Gold Member
-   **Variação / rota / dias:** Dom--Qua
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 120
-   **Moeda:** USD
-   **Regra de preço:** Tarifa específica para os dias indicados; não
    aplicar a dias sem preço cadastrado. Preço por pessoa; tarifa
    infantil não fornecida.
-   **Dias de operação:** Dom--Qua
-   **Horários:** 19:30--01:00
-   **Duração:** Noturno
-   **Descrição:** Entrada VIP com open bar premium em camarote e snack
    incluso.
-   **Inclui:** Cadeira + open bar premium + snacks.
-   **Não inclui:** ---
-   **Notas operacionais:** Área VIP sentada.
-   **Notas comerciais:** Perfil premium.
-   **Fonte:** Coco Bongo.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-011

-   **Fornecedor:** Coco Bongo
-   **Passeio / serviço:** Coco Bongo --- Gold Member
-   **Variação / rota / dias:** Qui--Sab
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 127.5
-   **Moeda:** USD
-   **Regra de preço:** Tarifa específica para os dias indicados; não
    aplicar a dias sem preço cadastrado. Preço por pessoa; tarifa
    infantil não fornecida.
-   **Dias de operação:** Qui--Sab
-   **Horários:** 19:30--01:00
-   **Duração:** Noturno
-   **Descrição:** Entrada VIP com open bar premium em camarote e snack
    incluso.
-   **Inclui:** Cadeira + open bar premium + snacks.
-   **Não inclui:** ---
-   **Notas operacionais:** Área VIP sentada.
-   **Notas comerciais:** Alta temporada.
-   **Fonte:** Coco Bongo.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-012

-   **Fornecedor:** Coco Bongo
-   **Passeio / serviço:** Coco Bongo --- Front Row
-   **Variação / rota / dias:** Dom--Qua
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 146.25
-   **Moeda:** USD
-   **Regra de preço:** Tarifa específica para os dias indicados; não
    aplicar a dias sem preço cadastrado. Preço por pessoa; tarifa
    infantil não fornecida.
-   **Dias de operação:** Dom--Qua
-   **Horários:** 19:30--01:00
-   **Duração:** Noturno
-   **Descrição:** Entrada VIP, primeira fila com open bar premium e
    snack incluso.
-   **Inclui:** Cadeira primeira fila + open bar premium + snacks.
-   **Não inclui:** ---
-   **Notas operacionais:** Primeira fila.
-   **Notas comerciais:** Experiência top.
-   **Fonte:** Coco Bongo.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-013

-   **Fornecedor:** Coco Bongo
-   **Passeio / serviço:** Coco Bongo --- Front Row
-   **Variação / rota / dias:** Qui--Sab
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 157.5
-   **Moeda:** USD
-   **Regra de preço:** Tarifa específica para os dias indicados; não
    aplicar a dias sem preço cadastrado. Preço por pessoa; tarifa
    infantil não fornecida.
-   **Dias de operação:** Qui--Sab
-   **Horários:** 19:30--01:00
-   **Duração:** Noturno
-   **Descrição:** Entrada VIP, primeira fila, com open bar premium e
    snack incluso.
-   **Inclui:** Cadeira primeira fila + open bar premium + snacks.
-   **Não inclui:** ---
-   **Notas operacionais:** Primeira fila.
-   **Notas comerciais:** Produto mais exclusivo.
-   **Fonte:** Coco Bongo.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-014

-   **Fornecedor:** Envatours
-   **Passeio / serviço:** Barco de Vidro -- Colores de Cancún
-   **Variação / rota / dias:** Coletivo
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 27
-   **Custo criança:** 27
-   **Moeda:** USD
-   **Regra de preço:** Preço por pessoa na modalidade coletiva.
-   **Dias de operação:** Todos os dias
-   **Horários:** 10:00 / 11:30 / 13:00 / 14:30 / 16:00
-   **Duração:** 1h15
-   **Descrição:** Passeio de barco de vidro pela lagoa Nichupté e áreas
    de recife artificial em Cancún.
-   **Inclui:** Chaleco salvavidas; guia bilíngue; impostos do píer; 2
    bebidas por pessoa.
-   **Não inclui:** Fotos; gorjetas.
-   **Notas operacionais:** Saída da Zona Hoteleira de Cancún. Hotéis do
    centro devem ir até o ponto de encontro.
-   **Notas comerciais:** Passeio fácil e acessível. Ideal para famílias
    com crianças pequenas.
-   **Fonte:** Envatours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-015

-   **Fornecedor:** Envatours
-   **Passeio / serviço:** Barco de Vidro -- Colores de Cancún
-   **Variação / rota / dias:** Privado
-   **Modelo de cobrança:** Por embarcação (preço fechado)
-   **Custo fixo:** 270
-   **Moeda:** USD
-   **Regra de preço:** Preço fixo de embarcação privativa até 10
    passageiros (nota da planilha); não multiplicar pelo número de
    pessoas.
-   **Dias de operação:** Todos os dias
-   **Horários:** 10:00 / 11:30 / 13:00 / 14:30 / 16:00
-   **Duração:** 1h15
-   **Descrição:** Passeio privado de barco de vidro pela lagoa Nichupté
    e áreas de recife artificial em Cancún.
-   **Inclui:** Chaleco salvavidas; guia bilíngue; impostos do píer; 2
    bebidas por pessoa.
-   **Não inclui:** Fotos; gorjetas.
-   **Notas operacionais:** Saída da Zona Hoteleira de Cancún. Hotéis do
    centro devem ir até o ponto de encontro.
-   **Notas comerciais:** Passeio fácil e acessível. Ideal para famílias
    com crianças pequenas.
-   **Fonte:** Envatours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-016

-   **Fornecedor:** Envatours
-   **Passeio / serviço:** Barco de Vidro -- Tour Isla Mujeres
-   **Variação / rota / dias:** Coletivo
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 20
-   **Custo criança:** 20
-   **Moeda:** USD
-   **Regra de preço:** Preço por pessoa na modalidade coletiva.
-   **Dias de operação:** Todos os dias
-   **Horários:** 10:00 / 11:00 / 12:00 / 13:00 / 14:00 / 15:00 / 16:00
    / 17:00
-   **Duração:** 45 min
-   **Descrição:** Passeio curto em barco de vidro ao redor da ilha de
    Isla Mujeres para observação do fundo do mar.
-   **Inclui:** Chaleco salvavidas; guia bilíngue.
-   **Não inclui:** Fotos; gorjetas.
-   **Notas operacionais:** Saída da Marina Bartolomé, Isla Mujeres.
    Capacidade limitada por embarcação.
-   **Notas comerciais:** Boa atividade complementar após ferry ou
    passeio pela ilha.
-   **Fonte:** Envatours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-017

-   **Fornecedor:** Envatours
-   **Passeio / serviço:** Barco de Vidro -- Tour Isla Mujeres
-   **Variação / rota / dias:** Privado
-   **Modelo de cobrança:** Por embarcação (preço fechado)
-   **Custo fixo:** 200
-   **Moeda:** USD
-   **Regra de preço:** Preço fixo de embarcação privativa até 10
    passageiros (nota da planilha); não multiplicar pelo número de
    pessoas.
-   **Dias de operação:** Todos os dias
-   **Horários:** 10:00 / 11:00 / 12:00 / 13:00 / 14:00 / 15:00 / 16:00
    / 17:00
-   **Duração:** 45 min
-   **Descrição:** Passeio privado em barco de vidro ao redor da ilha de
    Isla Mujeres para observação do fundo do mar.
-   **Inclui:** Chaleco salvavidas; guia bilíngue.
-   **Não inclui:** Fotos; gorjetas.
-   **Notas operacionais:** Saída da Marina Bartolomé, Isla Mujeres.
    Capacidade limitada por embarcação.
-   **Notas comerciais:** Boa atividade complementar após ferry ou
    passeio pela ilha.
-   **Pendências / ressalvas:** Valor bruto original está truncado ('200
    to people'); nota de preço indica privado para 10 pessoas.
-   **Fonte:** Envatours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Ressalva na tarifa

### TN-018

-   **Fornecedor:** Envatours
-   **Passeio / serviço:** Barco de Vidro -- Bajo el Mar Cozumel
-   **Variação / rota / dias:** Coletivo
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 14
-   **Custo criança:** 14
-   **Moeda:** USD
-   **Regra de preço:** Preço por pessoa na modalidade coletiva.
-   **Dias de operação:** Todos os dias
-   **Horários:** 10:00 / 12:00 / 14:00 / 16:00
-   **Duração:** 1h30
-   **Descrição:** Passeio em barco de vidro para observação da vida
    marinha e recifes de Cozumel, com paradas para snorkel.
-   **Inclui:** Chaleco salvavidas; guia bilíngue; snorkel; 2 bebidas
    por pessoa.
-   **Não inclui:** Fotos; gorjetas.
-   **Notas operacionais:** Saída de Cozumel. Capacidade máxima por
    embarcação: 15 passageiros incluindo crianças.
-   **Notas comerciais:** Check-in com antecedência. Ótima opção curta
    para quem não quer mergulho.
-   **Fonte:** Envatours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-019

-   **Fornecedor:** Envatours
-   **Passeio / serviço:** Barco de Vidro -- Bajo el Mar Cozumel
-   **Variação / rota / dias:** Privado
-   **Modelo de cobrança:** Por embarcação (preço fechado)
-   **Custo fixo:** 140
-   **Moeda:** USD
-   **Regra de preço:** Preço fixo de embarcação privativa até 10
    passageiros (nota da planilha); não multiplicar pelo número de
    pessoas.
-   **Dias de operação:** Todos os dias
-   **Horários:** 10:00 / 12:00 / 14:00 / 16:00
-   **Duração:** 1h30
-   **Descrição:** Passeio privado em barco de vidro para observação da
    vida marinha e recifes de Cozumel, com paradas para snorkel.
-   **Inclui:** Chaleco salvavidas; guia bilíngue; snorkel; 2 bebidas
    por pessoa.
-   **Não inclui:** Fotos; gorjetas.
-   **Notas operacionais:** Saída de Cozumel. Capacidade máxima por
    embarcação: 15 passageiros incluindo crianças.
-   **Notas comerciais:** Check-in com antecedência. Ótima opção curta
    para quem não quer mergulho.
-   **Pendências / ressalvas:** Catálogo diz capacidade física de até 15
    pessoas; preço privado documentado para 10. Confirmar para 11--15.
-   **Fonte:** Envatours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Ressalva na tarifa

### TN-020

-   **Fornecedor:** MTZ Tours
-   **Passeio / serviço:** Tulum Casa Tortuga Silver
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 76
-   **Custo criança:** 71
-   **Moeda:** USD
-   **Taxas / extras fora da tarifa:** Taxa/imposto de 205 MXN fora do
    custo da tarifa (planilha); conferir quem paga e quando.
-   **Dias de operação:** Todos os dias
-   **Horários:** Manhã
-   **Duração:** Aprox. 8 horas
-   **Descrição:** Tour que combina visita às ruínas de Tulum com
    experiência completa em cenotes na Casa Tortuga, incluindo cenotes
    abertos e de caverna, com tempo guiado e livre para nado.
-   **Inclui:** Transporte terrestre ida e volta; guia bilíngue durante
    o percurso; entrada na Casa Tortuga; visita a 2 cenotes abertos e 2
    cenotes de caverna; guia local dentro da Casa Tortuga; uso de
    tirolesa; almoço buffet (tacos); visita à 5ª Avenida de Playa del
    Carmen.
-   **Não inclui:** Bebidas; taxa ambiental; aluguel de colete
    salva-vidas; gorjetas.
-   **Notas operacionais:** Serviço regular compartilhado; saída
    conforme logística do operador; tempo de permanência controlado no
    local.
-   **Notas comerciais:** Bom custo-benefício para quem quer cenotes
    variados + Tulum; ideal para primeira viagem.
-   **Pendências / ressalvas:** Descrição menciona ruínas de Tulum, mas
    entrada arqueológica não consta expressamente entre as inclusões.
-   **Fonte:** MTZ Tours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Ressalva no conteúdo

### TN-021

-   **Fornecedor:** MTZ Tours
-   **Passeio / serviço:** Tulum Casa Tortuga Econômico
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 47
-   **Custo criança:** 41
-   **Moeda:** USD
-   **Taxas / extras fora da tarifa:** Taxa/imposto de 205 MXN fora do
    custo da tarifa (planilha); conferir quem paga e quando.
-   **Dias de operação:** Todos os dias
-   **Horários:** Manhã
-   **Duração:** Aprox. 7--8 horas
-   **Descrição:** Tour econômico com visita à Casa Tortuga, incluindo
    cenotes abertos e de caverna, com foco em nado e contato com a
    natureza, sem refeições completas.
-   **Inclui:** Transporte terrestre ida e volta; guia bilíngue durante
    o percurso; entrada na Casa Tortuga; acesso a 2 cenotes abertos e 2
    cenotes de caverna; guia local no parque; visita à 5ª Avenida de
    Playa del Carmen.
-   **Não inclui:** Bebidas; alimentos; aluguel de colete salva-vidas;
    gorjetas.
-   **Notas operacionais:** Não inclui almoço; cliente pode levar
    dinheiro para consumo local.
-   **Notas comerciais:** Indicado para clientes que priorizam preço e
    experiência em cenotes.
-   **Fonte:** MTZ Tours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-022

-   **Fornecedor:** MTZ Tours
-   **Passeio / serviço:** Tulum + Casa Tortuga + Madre Naturaleza ---
    MTZ Tours
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 74
-   **Custo criança:** 68
-   **Moeda:** USD
-   **Taxas / extras fora da tarifa:** Taxa/imposto de 205 MXN fora do
    custo da tarifa (planilha); conferir quem paga e quando.
-   **Dias de operação:** Todos os dias
-   **Horários:** Manhã
-   **Duração:** Dia inteiro
-   **Descrição:** Passeio de dia inteiro com foco em natureza e
    cenotes, sem visita às ruínas arqueológicas de Tulum, combinando
    Casa Tortuga, Madre Naturaleza e tempo livre em Playa del Carmen.
-   **Inclui:** Transporte terrestre ida e volta; box lunch (sanduíche,
    fruta, bolacha e suco); entrada na área de Tulum (1h, sem acesso às
    ruínas); garrafa de água; entrada ao Cenote Casa Tortuga (2
    abertos + 2 fechados); entrada à Madre Naturaleza; guia local;
    almoço buffet; fotos nas Letras de Tulum; 1h em Playa del Carmen.
-   **Não inclui:** Acesso às ruínas arqueológicas; guia federal;
    bebidas durante o almoço; visores; fotos; gastos pessoais.
-   **Notas operacionais:** Roteiro e horários sujeitos a alteração por
    logística ou condições climáticas. Passeio não inclui ruínas
    arqueológicas.
-   **Notas comerciais:** Boa opção para clientes que querem cenotes e
    natureza sem foco arqueológico. Perfil relax e familiar.
-   **Fonte:** MTZ Tours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-023

-   **Fornecedor:** MTZ Tours
-   **Passeio / serviço:** Tulum Dos Ojos e Grand Cenote
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 103
-   **Custo criança:** 97
-   **Moeda:** USD
-   **Taxas / extras fora da tarifa:** Taxa/imposto de 420 MXN fora do
    custo da tarifa (planilha); conferir quem paga e quando.
-   **Dias de operação:** Terça, quinta e sábado
-   **Horários:** Manhã
-   **Duração:** Aprox. 8--9 horas
-   **Descrição:** Tour que combina visita guiada às ruínas de Tulum com
    experiência de nado em cenotes da região, incluindo Dos Ojos e Grand
    Cenote, com tempo dedicado para exploração aquática.
-   **Inclui:** Transporte terrestre ida e volta; guia bilíngue; entrada
    na zona arqueológica de Tulum; visita guiada às ruínas; entrada no
    Parque Dos Ojos; nado em 2 cenotes; entrada no Grand Cenote; uso de
    colete salva-vidas.
-   **Não inclui:** Bebidas no restaurante; taxa ambiental; gorjetas.
-   **Notas operacionais:** Cenotes com tempo controlado; uso
    obrigatório de colete salva-vidas.
-   **Notas comerciais:** Boa opção para quem quer Tulum + cenotes
    clássicos no mesmo dia.
-   **Fonte:** MTZ Tours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-024

-   **Fornecedor:** MTZ Tours
-   **Passeio / serviço:** JOYÀ Cirque du Soleil -- VIP
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 242
-   **Custo criança:** 170
-   **Moeda:** USD
-   **Regra de preço:** Transporte até o espetáculo cotado separadamente
    conforme ponto de encontro.
-   **Dias de operação:** Conforme calendário
-   **Horários:** Noturno
-   **Duração:** Aprox. 2 horas
-   **Descrição:** Experiência VIP do espetáculo JOYÀ do Cirque du
    Soleil, com jantar completo de três tempos, assentos preferenciais e
    serviço premium durante o show.
-   **Inclui:** Ingresso para o espetáculo JOYÀ; jantar de três tempos;
    assentos preferenciais; champanhe ilimitado durante o jantar.
-   **Não inclui:** Transporte; bebidas adicionais fora do pacote;
    gorjetas.
-   **Notas operacionais:** Cliente deve chegar com antecedência mínima
    recomendada pelo teatro.
-   **Notas comerciais:** Ideal para clientes premium, comemorações e
    ocasiões especiais.
-   **Fonte:** MTZ Tours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-025

-   **Fornecedor:** MTZ Tours
-   **Passeio / serviço:** JOYÀ Cirque du Soleil -- Show & Jantar
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 180
-   **Custo criança:** 126
-   **Moeda:** USD
-   **Regra de preço:** Transporte até o espetáculo cotado separadamente
    conforme ponto de encontro.
-   **Dias de operação:** Conforme calendário
-   **Horários:** Noturno
-   **Duração:** Aprox. 2 horas
-   **Descrição:** Experiência que combina o espetáculo JOYÀ do Cirque
    du Soleil com jantar de três tempos e serviço de mesa durante a
    apresentação.
-   **Inclui:** Ingresso para o espetáculo JOYÀ; jantar de três tempos;
    meia garrafa de champanhe por pessoa.
-   **Não inclui:** Transporte; bebidas extras; gorjetas.
-   **Notas operacionais:** Assentos definidos conforme categoria
    adquirida.
-   **Notas comerciais:** Boa opção para quem quer experiência completa
    com melhor custo-benefício.
-   **Fonte:** MTZ Tours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-026

-   **Fornecedor:** MTZ Tours
-   **Passeio / serviço:** JOYÀ Cirque du Soleil -- Assentos Premium,
    Bebidas & Canapés
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 132
-   **Custo criança:** 93
-   **Moeda:** USD
-   **Regra de preço:** Transporte até o espetáculo cotado separadamente
    conforme ponto de encontro.
-   **Dias de operação:** Conforme calendário
-   **Horários:** Noturno
-   **Duração:** Aprox. 2 horas
-   **Descrição:** Experiência com assentos premium para o espetáculo
    JOYÀ, acompanhada de bebidas e seleção de canapés gourmet durante o
    show.
-   **Inclui:** Ingresso para o espetáculo JOYÀ; assentos premium; meia
    garrafa de champanhe por pessoa; seleção de canapés gourmet.
-   **Não inclui:** Transporte; bebidas adicionais; gorjetas.
-   **Notas operacionais:** Experiência focada no espetáculo, sem jantar
    completo.
-   **Notas comerciais:** Boa alternativa intermediária entre VIP e
    ingresso simples.
-   **Fonte:** MTZ Tours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-027

-   **Fornecedor:** MTZ Tours
-   **Passeio / serviço:** JOYÀ Cirque du Soleil -- Somente Show
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 75
-   **Custo criança:** 38
-   **Moeda:** USD
-   **Regra de preço:** Transporte até o espetáculo cotado separadamente
    conforme ponto de encontro.
-   **Dias de operação:** Conforme calendário
-   **Horários:** Noturno
-   **Duração:** Aprox. 2 horas
-   **Descrição:** Ingresso para assistir ao espetáculo JOYÀ do Cirque
    du Soleil, sem jantar incluso.
-   **Inclui:** Ingresso para o espetáculo JOYÀ; opção de mesa ou
    assento alto conforme disponibilidade.
-   **Não inclui:** Transporte; alimentos; bebidas; gorjetas.
-   **Notas operacionais:** Ideal chegar cedo para melhor acomodação
    conforme categoria.
-   **Notas comerciais:** Opção mais acessível para quem quer apenas o
    show.
-   **Fonte:** MTZ Tours.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-028

-   **Fornecedor:** MUSA
-   **Passeio / serviço:** Musa Cilindro
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 89
-   **Custo criança:** 89
-   **Moeda:** USD
-   **Dias de operação:** Todos os dias (checar domingos)
-   **Horários:** 10:00--16:00
-   **Duração:** Meio dia
-   **Descrição:** Treinamento em piscina das 10h às 12h para
    iniciantes, seguido de passeio de barco para dois pontos de mergulho
    em alto mar de aprox. 45 min cada --- um deles no MUSA, o museu
    subaquático. Retorno a Cancún após os mergulhos.
-   **Inclui:** Treinamento em piscina; equipamentos de mergulho;
    instrutor; barco ida e volta; transporte ida e volta saindo de
    Cancún; 2 paradas de mergulho com guia.
-   **Não inclui:** Roupa neoprene; fotos ou vídeos profissionais;
    alimentos ou bebidas.
-   **Notas operacionais:** Se o cliente não passar na fase de
    treinamento da piscina, o passeio encerra às 12h e não há reembolso.
-   **Notas comerciais:** Ideal para aventureiros e quem quer mergulhar
    pela primeira vez. O MUSA é um diferencial único --- museu
    subaquático é exclusivo de Cancún.
-   **Pendências / ressalvas:** Operação aos domingos indicada como
    pendente de confirmação.
-   **Fonte:** MUSA.docx (01/05/2026); TOURS PUBLIC & COST PRICES.xlsx;
    confirmações em chat (13/10/2026)
-   **Estado:** Horário / dia pendente

### TN-029

-   **Fornecedor:** Parasailing & Jet Ski
-   **Passeio / serviço:** Parasailing
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 55
-   **Custo criança:** 55
-   **Moeda:** USD
-   **Regra de preço:** Preço por pessoa.
-   **Taxas / extras fora da tarifa:** USD 10, taxa paga no local; não
    somar automaticamente ao pagamento ao fornecedor.
-   **Dias de operação:** Todos os dias
-   **Horários:** 10:00--16:00
-   **Duração:** 20min
-   **Descrição:** Sobrevoe o mar de Cancún a 80m de altura com voo em
    parasailing. Uma experiência de adrenalina com vista panorâmica da
    costa.
-   **Inclui:** Colete salva-vidas; voo; transporte ida e volta.
-   **Não inclui:** Fotos e vídeos.
-   **Notas operacionais:** Taxa de USD 10 paga no local.
-   **Fonte:** Parasailing & Jetski.docx (01/05/2026); TOURS PUBLIC &
    COST PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-030

-   **Fornecedor:** Parasailing & Jet Ski
-   **Passeio / serviço:** Jet ski 30min
-   **Modelo de cobrança:** Por jet ski (até 2 pessoas)
-   **Custo fixo:** 90
-   **Moeda:** USD
-   **Regra de preço:** Uma unidade comporta até 2 pessoas; não
    multiplicar por adulto/criança.
-   **Dias de operação:** Todos os dias
-   **Horários:** 10:00--16:00
-   **Duração:** 30min
-   **Descrição:** Dirija um jet ski pelos mares de Cancún durante 30
    minutos. Aceita até 2 pessoas por equipamento.
-   **Inclui:** Equipamento de jet ski; transporte ida e volta.
-   **Não inclui:** Fotos e vídeos.
-   **Fonte:** Parasailing & Jetski.docx (01/05/2026); TOURS PUBLIC &
    COST PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-031

-   **Fornecedor:** Parasailing & Jet Ski
-   **Passeio / serviço:** Jet ski 60min
-   **Modelo de cobrança:** Por jet ski (até 2 pessoas)
-   **Custo fixo:** 120
-   **Moeda:** USD
-   **Regra de preço:** Uma unidade comporta até 2 pessoas; não
    multiplicar por adulto/criança.
-   **Dias de operação:** Todos os dias
-   **Horários:** 10:00--16:00
-   **Duração:** 60min
-   **Descrição:** Dirija um jet ski pelos mares de Cancún durante 60
    minutos. Aceita até 2 pessoas por equipamento.
-   **Inclui:** Equipamento de jet ski; transporte ida e volta.
-   **Não inclui:** Fotos e vídeos.
-   **Fonte:** Parasailing & Jetski.docx (01/05/2026); TOURS PUBLIC &
    COST PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Revisado

### TN-032

-   **Fornecedor:** Playamia
-   **Passeio / serviço:** Cozumel El Cielo
-   **Variação / rota / dias:** Saída: Playa del Carmen
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 1660
-   **Custo criança:** 1480
-   **Moeda:** MXN
-   **Regra de preço:** Preço por pessoa de acordo com o local de saída;
    não intercambiar as três opções.
-   **Taxas / extras fora da tarifa:** USD 13, taxa portuária não
    incluída (planilha); confirmar cobrança/pagador.
-   **Dias de operação:** Seg--Sáb
-   **Horários:** A confirmar
-   **Duração:** Dia inteiro
-   **Descrição:** Passeio de catamarã em Cozumel com snorkel em
    arrecifes e visita a El Cielo e El Cielito, com almoço incluso.
-   **Inclui:** Ferry ida e volta; passeio de catamarã; snorkel em
    arrecifes; visita a El Cielo e El Cielito; open bar a bordo;
    equipamento de snorkel; almoço em restaurante; bebidas; tempo livre
    em Cozumel.
-   **Não inclui:** Taxa portuária; despesas pessoais.
-   **Notas operacionais:** Reportar no meeting point em Playa del
    Carmen.
-   **Notas comerciais:** Tour muito completo. Ótimo custo-benefício.
-   **Pendências / ressalvas:** Horários exatos de saída não informados.
-   **Fonte:** Playamia.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Horário pendente

### TN-033

-   **Fornecedor:** Playamia
-   **Passeio / serviço:** Cozumel El Cielo
-   **Variação / rota / dias:** Saída: Cancún
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 1960
-   **Custo criança:** 1780
-   **Moeda:** MXN
-   **Regra de preço:** Preço por pessoa de acordo com o local de saída;
    não intercambiar as três opções.
-   **Taxas / extras fora da tarifa:** USD 13, taxa portuária não
    incluída (planilha); confirmar cobrança/pagador.
-   **Dias de operação:** Seg--Sáb
-   **Horários:** A confirmar
-   **Duração:** Dia inteiro
-   **Descrição:** Mesma experiência de catamarã em Cozumel com
    transporte desde hotéis, snorkel e almoço incluso.
-   **Inclui:** Transporte hotel; ferry ida e volta; passeio de
    catamarã; snorkel; El Cielo; El Cielito; open bar; equipamento;
    almoço; bebidas; tempo livre.
-   **Não inclui:** Taxa portuária; despesas pessoais.
-   **Notas operacionais:** Buscar hotel conforme zona.
-   **Notas comerciais:** Ideal para quem não quer se deslocar por conta
    própria.
-   **Pendências / ressalvas:** Horários exatos de saída não informados.
-   **Fonte:** Playamia.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Horário pendente

### TN-034

-   **Fornecedor:** Playamia
-   **Passeio / serviço:** Cozumel El Cielo
-   **Variação / rota / dias:** Saída: Cozumel
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 1350
-   **Custo criança:** 1170
-   **Moeda:** MXN
-   **Regra de preço:** Preço por pessoa de acordo com o local de saída;
    não intercambiar as três opções.
-   **Taxas / extras fora da tarifa:** USD 13, taxa portuária não
    incluída (planilha); confirmar cobrança/pagador.
-   **Dias de operação:** Seg--Sáb
-   **Horários:** A confirmar
-   **Duração:** Dia inteiro
-   **Descrição:** Saída direta do píer em Cozumel para passeio de
    catamarã com snorkel e almoço.
-   **Inclui:** Passeio de catamarã; snorkel; El Cielo; El Cielito; open
    bar; equipamento; almoço; bebidas; tempo livre.
-   **Não inclui:** Taxa portuária; ferry; transporte terrestre.
-   **Notas operacionais:** Cliente deve estar em Cozumel.
-   **Notas comerciais:** Boa opção para quem já está na ilha.
-   **Pendências / ressalvas:** Horários exatos de saída não informados.
-   **Fonte:** Playamia.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Horário pendente

### TN-035

-   **Fornecedor:** Baktun
-   **Passeio / serviço:** Chichén Itzá Plus
-   **Modelo de cobrança:** Por pessoa
-   **Custo adulto:** 61
-   **Custo criança:** 50
-   **Moeda:** USD
-   **Pendências / ressalvas:** Passeio distinto do Deluxe, confirmado
    pelo responsável; descrição, inclusões, exclusões e agenda ainda não
    fornecidas.
-   **Fonte:** Baktun.docx (01/05/2026); TOURS PUBLIC & COST
    PRICES.xlsx; confirmações em chat (13/10/2026)
-   **Estado:** Informações pendentes

### TN-036

-   **Fornecedor:** Puerto Maya
-   **Passeio / serviço:** Jungle Tour
-   **Variação / rota / dias:** Pacote único
-   **Modelo de cobrança:** Por pessoa (transporte obrigatório incluso)
-   **Custo adulto:** 33
-   **Custo criança:** 23
-   **Moeda:** USD
-   **Regra de preço:** Adulto: passeio 25 + transporte obrigatório 8 =
    33; criança: passeio 15 + transporte obrigatório 8 = 23. Já incluído
    no custo: NÃO adicionar 8 novamente.
-   **Notas operacionais:** Transporte obrigatório para todos os
    passageiros; valor de USD 8 por pessoa já incluído nos totais.
-   **Pendências / ressalvas:** Preço informado como estimativa pelo
    responsável; confirmar com fornecedor. Faltam descrição, inclusões,
    exclusões, agenda e regras de faixa etária.
-   **Fonte:** Informações e decisões do responsável em chat
    (13/10/2026)
-   **Estado:** Preço estimado / conteúdo pendente

### TN-037

-   **Fornecedor:** Miguel Shuttle
-   **Passeio / serviço:** Traslado Aeroporto de Cancún
-   **Variação / rota / dias:** Aeroporto ↔ Cancún Zona Hoteleira /
    Centro
-   **Modelo de cobrança:** Por veículo e por trecho (1 a 7 passageiros)
-   **Custo fixo:** 39
-   **Moeda:** USD
-   **Regra de preço:** Mesmo preço em ambos os sentidos. Preço de um
    trecho; ida e volta = dois trechos, cobrados duas vezes. Máximo 7
    passageiros por veículo.
-   **Descrição:** Transfer privado entre Aeroporto de Cancún e Cancún
    Zona Hoteleira / Centro.
-   **Inclui:** Veículo para até 7 passageiros por trecho.
-   **Notas operacionais:** Mesma tarifa para chegada ao aeroporto ou
    saída dele, conforme confirmação do responsável.
-   **Fonte:** Tabela de Miguel (IMG_1893.png); confirmações do
    responsável em chat (13/10/2026)
-   **Estado:** Revisado

### TN-038

-   **Fornecedor:** Miguel Shuttle
-   **Passeio / serviço:** Traslado Aeroporto de Cancún
-   **Variação / rota / dias:** Aeroporto ↔ Costa Mujeres
-   **Modelo de cobrança:** Por veículo e por trecho (1 a 7 passageiros)
-   **Custo fixo:** 60
-   **Moeda:** USD
-   **Regra de preço:** Mesmo preço em ambos os sentidos. Preço de um
    trecho; ida e volta = dois trechos, cobrados duas vezes. Máximo 7
    passageiros por veículo.
-   **Descrição:** Transfer privado entre Aeroporto de Cancún e Costa
    Mujeres.
-   **Inclui:** Veículo para até 7 passageiros por trecho.
-   **Notas operacionais:** Mesma tarifa para chegada ao aeroporto ou
    saída dele, conforme confirmação do responsável.
-   **Fonte:** Tabela de Miguel (IMG_1893.png); confirmações do
    responsável em chat (13/10/2026)
-   **Estado:** Revisado

### TN-039

-   **Fornecedor:** Miguel Shuttle
-   **Passeio / serviço:** Traslado Aeroporto de Cancún
-   **Variação / rota / dias:** Aeroporto ↔ Playa del Carmen
-   **Modelo de cobrança:** Por veículo e por trecho (1 a 7 passageiros)
-   **Custo fixo:** 65
-   **Moeda:** USD
-   **Regra de preço:** Mesmo preço em ambos os sentidos. Preço de um
    trecho; ida e volta = dois trechos, cobrados duas vezes. Máximo 7
    passageiros por veículo.
-   **Descrição:** Transfer privado entre Aeroporto de Cancún e Playa
    del Carmen.
-   **Inclui:** Veículo para até 7 passageiros por trecho.
-   **Notas operacionais:** Mesma tarifa para chegada ao aeroporto ou
    saída dele, conforme confirmação do responsável.
-   **Fonte:** Tabela de Miguel (IMG_1893.png); confirmações do
    responsável em chat (13/10/2026)
-   **Estado:** Revisado

### TN-040

-   **Fornecedor:** Miguel Shuttle
-   **Passeio / serviço:** Traslado Aeroporto de Cancún
-   **Variação / rota / dias:** Aeroporto ↔ Tulum Centro
-   **Modelo de cobrança:** Por veículo e por trecho (1 a 7 passageiros)
-   **Custo fixo:** 120
-   **Moeda:** USD
-   **Regra de preço:** Mesmo preço em ambos os sentidos. Preço de um
    trecho; ida e volta = dois trechos, cobrados duas vezes. Máximo 7
    passageiros por veículo.
-   **Descrição:** Transfer privado entre Aeroporto de Cancún e Tulum
    Centro.
-   **Inclui:** Veículo para até 7 passageiros por trecho.
-   **Notas operacionais:** Mesma tarifa para chegada ao aeroporto ou
    saída dele, conforme confirmação do responsável.
-   **Fonte:** Tabela de Miguel (IMG_1893.png); confirmações do
    responsável em chat (13/10/2026)
-   **Estado:** Revisado

### TN-041

-   **Fornecedor:** Miguel Shuttle
-   **Passeio / serviço:** Traslado Aeroporto de Cancún
-   **Variação / rota / dias:** Aeroporto ↔ Tulum Zona Hoteleira
-   **Modelo de cobrança:** Por veículo e por trecho (1 a 7 passageiros)
-   **Custo fixo:** 135
-   **Moeda:** USD
-   **Regra de preço:** Mesmo preço em ambos os sentidos. Preço de um
    trecho; ida e volta = dois trechos, cobrados duas vezes. Máximo 7
    passageiros por veículo.
-   **Descrição:** Transfer privado entre Aeroporto de Cancún e Tulum
    Zona Hoteleira.
-   **Inclui:** Veículo para até 7 passageiros por trecho.
-   **Notas operacionais:** Mesma tarifa para chegada ao aeroporto ou
    saída dele, conforme confirmação do responsável.
-   **Fonte:** Tabela de Miguel (IMG_1893.png); confirmações do
    responsável em chat (13/10/2026)
-   **Estado:** Revisado

### TN-042

-   **Fornecedor:** Miguel Shuttle
-   **Passeio / serviço:** Traslado hotel ↔ hotel
-   **Variação / rota / dias:** Origem e destino variáveis
-   **Modelo de cobrança:** Cotação individual por veículo e trecho
-   **Moeda:** USD
-   **Regra de preço:** Preço depende do par de hotéis. Exigir cotação
    manual para a reserva; não reutilizar automaticamente o preço de
    outros trajetos.
-   **Descrição:** Transfer privado entre hotéis, com origem e destino
    informados na reserva.
-   **Inclui:** Serviço de transporte privado conforme cotação.
-   **Notas operacionais:** Miguel normalmente informa o valor caso a
    caso.
-   **Pendências / ressalvas:** Nenhum preço padrão estabelecido; cotar
    e salvar o custo real na reserva.
-   **Fonte:** Confirmação do responsável em chat (13/10/2026)
-   **Estado:** Sob cotação

## GUIA ORIGINAL DA PLANILHA (REFERÊNCIA ADICIONAL)

GUIA DE IMPORTAÇÃO --- TÍO NENÊ Versão inicial do cadastro de
fornecedores, passeios e custos --- 13/10/2026

OBJETIVO Importar a aba Catálogo como base inicial do sistema: 9
fornecedores, 42 linhas de opções, sem digitação manual. Os valores são
custos pagos aos fornecedores; NÃO são preços de venda ao cliente.

REGRAS OBRIGATÓRIAS DO SISTEMA 1. Todos os campos devem poder ser
alterados no painel: fornecedor, nome, tipo de pacote, custos, moeda,
horários, descrição, inclusões, exclusões e observações. Nada
hard-coded. 2. O custo de uma reserva por pessoa = (adultos × custo
adulto) + (crianças × custo criança), respeitando a opção e o dia
contratado. 3. Custos por embarcação, jet ski ou veículo são valores
fixos POR UNIDADE/trecho. Não multiplicar pelo número de passageiros. 4.
Para Puerto Maya, o transporte de USD 8 por passageiro é obrigatório e
JÁ FAZ PARTE dos custos totais: USD 33 adulto / USD 23 criança. Não
duplicar. 5. Miguel Shuttle: tarifas do aeroporto valem em ambos os
sentidos, por trecho (1--7 pessoas). Ida + volta = 2 trechos.
Hotel↔hotel requer cotação individual. 6. Tarifas do Coco Bongo variam
conforme dia. Datas não contempladas não devem receber preço inventado
ou calculado automaticamente. 7. Valores de taxas externas da coluna K
(porto, imposto, taxa local) são INFORMativos. Não incorporar ao
pagamento ao fornecedor sem regra confirmada. 8. Ao registrar uma
reserva, salvar uma cópia (snapshot) do custo aplicado, moeda,
quantidade e extras. Alterações futuras no catálogo não mudam reservas
anteriores. 9. Cada reserva deve indicar fornecedor + passeio/opção,
passageiros ou unidades, data do serviço e custo devido ao fornecedor;
pagamentos podem quitar várias reservas. 10. Campos faltantes devem
ficar vazios e editáveis. Não inventar informação nem publicar valores
estimados como confirmados.

ITENS PENDENTES / ALERTAS • Baktun --- Chichén Itzá Plus é diferente de
Deluxe; falta descrição, inclusões/exclusões e agenda. • Coco Bongo ---
Premium Qui--Sáb: descrição menciona bar nacional, mas inclusões
mencionam premium. Verificar; preço USD 105 mantido. • Envatours ---
preços privados indicados para até 10 pessoas, embora a capacidade
física do barco de Cozumel seja 15; regras acima de 10 a confirmar. •
MTZ Tours --- Silver: entrada em ruínas de Tulum não está explicitamente
nas inclusões. Existem taxas MXN separadas na planilha. • MUSA ---
verificar se opera aos domingos. Playamia --- horários de saída a
confirmar. • Puerto Maya --- Jungle Tour é pacote único, preços
estimados (USD 25/15 + USD 8/pessoa de transporte obrigatório). Faltam
informações descritivas. • Miguel Shuttle --- transfers hotel↔hotel usam
cotação individual e não possuem tabela de preço padrão. • Faixas
etárias para valores de criança precisam ser configuradas por
fornecedor/produto, não presumidas iguais para todos.

ESCOPO Incluídos: Baktun, Coco Bongo, Envatours, MTZ Tours, MUSA,
Parasailing & Jet Ski, Playamia, Puerto Maya e Miguel Shuttle. Excluídos
por decisão do responsável: Xcaret, The Dolphin Company (incluindo
Aquatours), Lugares Mágicos, Francisco Murrieta, Neftali, Tena Busses,
YachtL2, Viajero Cibernético, Tamei e TAMYFER. Excluir aqui significa
não importar ao catálogo atual; os dados históricos originais não devem
ser apagados.

FONTES Documentos individuais dos fornecedores (01/05/2026), planilha
TOURS PUBLIC & COST PRICES.xlsx, tabela de Miguel e confirmações no chat
de 13/10/2026. A coluna Fonte documenta a origem de cada opção. Valores
informados de modo incerto são explicitamente identificados.

## COMO ORGANIZAR A IMPLEMENTAÇÃO DEPOIS DA APROVAÇÃO

No plano, considere etapas independentes e entregáveis, adaptando a
ordem à arquitetura encontrada: - Etapa 0 --- Auditoria e diagnóstico
(somente leitura; esta é a etapa atual). - Etapa 1 --- Decisões
pendentes, modelo de dados e regras de negócio aprovadas. - Etapa 2 ---
Catálogo administrativo, permissões, validação e trilha de auditoria. -
Etapa 3 --- Importação validada e idempotente dos 42 registros, com
relatório e rollback. - Etapa 4 --- Motor de cálculo de custos e testes
unitários para cada tipo de cobrança. - Etapa 5 --- Cadastro/gestão de
reservas com snapshot imutável de custo. - Etapa 6 --- Pagamentos,
alocações, saldos e histórico. - Etapa 7 --- Integração com o site
público, somente onde fizer sentido e sem expor custos internos. - Etapa
8 --- Testes integrados, segurança, regressão, acessibilidade,
desempenho, documentação e deploy controlado.

Não assuma que essas etapas são obrigatórias na ordem exata: ajuste com
base nas dependências reais e justifique mudanças. Separe claramente o
site público do painel interno e proteja custos de fornecedores contra
exposição pública.

## FORMATO FINAL DA RESPOSTA DO ANTIGRAVITY

Use esta estrutura: 1. Resumo executivo. 2. Arquitetura e inventário
técnico encontrados (com evidências). 3. Matriz requisito × situação
atual × evidência × lacuna. 4. Riscos críticos e inconsistências de
negócio. 5. Decisões pendentes e perguntas ao responsável. 6. Plano por
etapas com tarefas, dependências, estimativa relativa (P/M/G), critérios
de aceite e testes. 7. Estratégia de importação e integridade histórica.
8. Plano de testes detalhado. 9. Ordem recomendada para execução e
critérios de aprovação de cada etapa.

Seja específico e objetivo. Cada afirmação sobre o código deve citar o
arquivo ou componente onde foi verificada. Se não encontrar evidência,
diga isso. **Não implemente nada até eu aprovar o plano.**
