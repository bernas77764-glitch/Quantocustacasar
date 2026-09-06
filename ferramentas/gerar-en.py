# -*- coding: utf-8 -*-
"""Gera en/index.html a partir de index.html: mesmo código, texto em inglês.

Correr a partir da raiz do repositório:  python3 ferramentas/gerar-en.py
Cada par (português, inglês) abaixo tem de existir no index.html; se um texto
português for alterado, o script pára e diz qual — atualiza-se o par e corre-se
outra vez. Assim a versão inglesa nunca fica silenciosamente desatualizada."""
import io, re, sys
s = io.open("index.html", encoding="utf-8").read()
falhas = []
def sub(old, new, n=1):
    global s
    c = s.count(old)
    if c == 0 or (n and c != n):
        falhas.append((c, old[:70])); return
    s = s.replace(old, new)

# ---------- cabeçalho ----------
sub(u'<html lang="pt-PT">', u'<html lang="en">')
sub(u'<meta name="description" content="Quanto custa casar em Portugal? Simulador gratuito com 24 rubricas, ajustado ao distrito, à data e ao número de convidados. Uma pergunta de cada vez, estimativa no fim.">',
    u'<meta name="description" content="How much does a wedding in Portugal cost? Free simulator with 24 cost items, adjusted to the district, the date and the number of guests. One question at a time, estimate at the end.">')
sub(u'<link rel="canonical" href="https://quantocustacasar.pt/">', u'<link rel="canonical" href="https://quantocustacasar.pt/en/">')
sub(u'<meta property="og:locale" content="pt_PT">', u'<meta property="og:locale" content="en_GB">')
sub(u'<meta property="og:url" content="https://quantocustacasar.pt/">', u'<meta property="og:url" content="https://quantocustacasar.pt/en/">')
sub(u'<meta property="og:title" content="Quanto custa casar em Portugal? — Simulador gratuito">', u'<meta property="og:title" content="How much does a wedding in Portugal cost? — Free simulator">')
sub(u'<meta property="og:description" content="Cinco perguntas, uma de cada vez. No fim ficas a saber quanto custa o teu casamento, rubrica a rubrica.">',
    u'<meta property="og:description" content="Five questions, one at a time. At the end you know what your wedding costs, item by item.">')
sub(u'<link rel="apple-touch-icon" href="marca/apple-touch-icon-180.png">', u'<link rel="apple-touch-icon" href="../marca/apple-touch-icon-180.png">')
# JSON-LD inteiro
ini = s.index('<script type="application/ld+json">'); fim = s.index('</script>', ini) + len('</script>')
s = s[:ini] + u'''<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": "https://quantocustacasar.pt/#site", "url": "https://quantocustacasar.pt/en/", "name": "Quanto Custa Casar", "inLanguage": "en" },
    { "@type": "WebApplication", "name": "Wedding cost simulator", "url": "https://quantocustacasar.pt/en/#simulador",
      "applicationCategory": "FinanceApplication", "operatingSystem": "Web", "inLanguage": "en",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" } },
    { "@type": "FAQPage", "mainEntity": [
      { "@type": "Question", "name": "How much does a wedding in Portugal cost?",
        "acceptedAnswer": { "@type": "Answer", "text": "It depends mostly on the region, the month and the number of guests. For 100 guests in the Lisbon area, in high season and in a classic all-inclusive format, the estimate is around 35,000 euros, about 355 euros per guest. The same 100 guests in central Portugal, off season and in an intimate format, come to around 19,500 euros." } },
      { "@type": "Question", "name": "Is the wedding simulator free?",
        "acceptedAnswer": { "@type": "Answer", "text": "It is free and no sign-up is needed to simulate. Contact details are only asked from those who want the detailed budget by email and proposals from suppliers." } },
      { "@type": "Question", "name": "Where do the prices in the estimate come from?",
        "acceptedAnswer": { "@type": "Answer", "text": "From market ranges practised in Portugal, organised by cost item and reviewed by wedding planning professionals. They are indicative: the final price depends on the suppliers chosen and on the date." } },
      { "@type": "Question", "name": "Is my data shared with suppliers?",
        "acceptedAnswer": { "@type": "Answer", "text": "Only with express permission. There are two separate permissions: one for contact by the team and another for sharing the request with partner suppliers in the couple's region. Either can be withdrawn at any time." } },
      { "@type": "Question", "name": "How far in advance should I plan the wedding?",
        "acceptedAnswer": { "@type": "Answer", "text": "The most sought-after venues book high-season Saturdays 12 to 18 months ahead. Simulating early is mostly about not booking the venue before knowing what is left for everything else." } }
    ] }
  ]
}
</script>''' + s[fim:]

