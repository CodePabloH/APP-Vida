/* =====================================================================
   CORPO: treino semanal, peso (ganhar ou perder) e hábitos saudáveis.
   Também traz o gráfico de linha usado em Peso e em Grana.
   ===================================================================== */

/* ----- gráfico de linha genérico (SVG, uma só escala, grade discreta) -----
   series: [{pts:[[x,y]], c:'cor', dash:'4 4', area:true}]  o: {xmin,xmax,ymin,ymax,xt:[[x,'rótulo']],yfmt,H,refs:[{y,c,t}]} */
function lineSvg(series,o){
  const W=320,H=o.H||140,L=o.L||34,Rr=10,T=10,B=20,pw=W-L-Rr,ph=H-T-B,X=x=>L+(o.xmax===o.xmin?0:(x-o.xmin)/(o.xmax-o.xmin))*pw,Y=y=>T+ph*(1-(y-o.ymin)/((o.ymax-o.ymin)||1)),yf=o.yfmt||(y=>Math.round(y));
  let s=`<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label||'Gráfico')}">`;
  [0,.5,1].forEach(f=>{const y=o.ymin+(o.ymax-o.ymin)*f;s+=`<line x1="${L}" x2="${W-Rr}" y1="${Y(y).toFixed(1)}" y2="${Y(y).toFixed(1)}" stroke="var(--grid)"/><text x="${L-5}" y="${(Y(y)+3).toFixed(1)}" text-anchor="end" class="ax">${yf(y)}</text>`});
  (o.xt||[]).forEach(t=>s+=`<text x="${X(t[0]).toFixed(1)}" y="${H-5}" text-anchor="middle" class="ax">${t[1]}</text>`);
  (o.refs||[]).forEach(r=>{const y=Y(r.y).toFixed(1);s+=`<line x1="${L}" x2="${W-Rr}" y1="${y}" y2="${y}" stroke="${r.c}" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W-Rr}" y="${(+y-4).toFixed(1)}" text-anchor="end" class="ax" fill="${r.c}">${r.t}</text>`});
  series.forEach(sr=>{if(!sr.pts.length)return;const p=sr.pts.map(a=>X(a[0]).toFixed(1)+' '+Y(a[1]).toFixed(1));
    if(sr.area)s+=`<path d="M${p[0]} L${p.join(' L')} L${X(sr.pts[sr.pts.length-1][0]).toFixed(1)} ${Y(o.ymin).toFixed(1)} L${X(sr.pts[0][0]).toFixed(1)} ${Y(o.ymin).toFixed(1)}Z" fill="${sr.c}" opacity=".13"/>`;
    if(sr.pts.length>1)s+=`<path d="M${p.join(' L')}" fill="none" stroke="${sr.c}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"${sr.dash?` stroke-dasharray="${sr.dash}"`:''}/>`;
    if(sr.dots!==false)sr.pts.forEach((a,i)=>{const last=i===sr.pts.length-1;if(sr.pts.length<=24||last)s+=`<circle cx="${X(a[0]).toFixed(1)}" cy="${Y(a[1]).toFixed(1)}" r="${last?4.5:3}" fill="${sr.c}" stroke="var(--card)" stroke-width="2"><title>${esc(a[2]||yf(a[1]))}</title></circle>`})});
  return s+'</svg>'}

