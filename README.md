# CRM · Quanto Custa Casar

CRM para gerir casamentos de ponta a ponta: **clientes (noivos) → fornecedores →
contratações → pagamentos**. Permite ligar cada cliente aos fornecedores que
contratou e controlar o que já foi pago, o que falta receber e o que está em
atraso.

## O que faz

- **Painel** — valor contratado, recebido, por receber e em atraso; pipeline de
  clientes, pagamentos em atraso e a vencer, próximos casamentos, recebimentos
  por mês e valor por categoria.
- **Clientes** — ficha do casal (data, convidados, orçamento, local, origem),
  pipeline de estados (`novo → contactado → qualificado → proposta →
  ganho/perdido`), histórico de atividade e notas, e totais financeiros por
  cliente.
- **Fornecedores** — catálogo por categoria e distrito, faixa de preços,
  percentagem de comissão, e a lista de clientes/valores associados a cada um.
- **Contratações** — a ligação cliente ↔ fornecedor, com valor acordado,
  comissão, estado (`proposta → confirmada → concluída`) e data do serviço.
- **Pagamentos** — plano de prestações por contratação (gerado automaticamente
  ou criado à mão), marcação de pago/reabertura, e uma vista de tesouraria
  global com filtros e exportação para CSV.

## Como correr

```bash
npm install
npm run seed     # dados de demonstração (opcional)
npm run dev      # http://localhost:3000
```

Para produção: `npm run build && npm start`.

Outros comandos:

| Comando | O que faz |
| --- | --- |
| `npm run seed` | Insere dados de demonstração (só se a base estiver vazia) |
| `npm run seed -- --forcar` | Apaga tudo e volta a inserir os dados de demonstração |
| `npm run criar-utilizador -- "Nome" email@exemplo.pt` | Cria ou atualiza uma conta de acesso |
| `npm run typecheck` | Verificação de tipos |
| `npm run lint` | ESLint |

## Acesso

O CRM exige autenticação: todas as páginas, Server Actions e a exportação CSV
verificam a sessão. A única exceção é a API pública de captação de leads, que
tem o seu próprio token.

Na primeira utilização, o `/login` propõe criar a conta de administração —
depois disso essa opção desaparece e as contas passam a criar-se no servidor:

```bash
npm run criar-utilizador -- "Bernardo Soares" bernardo@exemplo.pt
```

A palavra-passe nunca vai nos argumentos (ficaria no histórico da shell e na
lista de processos). O script aceita-a de três formas: escrita no terminal
(sem eco), canalizada por `stdin`, ou na variável `CRM_PALAVRA_PASSE`. Se o
email já existir, a palavra-passe é substituída e as sessões abertas terminam.

Detalhes de implementação: as palavras-passe são guardadas com `scrypt` e sal
aleatório; as sessões são registos na base de dados (revogáveis) referenciados
por um cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção, válido 30
dias.

## Alojamento

O `Dockerfile` produz uma imagem com o servidor autónomo do Next. A base de
dados vive num **volume persistente montado em `/data`** — sem esse volume, os
dados desaparecem a cada arranque.

```bash
docker build -t crm-quantocustacasar .
docker run -p 3000:3000 -v crm-dados:/data crm-quantocustacasar
```

Serve tal e qual em Railway, Render ou Fly.io. Em qualquer um deles é preciso:

1. Apontar o serviço a este repositório (todos detetam o `Dockerfile`).
2. Criar um volume e montá-lo em `/data`.
3. Definir `CRM_DB_PATH=/data/crm.db` (já é o valor por omissão na imagem).

Depois do primeiro arranque, abra `/login` e crie a conta de administração. Em
alternativa, crie-a a partir do servidor:

```bash
docker exec -e CRM_PALAVRA_PASSE='…' <contentor> \
  node --no-warnings scripts/criar-utilizador.ts "Nome" email@exemplo.pt
```

Cópias de segurança: o estado todo é o ficheiro `/data/crm.db` (mais os
`-wal`/`-shm` que o acompanham). Copie os três, ou use
`sqlite3 /data/crm.db ".backup /data/copia.db"` para uma cópia consistente com
o servidor a correr.

### Variáveis de ambiente

