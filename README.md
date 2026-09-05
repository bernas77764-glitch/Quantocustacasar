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

No fim da página há um painel recolhido onde é possível editar a tabela de
preços e os multiplicadores, repor os valores indicativos e exportar tudo em
JSON. As alterações são guardadas em `localStorage`, apenas no navegador de quem
edita — não alteram os valores para os restantes visitantes.

## Estado

Protótipo. Os formulários de casal e de fornecedor validam os dados e guardam-nos
em `localStorage`; não existe backend nem envio de email. Os preços são valores
indicativos de mercado, por validar com a equipa.
