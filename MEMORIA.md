# Memória do projeto Quanto Custa Casar

Este ficheiro existe para recuperar o projeto noutra conta, noutro
computador ou com outro assistente. Lê-se de uma ponta à outra em dez
minutos e diz onde está cada coisa, como se trabalha e o que falta.

Última atualização: 2026-11-03.

## 1. O que é

Quanto Custa Casar é um negócio de intermediação de casamentos em
Portugal. O casal faz uma simulação gratuita no site, deixa o contacto, e
o Bernardo liga-o a fornecedores parceiros (quintas, catering, fotografia,
música). O negócio vive das comissões que os fornecedores pagam.

São três projetos, todos no mesmo repositório GitHub:

| Projeto | Onde vive no GitHub | Onde está publicado |
| --- | --- | --- |
| Site com simulador | ramo `claude/wedding-cost-simulator-kvt9t1` | https://quantocustacasar.pt (GitHub Pages) |
| CRM | ramo `main` | https://crm.quantocustacasar.pt (Railway) |
| Domínio, correio e ligações | configurado em serviços externos | ver secção 5 |

Repositório: `github.com/bernas77764-glitch/Quantocustacasar`.
Dono: Bernardo Soares, sócio gerente, telemóvel 912 263 717,
email do negócio geral@quantocustacasar.pt.

## 2. Contas e serviços que o Bernardo controla

Nada disto depende da conta Claude. Se a conta Claude mudar, tudo
continua a funcionar.

| Serviço | Para quê | Conta |
| --- | --- | --- |
| GitHub | código do site e do CRM | utilizador `bernas77764-glitch` |
| GitHub Pages | aloja o site estático | ligado ao ramo do site, ficheiro `CNAME` |
| Railway | aloja o CRM (contentor Docker + volume `/data`) | conta do Bernardo; endereço técnico `cog0ripl.up.railway.app`; o antigo `quantocustacasar-production.up.railway.app` ainda responde |
| dominios.pt | domínio `quantocustacasar.pt`, DNS e caixa de correio cPanel | painel my.dominios.pt |
| Resend | envio de emails a partir do CRM (API HTTPS, região Irlanda) | domínio verificado |
| Outlook | leitura da caixa geral@ no telemóvel e no PC | IMAP/SMTP do cPanel |
| Meta (Facebook + Instagram) | Página "Quantocustacasar" e Instagram `quantocustacasar`, geridos pelo perfil pessoal | Centro de contas único |
| Metricool | agendamento e estatísticas de Instagram e Facebook | plano gratuito; ligado como conector do Claude |

Palavras-passe e chaves nunca ficaram no repositório nem nas conversas.
A chave do Resend está guardada dentro do CRM, em Definições › Email.

## 3. O site (simulador)

Ficheiros no ramo `claude/wedding-cost-simulator-kvt9t1`:

- `index.html`: página única em português. Tem o CSS e o JavaScript
  todos dentro. Secções principais: abertura, cinco perguntas do simulador
  (`#passo1` a `#passo6`), resultado com o formulário de pedido de
  estimativa (`#leadForm`), "Como funciona", formulário de fornecedores
  (`#supForm`) e perguntas frequentes.
- `en/index.html`: versão inglesa. Nunca se edita à mão. Gera-se com
  `python3 ferramentas/gerar-en.py` a partir do `index.html`.
- `marca/`: logótipo, anel, favicons e a fotografia de fundo
  `fundo-formulario.jpg` (1600 px, casal a trocar alianças).
- `CNAME`: contém `quantocustacasar.pt`, obrigatório para o GitHub Pages.
- `TAREFAS.md`, `negocio/`: notas antigas do arranque do site.

Ligações do site ao CRM (constantes no fim do `index.html`):

```
CRM_ENDPOINT              = https://crm.quantocustacasar.pt/api/public/leads
CRM_ENDPOINT_FORNECEDORES = https://crm.quantocustacasar.pt/api/public/fornecedores
PRECOS_URL                = https://crm.quantocustacasar.pt/api/public/precos
WHATSAPP                  = 351912263717
```

Cores da marca: terracota `#A8552B`, tinta `#1A1613`, papel `#FDF8F2`,
linha `#EADFD2`. Tipos de letra Bricolage Grotesque (títulos) e Public
Sans (texto). Tem modo escuro automático.

Publicar uma alteração: fazer commit no ramo do site e `git push`. O
GitHub Pages atualiza em um a três minutos.

## 4. O CRM

Aplicação Next.js 16 (App Router, Server Actions, React 19, Tailwind 4,
TypeScript) com base de dados SQLite num único ficheiro. O `README.md`
descreve tudo em detalhe. Resumo do que faz:

- Painel com valores contratados, recebidos, em atraso e lucro do mês.
- Clientes (casais) com pipeline de estados, notas e histórico.
- Fornecedores por categoria e distrito, com percentagem de comissão.
- Contratações (cliente ↔ fornecedor), com pedido de disponibilidade por
  email ao criar.
- Pagamentos com plano de prestações, tesouraria e CSV.
- Comissões a receber dos fornecedores, calculadas quando o casal paga.
- Despesas com IVA e categorias livres, lucro por período e por categoria.
- Calendário mensal com feed iCal para o Google Calendar e leitura do
  calendário pessoal do Google (endereço secreto iCal).
- Emails: oito modelos editáveis em Definições › Email (três para casais,
  cinco para fornecedores), dois automáticos quando o site envia uma
  simulação ou uma candidatura, envio por Resend, Brevo ou SMTP, anexos
  PDF/JPG/PNG, assinatura HTML com logótipo, e registo na ficha.
- Tabela de preços do simulador editada no CRM e lida pelo site.
- Utilizadores com perfil de administrador e dados de demonstração.

Pastas importantes:

```
src/app/(app)/        páginas (clientes, fornecedores, contratacoes, pagamentos,
                      comissoes, despesas, calendario, emails, precos,
                      utilizadores, definicoes/email, demonstracao)
src/app/api/public/   entradas públicas do site: leads, fornecedores, precos
src/lib/              base de dados, autenticação, email, calendário, IVA
src/lib/queries/      leituras da base de dados
src/lib/actions/      ações dos formulários
src/components/       formulários e componentes
scripts/seed.ts       dados de demonstração
scripts/criar-utilizador.ts  cria ou redefine uma conta
Dockerfile            imagem para o Railway
```

Correr localmente:

```bash
npm install
npm run seed          # dados de demonstração, opcional
npm run dev           # http://localhost:3000
```

Produção: o Railway constrói a imagem a partir do `Dockerfile` sempre que
o ramo `main` muda. A base de dados é o ficheiro `/data/crm.db` num volume
persistente. Cópia de segurança: copiar `crm.db`, `crm.db-wal` e
`crm.db-shm`, ou `sqlite3 /data/crm.db ".backup /data/copia.db"`.

Variáveis de ambiente (nomes, sem valores): `CRM_DB_PATH`,
`CRM_ORIGENS_PERMITIDAS`, `CRM_API_TOKEN`, `CRM_PALAVRA_PASSE`,
`CRM_EMAIL_API_BASE`, `CRM_SMTP_INSEGURO`, `CRM_PERMITIR_ICS_LOCAL`,
`PORT`. Em produção só `CRM_DB_PATH=/data/crm.db` é necessária.

Nota do Railway: bloqueia SMTP (portas 25, 465 e 587) nos planos Free,
Trial e Hobby. Por isso o CRM envia pelo Resend. O plano aconselhado é o
Hobby, cerca de 5 dólares por mês, antes de o crédito de teste acabar.

## 5. Domínio, DNS e correio

Domínio `quantocustacasar.pt` na dominios.pt. DNS editado em
my.dominios.pt (editor "solutedns"; nameservers dns1 a dns4 do
host-redirect.com). O editor não aceita ponto final e o campo Nome leva o
nome completo, por exemplo `crm.quantocustacasar.pt`.

| Tipo | Nome | Valor | Para quê |
| --- | --- | --- | --- |
| A | @ | 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 | site no GitHub Pages |
| CNAME | www | bernas77764-glitch.github.io | site |
| CNAME | crm | cog0ripl.up.railway.app | CRM no Railway |
| TXT | _railway-verify.crm | valor dado pelo Railway | verificação do CRM |
| A | mail | 185.12.116.244 | servidor de correio da dominios.pt |
| MX | @ | mail.quantocustacasar.pt, prioridade 10 | receber correio |
| TXT | @ | `v=spf1 +mx +a +ip4:185.12.116.244 include:spf.dominios.pt ~all` | SPF (o correio sai por um relay da dominios.pt) |
| TXT | default._domainkey | chave DKIM do cPanel, valor completo | DKIM |
| TXT | _dmarc | `v=DMARC1; p=none; rua=mailto:geral@quantocustacasar.pt` | DMARC |
| TXT | resend._domainkey | chave dada pelo Resend | Resend |
| CNAME | rsend | rsend-euw1.forge.rmta.net | Resend |
| CNAME | send | send.forge.rmta.net | Resend |

