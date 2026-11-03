# Quanto Custa Casar — ficha de recuperação do projeto

Este ficheiro existe para que o projeto possa ser retomado por qualquer pessoa,
ou por uma nova sessão do Claude noutra conta, sem depender do histórico de
conversas. **Tudo o que importa está neste repositório** — as conversas e as
pré-visualizações no claude.ai são descartáveis.

Última atualização: novembro de 2026.

---

## 1. O que é

Site estático de página única que simula o custo de um casamento em Portugal:
cinco perguntas (convidados, distrito, data, estilo, o que querem ter no dia),
estimativa a apertar à medida que se responde, resultado com repartição por
rubrica, e um formulário que gera uma lead para a equipa e para o CRM. O modelo
de negócio é comissão dos fornecedores parceiros; o casal não paga.

Pessoas: **Bernardo Soares** (dono, bernardo.soares@mgbautomoveis.pt) e
**Bruna** (valida preços, atende leads, organiza casamentos).

## 2. Onde está tudo

| O quê | Onde |
|---|---|
| Código do site | GitHub: `bernas77764-glitch/Quantocustacasar`, branch `claude/wedding-cost-simulator-kvt9t1` (público) |
| Site no ar | `https://bernas77764-glitch.github.io/Quantocustacasar/` — GitHub Pages a servir dessa branch, pasta raiz |
| Versão inglesa | `.../en/` — gerada por `ferramentas/gerar-en.py`, não se edita à mão |
| Domínio final | `quantocustacasar.pt` (canonical e og: já apontam para lá); o CRM já responde em `crm.quantocustacasar.pt` |
| Leads por email | Formspree, formulário `https://formspree.io/f/mnpqbrql` |
| CRM | `https://crm.quantocustacasar.pt` (alojado no Railway). **O código do CRM NÃO está neste repositório** — foi feito noutra sessão do Claude. Ver secção 8. |
| Marca | `marca/` — logótipo em SVG/PNG, favicon, ícone iOS, bio das redes |
| Publicações para redes | `marca/redes/` — perfil, capa, 6 publicações gráficas, 7 fotográficas |
| Folha de faturação | `negocio/simulador-faturacao.xlsx` |
| Lista de tarefas | `TAREFAS.md` |
| Documentação técnica | `README.md` (modelo de cálculo, ligar formulários, tabela de preços no CRM, marca) |

Ligações do claude.ai que **podem perder-se** com a mudança de conta — nenhuma
é necessária, tudo foi guardado aqui:
- Pré-visualização do site: `claude.ai/code/artifact/1ae3e76d-6ef4-4c84-bd28-2b176ed53a3a`
- Tela com as direções de logótipo: `claude.ai/code/artifact/36df83ff-fedb-4a37-a194-f0d4f4ad36e5`
- Tela com as três direções de layout: `claude.ai/code/artifact/afbc5ab0-16a9-420b-a9e7-cf5689676ec4`

## 3. Como o site está feito

- Um único `index.html` com HTML, CSS e JavaScript, sem build, sem dependências
  além das fontes do Google (Bricolage Grotesque e Public Sans).
- Tema claro e escuro por variáveis CSS. Paleta: papel `#FDF8F2`, tinta
  `#1A1613`, terracota `#A8552B`.
- Percurso: um ecrã prévio «Quem está a fazer as contas?» (noiva / noivo /
  outra pessoa, opcional) e cinco perguntas. A barra fixa no fundo mostra
  «estimativa provisória · faltam N respostas» e aperta a cada resposta.
- Resultado: valor, intervalo, formulário do casal logo a seguir (antes da
  repartição, de propósito, para não depender de scroll), depois «Onde vai o
  dinheiro» e o detalhe das 24 rubricas.
- Botão flutuante do WhatsApp no canto inferior direito, que sobe acima da
  barra enquanto ela está visível.
