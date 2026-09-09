# Pendentes

Lista de trabalho por fazer no CRM, mantida em conversa com o Bernardo.
Quando pedir "os pendentes", é isto que se lê e atualiza.

## Por desenvolver

### 1. Email automático ao fornecedor com pedido de disponibilidade

Pedido a 2026-09-09. Ao associar um cliente a um fornecedor (nova
contratação), o CRM envia ao fornecedor um email com a data do casamento,
o número de convidados, o valor e o local, se existir.

Desenho combinado:

- Opção "Enviar pedido de disponibilidade ao fornecedor" no formulário
  "Nova contratação", ligada por omissão.
- Modelo de texto editável nas definições, com campos `{casal}`, `{data}`,
  `{convidados}`, `{valor}`, `{local}`, `{categoria}`.
- Envio registado na atividade do cliente; botão "Reenviar pedido" na
  contratação; aviso quando o fornecedor não tem email.
- Respostas chegam à caixa de correio do Bernardo (Reply-To).
- Página de definições "Email", só para administradores, com os dados de
  envio (SMTP) e um botão "Enviar email de teste".

Decisões que faltam (são do Bernardo):

- Conta de envio: Gmail/email do domínio com palavra-passe de aplicação, ou
  serviço de envio (Brevo, Resend) com validação do domínio.
- Envio automático ao guardar, ou pré-visualização para confirmar com um
  toque (recomendado ao início).

Nota: a partir do ambiente de desenvolvimento não se enviam emails reais; o
teste final é feito no CRM em produção com "Enviar email de teste".

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

- 2026-09-09 — Despesas com IVA, categorias e lucro por período (PR #12).
- 2026-09-08 — Calendário com ligação ao Google Calendar (PR #11).
- 2026-09-07 — Seletores de estado a manter o valor escolhido (PR #10).
- 2026-09-07 — Comissões a receber dos fornecedores (PR #9).