/* ===== TREINO SEMANAL ===== */
const TIPOS=['Peito e tríceps','Costas e bíceps','Pernas','Ombros','Cardio','Corrida','Descanso'];
let tsel=new Date().getDay();
function weekDays(){const t=new Date();t.setHours(0,0,0,0);t.setDate(t.getDate()-t.getDay());return[...Array(7)].map((_,i)=>{const x=new Date(t);x.setDate(t.getDate()+i);return{i,k:dk(x),w:DOW[i]}})}
function setTP(i,t){S.tplan[i]=t;save();rr()}
function addTD(k){const m=Math.round(+v('tm'));if(!m)return;S.tr.push({id:uid(),d:k,k:v('tk').trim(),m,i:+v('ti')});save();rr()}
function setTG(n){S.prof.tgoal=Math.max(1,Math.min(7,(+S.prof.tgoal||4)+n));save();render()}
function vTreino(){
  const td=dk(),tg=+S.prof.tgoal||4,rows=weekDays().map(d=>({...d,e:S.tr.filter(x=>x.d===d.k),p:S.tplan[d.i]||''}));
  const mins=rows.map(r=>r.e.reduce((t,x)=>t+x.m,0)),done=rows.filter(r=>r.e.length).length,tot=mins.reduce((a,b)=>a+b,0),mx=Math.max(30,...mins),sel=rows[tsel],fut=sel.k>td,rec=S.tr.slice().reverse().slice(0,8);
  return `<div class="card hero-m"><div class="row">${ring(pct(done,tg),'💪')}<div class="g"><small>Meta da semana</small><div class="row" style="gap:4px"><button class="x" aria-label="Menos" onclick="setTG(-1)">−</button><span class="big2" style="font-size:26px">${done}/${tg}</span><button class="x" aria-label="Mais" onclick="setTG(1)">+</button></div><small>${hm(tot)} treinados · ${done>=tg?'meta batida! 🔥':'faltam '+(tg-done)}</small></div></div></div>
  <div class="wk">${rows.map(r=>`<button class="wd${r.i===tsel?' sel':''}${r.k===td?' td':''}${r.e.length?' ok':''}" onclick="tsel=${r.i};render()"><small>${r.w}</small><b>${r.e.length?'✓':r.p==='Descanso'?'z':'·'}</b><small>${esc((r.p||'—').split(' ')[0])}</small></button>`).join('')}</div>
  <div class="card"><h2>${sel.w}${sel.k===td?' · hoje':''}</h2><div class="stack"><div><small>Treino planejado</small><select onchange="setTP(${sel.i},this.value)"><option value="">Escolher…</option>${TIPOS.map(t=>`<option${t===sel.p?' selected':''}>${t}</option>`).join('')}</select></div>
  ${fut?'<small>Dia futuro: só dá para registrar quando chegar.</small>':`<input id="tk" placeholder="Tipo (musculação, corrida…)" list="tks" value="${esc(sel.p&&sel.p!=='Descanso'?sel.p:'')}"><div class="two"><input id="tm" type="number" inputmode="numeric" min="1" placeholder="Minutos"><select id="ti"><option value="1">Leve</option><option value="2">Médio</option><option value="3" selected>Pesado</option><option value="4">Insano</option></select></div><button class="btn" onclick="addTD('${sel.k}')">Registrar treino de ${sel.w}</button>`}</div>${sel.e.map(x=>`<div class="item"><div class="g"><b>${esc(x.k||'Treino')}</b><br><small>${['','Leve','Médio','Pesado','Insano'][x.i]}</small></div><b>${hm(x.m)}</b><button class="x" aria-label="Apagar" onclick="del('tr','${x.id}')">×</button></div>`).join('')}</div>
  <div class="card"><h2>Minutos na semana</h2><div class="bars">${rows.map((r,i)=>`<div class="bar${r.k===td?' t':''}"><small>${mins[i]?hm(mins[i]):''}</small><i style="height:${Math.max(3,mins[i]/mx*70)}px"></i>${r.w[0]}</div>`).join('')}</div></div>
  ${rec.length?`<div class="card"><h2>Histórico</h2>${rec.map(x=>`<div class="item"><div class="g"><b>${esc(x.k||'Treino')}</b><br><small>${fd(x.d)} · ${['','Leve','Médio','Pesado','Insano'][x.i]}</small></div><b>${hm(x.m)}</b></div>`).join('')}</div>`:''}`}

/* ===== PESO ===== */
function addW(){const kg=+String(v('wk')).replace(',','.');if(!(kg>20&&kg<400)){setMsg('w','Informe um peso válido em kg.');rr();return}
  const d=v('wd')||dk();S.wt=S.wt.filter(x=>x.d!==d);S.wt.push({id:uid(),d,kg});S.wt.sort((a,b)=>a.d<b.d?-1:1);S.prof.peso=String(S.wt[S.wt.length-1].kg);setMsg('w','Peso registrado. +10 XP',1);save();render()}