| Variável | Para que serve |
| --- | --- |
| `CRM_DB_PATH` | Caminho do ficheiro SQLite (por omissão `data/crm.db`; `/data/crm.db` na imagem) |
| `CRM_API_TOKEN` | Se definida, a API pública de leads passa a exigir `Authorization: Bearer …` |
| `CRM_PALAVRA_PASSE` | Só para o script `criar-utilizador`, em automatismos |
| `PORT` | Porta do servidor (por omissão 3000) |

## Stack

- **Next.js 16** (App Router, Server Components e Server Actions) + TypeScript
- **Tailwind CSS 4**
- **SQLite** através do `node:sqlite`, o módulo nativo do Node — sem dependências
  de base de dados e sem compilação nativa

A base de dados é um ficheiro em `data/crm.db` (fora do controlo de versões).
Defina `CRM_DB_PATH` para a guardar noutro sítio.

## Notas de implementação

- **Valores monetários em cêntimos.** Todas as colunas de dinheiro são
  `INTEGER` em cêntimos, para que as somas sejam exatas. A conversão de e para
  euros está em `src/lib/format.ts` (`paraCents`, `euros`), que aceita os
  formatos `1250`, `1250,50`, `1.250,50` e `1250.50`.
- **Totais financeiros contam apenas contratações `confirmada` ou `concluida`.**
  Uma proposta ainda não é um compromisso, por isso não entra no valor
  contratado.
- **"Em atraso" é derivado, não guardado.** Um pagamento está em atraso quando
  continua `pendente` e a data prevista já passou — assim nunca fica um estado
  desatualizado na base de dados.
- **Linhas do SQLite normalizadas numa só camada.** O `node:sqlite` devolve
  objetos com protótipo nulo, que o React não consegue passar a Client
  Components; `src/lib/db.ts` envolve o `prepare` e devolve sempre objetos
  simples.
- **Eliminar um fornecedor com contratações desativa-o** em vez de o apagar,
  para não perder o histórico financeiro.
- **Cada Server Action verifica a sessão por si.** O guarda no layout protege
  as páginas, mas uma Server Action pode ser invocada diretamente — por isso o
  `exigirSessao()` aparece no topo de todas.
- **A base de dados está excluída do file tracing** (`next.config.ts`). Sem
  isso, o `output: "standalone"` copiava `data/crm.db` para dentro da saída —
  ou seja, para dentro da imagem de contentor.

## API pública (captação de leads)

Para ligar o formulário/simulador do site ao CRM:

```bash
curl -X POST http://localhost:3000/api/public/leads \
  -H 'content-type: application/json' \
  -d '{
        "nome": "Ana Ferreira",
        "parceiro": "Rui Ferreira",
        "email": "ana@email.pt",
        "telefone": "961 000 000",
        "data_casamento": "2027-06-12",
        "num_convidados": 120,
        "orcamento": "25.000,00",
        "distrito": "Lisboa",
        "origem": "Simulador"
      }'
```

Só `nome` é obrigatório. O lead entra no estado `novo`. Se definir a variável de
ambiente `CRM_API_TOKEN`, os pedidos passam a exigir o cabeçalho
`Authorization: Bearer <token>`.

A tesouraria também exporta CSV (separador `;`, UTF-8 com BOM, pronto para
Excel) em `/api/pagamentos/csv`, respeitando os filtros ativos.

## Estrutura

```
src/
  app/
    (app)/                páginas do CRM, atrás do guarda de autenticação
    login/                autenticação e criação da conta inicial
    api/                  captação pública de leads e exportação CSV
  components/             componentes de UI partilhados e formulários
  lib/
    db.ts                 ligação e esquema SQLite
    auth.ts               sessões e guardas de acesso
    palavra-passe.ts      hashing scrypt (sem dependências do Next)
    constants.ts          vocabulário de domínio (estados, categorias, …)
    format.ts             euros, datas e percentagens em pt-PT
    queries/              leituras e escritas por entidade
    actions/              Server Actions dos formulários
scripts/
  seed.ts                 dados de demonstração
  criar-utilizador.ts     criação de contas de acesso
Dockerfile                imagem para alojamento com volume persistente
```