# ---------- cabeçalho da página ----------
sub(u'aria-label="Quanto Custa Casar — início"', u'aria-label="Quanto Custa Casar — home"')
sub(u'''      <a href="#como">Como funciona</a>
      <a href="#fornecedores">Fornecedores</a>
      <a href="#faq">Perguntas</a>
      <a href="en/" lang="en" aria-label="English version">EN</a>''',
u'''      <a href="#como">How it works</a>
      <a href="#fornecedores">Suppliers</a>
      <a href="#faq">Questions</a>
      <a href="../" lang="pt" aria-label="Versão em português">PT</a>''')

# ---------- abertura e percurso ----------
M = [
 (u'Simulador gratuito · Portugal', u'Free simulator · Portugal'),
 (u'<h1>Quanto custa casar em Portugal?</h1>', u'<h1>How much does a wedding in Portugal cost?</h1>'),
 (u'Cinco perguntas, uma de cada vez. No fim ficam a saber quanto custa o vosso casamento, rubrica a rubrica — sem registo e sem compromisso.',
  u'Five questions, one at a time. At the end you know what your wedding costs, item by item — no sign-up, no commitment.'),
 (u'aria-label="Progresso das perguntas"', u'aria-label="Question progress"'),
 (u'''      Voltar
    </button>''', u'''      Back
    </button>'''),
 (u'<span class="conta-passos" id="contaPassos">Antes de começar</span>', u'<span class="conta-passos" id="contaPassos">Before we start</span>'),
 (u'<h2>Quem está a fazer as contas?</h2>', u'<h2>Who is doing the maths?</h2>'),
 (u'Só para sabermos com quem falamos — a estimativa é a mesma.', u'Just so we know who we are talking to — the estimate is the same.'),
 (u'<h2>Quantas pessoas vão estar convosco?</h2>', u'<h2>How many people will be with you?</h2>'),
 (u'É o número que mais mexe na conta — o catering e a bebida são cobrados por pessoa.', u'It is the number that moves the bill the most — catering and drinks are charged per person.'),
 (u'aria-label="Número de convidados"', u'aria-label="Number of guests"'),
 (u'<b id="numConvidados">100</b><span>convidados</span>', u'<b id="numConvidados">100</b><span>guests</span>'),
 (u'<h2>Onde vai ser o casamento?</h2>', u'<h2>Where will the wedding be?</h2>'),
 (u'Os preços mudam muito de zona para zona: entre o Algarve e o Centro do país há mais de 25% de diferença nas mesmas rubricas.',
  u'Prices vary a lot from area to area: between the Algarve and central Portugal there is over 25% difference on the same items.'),
 (u'<label class="lab" for="distrito">Distrito</label>', u'<label class="lab" for="distrito">District</label>'),
 (u'<h2>Já têm data?</h2>', u'<h2>Do you have a date yet?</h2>'),
 (u'Um sábado de agosto e um sábado de fevereiro não custam o mesmo. Se ainda não souberem, escolham só a altura do ano.',
  u'A Saturday in August and a Saturday in February do not cost the same. If you do not know yet, just pick the time of year.'),
 (u'<label class="lab" for="dataCasamento">Data do casamento</label>', u'<label class="lab" for="dataCasamento">Wedding date</label>'),
 (u'<span class="lab">Altura do ano</span>', u'<span class="lab">Time of year</span>'),
 (u'<h2>Que casamento têm em mente?</h2>', u'<h2>What kind of wedding do you have in mind?</h2>'),
 (u'Não é sobre gosto, é sobre escala: quantos fornecedores entram e de que gama.', u'It is not about taste, it is about scale: how many suppliers come in, and of what range.'),
 (u'<h2>O que querem ter no dia?</h2>', u'<h2>What do you want on the day?</h2>'),
 (u'Já pusemos o que é mais comum. Desliga o que não se aplica — a estimativa acompanha.', u'We have ticked what is most common. Untick what does not apply — the estimate follows.'),
 (u'<label class="lab" for="orcamento">Orçamento que têm em mente (opcional)</label>', u'<label class="lab" for="orcamento">Budget you have in mind (optional)</label>'),
 (u'placeholder="ex.: 25000"', u'placeholder="e.g. 25000"'),
 # resultado
 (u'<span class="eyebrow">A vossa estimativa</span>', u'<span class="eyebrow">Your estimate</span>'),
 (u'<h1 style="font-size: 32px;">É este o valor a ter em conta</h1>', u'<h1 style="font-size: 32px;">This is the figure to plan around</h1>'),
 (u'<span class="lab">Custo estimado do casamento</span>', u'<span class="lab">Estimated wedding cost</span>'),
 (u'<span>Por convidado <b id="porConvidado">—</b></span>', u'<span>Per guest <b id="porConvidado">—</b></span>'),
 (u'<span>Convidados <b id="nConv">—</b></span>', u'<span>Guests <b id="nConv">—</b></span>'),
 (u'<span>Rubricas <b id="nRub">—</b></span>', u'<span>Items <b id="nRub">—</b></span>'),
 (u'>Rever as respostas</button>', u'>Review the answers</button>'),
 (u'<h2 style="font-size: 22px;">Onde vai o dinheiro</h2>', u'<h2 style="font-size: 22px;">Where the money goes</h2>'),
 (u'<summary>Ver as 24 rubricas, uma a uma</summary>', u'<summary>See all 24 items, one by one</summary>'),
 (u'<thead><tr><th>Rubrica</th><th class="num">Mínimo</th><th class="num">Estimativa</th><th class="num">Máximo</th></tr></thead>',
  u'<thead><tr><th>Item</th><th class="num">Minimum</th><th class="num">Estimate</th><th class="num">Maximum</th></tr></thead>'),
 (u'<h2>Querem esta estimativa afinada ao vosso caso?</h2>', u'<h2>Want this estimate tailored to your case?</h2>'),
 (u'Enviamos o orçamento detalhado e propostas reais de quintas, catering, fotografia e música para a vossa data. Sem custos para vocês.',
  u'We send you the detailed budget and real proposals from venues, catering, photography and music for your date. At no cost to you.'),
 (u'<label class="lab" for="ln">Nome</label>', u'<label class="lab" for="ln">Name</label>'),
 (u'<label class="lab" for="lt">Telemóvel</label>', u'<label class="lab" for="lt">Mobile</label>'),
 (u'<label class="lab" for="ld">Data do casamento</label>', u'<label class="lab" for="ld">Wedding date</label>'),
 (u'<label class="lab" for="lo">Observações (opcional)</label>', u'<label class="lab" for="lo">Notes (optional)</label>'),
 (u'placeholder="ex.: já temos a quinta reservada · queremos cerimónia religiosa · convidados de fora do país"',
  u'placeholder="e.g. we already have the venue booked · we want a religious ceremony · guests coming from abroad"'),
 (u'Queremos receber a estimativa e ser contactados pela equipa para organizar o casamento.', u'We want to receive the estimate and be contacted by the team to organise the wedding.'),
 (u'Autorizamos a partilha dos nossos dados com fornecedores parceiros (quintas, catering, fotografia, música) para receber propostas.',
  u'We allow our details to be shared with partner suppliers (venues, catering, photography, music) so we can receive proposals.'),
 (u'>Receber a nossa estimativa</button>', u'>Get our estimate</button>'),
 (u'Os vossos dados são usados apenas para enviar a estimativa e as propostas que autorizarem. Podem retirar o consentimento a qualquer momento.',
  u'Your details are used only to send the estimate and the proposals you allow. You can withdraw consent at any time.'),
 (u'aria-label="Falar connosco no WhatsApp"', u'aria-label="Talk to us on WhatsApp"'),
 (u'<span class="vivo-eti" id="vivoEti">Por agora</span>', u'<span class="vivo-eti" id="vivoEti">So far</span>'),
 (u'<button type="button" class="btn" id="btnContinuar">Continuar</button>', u'<button type="button" class="btn" id="btnContinuar">Continue</button>'),
 # como funciona
 (u'<h2>Como chegamos a este número</h2>', u'<h2>How we get to this number</h2>'),
 (u'Não é um valor tirado de um artigo estrangeiro. São intervalos de mercado praticados em Portugal, rubrica a rubrica.', u'It is not a figure lifted from a foreign article. These are market ranges practised in Portugal, item by item.'),
 (u'<h3>24 rubricas, não uma média</h3>', u'<h3>24 items, not an average</h3>'),
 (u'Do espaço às alianças, cada rubrica tem um mínimo, um valor típico e um máximo. Umas são preço fixo, outras são cobradas por convidado.',
  u'From the venue to the rings, each item has a minimum, a typical value and a maximum. Some are fixed prices, others are charged per guest.'),
 (u'<h3>Ajustado à vossa zona e data</h3>', u'<h3>Adjusted to your area and date</h3>'),
 (u'As rubricas que dependem do mercado local sobem ou descem com o distrito e com a altura do ano. As de retalho — vestido, fato, alianças — mantêm preço nacional.',
  u'Items that depend on the local market go up or down with the district and the time of year. Retail ones — dress, suit, rings — keep a national price.'),
 (u'<h3>Revisto por quem organiza</h3>', u'<h3>Reviewed by people who organise weddings</h3>'),
 (u'Os intervalos são revistos por profissionais de organização de casamentos. São indicativos: o preço final depende dos fornecedores escolhidos e da data.',
  u'The ranges are reviewed by wedding planning professionals. They are indicative: the final price depends on the suppliers chosen and on the date.'),
 # fornecedores
 (u'<h2>É fornecedor de casamentos?</h2>', u'<h2>Are you a wedding supplier?</h2>'),
 (u'Estamos a montar a rede de parceiros por distrito. Quem entrar agora recebe os pedidos dos casais da sua zona antes do lançamento.',
  u'We are building the partner network district by district. Those who join now receive requests from couples in their area before launch.'),
 (u'<label class="lab" for="se">Empresa</label>', u'<label class="lab" for="se">Company</label>'),
 (u'<label class="lab" for="sc">Categoria</label>', u'<label class="lab" for="sc">Category</label>'),
 (u'''              <option>Espaço / quinta</option>
              <option>Catering e bebidas</option>
              <option>Fotografia</option>
              <option>Vídeo</option>
              <option>Música / DJ / banda</option>
              <option>Decoração e flores</option>
              <option>Bolos e doçaria</option>
              <option>Beleza e cabelo</option>
              <option>Transporte</option>
              <option>Outra</option>''',
  u'''              <option>Venue</option>
              <option>Catering and drinks</option>
              <option>Photography</option>
              <option>Video</option>
              <option>Music / DJ / band</option>
              <option>Decoration and flowers</option>
              <option>Cakes and sweets</option>
              <option>Beauty and hair</option>
              <option>Transport</option>
              <option>Other</option>'''),
 (u'<label class="lab" for="sd">Distrito</label>', u'<label class="lab" for="sd">District</label>'),
 (u'placeholder="ex.: Braga"', u'placeholder="e.g. Braga"'),
 (u'<label class="lab" for="sn">Nome do responsável</label>', u'<label class="lab" for="sn">Contact name</label>'),
 (u'<label class="lab" for="st">Telefone</label>', u'<label class="lab" for="st">Phone</label>'),
 (u'Autorizo o contacto para apresentação das condições de parceria.', u'I agree to be contacted about the partnership terms.'),
 (u'>Quero receber as condições</button>', u'>Send me the terms</button>'),
 # faq
 (u'<h2>Perguntas que nos fazem sempre</h2>', u'<h2>Questions we always get</h2>'),
 (u'<summary>Isto é mesmo grátis?</summary>', u'<summary>Is this really free?</summary>'),
 (u'Simular é grátis e não é preciso registo. Só pedimos contactos a quem quiser receber o orçamento detalhado e propostas de fornecedores. Quem paga somos nós a receber dos parceiros, nunca o casal.',
  u'Simulating is free and needs no sign-up. We only ask for contact details from those who want the detailed budget and supplier proposals. Our partners pay us, never the couple.'),
 (u'<summary>De onde vêm estes preços?</summary>', u'<summary>Where do these prices come from?</summary>'),
 (u'De intervalos praticados em Portugal, organizados por rubrica e revistos por profissionais de organização de casamentos. São indicativos: o preço final depende sempre dos fornecedores escolhidos e da data.',
  u'From ranges practised in Portugal, organised by item and reviewed by wedding planning professionals. They are indicative: the final price always depends on the suppliers chosen and on the date.'),
 (u'<summary>Os nossos dados vão parar às mãos de quem?</summary>', u'<summary>Who ends up with our details?</summary>'),
 (u'Só de quem autorizarem. São duas autorizações separadas: uma para a nossa equipa contactar, outra para partilharmos o pedido com fornecedores parceiros da vossa zona. Podem dar só a primeira, e podem retirar qualquer uma a qualquer momento.',
  u'Only whoever you allow. There are two separate permissions: one for our team to contact you, another for us to share the request with partner suppliers in your area. You can give only the first, and withdraw either at any time.'),
 (u'<summary>Com quanto tempo devemos começar a planear?</summary>', u'<summary>How far ahead should we start planning?</summary>'),
 (u'As quintas com procura alta fecham sábados de época alta com 12 a 18 meses de antecedência, e a data condiciona quase tudo o resto. Simular cedo serve sobretudo para não reservarem o espaço antes de saberem o que sobra para o resto.',
  u'In-demand venues book high-season Saturdays 12 to 18 months ahead, and the date shapes almost everything else. Simulating early is mostly about not booking the venue before you know what is left for the rest.'),
 # área da equipa
 (u'<summary><span>Área da equipa · tabela de preços e leads <span class="badge">Protótipo</span></span></summary>',
  u'<summary><span>Team area · price table and leads <span class="badge">Prototype</span></span></summary>'),
 (u'<p class="hint">Bruna: substitui aqui os valores indicativos pelos reais. <b>Estimativa</b> é o valor típico que o simulador usa; mínimo e máximo definem o intervalo mostrado ao casal. Guardar grava neste navegador; <b>Copiar tabela</b> dá o ficheiro para fixar como base do site.</p>',
  u'<p class="hint">Replace the indicative values with real ones here. <b>Estimate</b> is the typical value the simulator uses; minimum and maximum define the range shown to the couple. Save stores in this browser; <b>Copy table</b> gives the file to fix as the site base.</p>'),
 (u'<thead><tr><th>Rubrica</th><th>Unidade</th><th class="num">Mínimo</th><th class="num">Estimativa</th><th class="num">Máximo</th></tr></thead>',
  u'<thead><tr><th>Item</th><th>Unit</th><th class="num">Minimum</th><th class="num">Estimate</th><th class="num">Maximum</th></tr></thead>'),
 (u'<h3 style="margin-top: 12px; font-size: 16px;">Multiplicadores</h3>', u'<h3 style="margin-top: 12px; font-size: 16px;">Multipliers</h3>'),
 (u'<thead><tr><th>Fator</th><th class="num">Multiplicador</th></tr></thead>', u'<thead><tr><th>Factor</th><th class="num">Multiplier</th></tr></thead>'),
 (u'>Guardar preços</button>', u'>Save prices</button>'),
 (u'>Repor valores indicativos</button>', u'>Reset indicative values</button>'),
 (u'>Copiar tabela (JSON)</button>', u'>Copy table (JSON)</button>'),
 (u'<span class="saved" id="savedMsg" hidden>Guardado.</span>', u'<span class="saved" id="savedMsg" hidden>Saved.</span>'),
 (u'aria-label="Tabela de preços em JSON"', u'aria-label="Price table as JSON"'),
 (u'<h3 style="margin-top: 12px; font-size: 16px;">Leads de teste</h3>', u'<h3 style="margin-top: 12px; font-size: 16px;">Test leads</h3>'),
 (u'<p class="hint">No protótipo as leads ficam guardadas apenas neste navegador. Na versão final ligam-se ao email da equipa e ao backoffice.</p>',
  u'<p class="hint">In the prototype, leads are stored only in this browser. In the final version they go to the team email and the back office.</p>'),
 (u'Estimativas indicativas para casamentos em Portugal, construídas a partir de intervalos de mercado e afinadas com a experiência da equipa. O valor final depende sempre dos fornecedores escolhidos e da data. Protótipo em construção — 2026.',
  u'Indicative estimates for weddings in Portugal, built from market ranges and refined with the team’s experience. The final figure always depends on the suppliers chosen and on the date. Prototype under construction — 2026.'),
]
for a, b in M: sub(a, b)