function saveWG(){const m=+String(v('wm')).replace(',','.'),i=+String(v('ws')).replace(',','.');S.prof.pmeta=m?String(m):'';if(i)S.prof.pini=String(i);save();render()}
function wInfo(){
  const w=S.wt,meta=+S.prof.pmeta||0,cur=w.length?w[w.length-1].kg:(+S.prof.peso||0),ini=w.length?(+S.prof.pini||w[0].kg):(+S.prof.pini||cur);
  if(!meta||!cur)return{meta,cur,ini,ok:false};
  const dir=meta>=ini?1:-1,tot=Math.abs(meta-ini)||1,done=Math.max(0,(cur-ini)*dir),p=Math.min(100,Math.round(done/tot*100)),rest=Math.max(0,(meta-cur)*dir);
  let rate=null,eta=null;if(w.length>=2){const a=w.filter(x=>left(x.d)>=-28),f=a[0],l=a[a.length-1],days=Math.max(1,(new Date(l.d)-new Date(f.d))/864e5);if(a.length>=2){rate=(l.kg-f.kg)/days*7;if(rate*dir>.01&&rest>0)eta=Math.ceil(rest/(Math.abs(rate)/7))}}
  return{meta,cur,ini,dir,p,rest,rate,eta,ok:true,hit:rest<=0}}
function vPeso(){
  const I=wInfo(),w=S.wt.slice(-30),rec=S.wt.slice().reverse().slice(0,6);
  let chart='';
  if(w.length>=2){const ys=w.map(x=>x.kg).concat(I.meta?[I.meta]:[]),mn=Math.floor(Math.min(...ys)-1),mx=Math.ceil(Math.max(...ys)+1),t0=new Date(w[0].d+'T00:00').getTime()/864e5,t1=new Date(w[w.length-1].d+'T00:00').getTime()/864e5;
    chart=`<div class="card"><h2>Evolução do peso</h2>${lineSvg([{pts:w.map(x=>[new Date(x.d+'T00:00').getTime()/864e5,x.kg,fd(x.d)+': '+x.kg+' kg']),c:'var(--acc)',area:true}],{xmin:t0,xmax:Math.max(t1,t0+1),ymin:mn,ymax:mx,yfmt:y=>Math.round(y),label:'Peso ao longo do tempo',refs:I.meta?[{y:I.meta,c:'var(--ok)',t:'meta '+fx(I.meta)+' kg'}]:[],xt:[[t0,fd(w[0].d).slice(0,5)],[t1,fd(w[w.length-1].d).slice(0,5)]]})}</div>`}
  const verb=I.ok?(I.dir>0?'ganhar':'perder'):'',tip=I.ok&&I.dir>0?'Para ganhar peso de forma saudável: superávit calórico leve, proteína em todas as refeições, treino de força e sono em dia. Meta realista: 0,25 a 0,5 kg por semana.':I.ok?'Para perder de forma saudável: déficit moderado, proteína alta, treino de força e sono em dia. Meta realista: 0,5 a 1 kg por semana.':'Defina seu peso meta para o app acompanhar o caminho.';
  return `<div class="card hero-m">${I.ok?`<div class="row"><div class="g"><small>Peso atual · meta: ${verb} até ${fx(I.meta)} kg</small><div class="big2">${fx(I.cur)}<small> kg</small></div><small>${I.hit?'✓ Meta atingida! Agora é manter.':'Faltam <b>'+fx(I.rest)+' kg</b>'+(I.eta?' · no ritmo atual: ~'+I.eta+' dias':'')}</small></div>${ring(I.p,'⚖️')}</div>${bar(I.p)}<small style="display:block;margin-top:6px">${I.p}% do caminho (de ${fx(I.ini)} para ${fx(I.meta)} kg)${I.rate!=null?' · ritmo '+(I.rate>0?'+':'')+fx(I.rate)+' kg/sem':''}</small>`:`<h2>Defina sua meta de peso</h2><small>${tip}</small>`}</div>
  <div class="card"><h2>Registrar peso</h2><div class="two"><input id="wk" type="number" step="0.1" inputmode="decimal" placeholder="Peso (kg)"><input id="wd" type="date" value="${dk()}" aria-label="Data"></div>${msg('w')}<button class="btn" style="width:100%;margin-top:8px" onclick="addW()">Registrar (+10 XP)</button></div>
  ${chart}
  <div class="card"><h2>Minha meta</h2><div class="two"><div><small>Peso inicial (kg)</small><input id="ws" type="number" step="0.1" inputmode="decimal" value="${S.prof.pini||(S.wt[0]?S.wt[0].kg:'')||S.prof.peso||''}"></div><div><small>Peso meta (kg)</small><input id="wm" type="number" step="0.1" inputmode="decimal" value="${S.prof.pmeta||''}"></div></div><button class="btn g" style="width:100%;margin-top:8px" onclick="saveWG()">Salvar meta</button><p class="mute" style="margin:10px 0 0;font-size:13px">${tip}</p></div>
  ${rec.length?`<div class="card"><h2>Registros</h2>${rec.map(x=>`<div class="item"><div class="g"><b>${fx(x.kg)} kg</b></div><small>${fd(x.d)}</small><button class="x" aria-label="Apagar" onclick="del('wt','${x.id}')">×</button></div>`).join('')}</div>`:''}`}

