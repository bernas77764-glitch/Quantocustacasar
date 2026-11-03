# Instagram do Quanto Custa Casar: resumo do trabalho feito

Resumo do trabalho de Instagram feito com o Claude entre 27 de outubro e
3 de novembro de 2026. Serve para retomar o trabalho noutra conta (por
exemplo, no Claude Teams) sem perder nada.

Estado a 3 de novembro de 2026.

---

## 1. Onde estão as coisas

| O quê | Onde |
|---|---|
| Código do CRM | GitHub: `bernas77764-glitch/Quantocustacasar` (repositório público) |
| Este resumo, as imagens e o script dos gráficos | Ramo `claude/exciting-planck-s9szfi`, pasta `marketing/` |
| Lista de pendentes do CRM | `PENDENTES.md`, na raiz do repositório |
| Documentação do CRM | `README.md`, na raiz do repositório |
| Posts agendados e rascunhos | Metricool, marca **quantocustacasar** (ID 7675274, fuso Europe/Lisbon) |
| Conta de Instagram | [@quantocustacasar](https://www.instagram.com/quantocustacasar) |
| Página de Facebook | Ligada ao Metricool (ID 1198014020071671), mas ainda sem posts |

> ⚠️ O ramo `claude/exciting-planck-s9szfi` ainda **não foi integrado** no
> `main`. Se o ramo for apagado, perdem-se as imagens e este ficheiro. Para
> as guardar de vez, faz o merge para o `main` ou guarda uma cópia deste
> ficheiro e da pasta `marketing/instagram/` no teu computador.

---

## 2. Ferramentas e conectores

Na conta nova, liga estes conectores em claude.ai › Definições › Conectores:

| Conector | Para quê | Notas |
|---|---|---|
| **Metricool** | Agendar posts, ver as melhores horas, ver métricas | Conta Metricool com o email geral@quantocustacasar.pt |
| **Unsplash** | Fotos gratuitas para os posts | Conta Unsplash gratuita, já criada |
| **GitHub** | Aceder ao repositório do CRM | Repositório `bernas77764-glitch/Quantocustacasar` |
| Higgsfield | Gerar imagens e vídeo com IA (opcional) | É pago. As alternativas gratuitas estão abaixo |

**Alternativas gratuitas ao Higgsfield:** Canva (plano grátis), Adobe
Express/Firefly, Microsoft Designer/Bing Image Creator, Gemini, ChatGPT,
Meta AI e CapCut (para reels). Para fotos reais: Unsplash, Pexels, ou fotos
dos fornecedores parceiros (com autorização).

**Licença do Unsplash:** as fotos são gratuitas e podem ser usadas para fins
comerciais. Creditar o fotógrafo não é obrigatório, mas fazemos sempre
("📷 Nome / Unsplash"). Não se pode vender a foto tal como está nem dar a
entender que o fotógrafo recomenda a marca.

---

## 3. Regras combinadas

- **Nada é publicado sem aprovação do Bernardo.** O Claude cria os posts como
  **rascunho** no Metricool e só os passa a agendados depois de um "aprovado".
- **Alternar os tipos de post:** um gráfico com números, um post com foto e
  dica, e assim por diante.
- **Ritmo:** 2 posts por semana, à **terça e à sexta, às 10h00** (hora de
  Lisboa).
- **Melhores horas segundo o Metricool:** de quarta a sexta, entre as 10h e
  as 11h (a sexta às 10h é a melhor). Por volta das 18h também resulta. Ao
  fim de semana o alcance cai para cerca de metade.
- **Texto:** português de Portugal, a tratar os casais por "vocês". O post
  acaba com a chamada "👉 … em quantocustacasar.pt (link na bio)", o crédito
  da foto (quando há foto) e as hashtags.
- **Imagens feitas com IA** têm de ser marcadas como tal no Instagram (opção
  `isAiGenerated`). Até agora nenhuma imagem foi feita com IA.
- **Só Instagram por agora.** O Facebook está ligado, mas ainda não foi usado.

---

## 4. Identidade visual dos gráficos

- Formato 1080×1350 (4:5, vertical)
- Fundo creme `#FAF6F1`, texto `#1A1613`, cor da marca (terracota) `#A8552B`,
  bege `#EADFD2`, cinzento `#8A7F74`
- Títulos em Playfair Display e texto em Inter (Google Fonts)
- Rodapé com a nota sobre a origem dos números, "Quanto Custa Casar" e
  "quantocustacasar.pt"

O script `marketing/instagram/gerar-graficos.mjs` volta a gerar as três
imagens com Playwright: `node marketing/instagram/gerar-graficos.mjs`.

**Como as imagens chegam ao Metricool:** o Metricool precisa de um link
público. Os PNG foram postos no GitHub e o link usado foi este:
`https://raw.githubusercontent.com/bernas77764-glitch/Quantocustacasar/<commit>/marketing/instagram/<ficheiro>.png`.
Ao criar o post, o Metricool guarda a sua própria cópia da imagem.

---

## 5. De onde vêm os números

Os números saem dos **valores de base do simulador**, definidos em
`src/lib/precos.ts` (`RUBRICAS_BASE` e `MULT_BASE`). O site lê a tabela em
`GET /api/public/precos`.

> ⚠️ Se a tabela de preços tiver sido alterada no CRM (Definições), os
> valores do site são outros e os posts com números deixam de bater certo.
> Isto ainda não foi confirmado. Antes de aprovar os posts com números, faz
> uma simulação no site (100 convidados, estilo clássico, abril ou outubro)
> e confirma que dá perto de 28 650 €.

**Como os totais foram calculados** (pelo Claude, não pelo simulador):
- Somam-se as rubricas que vêm ligadas por omissão (`on: true`), com o
  valor `base`.
- As rubricas cobradas por convidado multiplicam-se pelo número de
  convidados (100).
- Os ajustes de região, época e estilo multiplicam só as rubricas com
  `mercado: true`. O vestido, o fato e as alianças não mudam.

Resultados com 100 convidados, estilo clássico e abril ou outubro:

| Indicador | Valor |
|---|---|
| Total de referência | 28 650 € (mínimo 16 050 €, máximo 53 800 €) |
| Custo por convidado (catering, open bar, mesa, papelaria) | cerca de 112 € |
| 60 / 100 / 150 convidados | 24 170 € / 28 650 € / 34 250 € |
| Época alta / média / baixa | 31 155 € / 28 650 € / 25 644 € |
| Algarve | 33 660 € |
| Lisboa | 32 408 € |
| Madeira | 31 656 € |
| Açores | 31 155 € |
| Porto | 30 654 € |
| Norte (restante) | 27 398 € |
| Alentejo | 27 398 € |
| Centro | 26 646 € |

Peso de cada rubrica no total: catering 27,9%, espaço 10,5%, wedding
planner 8,7%, open bar 6,3%, decoração e flores 6,3%, vestido 6,3%,
fotografia 5,6%, vídeo 5,2%, as restantes 10 rubricas 23,2%. Comer e beber
(catering, open bar e bolo) dá 35,8%.

---

## 6. Calendário de posts

| # | Data (10h00) | Tipo | Tema | Estado a 3/11 |
|---|---|---|---|---|
| 0 | Sex 30 out | Foto | Apresentação: "Quanto custa casar em Portugal?" | ✅ **Publicado**: https://www.instagram.com/p/DfHUpyqiF2-/ |
| 1 | Ter 3 nov | Gráfico | Para onde vai o dinheiro | 📝 Rascunho, por aprovar |
| 2 | Sex 6 nov | Foto | Cada convidado conta (e custa) | 📝 Rascunho, por aprovar |
| 3 | Ter 10 nov | Gráfico | Quanto custa casar em cada região | 📝 Rascunho, por aprovar |
| 4 | Sex 13 nov | Foto | Casar no inverno | 📝 Rascunho, por aprovar |
| 5 | Ter 17 nov | Gráfico | Quanto custam os fornecedores | 📝 Rascunho, por aprovar |

Os rascunhos não são publicados sozinhos. Se a data de um deles já tiver
passado, muda a data no Metricool antes de o aprovar. O rascunho de 3 de
novembro, por exemplo, tem a data de hoje.

IDs no Metricool (o `uuid` não muda quando o post é editado):

| # | uuid |
|---|---|
| 0 | -1049472674034663115 |
| 1 | 7531821475885174488 |
| 2 | 6652844686736377987 |
| 3 | -4645989842999751051 |
| 4 | 1183609636444392313 |
| 5 | -6385733658534196190 |

### Texto completo de cada post

#### 0. Apresentação (publicado)
Foto: amigos a levantar os noivos na Quinta Alferes de Crasto, no Douro, de
Pedro Pulido
([Unsplash](https://unsplash.com/photos/friends-celebrate-the-wedding-with-a-fun-lift-qVsWTUQCpvc)).

```
Quanto custa casar em Portugal? 💍

É a primeira pergunta de quase todos os casais, e a resposta mais comum é "depende". Nós queremos dar-vos números.

No Quanto Custa Casar ajudamos-vos a perceber quanto vai custar o vosso casamento, desde a quinta e o catering até à fotografia e à música, e pomos-vos em contacto com fornecedores de confiança perto de vocês.

👉 Façam a simulação gratuita em quantocustacasar.pt (link na bio)

Nos próximos posts vamos falar de preços reais, de onde vai o dinheiro e de como poupar sem abdicar do que importa. Sigam-nos para não perderem nada! ✨

📷 Pedro Pulido / Unsplash

#casamento #casamentoportugal #noivas2027 #noivos #casar #orcamentocasamento #quintaparacasamentos #weddingportugal #casamentodouro #quantocustacasar
```

#### 1. Para onde vai o dinheiro (gráfico)
Imagem: `marketing/instagram/01-para-onde-vai-o-dinheiro.png`

```
Para onde vai o dinheiro de um casamento? 💸

Num casamento clássico para 100 convidados, o nosso simulador estima cerca de 28 650 €. E mais de um terço disso vai para a mesa: catering, open bar e bolo somam quase 36% do orçamento.

Logo a seguir vêm o espaço (10,5%) e o wedding planner (8,7%). Open bar, decoração e vestido empatam com 6,3% cada.

O que isto quer dizer? Se querem mexer no orçamento, comecem pelo que pesa mais. Um menu bem escolhido poupa mais do que cortar nas lembranças.

👉 Façam a vossa simulação gratuita em quantocustacasar.pt (link na bio)

Guardem este post para quando começarem a pedir orçamentos 📌

#casamento #casamentoportugal #orcamentocasamento #noivas2027 #noivos #casar #dicasdecasamento #weddingportugal #quantocustacasar
```

#### 2. Cada convidado conta (foto)
Foto: convidados a brindar numa mesa comprida, de Alexander Mass
([Unsplash](https://unsplash.com/photos/wedding-guests-toast-the-happy-couple-at-a-long-table-qa0gEVBTyRY)).

```
Cada convidado conta. E custa 🥂

A lista de convidados é a decisão que mais mexe no orçamento. Catering, bar, mesa e convites pagam-se por pessoa e, nos valores de referência do nosso simulador, somam cerca de 112 € por convidado.

Num casamento clássico, isto dá:
• 60 convidados: cerca de 24 200 €
• 100 convidados: cerca de 28 650 €
• 150 convidados: cerca de 34 250 €

Três perguntas que ajudam a fechar a lista:
1. Falámos com esta pessoa no último ano?
2. Conhece-nos aos dois?
3. Estamos a convidar por vontade ou por obrigação?

👉 Vejam quanto muda o vosso orçamento em quantocustacasar.pt (link na bio)

📷 Alexander Mass / Unsplash

#casamento #casamentoportugal #listadeconvidados #orcamentocasamento #noivas2027 #noivos #dicasdecasamento #quantocustacasar
```

#### 3. Quanto custa casar em cada região (gráfico)
Imagem: `marketing/instagram/03-casar-por-regiao.png`

```
Quanto custa casar em cada região? 📍

O mesmo casamento (100 convidados, estilo clássico, abril ou outubro) pode custar cerca de 26 600 € no Centro e 33 700 € no Algarve. São 7 000 € de diferença só por causa da região.

Lisboa (32 400 €) e Madeira (31 700 €) vêm logo a seguir ao Algarve. No outro extremo, o Centro, o Alentejo e o Norte fora do Porto são as zonas mais em conta.

A diferença não está no vestido nem nas alianças, que custam o mesmo em todo o lado. Está no espaço, no catering e nos serviços locais.

Onde vão casar? Contem-nos nos comentários 👇

👉 Façam a simulação com a vossa região em quantocustacasar.pt (link na bio)

#casamento #casamentoportugal #casamentoalgarve #casamentolisboa #casamentoporto #orcamentocasamento #noivas2027 #quantocustacasar
```

#### 4. Casar no inverno (foto)
Foto: mesa posta com velas e flores, de Katie Puzatova
([Unsplash](https://unsplash.com/photos/a-beautifully-set-table-with-candles-and-flowers-G4tIbJ7wi0Q)).

```
Casar no inverno? Pode ser a melhor decisão para o vosso orçamento 🕯️

Entre novembro e março, as quintas e os fornecedores têm mais datas livres e preços mais baixos.

Nos valores de referência do nosso simulador, para 100 convidados e estilo clássico:
• Maio a setembro: cerca de 31 150 €
• Abril ou outubro: cerca de 28 650 €
• Novembro a março: cerca de 25 650 €

São perto de 5 500 € de diferença entre um casamento em julho e um em fevereiro, com os mesmos convidados e o mesmo estilo.

E ainda há velas, lareira e aquela luz dourada ao fim da tarde ✨

👉 Comparem as épocas na vossa simulação em quantocustacasar.pt (link na bio)

📷 Katie Puzatova / Unsplash

#casamento #casamentoportugal #casamentodeinverno #orcamentocasamento #noivas2027 #noivos #dicasdecasamento #quantocustacasar
```

#### 5. Quanto custam os fornecedores (gráfico)
Imagem: `marketing/instagram/05-precos-fornecedores.png`

```
Quanto custam os fornecedores de um casamento? 💍

Do mais em conta ao mais exclusivo, estes são os intervalos de referência do nosso simulador (entre parênteses, o valor de referência):

📸 Fotografia: 900 € a 3000 € (1600 €)
🎥 Vídeo: 800 € a 2800 € (1500 €)
🎧 DJ: 600 € a 1600 € (950 €)
🎸 Banda ao vivo: 1200 € a 4000 € (2200 €)
💐 Decoração e flores: 800 € a 4000 € (1800 €)
👗 Vestido de noiva: 900 € a 3500 € (1800 €)
📋 Wedding planner: 1200 € a 5000 € (2500 €)
🏡 Espaço / quinta: 1500 € a 6000 € (3000 €)

Os valores mudam com a região, a época e o estilo do casamento.

Dica: peçam sempre pelo menos três orçamentos e comparem o que está incluído, não só o preço final.

👉 Façam a vossa simulação em quantocustacasar.pt (link na bio)

#casamento #casamentoportugal #fornecedoresdecasamento #fotografodecasamento #orcamentocasamento #noivas2027 #quantocustacasar
```

---

## 7. Por fazer

1. **Confirmar os números do site** (ver a secção 5) e depois **aprovar os 5
   rascunhos**. Antes disso, mudar as datas que já tenham passado.
2. Confirmar que a bio do Instagram tem o link para quantocustacasar.pt.
3. Decidir se os posts também vão para o Facebook.
4. Ideia: convidar o **Pedro Pulido** (fotógrafo de casamentos no Porto,
   [@pedropulidophotography](https://www.instagram.com/pedropulidophotography))
   para fornecedor parceiro. As fotos dele no Unsplash são todas gratuitas.
5. Planear os posts seguintes (a partir de 20 de novembro), mantendo a
   alternância entre gráficos e fotos.
6. Integrar o ramo `claude/exciting-planck-s9szfi` no `main` (ver a
   secção 1).

---

## 8. Como retomar na conta nova

1. Liga os conectores da secção 2 (Metricool, Unsplash e GitHub).
2. Abre uma sessão do Claude Code com o repositório
   `bernas77764-glitch/Quantocustacasar`.
3. Cola esta mensagem:

> Lê o ficheiro `marketing/RESUMO-INSTAGRAM.md` do ramo
> `claude/exciting-planck-s9szfi` (ou do `main`, se já tiver sido
> integrado). É o resumo do trabalho de Instagram do Quanto Custa Casar.
> Segue as regras da secção 3 e continua a partir da lista "Por fazer". A
> marca no Metricool é a 7675274.
