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

Na primeira utilização, o `/login` propõe criar a conta inicial, que fica
**administradora**. Depois disso essa opção desaparece.

Há dois perfis: **administrador** (vê a página **Utilizadores**, onde cria
contas, dá ou retira o perfil de administrador, desativa e reativa contas e
redefine palavras-passe) e **utilizador** (tudo o resto). Qualquer pessoa muda
a própria palavra-passe em **A minha conta**, na barra lateral. Desativar uma
conta ou redefinir-lhe a palavra-passe termina as sessões dessa pessoa; o CRM
recusa desativar a própria conta e recusa deixar o sistema sem nenhum
administrador ativo.

Contas também podem ser criadas no servidor, o que é útil se todos os
administradores perderem o acesso (a conta criada pelo script é sempre
administradora):

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

O processo corre como root dentro do contentor: estes serviços montam os
volumes com dono root, e um utilizador sem privilégios não conseguiria escrever
em `/data`.

Serve tal e qual em Railway, Render ou Fly.io. Em qualquer um deles é preciso:

1. Apontar o serviço a este repositório (todos detetam o `Dockerfile`).
2. Criar um volume e montá-lo em `/data`. No Railway o volume não está nas
   definições do serviço: use `⌘K`/`Ctrl+K` e escreva "volume", ou clique com
   o botão direito no serviço e escolha *Attach Volume*; o *Mount Path* é
   `/data`.
3. Definir `CRM_DB_PATH=/data/crm.db` (já é o valor por omissão na imagem).
4. Gerar o endereço público: no Railway, *Settings → Networking → Public
   Networking → Generate Domain*, porta `3000`.

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
| `CRM_ORIGENS_PERMITIDAS` | Origens (separadas por vírgulas) autorizadas a enviar leads a partir do browser; por omissão, as do próprio site |
| `CRM_API_TOKEN` | Se definida, os pedidos de leads servidor-a-servidor (sem `Origin`) passam a exigir `Authorization: Bearer …` |
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

Só `nome` é obrigatório. O lead entra no estado `novo`.

**A partir do site (browser).** O simulador é uma página estática noutro
domínio, por isso o pedido é cross-origin. A rota responde ao preflight e só
aceita as origens de `CRM_ORIGENS_PERMITIDAS` (por omissão, o GitHub Pages do
projeto e `quantocustacasar.pt`); um browser noutra origem recebe 403. Como o
código do site é público, não há token nesse caminho — a proteção é a lista de
origens, o campo-isco do formulário do site e um limite de 10 pedidos por
endereço a cada 10 minutos (429). No site, o endereço da rota vai na constante
`CRM_ENDPOINT` do `index.html`; o simulador envia cada pedido de casal para o
Formspree (email à equipa) e para o CRM em paralelo.

**Servidor-a-servidor.** Pedidos sem `Origin` não passam pela lista. Se definir
`CRM_API_TOKEN`, passam a exigir `Authorization: Bearer <token>`.

### Fornecedores (formulário "Seja nosso parceiro")

`POST /api/public/fornecedores`, com as mesmas regras de origem, token e
limite. Campos: `empresa` (obrigatório), `categoria`, `distrito`, `responsavel`,
`email`, `telefone`, `website`, `notas`.

O fornecedor entra **inativo** — não aparece em novas contratações até a equipa
rever as condições e o ativar na ficha (Fornecedores → filtro "Inativos"). A
categoria e o distrito podem vir escritos à maneira do site: o CRM converte-os
para a sua lista e, quando a conversão não é exata, guarda o texto original nas
notas. Se o email já existir no catálogo, não se cria um duplicado — a ficha
existente ganha uma nota com o novo pedido (resposta 200 com `repetido: true`).

A lógica comum às duas rotas públicas está em `src/lib/api-publica.ts`.

### Tabela de preços do simulador

`GET /api/public/precos` devolve a tabela de preços que o site usa para
estimar — no formato exato do botão «Copiar tabela (JSON)» da área da equipa
do site (`atualizado`, `rubricas[{id, nome, un, min, base, max}]`,
`mult{regiao, epoca, estilo}`). É informação pública, por isso o CORS é
aberto e a resposta é `no-store`: uma alteração vê-se no carregamento
seguinte da página.

A tabela edita-se na página **Tabela de preços** do CRM (qualquer utilizador
autenticado): mínimo, estimativa e máximo por rubrica, e os multiplicadores de
região, época e estilo. Também se pode colar o JSON copiado do site
("Importar do site"). Enquanto nada for guardado, a rota serve os valores com
que o site nasceu, definidos em `src/lib/precos.ts` — os `id` das rubricas e
as chaves dos multiplicadores têm de coincidir com os do `index.html` do site,
porque o site só aplica o que reconhece. Ao contrário do resto do CRM, estes
valores são em euros, não em cêntimos: é o formato do site.

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