- Área da equipa escondida (tabela de preços, multiplicadores, leads de
  teste): abre com `#equipa` no endereço, escrevendo `equipa` no teclado, ou
  com **cinco toques no nome do rodapé** (telemóvel). É ocultação, não
  segurança — a gestão a sério é no CRM.

### Constantes de configuração (topo do script do `index.html`)

| Constante | Valor atual | Para que serve |
|---|---|---|
| `ENDPOINT` | `https://formspree.io/f/mnpqbrql` | email das leads |
| `CRM_ENDPOINT` | `https://crm.quantocustacasar.pt/api/public/leads` | leads de casais no CRM |
| `CRM_ENDPOINT_FORNECEDORES` | `.../api/public/fornecedores` | pedidos de parceria no CRM |
| `PRECOS_URL` | `.../api/public/precos` | tabela de preços vinda do CRM |
| `WHATSAPP` | `351912263717` (número do Bernardo, provisório) | botão do WhatsApp |
| `CHAVE_EQUIPA` | `equipa` | abrir a área da equipa |

### Modelo de cálculo

24 rubricas com mínimo / estimativa / máximo, fixas ou por convidado.
Multiplicadores: região (Lisboa 1,15 · Porto 1,08 · Algarve 1,20 · Norte 0,95 ·
Centro 0,92 · Alentejo 0,95 · Madeira 1,12 · Açores 1,10), época (alta 1,10 ·
abril/outubro 1,00 · baixa 0,88), estilo (intimista 0,82 · clássico 1,00 ·
sofisticado 1,35). Vestido, fato, alianças e lua de mel são retalho e não
levam multiplicador. O distrito escolhido determina a região (Setúbal conta
como Lisboa). Referência: 100 convidados, Lisboa, época alta, clássico =
**35 300 €**, 355 € por convidado. Os valores são indicativos, por validar pela
Bruna — agora no CRM, que o site vai buscar ao abrir; se o CRM não responder,
o site usa os valores do ficheiro.

### O que cada lead leva

Quem responde, nome, email, telemóvel, data, distrito, região, época, estilo,
convidados, estimativa, intervalo, orçamento, rubricas incluídas (com valores)
e excluídas, observações, autorizações (contacto e partilha com fornecedores),
idioma. Vai para o Formspree (decide a confirmação que o casal vê) e, em
segundo plano, para o CRM. Campo-isco `website` contra robôs. Os pedidos de
parceria entram no CRM como fornecedores inativos.

## 4. Decisões tomadas, para não as repensar

- **Direção C** (passo a passo, telemóvel primeiro) escolhida entre três
  propostas; as outras eram editorial e ferramenta de um ecrã.
- **Logótipo A, «Anel»**: o Q de «Quanto» como aliança com diamante. Palavra em
  Bricolage Grotesque SemiBold convertida em contornos. Outras quatro direções
  rejeitadas (pergunta, etiqueta, convite, faísca).
- Sem Fraunces, sem emojis na marca; tratamento por «vocês» no site, por «tu»
  na bio do Instagram.
- A pergunta «quem responde» é opcional e não conta como pergunta, para o site
  continuar a prometer «cinco perguntas».
- O site não foi indexado (`noindex` + `robots.txt`) até os preços estarem
  validados e o domínio no ar.
- Repositório passou a público para o GitHub Pages funcionar no plano gratuito.
- Comissão de 1% é demasiado baixa para pagar campanhas com folga; o setor
  pratica 5–15%. A folha em `negocio/` mostra o efeito e o fundo de maneio
  necessário (as comissões só se recebem perto do dia do casamento).
- Backoffice próprio adiado até haver leads reais — entretanto apareceu o CRM.
- Forma jurídica: independente com o primeiro fornecedor pagante; empresa só
  com sócio, receita recorrente ou volume. A confirmar com contabilista.

## 5. O que foi entregue, por ordem

