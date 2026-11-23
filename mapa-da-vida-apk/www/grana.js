/* =====================================================================
   GRANA: três telas simples.
     Visão   = alarme (verde / amarelo / vermelho) + 3 gráficos claros
     Lançar  = valor, categoria, pronto (gaveta rápida no botão +)
     Listas  = lançamentos do mês, planejar (limites, plano, dívidas,
               metas, contas)
   Dados: S.fin, S.acc, S.bud, S.prof.budget, S.sal, S.debts, S.goals
   ===================================================================== */
const CATS={g:[['🍔','Alimentação'],['🚗','Transporte'],['🏠','Moradia'],['💊','Saúde'],['📚','Estudos'],['🎮','Lazer'],['🛒','Compras'],['🧾','Outros']],r:[['💰','Salário'],['💼','Extra'],['📈','Investimentos'],['🎁','Outros']]};
const ICON={};[...CATS.g,...CATS.r].forEach(c=>ICON[c[1]]=c[0]);
/* uma cor FIXA por categoria (a cor segue a categoria, não o ranking). Vermelho fica reservado para alerta. */
const CCOL={'Alimentação':'#3987e5','Transporte':'#d95926','Moradia':'#199e70','Saúde':'#d55181','Estudos':'#9085e9','Lazer':'#c98500','Compras':'#2dbbd6','Outros':'#8b93a1'};
const ccol=c=>CCOL[c]||'#8b93a1';
let fm=dk().slice(0,7),ft='g',fcat='Alimentação',fcf='',pl='t',fmore=false;
const isCur=m=>m===dk().slice(0,7);
const accN=id=>(S.acc.find(a=>a.id===id)||{}).name||'';
const dim=m=>new Date(+m.slice(0,4),+m.slice(5,7),0).getDate();

/* ----- números do mês (calculado uma vez por chamada) ----- */
function md(m){
  const all=S.fin.filter(x=>x.d.startsWith(m)),e=all.filter(x=>!x.x),ex=e.filter(x=>x.t==='g'),rp=e.filter(isP),pe=e.filter(x=>!isP(x));
  const r=sum(rp,'r'),g=sum(rp,'g'),pr=sum(pe,'r'),pg=sum(pe,'g'),G=g+pg,by={},perDay=Array(dim(m)).fill(0);
  ex.forEach(x=>{const c=x.c||'Outros';by[c]=(by[c]||0)+x.v;perDay[+x.d.slice(8)-1]+=x.v});
  const lim=+S.prof.budget||0,late=pe.filter(x=>x.d<dk()),dN=isCur(m)?now5().getDate():(m<dk().slice(0,7)?dim(m):0);
  return{all,e,r,g,pr,pg,G,by,perDay,lim,late,lateV:late.reduce((t,x)=>t+(x.t==='g'?x.v:0),0),dN,N:dim(m),saldo:r-g,prev:r+pr-g-pg,tg:sum(e,'g')}}

/* ----- ALARME: o coração da tela ----- */
function moneyStatus(m){
  const d=md(m),it=[],R_=(t)=>it.push({lv:'red',t}),Y=(t)=>it.push({lv:'yel',t});
  if(!S.fin.length&&!d.lim)return{lv:'none',items:[],d};
  if(d.lim&&d.G>d.lim)R_('Você estourou o limite do mês em '+R(d.G-d.lim));
  if(d.saldo<0)R_('Saldo negativo: você gastou '+R(-d.saldo)+' a mais do que recebeu');
  if(d.late.length)R_(d.late.length+' conta'+(d.late.length>1?'s':'')+' atrasada'+(d.late.length>1?'s':'')+(d.lateV?' ('+R(d.lateV)+')':''));
  Object.keys(d.by).forEach(c=>{const t=+S.bud[c]||0;if(t&&d.by[c]>t)R_('Teto de '+c+' estourado em '+R(d.by[c]-t))});
  if(d.lim&&d.G<=d.lim){
    if(d.G>=d.lim*.8)Y('Já usou '+Math.round(d.G/d.lim*100)+'% do limite'+(isCur(m)?' e ainda faltam '+(d.N-d.dN)+' dias':''));
    else if(isCur(m)&&d.dN>=5){const proj=d.g/d.dN*d.N+d.pg;if(proj>d.lim)Y('No ritmo atual você fecha o mês em '+R0(proj)+' (limite '+R0(d.lim)+')')}}
  Object.keys(d.by).forEach(c=>{const t=+S.bud[c]||0;if(t&&d.by[c]<=t&&d.by[c]>=t*.8)Y(c+' já está em '+Math.round(d.by[c]/t*100)+'% do teto')});
  if(isCur(m)){const soon=d.e.filter(x=>!isP(x)&&x.d>=dk()&&left(x.d)<=3&&x.t==='g');if(soon.length)Y(soon.length+' conta'+(soon.length>1?'s vencem':' vence')+' em até 3 dias')}
  const lv=it.some(a=>a.lv==='red')?'red':it.length?'yel':'ok';
  it.sort((a,b)=>(a.lv==='red'?0:1)-(b.lv==='red'?0:1));
  return{lv,items:it,d}}

