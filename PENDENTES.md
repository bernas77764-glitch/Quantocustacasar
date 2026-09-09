# Pendentes

Lista de trabalho por fazer no CRM, mantida em conversa com o Bernardo.
Quando pedir "os pendentes", é isto que se lê e atualiza.

## Por desenvolver

### 1. Emails a fornecedores e clientes (adiado, 2026-09-09)

O Bernardo decidiu não avançar por agora; é uma aposta para o futuro.

O pedido de disponibilidade ao fornecedor está construído e testado no
PR #13 (commit 8b2aff5, ramo de trabalho), com Definições › Email
(Resend/Brevo por API, remetente do domínio, modelo editável, email de
teste). Não foi fundido. Para retomar: reabrir o PR #13 ou recuperar o
commit, fundir, e depois criar conta no Resend (ou Brevo), verificar o
domínio quantocustacasar.pt com os registos DNS na dominios.pt e colar a
chave em Definições › Email com o remetente geral@quantocustacasar.pt.
Alternativa sem conta nova: enviar pela caixa geral@ do cPanel, o que
exige acrescentar SMTP ao CRM.

Também por fazer: modelos de email ao casal (agradecer a simulação) e de
proposta de parceria a novos fornecedores, ambos escritos em conversa a
2026-09-09.

### 2. Tabela de preços só para administradores

Sugerido a 2026-09-07, sem pedido. Hoje qualquer utilizador com sessão pode
alterar a tabela que o site usa. Passar a exigir perfil de administrador.

### 3. Imagem Docker sem correr como root

Sugerido a 2026-09-06, sem pedido. O contentor corre como root porque o
volume do Railway é criado com dono root. Alternativa: um entrypoint que
ajusta as permissões de `/data` e larga privilégios para o utilizador `node`.

### 4. Google Calendar em tempo real (OAuth)

Só se o atraso do feed subscrito (o Google relê de poucas em poucas horas)
vier a incomodar. Exige projeto na Google Cloud e ecrã de consentimento.

## Ações do Bernardo (não são código)

- Na página Comissões, marcar como recebidas as comissões que os
  fornecedores já pagaram antes de existir o controlo (uma vez só).
- Em Calendário › Google Calendar, num computador: subscrever a ligação do
  CRM no Google e colar o endereço secreto iCal do calendário pessoal.
- Domínio: confirmar que quantocustacasar.pt abre o site e ligar "Enforce
  HTTPS" no GitHub Pages; depois, o CRM em crm.quantocustacasar.pt (Railway
  › Settings › Networking › Custom Domain, mais um CNAME na dominios.pt).

## Concluído

- 2026-09-09 — Pedido de disponibilidade ao fornecedor por email
  construído (PR #13), adiado por decisão do Bernardo; não fundido.
- 2026-09-09 — Despesas com IVA, categorias e lucro por período (PR #12).
- 2026-09-08 — Calendário com ligação ao Google Calendar (PR #11).
- 2026-09-07 — Seletores de estado a manter o valor escolhido (PR #10).
- 2026-09-07 — Comissões a receber dos fornecedores (PR #9).
