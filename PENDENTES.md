# Pendentes

Lista de trabalho por fazer no CRM, mantida em conversa com o Bernardo.
Quando pedir "os pendentes", é isto que se lê e atualiza.

## Por desenvolver

### 1. Emails: ligar a caixa de correio e rever os modelos

Construído e testado (PR #13, retomado a 2026-09-10). Falta, do lado do
Bernardo, em Definições › Email:

- Escolher "A minha caixa de correio (SMTP)", servidor
  `webdomain04.dnscpanel.com`, porta 465, utilizador
  `geral@quantocustacasar.pt` e a palavra-passe da caixa; remetente
  geral@quantocustacasar.pt; IBAN para as faturas. Carregar em "Enviar
  teste".
- Rever os oito modelos (o texto é o do ficheiro modelos-de-email.md) e
  confirmar os dois automáticos, que vêm ligados.

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
- 2026-09-10 — Emails a casais e fornecedores: oito modelos editáveis,
  dois automáticos a partir do site, envio por SMTP/Resend/Brevo, anexos
  (PR #13).
- 2026-09-09 — Despesas com IVA, categorias e lucro por período (PR #12).
- 2026-09-08 — Calendário com ligação ao Google Calendar (PR #11).
- 2026-09-07 — Seletores de estado a manter o valor escolhido (PR #10).
- 2026-09-07 — Comissões a receber dos fornecedores (PR #9).