function banner(m){
  const s=moneyStatus(m),d=s.d;
  if(s.lv==='none')return `<div class="alarm none"><div class="al-h"><span class="al-i">💡</span><div><b>Comece por aqui</b><small>Toque no + e lance seu primeiro gasto. Depois defina um limite do mês em Planejar.</small></div></div></div>`;
  const H={red:['🚨','NO VERMELHO'],yel:['⚠️','ATENÇÃO'],ok:['✅','NO AZUL']}[s.lv];
  const room=d.lim?d.lim-d.G:0,perDay=isCur(m)&&d.lim&&room>0?room/Math.max(1,d.N-d.dN+1):0;
  const sub=s.lv==='ok'?(d.lim?(isCur(m)?'Você pode gastar <b>'+R(perDay)+' por dia</b> até o fim do mês.':'Mês fechado dentro do limite.'):'Defina um limite do mês para eu te avisar antes de estourar.'):'';
  return `<div class="alarm ${s.lv}" role="alert"><div class="al-h"><span class="al-i">${H[0]}</span><div><b>${H[1]}</b>${sub?`<small>${sub}</small>`:''}</div></div>${s.items.length?`<ul>${s.items.slice(0,4).map(a=>`<li class="${a.lv}">${a.lv==='red'?'●':'▲'} ${a.t}</li>`).join('')}</ul>`:''}</div>`}

/* ----- GRÁFICO 1: orçamento com marcador de ritmo ----- */
function budgetChart(d,m){
  if(!d.lim)return `<div class="card"><h2>Orçamento do mês</h2><div class="empty" style="padding:6px 0">Sem limite definido.<br><button class="btn" style="margin-top:10px" onclick="ms='p';pl='l';render()">Definir limite</button></div></div>`;
  const p=d.G/d.lim*100,over=d.G>d.lim,col=over?'var(--bad)':p>=80?'var(--warn)':'var(--acc)',pace=isCur(m)?d.dN/d.N*100:null;
  return `<div class="card"><div class="row"><h2 style="margin:0">Orçamento do mês</h2><b style="margin-left:auto;color:${col}">${over?'🔴 ':p>=80?'🟡 ':'🟢 '}${Math.round(p)}%</b></div>
  <div class="bchart" role="img" aria-label="Gasto ${R(d.G)} de ${R(d.lim)}"><div class="bc-t"><i style="width:${Math.min(100,p)}%;background:${col}"></i>${pace!=null?`<u style="left:${pace}%" title="Onde você deveria estar hoje"></u>`:''}</div>${pace!=null?`<span class="bc-p" style="left:${Math.min(92,pace)}%">hoje</span>`:''}</div>
  <div class="row" style="margin-top:22px"><div><small>Gasto (pago + a pagar)</small><div class="num ${over?'out':''}">${R(d.G)}</div></div><div style="margin-left:auto;text-align:right"><small>${over?'Passou do limite':'Ainda pode gastar'}</small><div class="num ${over?'out':'in'}">${over?'+':''}${R(Math.abs(d.lim-d.G))}</div></div></div>
  <small class="mute">Limite ${R(d.lim)}${pace!=null?' · a marca "hoje" mostra o ritmo ideal: gastar acima dela te leva ao vermelho':''}</small></div>`}