Caixa de correio `geral@quantocustacasar.pt` criada no cPanel da
dominios.pt. Configurada no Outlook (telemóvel e clássico no PC) por
IMAP/SMTP. A assinatura HTML do Outlook foi feita a partir do mesmo
conteúdo que o CRM usa em `src/lib/email-assinatura.ts`: logótipo, nome,
cargo, telemóvel, botões para Instagram, Facebook
(https://www.facebook.com/profile.php?id=61594176211185) e WhatsApp.

## 6. Redes sociais

- O Instagram `quantocustacasar` é conta profissional e está ligado à
  Página de Facebook "Quantocustacasar". A ligação fez-se no computador em
  business.facebook.com, porque a app dava erro.
- O perfil pessoal de Facebook do Bernardo administra a Página. Tudo está
  no mesmo Centro de contas.
- Metricool: conta gratuita ligada ao Instagram e ao Facebook, e adicionada
  como conector no claude.ai. Permite ao Claude agendar publicações, ver
  estatísticas e melhores horas. Não responde a mensagens nem publica
  stories.

## 7. Como se trabalha com o Claude neste projeto

- O Bernardo fala em português, quase sempre pelo telemóvel, e não é
  programador. As respostas são curtas, em frases simples, com listas
  numeradas quando há vários pontos, sem exclamações nem travessões.
- Para o CRM: o Claude desenvolve num ramo, abre um pull request para
  `main` e o Bernardo responde "merge". O Railway publica sozinho.
- Para o site: o Claude prepara a alteração, mostra capturas de ecrã, e
  só publica no ramo do site depois de o Bernardo escrever "pode publicar".
- Cada funcionalidade nova leva testes de ponta a ponta com Playwright
  (Chromium), com servidores falsos para email e calendário.
- Existe uma lista de pendentes em `PENDENTES.md`. Quando o Bernardo pede
  "os pendentes", lê-se e atualiza-se esse ficheiro.
- Os emails do Bernardo seguem o estilo dele: frases curtas, "Segue…",
  "Vou…", "Aguardo confirmação", "Cumprimentos," no primeiro contacto e
  "Abraço," quando já há relação. Os oito modelos em
  `src/lib/email-modelo.ts` são o melhor exemplo desse tom.

## 8. Cronologia

| Data | O quê |
| --- | --- |
| 2026-09-05 | Site com simulador de 24 rubricas, versão inglesa, botão WhatsApp |
| 2026-09-07 | CRM: clientes, fornecedores, contratações, pagamentos (PR #2); autenticação e Docker (PR #3, #4); leads e candidaturas do site (PR #5, #6); tabela de preços servida ao site (PR #7); dados de demonstração (PR #8). Site a enviar pedidos ao CRM |
| 2026-09-08 | Comissões a receber (PR #9); seletores de estado (PR #10); calendário com Google Calendar (PR #11) |
| 2026-09-09 | Despesas com IVA e lucro (PR #12); domínio, DNS, correio geral@ com SPF, DKIM e DMARC; CRM em crm.quantocustacasar.pt; site apontado ao endereço novo |
| 2026-09-10 | Oito modelos de email integrados no CRM (PR #13); assinatura HTML nos emails (PR #14); Resend verificado |
| 2026-09-15 | Fotografia de fundo a toda a largura do simulador no site |
| 2026-10-26 a 11-03 | Instagram ligado à Página de Facebook; Metricool ligado ao Claude |

## 9. Pendentes

Ver `PENDENTES.md` para a versão viva. Em resumo:

1. Rever os oito modelos de email em Definições › Email e confirmar os
   dois automáticos.
2. Tabela de preços só para administradores.
3. Imagem Docker sem correr como root.
4. Google Calendar em tempo real por OAuth, só se o atraso incomodar.
5. Publicar no Instagram a partir do CRM pela API da Meta, se um dia o
   Metricool não chegar.
6. Ações do Bernardo: marcar comissões antigas como recebidas; subscrever
   o feed do CRM no Google Calendar; passar o Railway ao plano Hobby.

## 10. Como recuperar o projeto numa conta Claude nova

1. Na conta nova, em Definições › Conectores, ligar o GitHub e dar acesso
   ao repositório `bernas77764-glitch/Quantocustacasar`. Se o repositório
   passar para uma organização, dar acesso a essa organização.
2. Voltar a ligar o conector Metricool, se se quiser gerir o Instagram.
3. Abrir uma sessão do Claude Code com esse repositório e escrever:
   "Lê MEMORIA.md, README.md e PENDENTES.md e continua a trabalhar com as
   mesmas regras."
4. Para mexer no site, pedir para abrir o ramo
   `claude/wedding-cost-simulator-kvt9t1`.
5. Nada mais é preciso. O site, o CRM, o domínio, o correio e as redes
   sociais não dependem da conta Claude.

Se o repositório GitHub se perder, é a única coisa realmente grave: o
código do site está também publicado em quantocustacasar.pt e pode ser
descarregado, mas o CRM só existe no GitHub e na imagem do Railway. Vale a
pena manter uma cópia local do repositório no PC de vez em quando com
`git clone`.