1. Site original (artifact) trazido para o repositório; README.
2. Área da equipa escondida; formulários ligados a um endpoint; `noindex`.
3. Distrito e data no simulador (zona e época deduzidas).
4. Reconstrução completa na direção C; formulário subido para junto do valor.
5. Formspree ligado e testado; assunto, resumo e anti-spam no envio.
6. Observações no formulário; pergunta prévia noiva/noivo/outra pessoa; marca
   do cabeçalho como atalho para o início; botão do WhatsApp.
7. Versão inglesa com gerador.
8. Marca: logótipo, favicon, ícones, JPEG para perfil e capa, bio, 6
   publicações gráficas, 7 fotográficas (fotos fornecidas pelo Bernardo —
   parecem geradas ou de banco; confirmar licença antes de as apresentar como
   casamentos reais).
9. Folha de faturação com sensibilidade e fluxo de caixa.
10. Preço por convidado nas rubricas por pessoa.
11. Ligação ao CRM (feita pela sessão do CRM) e tabela de preços remota;
    fotografia de fundo no simulador (sessão do CRM).

## 6. O que falta (resumo; detalhe em `TAREFAS.md`)

- Domínio `quantocustacasar.pt` apontado ao GitHub Pages (registos DNS +
  domínio personalizado nas definições do Pages) — o subdomínio do CRM já
  existe, o que sugere que o domínio está ativo.
- Email do negócio; trocar o destino no Formspree.
- Registo da marca no INPI.
- Preços validados pela Bruna, no CRM.
- Redes sociais: perfis e publicações, quando o domínio estiver no ar.
- Antes do lançamento: mudar `CHAVE_EQUIPA`, tirar `noindex` nas duas línguas,
  abrir `robots.txt`, trocar `WHATSAPP` pelo número do negócio (WhatsApp
  Business), restringir o Formspree ao domínio, política de privacidade e
  consentimentos (RGPD).
- Forma jurídica, com contabilista.

## 7. Como trabalhar no site

```bash
git clone https://github.com/bernas77764-glitch/Quantocustacasar
git checkout claude/wedding-cost-simulator-kvt9t1
# editar index.html; depois regenerar a versão inglesa:
python3 ferramentas/gerar-en.py      # pára e diz qual, se um texto ficou sem tradução
git commit -am "..." && git push     # o GitHub Pages publica em 1–2 minutos
```

Qualquer mudança de texto em português tem par em `ferramentas/gerar-en.py`;
o script recusa-se a escrever o inglês se um par deixar de bater certo.
Para testar envios usa-se o endereço github.io, nunca uma pré-visualização
dentro de uma moldura (bloqueia pedidos a outros sítios).

## 8. Risco a tratar antes da migração: o CRM

O CRM é a peça mais valiosa depois do site e **o seu código não está aqui**.
Antes de mudar de conta, confirmar que:
1. O código do CRM está num repositório GitHub (o Railway publica a partir de
   um repositório ou de um upload — se for upload, pedir à sessão do CRM que
   o ponha num repositório).
2. As variáveis de ambiente do Railway (base de dados, chaves) estão anotadas
   num sítio seguro fora do Claude.
3. O acesso ao Railway e ao domínio `crm.quantocustacasar.pt` está na conta
   certa.

## 9. Para retomar com uma nova sessão do Claude

Colar isto no início da conversa:

> Estou a retomar o projeto Quanto Custa Casar. O repositório é
> `bernas77764-glitch/Quantocustacasar`, branch
> `claude/wedding-cost-simulator-kvt9t1`. Lê primeiro `PROJETO.md`, depois
> `TAREFAS.md` e `README.md`. O site está no ar em
> `https://bernas77764-glitch.github.io/Quantocustacasar/`. Não alteres o
> `en/index.html` à mão: gera-se com `ferramentas/gerar-en.py`. Começa por me
> dizer o que vês na lista de tarefas e o que precisas de mim.