/* ===== HÁBITOS ===== */
let hmsg='';
const SUG=[['📖','Ler 10 páginas'],['🙏','Rezar'],['⏰','Acordar cedo'],['💧','Beber 3L de água'],['😴','Dormir 7h ou mais'],['📵','Sem celular antes de dormir'],['🧘','Meditar 10 min'],['🏃','Caminhar 30 min'],['🍽️','Comer proteína em toda refeição']];
function hchk(i,k){const a=S.hd[k]||(S.hd[k]=[]),x=a.indexOf(i);x<0?a.push(i):a.splice(x,1);save();render()}
function hdel(i){S.habits=S.habits.filter(h=>h.id!==i);save();render()}
function addH(n,ic){n=(n||v('hn')).trim();if(!n)return;if(S.habits.length>=5+rank(xp())){hmsg='Sem vagas. Suba de rank para liberar mais um hábito.';render();return}hmsg='';if(!S.habits.length)S.hsince=dk();S.habits.push({id:uid(),name:n,ic:ic||'✅'});save();render()}
function vHabitos(){
  const k=dk(),H=S.habits,slots=5+rank(xp()),days=[...Array(7)].map((_,i)=>{const x=addD(k,i-6);return{k:x,w:DOW[new Date(x+'T00:00').getDay()][0]}});
  const dn=(h,kk)=>(S.hd[kk]||[]).includes(h.id);
  const st=h=>{let n=0,x=k;if(!dn(h,x))x=addD(x,-1);while(dn(h,x)){n++;x=addD(x,-1)}return n};
  const p30=h=>{let n=0;for(let i=0;i<30;i++)if(dn(h,addD(k,-i)))n++;return Math.round(n/30*100)};
  const nd=H.filter(h=>dn(h,k)).length,pc=H.length?Math.round(nd/H.length*100):0;
  return `<div class="card hero-m"><div class="row">${ring(pc,'🌱')}<div class="g"><small>Hábitos de hoje</small><div class="big2">${nd}<small> de ${H.length}</small></div><small>Cada hábito vale 10 XP. Todos feitos = missão cumprida.</small></div></div></div>
  ${H.map(h=>`<div class="card"><div class="row"><span class="ic">${h.ic||'✅'}</span><div class="g"><b>${esc(h.name)}</b><br><small>🔥 ${st(h)} dias seguidos · ${p30(h)}% em 30 dias</small></div><button class="x" aria-label="Apagar" onclick="hdel('${h.id}')">×</button></div><div class="week">${days.map(x=>`<div><small>${x.w}</small><br><button class="dd ${dn(h,x.k)?'on':''}" aria-label="Marcar ${fd(x.k)}" onclick="hchk('${h.id}','${x.k}')">${dn(h,x.k)?'✓':''}</button></div>`).join('')}</div></div>`).join('')}
  <div class="card"><h2>Novo hábito · ${H.length} de ${slots} vagas</h2><div class="row"><input id="hn" placeholder="Ex.: ler livro, rezar"><button class="btn" onclick="addH()">Adicionar</button></div><div class="cats" style="margin-top:10px">${SUG.filter(s=>!H.some(h=>h.name===s[1])).map(s=>`<button class="chip" onclick="addH('${s[1]}','${s[0]}')">${s[0]} ${s[1]}</button>`).join('')}</div>${hmsg?`<small style="color:var(--warn);display:block;margin-top:8px">${hmsg}</small>`:''}<small style="display:block;margin-top:8px">Cada rank novo libera mais uma vaga.</small></div>`}

V.body=function(){
  const ds=stat(dk()),tr=ds.M.find(a=>a.id==='t');
  const seg=`<div class="seg">${[['t','Treino'],['w','Peso'],['h','Hábitos']].map(a=>`<button class="${bs===a[0]?'on':''}" onclick="bs='${a[0]}';render()">${a[1]}</button>`).join('')}</div>`;
  return seg+({t:vTreino,w:vPeso,h:vHabitos}[bs]||vTreino)()};
