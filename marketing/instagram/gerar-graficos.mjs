// Gera os gráficos dos posts de Instagram (1080x1350) com os valores de referência de src/lib/precos.ts.
// Correr com: node marketing/instagram/gerar-graficos.mjs
import { createRequire } from 'module';const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs';
const C={bg:'#FAF6F1',ink:'#1A1613',brand:'#A8552B',soft:'#EADFD2',muted:'#8A7F74',track:'#F1E8DE'};
const eur=n=>n.toLocaleString('pt-PT').replace(/ | /g,' ')+' €';
const shell=(kicker,title,body,nota)=>`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;background:${C.bg};color:${C.ink};font-family:Inter,sans-serif;padding:84px 84px 64px;display:flex;flex-direction:column}
.k{font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:${C.brand};font-weight:600}
h1{font-family:'Playfair Display',serif;font-weight:600;font-size:66px;line-height:1.12;margin:22px 0 0}
.body{flex:1;display:flex;flex-direction:column;justify-content:center}
.nota{font-size:20px;color:${C.muted};line-height:1.4;border-top:2px solid ${C.soft};padding-top:22px}
.foot{display:flex;justify-content:space-between;align-items:baseline;margin-top:18px}
.marca{font-family:'Playfair Display',serif;font-size:30px;font-weight:600}.site{font-size:22px;color:${C.brand};font-weight:600}
.row{display:grid;grid-template-columns:330px 1fr;align-items:center;gap:24px;margin:13px 0}
.lab{font-size:27px;font-weight:500}.bar{height:40px;background:${C.track};border-radius:0 6px 6px 0;position:relative}
.fill{height:100%;background:${C.brand};border-radius:0 6px 6px 0}
.val{position:absolute;top:50%;transform:translateY(-50%);font-size:25px;font-weight:700;white-space:nowrap}
</style></head><body><div class="k">${kicker}</div><h1>${title}</h1><div class="body">${body}</div>
<div class="nota">${nota}</div><div class="foot"><span class="marca">Quanto Custa Casar</span><span class="site">quantocustacasar.pt</span></div></body></html>`;
const bars=(items,max,fmt,mutedLast)=>items.map((it,i)=>{const p=it.v/max*100;const m=mutedLast&&i===items.length-1;const inside=p>72;
return `<div class="row"><div class="lab" style="${m?`color:${C.muted}`:''}">${it.n}</div><div class="bar"><div class="fill" style="width:${p}%;${m?`background:${C.muted}`:''}"></div><span class="val" style="${inside?`right:${100-p}%;margin-right:14px;color:#fff`:`left:${p}%;margin-left:14px`}">${fmt(it.v)}</span></div></div>`}).join('');
const ref='Valores de referência do simulador Quanto Custa Casar: 100 convidados, estilo clássico, abril ou outubro. Cada casamento é diferente; façam a vossa simulação.';
const pages={
'01-para-onde-vai-o-dinheiro':shell('Para onde vai o dinheiro','Mais de um terço do orçamento vai para comer e beber',
 bars([{n:'Catering e bebidas',v:27.9},{n:'Espaço / quinta',v:10.5},{n:'Wedding planner',v:8.7},{n:'Open bar',v:6.3},{n:'Decoração e flores',v:6.3},{n:'Vestido de noiva',v:6.3},{n:'Fotografia',v:5.6},{n:'Vídeo',v:5.2},{n:'Restantes 10 rubricas',v:23.2}],30,v=>v.toFixed(1).replace('.',',')+' %',true)
 +`<p style="font-size:26px;margin-top:34px;color:${C.muted}">Peso de cada rubrica num casamento de cerca de <b style="color:${C.ink}">${eur(28650)}</b></p>`,ref),
'03-casar-por-regiao':shell('Quanto custa casar em cada região','O mesmo casamento, até 7&nbsp;000&nbsp;€ de diferença',
 bars([['Algarve',33700],['Lisboa e arredores',32400],['Madeira',31700],['Açores',31200],['Porto e arredores',30700],['Norte (restante)',27400],['Alentejo',27400],['Centro',26600]].map(([n,v])=>({n,v})),34000,eur)+`<p style="font-size:26px;margin-top:34px;color:${C.muted}">Entre o Algarve e o Centro vão <b style="color:${C.ink}">cerca de 7 000 €</b>, só por causa da região.</p>`,
 'Estimativa total do simulador Quanto Custa Casar, valores arredondados: 100 convidados, estilo clássico, abril ou outubro. Façam a vossa simulação.'),
};
// dumbbell
const R=[['Espaço / quinta',1500,3000,6000],['Wedding planner',1200,2500,5000],['Decoração e flores',800,1800,4000],['Banda ao vivo',1200,2200,4000],['Vestido de noiva',900,1800,3500],['Fotografia',900,1600,3000],['Vídeo',800,1500,2800],['DJ',600,950,1600]];
const X=6000,pc=v=>v/X*100,k=v=>v>=1000?(v/1000).toLocaleString('pt-PT')+' mil €':v+' €';
const db=R.map(([n,a,b,c])=>`<div style="display:grid;grid-template-columns:280px 1fr 200px;align-items:center;gap:20px;margin:16px 0"><div class="lab">${n}</div><div style="position:relative;height:64px">
<div style="position:absolute;top:40px;height:10px;left:0;right:0;background:${C.track};border-radius:5px"></div>
<div style="position:absolute;top:40px;height:10px;left:${pc(a)}%;width:${pc(c)-pc(a)}%;background:#D9B8A0;border-radius:5px"></div>
<div style="position:absolute;top:34px;left:calc(${pc(b)}% - 11px);width:22px;height:22px;border-radius:50%;background:${C.brand};box-shadow:0 0 0 3px ${C.bg}"></div>
<span style="position:absolute;top:0;left:${pc(b)}%;transform:translateX(-50%);font-size:24px;font-weight:700;white-space:nowrap">${eur(b)}</span></div>
<div style="font-size:21px;color:${C.muted};text-align:right;white-space:nowrap;padding-top:22px">${k(a)} – ${k(c)}</div></div>`).join('');
pages['05-precos-fornecedores']=shell('Quanto custam os fornecedores','Do mais em conta ao mais exclusivo',
 `<div style="display:flex;gap:28px;font-size:21px;color:${C.muted};margin-bottom:18px;align-items:center"><span style="display:inline-flex;align-items:center;gap:10px"><i style="width:18px;height:18px;border-radius:50%;background:${C.brand};display:inline-block"></i>valor de referência</span><span style="display:inline-flex;align-items:center;gap:10px"><i style="width:40px;height:10px;border-radius:5px;background:#D9B8A0;display:inline-block"></i>do mínimo ao máximo</span></div>`+db,
 'Intervalos de referência do simulador Quanto Custa Casar, antes do ajuste por região, época e estilo. Façam a vossa simulação.');
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});
const out=new URL('.',import.meta.url).pathname;
for(const [n,h] of Object.entries(pages)){await p.setContent(h,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:out+n+'.png'});}
await b.close();
