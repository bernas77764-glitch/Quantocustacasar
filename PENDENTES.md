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

Modelos escritos a 2026-09-10 (ficheiro modelos-de-email.md enviado ao
Bernardo para ajustar): C1 agradecimento pela simulação (automático, ao
receber o lead do site), C2 depois do primeiro telefonema, C3 proposta de
orçamentos; F1 agradecimento pela candidatura (automático, ao receber o
pedido de parceria do site), F2 apresentação e condições, F3 pedido de
disponibilidade e cotação com notas, F4 ponto de situação para controlar
comissões, F5 envio de fatura. Integrar no CRM quando o envio de email for
retomado: os automáticos disparam nas rotas públicas; os outros abrem
pré-preenchidos a partir da ficha, como o pedido de disponibilidade.

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

## Concluído

- 2026-09-09 — Domínio quantocustacasar.pt ligado a tudo: site (GitHub
  Pages, HTTPS), CRM em crm.quantocustacasar.pt (Railway), site a enviar
  leads e a ler preços no endereço novo, e correio geral@quantocustacasar.pt
  no cPanel da dominios.pt com MX, SPF (com include:spf.dominios.pt, porque
  o correio sai por um relay deles), DKIM e DMARC. DNS gerido no editor da
  dominios.pt (nameservers host-redirect).
- 2026-09-09 — Pedido de disponibilidade ao fornecedor por email
  construído (PR #13), adiado por decisão do Bernardo; não fundido.
- 2026-09-09 — Despesas com IVA, categorias e lucro por período (PR #12).
- 2026-09-08 — Calendário com ligação ao Google Calendar (PR #11).
- 2026-09-07 — Seletores de estado a manter o valor escolhido (PR #10).
- 2026-09-07 — Comissões a receber dos fornecedores (PR #9).