/* ----- GRÁFICO 2: categorias (barras horizontais + teto) ----- */
function catChart(d){
  const ks=Object.keys(d.by).sort((a,b)=>d.by[b]-d.by[a]);if(!ks.length)return '';
  const mx=Math.max(...ks.map(k=>Math.max(d.by[k],+S.bud[k]||0)));
  return `<div class="card"><div class="row"><h2 style="margin:0">Para onde foi o dinheiro</h2><b style="margin-left:auto">${R(d.tg)}</b></div><div class="cbars">${ks.map(k=>{const v_=d.by[k],t=+S.bud[k]||0,over=t&&v_>t,warn=t&&!over&&v_>=t*.8,w=v_/mx*100;
    return `<button class="cb${fcf===k?' sel':''}" onclick="fcf='${k}';ms='l';render()" aria-label="${k}: ${R(v_)}"><span class="cb-n">${ICON[k]||'🧾'} ${esc(k)}</span><span class="cb-v ${over?'out':''}">${R0(v_)}<small> ${Math.round(v_/d.tg*100)}%</small></span><span class="cb-t"><i style="width:${w}%;background:${over?'var(--bad)':ccol(k)}"></i>${t?`<u style="left:${t/mx*100}%" title="Teto ${R0(t)}"></u>`:''}</span>${over?`<span class="cb-a">🔴 ${R0(v_-t)} acima do teto de ${R0(t)}</span>`:warn?`<span class="cb-a y">🟡 ${Math.round(v_/t*100)}% do teto de ${R0(t)}</span>`:''}</button>`}).join('')}</div><small class="mute">Toque numa categoria para ver os lançamentos. A marca vertical é o teto.</small></div>`}

/* ----- GRÁFICO 3: acumulado do mês x limite ----- */
function paceChart(d,m){
  if(!d.e.some(x=>x.t==='g'))return '';
  let a=0;const pts=[],n=isCur(m)?d.dN:d.N;for(let i=0;i<n;i++){a+=d.perDay[i];pts.push([i+1,a,'Dia '+(i+1)+': '+R(a)])}
  const ser=[{pts,c:d.lim&&a>d.lim?'var(--bad)':'var(--acc)',area:true}];
  if(isCur(m)&&d.dN>=3&&d.dN<d.N){const pj=d.g/d.dN*d.N+d.pg;ser.push({pts:[[d.dN,a],[d.N,Math.max(a,pj)]],c:'var(--mute)',dash:'4 4',dots:false})}
  const top=Math.max(a,d.lim||0,isCur(m)&&d.dN>=3?d.g/d.dN*d.N+d.pg:0)*1.08||10;
  return `<div class="card"><h2>Gasto acumulado no mês</h2>${lineSvg(ser,{xmin:1,xmax:d.N,ymin:0,ymax:top,yfmt:y=>y>=1000?(y/1000).toFixed(y%1000?1:0).replace('.',',')+'k':Math.round(y),label:'Gasto acumulado por dia',refs:d.lim?[{y:d.lim,c:'var(--bad)',t:'limite'}]:[],xt:[[1,'1'],[Math.round(d.N/2),String(Math.round(d.N/2))],[d.N,String(d.N)]]})}<small class="mute">${isCur(m)&&d.dN>=3&&d.dN<d.N?'Linha tracejada = projeção no ritmo atual.':'Linha vermelha = seu limite.'}</small></div>`}

/* ----- GRÁFICO 4: últimos 6 meses ----- */
function trendChart(){
  const ms_=[];for(let i=5;i>=0;i--){const t=now5();t.setDate(1);t.setMonth(t.getMonth()-i);ms_.push(dk(t).slice(0,7))}
  const D=ms_.map(m=>{const e=S.fin.filter(x=>x.d.startsWith(m)&&!x.x&&isP(x));return{m,r:sum(e,'r'),g:sum(e,'g')}});
  if(!D.some(x=>x.r||x.g))return '';
  const mx=Math.max(...D.map(x=>Math.max(x.r,x.g)),1);
  return `<div class="card"><h2>Entrou x saiu · 6 meses</h2><div class="tbars">${D.map(x=>`<div class="tb${x.m===fm?' on':''}" onclick="fm='${x.m}';render()"><div class="tb-c"><i class="r" style="height:${Math.max(2,x.r/mx*100)}%" title="Entrou ${R(x.r)}"></i><i class="g${x.g>x.r?' bad':''}" style="height:${Math.max(2,x.g/mx*100)}%" title="Saiu ${R(x.g)}"></i></div><small>${MON[+x.m.slice(5)-1]}</small></div>`).join('')}</div><div class="leg"><span><i class="lg in"></i>Entrou</span><span><i class="lg out"></i>Saiu</span><span class="mute">barra vermelha = gastou mais do que entrou</span></div></div>`}

