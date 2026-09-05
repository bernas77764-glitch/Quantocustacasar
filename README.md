# Quanto Custa Casar

Simulador de custos de casamento em Portugal. Site estático de página única, em
português de Portugal, que estima o custo de um casamento a partir do número de
convidados, da região, da época do ano e do estilo pretendido.

## Como abrir

O site é um único ficheiro sem dependências de build. Basta abrir `index.html`
no navegador, ou servir a pasta:

```bash
python3 -m http.server 8000   # depois abrir http://localhost:8000
```

## Estrutura

- `index.html` — site completo: marcação, estilos, script do simulador e dados
  de preços. As fontes (Fraunces e Karla) vêm do Google Fonts; tudo o resto é
  local.
- `robots.txt` — bloqueia a indexação enquanto o site for protótipo.

## Como funciona a estimativa

- **24 rubricas** agrupadas em O dia, Imagem, Música, Decoração, Os noivos,
  Apoio e Depois do dia. Cada rubrica tem um valor mínimo, uma estimativa e um
  máximo, e é cobrada como preço fixo ou por convidado.
- **Multiplicadores** aplicados às rubricas sensíveis ao mercado:
  - região (Lisboa 1,15 · Porto 1,08 · Algarve 1,20 · Norte 0,95 · Centro 0,92 ·
    Alentejo 0,95 · Madeira 1,12 · Açores 1,10);
  - época (alta 1,10 · abril/outubro 1,00 · baixa 0,88);
  - estilo (intimista 0,82 · clássico 1,00 · sofisticado 1,35).
- Rubricas de retalho (vestido, fato, alianças, lua de mel) têm preço nacional e
  não são afetadas pelos multiplicadores.
- O casal pode ligar e desligar rubricas e definir um orçamento-alvo, com
  comparação face à estimativa.

## Área da equipa

O painel de gestão (tabela de preços, multiplicadores e leads recebidas) está
escondido dos visitantes. Para o abrir, junta a chave ao endereço:

```
https://quantocustacasar.pt/#equipa
```

A chave é a constante `CHAVE_EQUIPA` no script do `index.html` — muda-a para algo
menos óbvio antes de publicar.

Isto esconde o painel de quem visita o site, mas **não é uma proteção real**:
quem abrir o código-fonte da página encontra a chave. Enquanto for um protótipo
sem dados de terceiros, chega; a partir do momento em que as leads reais ficarem
lá dentro, a gestão deve passar para um backoffice com autenticação no servidor.

As alterações de preços feitas no painel são guardadas em `localStorage`, só no
navegador de quem edita. Para as fixar no site, usa **Copiar tabela (JSON)** e
atualiza os valores de `RUBRICAS_BASE` e `MULT_BASE` no `index.html`.

## Ligar os formulários

Os formulários (casal e fornecedor) enviam um POST em JSON para o URL definido
na constante `ENDPOINT`, no topo do script do `index.html`:

```js
const ENDPOINT = "";        // ex.: "https://formspree.io/f/xxxxxxxx"
const CAMPOS_EXTRA = {};    // ex.: { access_key: "..." } para o Web3Forms
```

Serve qualquer serviço que aceite um POST em JSON e permita pedidos a partir do
browser (Formspree, Web3Forms, uma função própria). O corpo enviado é:

```json
{
  "tipo": "casal",
  "origem": "https://quantocustacasar.pt/",
  "nome": "...", "email": "...", "telefone": "...", "data": "2026-06",
  "convidados": 100, "regiao": "...", "epoca": "...", "estilo": "...",
  "estimativa": 35300, "orcamento": null, "partilhaFornecedores": true
}
```

Os pedidos de fornecedores usam a mesma rota com `"tipo": "fornecedor"`.

**Enquanto `ENDPOINT` estiver vazio**, o site funciona em modo protótipo: os
dados ficam guardados apenas no navegador de quem preenche, e a mensagem de
confirmação diz isso mesmo em vez de prometer um email que ninguém envia.

Se o envio falhar, o formulário mantém os dados preenchidos e mostra um erro
para a pessoa tentar de novo.

## Antes de publicar

- [ ] Definir `ENDPOINT` (e `CAMPOS_EXTRA`, se o serviço exigir chave).
- [ ] Mudar `CHAVE_EQUIPA` para um valor não adivinhável.
- [ ] Substituir os valores indicativos de `RUBRICAS_BASE` e `MULT_BASE` pelos
      preços reais validados pela equipa.
- [ ] Trocar a meta `robots` de `noindex, nofollow` para `index, follow` e
      atualizar o `robots.txt` (ambos estão comentados no sítio certo).
- [ ] Confirmar a política de privacidade e o tratamento dos consentimentos
      (RGPD) antes de recolher dados reais.

## Estado

Protótipo. Os preços são valores indicativos de mercado, por validar com a
equipa. O site não está indexado enquanto essa validação não estiver feita.