# ---------- script: modelo ----------
R = [
 (u'grupo:"O dia",', u'grupo:"The day",'), (u'grupo:"Imagem",', u'grupo:"Image",'), (u'grupo:"Música",', u'grupo:"Music",'),
 (u'grupo:"Decoração",', u'grupo:"Decoration",'), (u'grupo:"Os noivos",', u'grupo:"The couple",'), (u'grupo:"Apoio",', u'grupo:"Support",'),
 (u'grupo:"Depois do dia",', u'grupo:"After the day",'),
 (u'nome:"Espaço / quinta",', u'nome:"Venue",'), (u'nome:"Catering e bebidas",', u'nome:"Catering and drinks",'),
 (u'nome:"Open bar / bar de noite",', u'nome:"Open bar / night bar",'), (u'nome:"Bolo de noiva",', u'nome:"Wedding cake",'),
 (u'nome:"Cerimónia (taxas e celebrante)",', u'nome:"Ceremony (fees and officiant)",'), (u'nome:"Som, luz e estruturas",', u'nome:"Sound, light and structures",'),
 (u'nome:"Fotografia",', u'nome:"Photography",'), (u'nome:"Vídeo",', u'nome:"Video",'), (u'nome:"Fotobooth / animação extra",', u'nome:"Photo booth / extra entertainment",'),
 (u'nome:"DJ",', u'nome:"DJ",'), (u'nome:"Banda ao vivo",', u'nome:"Live band",'), (u'nome:"Música da cerimónia",', u'nome:"Ceremony music",'),
 (u'nome:"Decoração e flores",', u'nome:"Decoration and flowers",'), (u'nome:"Centros de mesa e mise en place",', u'nome:"Centrepieces and table setting",'),
 (u'nome:"Convites e papelaria",', u'nome:"Invitations and stationery",'), (u'nome:"Lembranças para os convidados",', u'nome:"Guest favours",'),
 (u'nome:"Vestido de noiva e acessórios",', u'nome:"Wedding dress and accessories",'), (u'nome:"Fato do noivo",', u'nome:"Groom\'s suit",'),
 (u'nome:"Alianças",', u'nome:"Rings",'), (u'nome:"Cabelo e maquilhagem",', u'nome:"Hair and make-up",'), (u'nome:"Transporte dos noivos",', u'nome:"Couple\'s transport",'),
 (u'nome:"Wedding planner e coordenação",', u'nome:"Wedding planner and coordination",'), (u'nome:"Espaço e apoio para crianças",', u'nome:"Kids\' area and childcare",'),
 (u'nome:"Lua de mel",', u'nome:"Honeymoon",'),
 (u'nome:"Lisboa e arredores"', u'nome:"Lisbon and surroundings"'), (u'nome:"Porto e arredores"', u'nome:"Porto and surroundings"'),
 (u'nome:"Norte (restante)"', u'nome:"North (rest)"'), (u'nome:"Centro"', u'nome:"Centre"'), (u'nome:"Açores"', u'nome:"Azores"'),
 (u'nome:"Época alta (maio a setembro)"', u'nome:"High season (May to September)"'), (u'nome:"Abril ou outubro"', u'nome:"April or October"'), (u'nome:"Novembro a março"', u'nome:"November to March"'),
 (u'nome:"Intimista", m:0.82, desc:"Menos rubricas, fornecedores locais, decoração simples."', u'nome:"Intimate", m:0.82, desc:"Fewer items, local suppliers, simple decoration."'),
 (u'nome:"Clássico",  m:1.00, desc:"O casamento português típico: quinta, banquete e festa até de madrugada."', u'nome:"Classic",  m:1.00, desc:"The typical Portuguese wedding: venue, banquet and party until dawn."'),
 (u'nome:"Sofisticado", m:1.35, desc:"Quintas de topo, menu de autor, decoração de assinatura."', u'nome:"Sophisticated", m:1.35, desc:"Top venues, signature menu, designer decoration."'),
 (u'const MESES = ["janeiro","fevereiro","março","abril","maio","junho",\n                 "julho","agosto","setembro","outubro","novembro","dezembro"];',
  u'const MESES = ["January","February","March","April","May","June",\n                 "July","August","September","October","November","December"];'),
 (u'return parseInt(p[2], 10) + " de " + mes + " de " + p[0];', u'return parseInt(p[2], 10) + " " + mes + " " + p[0];'),
 (u'new Intl.NumberFormat("pt-PT", { style:"currency", currency:"EUR", maximumFractionDigits:0 })', u'new Intl.NumberFormat("en-IE", { style:"currency", currency:"EUR", maximumFractionDigits:0 })'),
 (u'const QUEM = { noiva: "Noiva", noivo: "Noivo", outro: "Outra pessoa" };', u'const QUEM = { noiva: "Bride", noivo: "Groom", outro: "Someone else" };'),
 (u'const desc = { noiva: "", noivo: "", outro: "Família, amigos, ou quem está a organizar." };', u'const desc = { noiva: "", noivo: "", outro: "Family, friends, or whoever is organising." };'),
 # envio
 (u'? "Quanto Custa Casar — novo fornecedor: " + (dados.empresa || "")\n      : "Quanto Custa Casar — novo casal: " + (dados.nome || "");',
  u'? "Quanto Custa Casar — new supplier (EN site): " + (dados.empresa || "")\n      : "Quanto Custa Casar — new couple (EN site): " + (dados.nome || "");'),
 (u'{ tipo: tipo, origem: location.hostname || "ficheiro local" },', u'{ tipo: tipo, idioma: "en", origem: location.hostname || "local file" },'),
 (u'd.partilhaFornecedores ? "autoriza fornecedores" : "sem partilha"]', u'd.partilhaFornecedores ? "allows suppliers" : "no sharing"]'),
 (u'd.nRubricas ? d.nRubricas + " rubricas" : null,', u'd.nRubricas ? d.nRubricas + " items" : null,'),
 (u'btn.textContent = "A enviar\\u2026";', u'btn.textContent = "Sending\\u2026";'),
 # barra viva e navegação
 (u'$("vivoEti").textContent = "Por agora";\n      $("vivoVal").textContent = "—";\n      $("vivoObs").textContent = "Escolham pelo menos uma rubrica.";',
  u'$("vivoEti").textContent = "So far";\n      $("vivoVal").textContent = "—";\n      $("vivoObs").textContent = "Pick at least one item.";'),
 (u'$("vivoEti").textContent = "Por agora";\n      $("vivoVal").textContent = eur(arred(iv.min, 500)) + " – " + eur(arred(iv.max, 500));\n      $("vivoObs").innerHTML = "estimativa provisória<br>" + (restantes === 1 ? "falta 1 resposta" : "faltam " + restantes + " respostas");',
  u'$("vivoEti").textContent = "So far";\n      $("vivoVal").textContent = eur(arred(iv.min, 500)) + " – " + eur(arred(iv.max, 500));\n      $("vivoObs").innerHTML = "provisional estimate<br>" + (restantes === 1 ? "1 answer to go" : restantes + " answers to go");'),
 (u'$("vivoEti").textContent = "Estimativa";\n      $("vivoVal").textContent = eur(arred(res.base, 50));\n      $("vivoObs").innerHTML = "entre " + eur(arred(res.min, 500)) + "<br>e " + eur(arred(res.max, 500));',
  u'$("vivoEti").textContent = "Estimate";\n      $("vivoVal").textContent = eur(arred(res.base, 50));\n      $("vivoObs").innerHTML = "between " + eur(arred(res.min, 500)) + "<br>and " + eur(arred(res.max, 500));'),
 (u'$("btnContinuar").textContent = passo === PASSOS ? "Ver a estimativa" : "Continuar";', u'$("btnContinuar").textContent = passo === PASSOS ? "See the estimate" : "Continue";'),
 (u'passo === 1 ? "Antes de começar" : "Pergunta " + (passo - 1) + " de " + PERGUNTAS;', u'passo === 1 ? "Before we start" : "Question " + (passo - 1) + " of " + PERGUNTAS;'),
 (u'"Cada 10 convidados a mais custam, em média, mais <b>" +\n        eur(extra) + "</b> " + textoZona() + ".";', u'"Every 10 extra guests cost, on average, <b>" +\n        eur(extra) + "</b> more " + textoZona() + ".";'),
 (u'return respondido.regiao ? "em " + MULT.regiao[estado.regiao].nome : "no país";', u'return respondido.regiao ? "in " + MULT.regiao[estado.regiao].nome : "nationwide";'),
 (u'd.nome, d.convidados + " convidados",', u'd.nome, d.convidados + " guests",'),
 (u'vazio.value = ""; vazio.textContent = "Ainda não sabemos";', u'vazio.value = ""; vazio.textContent = "We don\'t know yet";'),
 (u'lb.innerHTML = r.nome + (r.un === "convidado" ? \' <span class="un">por convidado</span>\' : "");', u'lb.innerHTML = r.nome + (r.un === "convidado" ? \' <span class="un">per guest</span>\' : "");'),
 # resultado
 (u'? "Provável entre " + eur(arred(res.min, 50)) + " e " + eur(arred(res.max, 50))\n      : "Escolham pelo menos uma rubrica.";', u'? "Likely between " + eur(arred(res.min, 50)) + " and " + eur(arred(res.max, 50))\n      : "Pick at least one item.";'),
 (u'.length + " de " + RUBRICAS.length;', u'.length + " of " + RUBRICAS.length;'),
 (u'msg = "O orçamento cobre a estimativa, com " + eur(arred(estado.orcamento - res.base, 50)) + " de folga.";', u'msg = "Your budget covers the estimate, with " + eur(arred(estado.orcamento - res.base, 50)) + " to spare.";'),
 (u'msg = "Faltam cerca de " + eur(arred(res.base - estado.orcamento, 50)) + " — dá para fechar cortando uma ou duas rubricas.";', u'msg = "About " + eur(arred(res.base - estado.orcamento, 50)) + " short — you can close the gap by cutting one or two items.";'),
 (u'msg = "O orçamento cobre " + Math.round(cobertura * 100) + "% da estimativa. Vale a pena rever convidados, época ou estilo.";', u'msg = "Your budget covers " + Math.round(cobertura * 100) + "% of the estimate. Worth revisiting guests, season or style.";'),
 (u'p.className = "hint"; p.textContent = "Escolham as rubricas para verem a repartição.";', u'p.className = "hint"; p.textContent = "Pick the items to see the breakdown.";'),
 (u'nome: "Outras " + resto.length + " rubricas",', u'nome: "Other " + resto.length + " items",'),
 (u'[["Total", ""],', u'[["Total", ""],'),
 # formulário do casal
 (u'if (nome.length < 2) problemas.push("o vosso nome");', u'if (nome.length < 2) problemas.push("your name");'),
 (u'problemas.push("um email válido");', u'problemas.push("a valid email");'),
 (u'problemas.push("um telemóvel válido");', u'problemas.push("a valid phone number");'),
 (u'problemas.push("a autorização para vos contactarmos");', u'problemas.push("permission to contact you");'),
 (u'err.textContent = "Falta " + problemas.join(", ").replace(/, ([^,]*)$/, " e $1") + ".";', u'err.textContent = "Missing: " + problemas.join(", ").replace(/, ([^,]*)$/, " and $1") + ".";'),
 (u'.nRubricas ? d.nRubricas', u'.nRubricas ? d.nRubricas'),
 (u'rubricasExcluidas: res.linhas.filter(function (l) { return !l.ativa; })\n        .map(function (l) { return l.r.nome; }).join(" · ") || "nenhuma",', u'rubricasExcluidas: res.linhas.filter(function (l) { return !l.ativa; })\n        .map(function (l) { return l.r.nome; }).join(" · ") || "none",'),
 (u'nRubricas: res.linhas.filter(function (l) { return l.ativa; }).length + " de " + RUBRICAS.length', u'nRubricas: res.linhas.filter(function (l) { return l.ativa; }).length + " of " + RUBRICAS.length'),
 (u'intervalo: eur(arred(res.min, 50)) + " a " + eur(arred(res.max, 50)),', u'intervalo: eur(arred(res.min, 50)) + " to " + eur(arred(res.max, 50)),'),
 (u't.className = "tick"; t.textContent = "Obrigado, " + nome.split(" ")[0] + ".";', u't.className = "tick"; t.textContent = "Thank you, " + nome.split(" ")[0] + ".";'),
 (u'? "A vossa estimativa é de " + eur(arred(res.base, 50)) + " para " + estado.convidados +\n          " convidados. Este site ainda está em construção: o pedido ficou guardado apenas neste " +\n          "navegador e ainda não chegou a ninguém."',
  u'? "Your estimate is " + eur(arred(res.base, 50)) + " for " + estado.convidados +\n          " guests. This site is still under construction: the request was stored only in this " +\n          "browser and has not reached anyone yet."'),
 (u': "Enviámos a estimativa de " + eur(arred(res.base, 50)) + " para " + email +\n          ". A equipa entra em contacto em 24 horas com propostas para " + estado.convidados + " convidados " +\n          (data ? "em " + dataExtenso(data) + "." : "na vossa data.");',
  u': "We have sent the estimate of " + eur(arred(res.base, 50)) + " to " + email +\n          ". The team will be in touch within 24 hours with proposals for " + estado.convidados + " guests " +\n          (data ? "on " + dataExtenso(data) + "." : "on your date.");'),
 (u'? "Vamos pedir propostas aos fornecedores parceiros da vossa zona."\n        : "Não vamos partilhar os vossos dados com fornecedores.";', u'? "We will ask partner suppliers in your area for proposals."\n        : "We will not share your details with suppliers.";'),
 (u'err.textContent = "Não conseguimos enviar o vosso pedido agora. Verifiquem a ligação e tentem outra vez.";', u'err.textContent = "We could not send your request right now. Check your connection and try again.";'),
 # editor da equipa
 (u'(r.un === "convidado" ? "por convidado" : "valor fixo")', u'(r.un === "convidado" ? "per guest" : "fixed price")'),
 (u'[["regiao", "Região"], ["epoca", "Época"], ["estilo", "Estilo"]]', u'[["regiao", "Region"], ["epoca", "Season"], ["estilo", "Style"]]'),
 (u'"Guardado neste navegador."', u'"Saved in this browser."'), (u'"Não foi possível guardar neste navegador."', u'"Could not save in this browser."'),
 (u'td.className = "hint"; td.textContent = "Ainda não há leads de teste neste navegador.";', u'td.className = "hint"; td.textContent = "No test leads in this browser yet.";'),
 (u'" convidados · " + esc(l.distrito || "—") + " · " + esc(l.regiao) +\n        " · estimativa " + eur(l.estimativa) + (l.partilhaFornecedores ? " · autoriza fornecedores" : " · sem partilha") + "</span>" +\n        (l.observacoes && l.observacoes !== "—" ? \'<br><span class="un">Obs.: \' + esc(l.observacoes) + "</span>" : "");',
  u'" guests · " + esc(l.distrito || "—") + " · " + esc(l.regiao) +\n        " · estimate " + eur(l.estimativa) + (l.partilhaFornecedores ? " · allows suppliers" : " · no sharing") + "</span>" +\n        (l.observacoes && l.observacoes !== "—" ? \'<br><span class="un">Notes: \' + esc(l.observacoes) + "</span>" : "");'),
 (u'esc(l.dataTexto || "sem data")', u'esc(l.dataTexto || "no date")'),
 # fornecedores
 (u'if (empresa.length < 2) faltas.push("o nome da empresa");', u'if (empresa.length < 2) faltas.push("the company name");'),
 (u'if (distrito.length < 2) faltas.push("o distrito");', u'if (distrito.length < 2) faltas.push("the district");'),
 (u'if (nome.length < 2) faltas.push("o nome do responsável");', u'if (nome.length < 2) faltas.push("the contact name");'),
 (u'faltas.push("um email válido");', u'faltas.push("a valid email");'),
 (u'faltas.push("a autorização de contacto");', u'faltas.push("permission to contact you");'),
 (u'err.textContent = "Falta " + faltas.join(", ").replace(/, ([^,]*)$/, " e $1") + ".";', u'err.textContent = "Missing: " + faltas.join(", ").replace(/, ([^,]*)$/, " and $1") + ".";'),
 (u't.className = "tick"; t.textContent = "Recebido.";', u't.className = "tick"; t.textContent = "Received.";'),
 (u'? "O site ainda está em construção: o pedido de " + empresa + " ficou guardado apenas neste " +\n          "navegador e ainda não chegou a ninguém."',
  u'? "This site is still under construction: the request from " + empresa + " was stored only in this " +\n          "browser and has not reached anyone yet."'),
 (u': "Entramos em contacto com " + empresa + " através de " + email +\n          " com as condições de parceria antes do lançamento.";', u': "We will contact " + empresa + " at " + email +\n          " with the partnership terms before launch.";'),
 (u'err.textContent = "Não conseguimos enviar o pedido agora. Verifica a ligação e tenta outra vez.";', u'err.textContent = "We could not send the request right now. Check your connection and try again.";'),
 # whatsapp
 (u'let msg = "Olá! Estive no Quanto Custa Casar e gostava de falar convosco.";', u'let msg = "Hello! I was on Quanto Custa Casar and would like to talk to you.";'),
 (u'msg += " A minha estimativa deu " + eur(arred(res.base, 50)) + " para " + estado.convidados + " convidados.";', u'msg += " My estimate came to " + eur(arred(res.base, 50)) + " for " + estado.convidados + " guests.";'),
]
for a, b in R: sub(a, b, 0)

import os
os.makedirs("en", exist_ok=True)
io.open("en/index.html", "w", encoding="utf-8").write(s)
print("en/index.html escrito |", len(s), "caracteres")
if falhas:
    print("FALHAS (%d):" % len(falhas))
    for c, t in falhas: print("  x%d  %s" % (c, t))
    sys.exit(1)
print("todas as substituições aplicadas")