/* ----- TELAS ----- */
function monthBar(){let t=new Date(fm+'-01T00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(' de ',' ');t=t[0].toUpperCase()+t.slice(1);
  return `<div class="mbar"><button class="x" aria-label="Mês anterior" onclick="fmv(-1)">‹</button><b>${t}</b><button class="x" aria-label="Próximo mês" onclick="fmv(1)">›</button></div>`}
function fmv(n){const t=new Date(fm+'-01T00:00');t.setMonth(t.getMonth()+n);fm=dk(t).slice(0,7);render()}
M.v=function(){
  const d=md(fm);
  const bal=`<div class="card bal"><div class="two"><div><small>Saldo do mês</small><div class="bn ${d.saldo>=0?'in':'out'}">${d.saldo<0?'−':''}${R(Math.abs(d.saldo))}</div></div><div><small>Previsto no fim</small><div class="bn2 ${d.prev>=0?'':'out'}">${d.prev<0?'−':''}${R(Math.abs(d.prev))}</div></div></div>
  <div class="three" style="margin-top:12px"><div class="pl"><small>Entrou</small><b class="in">${R0(d.r)}</b></div><div class="pl"><small>Saiu</small><b class="out">${R0(d.g)}</b></div><div class="pl"><small>A pagar</small><b>${R0(d.pg)}</b></div></div></div>`;
  return banner(fm)+bal+budgetChart(d,fm)+catChart(d)+paceChart(d,fm)+trendChart()};
M.l=function(){
  const d=md(fm),grp={};d.all.filter(x=>!fcf||x.c===fcf||(!x.c&&fcf==='Outros')).sort((a,b)=>a.d<b.d?1:-1).forEach(x=>(grp[x.d]=grp[x.d]||[]).push(x));
  const ks=Object.keys(d.by).sort((a,b)=>d.by[b]-d.by[a]);
  return `<div class="cats fchips"><button class="chip${!fcf?' sel':''}" onclick="fcf='';render()">Tudo</button>${ks.map(k=>`<button class="chip${fcf===k?' sel':''}" onclick="fcf='${k}';render()">${ICON[k]||'🧾'} ${esc(k)}</button>`).join('')}</div>
  ${Object.keys(grp).length?Object.keys(grp).map(k=>{const day=grp[k],tg=sum(day.filter(x=>!x.x),'g');return `<div class="card"><div class="row"><h2 style="margin:0">${fd(k)}${k===dk()?' · hoje':''}</h2><small style="margin-left:auto">${tg?'−'+R(tg):''}</small></div>${day.map(x=>`<div class="item"><button class="pay ${isP(x)?'on':''}" aria-label="${isP(x)?'Marcar como pendente':'Marcar como pago'}" onclick="tgp('${x.id}')">${isP(x)?'✓':''}</button><span class="ic">${x.x?'💳':ICON[x.c]||'🧾'}</span><div class="g"><b>${esc(x.c||'Outros')}</b><br><small>${esc(accN(x.a))}${x.n?' · '+esc(x.n):''}${!isP(x)?(x.d<dk()?' · <span class="out">🔴 atrasado</span>':' · pendente'):''}</small></div><b class="${x.t==='r'?'in':'out'}">${x.t==='r'?'+':'−'}${R(x.v)}</b><button class="x" aria-label="Apagar" onclick="delF('${x.id}')">×</button></div>`).join('')}</div>`}).join(''):empty('Nenhum lançamento aqui.')}`};

/* ----- PLANEJAR ----- */
const PLS=[['t','Tetos'],['l','Limite'],['s','Salário'],['d','Dívidas'],['m','Metas'],['c','Contas']];
function setLim(){S.prof.budget=+v('bl')||0;save();render()}
M.p=function(){
  const seg=`<div class="seg sc">${PLS.map(a=>`<button class="${pl===a[0]?'on':''}" onclick="pl='${a[0]}';render()">${a[1]}</button>`).join('')}</div>`;
  return seg+(P[pl]||P.t)()};
const P={};
P.l=function(){const d=md(fm);return `<div class="card"><h2>Limite de gastos do mês</h2><p class="mute" style="margin:0 0 10px">É o teto de tudo que você pode gastar no mês. Quando você chega perto, o app acende o alarme amarelo; passou, vermelho.</p><div class="row"><input id="bl" type="number" inputmode="decimal" placeholder="R$" value="${S.prof.budget||''}"><button class="btn" onclick="setLim()">Salvar</button></div>${S.sal.inc?`<button class="chip" style="margin-top:10px" onclick="S.prof.budget=${Math.round(S.sal.inc*.8)};save();render()">Sugestão: 80% do salário (${R0(S.sal.inc*.8)})</button>`:''}</div>`};
P.t=function(){
  const d=md(fm);
  return `<div class="card"><h2>Teto por categoria</h2><small>Acima de 80% fica amarelo, acima de 100% fica vermelho e acende o alarme.</small>${CATS.g.map(c=>{const s=d.by[c[1]]||0,l=+S.bud[c[1]]||0,p=l?s/l*100:0;return `<div style="margin-top:14px"><div class="row"><span class="ic">${c[0]}</span><div class="g"><b>${c[1]}</b><br><small>${R(s)}${l?' de '+R(l):''}${p>=100?' · <span class="out">🔴 estourou</span>':p>=80?' · <span style="color:var(--warn)">🟡 atenção</span>':''}</small></div><input type="number" inputmode="decimal" placeholder="Teto" value="${l||''}" style="width:96px" onchange="S.bud['${c[1]}']=+this.value||0;save();render()"></div>${l?bar(p,p>=100?'var(--bad)':p>=80?'var(--warn)':ccol(c[1])):''}</div>`}).join('')}</div>`};
function payoff(extra){let d=S.debts.map(x=>({s:+x.t||0,p:+x.p||0,j:(+x.j||0)/100})).filter(x=>x.s>0),m=0,ju=0;
  while(d.length&&m<600){m++;let ex=extra;d.sort((a,b)=>b.j-a.j);d.forEach(x=>{const j=x.s*x.j;ju+=j;x.s+=j;const pg=Math.min(x.s,x.p);x.s-=pg});d.forEach(x=>{if(x.s>0&&ex>0){const pg=Math.min(x.s,ex);x.s-=pg;ex-=pg}});d=d.filter(x=>x.s>.5)}
  return{m,ju:Math.round(ju),ok:m<600}}
function saveSal(){const s=S.sal;s.inc=+v('si')||0;s.fix=+v('sf')||0;s.day=+v('sd')||5;s.pd=+v('spd')||0;s.pf=+v('spf')||0;s.pl=Math.max(0,100-s.pd-s.pf);save();rr()}
P.s=function(){
  const s=S.sal,pg=S.debts.reduce((t,d)=>t+(+d.p||0),0),liv=Math.max(0,s.inc-s.fix-pg),dv=S.debts.length?Math.round(liv*s.pd/100):0;
  const fu=Math.round(liv*(S.debts.length?s.pf:s.pf+s.pd)/100),li=Math.max(0,liv-dv-fu);
  const parts=[['Contas fixas',s.fix,'#3987e5'],['Parcelas de dívidas',pg,'#d95926'],['Dívida extra',dv,'#c98500'],['Futuro (reserva e metas)',fu,'#199e70'],['Livre / lazer',li,'#9085e9']].filter(a=>a[1]>0);
  const cur=payoff(dv),sem=payoff(0);
  return `<div class="card"><h2>Meu salário</h2><div class="stack"><div class="two"><div><small>Salário líquido (R$)</small><input id="si" type="number" inputmode="decimal" value="${s.inc||''}" placeholder="0,00"></div><div><small>Dia que cai</small><input id="sd" type="number" min="1" max="31" value="${s.day}"></div></div><div class="two"><div><small>Contas fixas por mês (R$)</small><input id="sf" type="number" inputmode="decimal" value="${s.fix||''}" placeholder="aluguel, luz, mercado"></div><div><small>% da sobra para dívida</small><input id="spd" type="number" min="0" max="100" value="${s.pd}"></div></div><div class="two"><div><small>% da sobra para o futuro</small><input id="spf" type="number" min="0" max="100" value="${s.pf}"></div><div><small>% livre (automático)</small><input disabled value="${Math.max(0,100-s.pd-s.pf)}"></div></div><button class="btn" onclick="saveSal()">Calcular plano</button></div></div>
  ${s.inc?`<div class="card"><h2>Para onde vai cada real</h2><div class="split big8">${parts.map(a=>`<i style="width:${a[1]/s.inc*100}%;background:${a[2]}"></i>`).join('')}</div>${parts.map(a=>`<div class="item"><i class="dot" style="background:${a[2]}"></i><b>${a[0]}</b><span style="margin-left:auto"><b>${R(a[1])}</b> <small>${Math.round(a[1]/s.inc*100)}%</small></span></div>`).join('')}${s.inc-s.fix-pg<0?'<small class="out">🔴 Fixos + parcelas passam do salário. Renegocie ou corte antes de tudo.</small>':''}</div>
  <div class="card"><h2>Foco no futuro</h2><div class="three"><div class="stat"><b>${R0(fu)}</b><span>guardado por mês</span></div><div class="stat"><b>${R0(fu*12)}</b><span>em 12 meses</span></div><div class="stat"><b>${S.debts.length?(cur.ok?cur.m+' meses':'sem fim'):'sem dívidas'}</b><span>para quitar tudo</span></div></div>${S.debts.length&&cur.ok&&sem.ok&&sem.m>cur.m?`<small style="display:block;margin-top:10px">Com a dívida extra você quita ${sem.m-cur.m} meses antes e economiza cerca de ${R(sem.ju-cur.ju)} em juros.</small>`:''}</div>`:empty('Informe o salário para ver o plano.')}`};
function addDebt(){const n=v('dn').trim(),t=+v('dt');if(!n||!t)return;S.debts.push({id:uid(),n,t,p:+v('dp')||0,j:+v('dj')||0});save();rr()}
function payD(i){const x=+v('dv'+i),d=S.debts.find(a=>a.id===i);if(!x||!d)return;d.t=Math.max(0,d.t-x);save();rr()}
P.d=function(){
  const tot=S.debts.reduce((t,d)=>t+(+d.t||0),0),ord=S.debts.slice().sort((a,b)=>(+b.j||0)-(+a.j||0));
  return `<div class="card bal"><small>Total devido</small><div class="bn ${tot?'out':'in'}">${R(tot)}</div><small>Ordem de ataque: maior juros primeiro (economiza mais)</small></div>
  ${ord.map((d,i)=>`<div class="card"><div class="row"><b style="flex:1">${i===0?'🎯 ':''}${esc(d.n)}</b><button class="x" aria-label="Apagar" onclick="del('debts','${d.id}')">×</button></div><div class="num">${R(d.t)}</div><small>parcela ${R(d.p)} · juros ${d.j}% ao mês</small><div class="row" style="margin-top:10px"><input id="dv${d.id}" type="number" inputmode="decimal" placeholder="Abater (R$)"><button class="btn" onclick="payD('${d.id}')">Abater</button></div></div>`).join('')||empty('Nenhuma dívida. Ótimo.')}
  <div class="card"><h2>Nova dívida</h2><div class="stack"><input id="dn" placeholder="Cartão, financiamento, empréstimo"><div class="two"><input id="dt" type="number" inputmode="decimal" placeholder="Saldo devedor (R$)"><input id="dp" type="number" inputmode="decimal" placeholder="Parcela por mês (R$)"></div><input id="dj" type="number" step="0.1" inputmode="decimal" placeholder="Juros ao mês (%)"><button class="btn" onclick="addDebt()">Adicionar</button></div></div>`};
function addG(){const n=v('gn').trim(),t=+v('gt');if(!n||!t)return;S.goals.push({id:uid(),n,t,s:0});save();rr()}
function depG(i){const x=+v('gd'+i);if(!x)return;S.goals.find(g=>g.id===i).s+=x;save();render()}
P.m=function(){
  return `<div class="card"><h2>Nova meta de dinheiro</h2><div class="stack"><input id="gn" placeholder="Ex.: reserva de emergência, viagem"><div class="row"><input id="gt" type="number" inputmode="decimal" placeholder="Valor alvo (R$)"><button class="btn" onclick="addG()">Criar</button></div></div></div>`+(S.goals.length?S.goals.map(g=>{const p=Math.min(100,Math.round(g.s/g.t*100));return `<div class="card"><div class="row"><b style="flex:1">${esc(g.n)}</b><button class="x" aria-label="Apagar" onclick="del('goals','${g.id}')">×</button></div><div class="num">${R(g.s)} <small>de ${R(g.t)}</small></div>${bar(p,p>=100?'var(--ok)':'var(--acc)')}<div class="row" style="margin-top:10px"><input id="gd${g.id}" type="number" inputmode="decimal" placeholder="Guardar (R$)"><button class="btn" onclick="depG('${g.id}')">Guardar</button></div><small>${p>=100?'🏆 Meta batida!':p+'% · faltam '+R(g.t-g.s)}</small></div>`}).join(''):empty('Nenhuma meta ainda.'))};
function addAcc(){const n=v('an2').trim();if(!n)return;const c=v('at2')==='cartao',x=+v('av2')||0;S.acc.push({id:uid(),name:n,ic:c?'💳':'🏦',type:c?'cartao':'conta',ini:c?0:x,lim:c?x:0,due:+v('ad2')||0});save();render()}
function delAcc(i){const a=S.acc.find(x=>x.id===i);if(a.type!=='cartao'&&S.acc.filter(x=>x.type!=='cartao').length<2)return;S.acc=S.acc.filter(x=>x.id!==i);save();render()}
function payFat(i){const a=S.acc.find(x=>x.id===i),f=sum(S.fin.filter(x=>x.a===i&&x.d.startsWith(fm)),'g'),c=S.acc.find(x=>x.type!=='cartao');if(!f||!c)return;S.fin.push({id:uid(),d:dk(),t:'g',v:f,c:'Fatura '+a.name,a:c.id,x:1,p:true,n:''});(a.pg=a.pg||{})[fm]=true;save();render()}
P.c=function(){
  const ct=S.acc.filter(a=>a.type!=='cartao'),cc=S.acc.filter(a=>a.type==='cartao'),bal=a=>(+a.ini||0)+sum(S.fin.filter(x=>x.a===a.id&&isP(x)),'r')-sum(S.fin.filter(x=>x.a===a.id&&isP(x)),'g'),tot=ct.reduce((t,a)=>t+bal(a),0),fat=a=>sum(S.fin.filter(x=>x.a===a.id&&x.d.startsWith(fm)),'g');
  return `<div class="card bal"><small>Saldo total nas contas</small><div class="bn ${tot>=0?'in':'out'}">${R(tot)}</div></div>
  <div class="card"><h2>Contas</h2>${ct.map(a=>`<div class="item"><span class="ic">${a.ic}</span><div class="g"><b>${esc(a.name)}</b></div><b class="${bal(a)<0?'out':''}">${R(bal(a))}</b><button class="x" aria-label="Apagar" onclick="delAcc('${a.id}')">×</button></div>`).join('')}</div>
  <div class="card"><h2>Cartões · fatura do mês</h2>${cc.length?cc.map(a=>{const f=fat(a),pg=(a.pg||{})[fm],p=a.lim?f/a.lim*100:0;return `<div class="item"><span class="ic">💳</span><div class="g"><b>${esc(a.name)}</b><br><small>vence dia ${a.due||'–'}${a.lim?' · limite '+R0(a.lim)+(p>=80?' · <span class="out">🔴 '+Math.round(p)+'% usado</span>':''):''}</small></div><div style="text-align:right"><b>${R(f)}</b><br>${pg?'<small class="in">paga</small>':f?`<button class="chip" onclick="payFat('${a.id}')">Pagar</button>`:''}</div><button class="x" aria-label="Apagar" onclick="delAcc('${a.id}')">×</button></div>`}).join(''):empty('Nenhum cartão.')}</div>
  <div class="card"><h2>Nova conta ou cartão</h2><div class="stack"><input id="an2" placeholder="Nome (Nubank, Itaú...)"><div class="two"><select id="at2"><option value="conta">Conta</option><option value="cartao">Cartão de crédito</option></select><input id="av2" type="number" inputmode="decimal" placeholder="Saldo ou limite (R$)"></div><input id="ad2" type="number" min="1" max="31" placeholder="Dia de vencimento (só cartão)"><button class="btn" onclick="addAcc()">Adicionar</button></div></div>`};

/* ----- LANÇAR (gaveta rápida) ----- */
function openLanc(){
  ft='g';fcat='Alimentação';fmore=false;
  sheet(`<h2 style="margin:0 0 10px">Novo lançamento</h2>
  <div class="seg"><button id="lt_g" class="on" onclick="setFt('g')">Gastei</button><button id="lt_r" onclick="setFt('r')">Entrou</button></div>
  <input id="fv" class="qv" type="number" inputmode="decimal" placeholder="R$ 0,00" autofocus>
  <div class="cats" id="lcats" style="margin:12px 0"></div>
  <input id="fn" placeholder="Descrição (opcional)">
  <div id="lmore"></div>
  <button class="chip" id="lmb" style="margin:10px 0" onclick="moreLanc()">Mais opções: data, conta, parcelas ›</button>
  <button class="btn" style="width:100%" onclick="addF()">Lançar</button><div id="lmsg"></div>`);
  setFt('g');setTimeout(()=>{const e=$('#fv');e&&e.focus()},60)}
function setFt(t){ft=t;fcat=CATS[t][0][1];$('#lt_g').classList.toggle('on',t==='g');$('#lt_r').classList.toggle('on',t==='r');drawCats()}
function drawCats(){$('#lcats').innerHTML=CATS[ft].map(c=>`<button class="chip ${fcat===c[1]?'sel':''}" onclick="pickCat('${c[1]}')">${c[0]} ${c[1]}</button>`).join('')}
function pickCat(c){fcat=c;drawCats()}
function moreLanc(){fmore=true;$('#lmb').remove();$('#lmore').innerHTML=`<div class="stack" style="margin-top:10px"><div class="two"><input id="fd" type="date" value="${dk()}" aria-label="Data"><select id="fa">${S.acc.map(a=>`<option value="${a.id}">${a.ic} ${esc(a.name)}</option>`).join('')}</select></div><select id="fr"><option value="1">Única</option><option value="p2">Parcelado 2x</option><option value="p3">Parcelado 3x</option><option value="p6">Parcelado 6x</option><option value="p10">Parcelado 10x</option><option value="p12">Parcelado 12x</option><option value="m12">Fixa mensal (12 meses)</option></select><small>Data futura vira conta a pagar ou a receber.</small></div>`}
function addF(){
  const x=+String(v('fv')).replace(',','.');if(!(x>0)){$('#lmsg').innerHTML='<small style="color:var(--warn)">Informe o valor.</small>';return}
  const rp=fmore?(v('fr')||'1'):'1',d0=fmore?(v('fd')||dk()):dk(),acc=fmore?v('fa'):(S.acc.find(a=>a.type!=='cartao')||S.acc[0]).id;let n=1,vl=x;
  if(rp[0]==='p'){n=+rp.slice(1);vl=x/n}else if(rp[0]==='m')n=12;
  for(let i=0;i<n;i++){const t=new Date(d0+'T00:00');t.setMonth(t.getMonth()+i);const k=dk(t);S.fin.push({id:uid(),d:k,t:ft,v:Math.round(vl*100)/100,c:fcat,n:v('fn').trim()+(n>1?' ('+(i+1)+'/'+n+')':''),a:acc,p:k<=dk()})}
  fm=d0.slice(0,7);closeSheet();save();render();
  const s=moneyStatus(fm);if(ft==='g'&&s.lv==='red')setTimeout(()=>toast('🚨 Você está no vermelho','bad'),300)}
function tgp(i){const f=S.fin.find(x=>x.id===i);f.p=f.p===false;save();render()}
function delF(i){if(!confirm('Apagar este lançamento?'))return;del('fin',i)}

V.money=function(){
  const seg=`<div class="seg">${[['v','Visão'],['l','Lançamentos'],['p','Planejar']].map(a=>`<button class="${ms===a[0]?'on':''}" onclick="ms='${a[0]}';${a[0]==='l'?"fcf='';":''}render()">${a[1]}${a[0]==='v'&&moneyStatus(dk().slice(0,7)).lv==='red'?' <i class="rdot"></i>':''}</button>`).join('')}</div>`;
  if(!['v','l','p'].includes(ms))ms='v';
  return seg+(ms==='p'?'':monthBar())+M[ms]()+`<button class="fab" onclick="openLanc()" aria-label="Novo lançamento">＋</button>`};
