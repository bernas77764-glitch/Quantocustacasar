# Pendentes

Lista de trabalho por fazer no CRM, mantida em conversa com o Bernardo.
Quando pedir "os pendentes", é isto que se lê e atualiza.

## Por desenvolver

### 1. Email ao fornecedor: ligar a conta de envio

O CRM já prepara e envia o pedido de disponibilidade (PR #13). Falta, do
lado do Bernardo, a conta de envio:

- Criar conta no Resend ou no Brevo, adicionar o domínio quantocustacasar.pt
  e criar no editor de DNS da dominios.pt os registos que o serviço indicar
  (SPF, DKIM e, no Resend, um MX para o subdomínio de devoluções).
- Criar uma chave da API e colá-la em Definições › Email, com o remetente
  do domínio (por exemplo bernardo@quantocustacasar.pt).
- Carregar em "Enviar teste" e confirmar que chega.

Ideias para depois: modelo de email ao casal a agradecer a simulação, e
modelo de proposta de parceria a novos fornecedores, ambos já escritos em
conversa (2026-09-09) e por transformar em modelos no CRM.

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

- 2026-09-09 — Pedido de disponibilidade ao fornecedor por email, com
  Definições › Email (PR #13).
- 2026-09-09 — Despesas com IVA, categorias e lucro por período (PR #12).
- 2026-09-08 — Calendário com ligação ao Google Calendar (PR #11).
- 2026-09-07 — Seletores de estado a manter o valor escolhido (PR #10).
- 2026-09-07 — Comissões a receber dos fornecedores (PR #9).
