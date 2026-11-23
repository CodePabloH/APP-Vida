/* =====================================================================
   ESTUDO: cronômetro, foco, questões, cartões (Anki), revisões, matérias,
   provas e LEITURA. Página inicial = hub com um botão grande de começar.
   ===================================================================== */
/* ===== CONSTANTES E ESTADO DA TELA ===== */
const MC=['#2ECC71','#3B82F6','#F59E0B','#A855F7','#EC4899','#22D3EE','#EF4444','#EAB308','#14B8A6','#F97316','#8B5CF6','#94A3B8'];
const RI=[1,7,30];                       // revisões espaçadas (dias depois do estudo)
const SUGG=['Língua Portuguesa','Matemática','Raciocínio Lógico','Direito Constitucional','Direito Administrativo','Noções de Informática','Redação','Atualidades'];
let tm='m',        // gráfico por: m = matérias, c = conteúdos
    selk=-1,       // fatia selecionada no gráfico de pizza
    qi=-1,         // barra selecionada no gráfico de questões
    qf='',         // filtro de matéria no gráfico de questões
    mo='',         // matéria aberta na aba Matérias
    ncol='',       // cor escolhida para nova matéria
    qa='',         // formulário rápido aberto (nova matéria / novo conteúdo)
    MSG={},        // mensagens de aviso por formulário
    pf={k:'m',o:0,a:dk(),b:dk()};   // filtro de período (d,w,m,y,t,x) + deslocamento

/* ===== ACESSO A MATÉRIAS E CONTEÚDOS ===== */
const mat=id=>S.mats.find(m=>m.id===id);
const tpc=(mid,tid)=>((mat(mid)||{}).topics||[]).find(t=>t.id===tid);
const mname=r=>(mat(r.mid)||{}).name||r.s||'Sem matéria';
const tname=r=>(tpc(r.mid,r.tid)||{}).name||'';
const mkey=r=>r.mid||'n:'+(r.s||'');
const mcolor=r=>(mat(r.mid)||{}).color||'#6B7280';
const secOf=s=>s.sec!=null?s.sec:s.m*60;
const dur=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}h ${m}m ${x}s`:m?`${m}m ${x}s`:`${x}s`};
const pcs=f=>(f*100).toFixed(1).replace('.',',')+'%';
function ensureMat(name){name=name.trim();let m=S.mats.find(x=>x.name.toLowerCase()===name.toLowerCase());if(!m){m={id:uid(),name,color:MC[S.mats.length%MC.length],topics:[]};S.mats.push(m)}return m.id}
function shade(hex,i){ // variações da cor da matéria para os conteúdos
  if(i<0)return hex;let n=parseInt(hex.slice(1),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;
  if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}
  l=Math.max(.22,Math.min(.78,l+[0,.14,-.14,.26,-.2,.07,-.07][i%7]));
  return `hsl(${Math.round(h)} ${Math.round(s*100)}% ${Math.round(l*100)}%)`}

/* ===== MIGRAÇÃO: nomes antigos viram matérias cadastradas ===== */
(function(){
  if(!S.mig2){
    [...S.sess,...S.qs].forEach(x=>{if(!x.mid&&x.s)x.mid=ensureMat(x.s);if(x.tid==null)x.tid=''});
    if(S.tsub)S.sel.c={m:ensureMat(S.tsub),t:''};
    if((S.timer.run||S.timer.acc)&&S.tsub){S.timer.mid=ensureMat(S.tsub);S.timer.tid=''}
    S.mig2=1;save();
  }
  ['c','q','x','r'].forEach(k=>{const s=S.sel[k]=Object.assign({m:'',t:''},S.sel[k]);if(s.m&&!mat(s.m))S.sel[k]={m:'',t:''};else if(s.t&&!tpc(s.m,s.t))s.t=''});
})();

/* ===== PEÇAS REUTILIZÁVEIS ===== */
// repinta a tela sem perder o que já foi digitado nos campos
const setMsg=(c,t,ok)=>{MSG[c]=t?{t,ok}:null};
const msg=c=>MSG[c]?`<small style="display:block;margin-top:8px;color:${MSG[c].ok?'var(--ok)':'var(--warn)'}">${MSG[c].t}</small>`:'';

// seletor de matéria (obrigatória) + conteúdo (opcional). c = contexto: c cronômetro, q questões, x manual, r revisão
function matSel(c,lock){
  const s=S.sel[c],m=mat(s.m),nw=!lock&&(qa==='nm:'+c||!S.mats.length);
  return `<div class="stack">
  <div class="row"><select aria-label="Matéria" ${lock?'disabled':''} onchange="selMat('${c}',this.value)"><option value="">Matéria (obrigatória)</option>${S.mats.map(x=>`<option value="${x.id}"${x.id===s.m?' selected':''}>${esc(x.name)}</option>`).join('')}${lock?'':'<option value="__new">＋ Nova matéria…</option>'}</select>${m?`<i class="dot lg" style="background:${m.color}"></i>`:''}</div>
  ${nw?`<div class="row"><input id="nm_${c}" placeholder="Nome da nova matéria"><button class="btn" onclick="newMat('${c}')">Criar</button></div>`:''}
  ${m?`<div class="row"><select aria-label="Conteúdo" ${lock?'disabled':''} onchange="selTop('${c}',this.value)"><option value="">Conteúdo (opcional)</option>${m.topics.map(t=>`<option value="${t.id}"${t.id===s.t?' selected':''}>${esc(t.name)}</option>`).join('')}</select>${lock?'':`<button class="btn g" aria-label="Novo conteúdo" onclick="qa=qa==='nt:${c}'?'':'nt:${c}';rr()">＋</button>`}</div>`:''}
  ${m&&!lock&&qa==='nt:'+c?`<div class="row"><input id="nt_${c}" placeholder="Novo conteúdo de ${esc(m.name)}"><button class="btn" onclick="newTop('${c}')">Criar</button></div>`:''}
  </div>`}
function selMat(c,val){if(val==='__new'){qa='nm:'+c;rr();return}S.sel[c]={m:val,t:''};qa='';save();rr()}
function selTop(c,val){S.sel[c].t=val;save()}
function newMat(c){const n=v('nm_'+c).trim();if(!n)return;S.sel[c]={m:ensureMat(n),t:''};qa='';save();rr()}
function newTop(c){const n=v('nt_'+c).trim(),m=mat(S.sel[c].m);if(!n||!m)return;let t=m.topics.find(x=>x.name.toLowerCase()===n.toLowerCase());if(!t){t={id:uid(),name:n};m.topics.push(t)}S.sel[c].t=t.id;qa='';save();rr()}

/* ===== PERÍODO (Dia, Semana, Mês, Ano, Total, Datas) ===== */
function prange(){
  const t=now5();t.setHours(0,0,0,0);let a,b,lb;
  if(pf.k==='d'){const d=new Date(t);d.setDate(d.getDate()+pf.o);a=b=dk(d);lb=pf.o===0?'Hoje':pf.o===-1?'Ontem':fd(a)}
  else if(pf.k==='w'){const d=new Date(t);d.setDate(d.getDate()-d.getDay()+7*pf.o);const e=new Date(d);e.setDate(d.getDate()+6);a=dk(d);b=dk(e);lb=pf.o===0?'Esta semana':fd(a).slice(0,5)+' a '+fd(b).slice(0,5)}
  else if(pf.k==='m'){const d=new Date(t.getFullYear(),t.getMonth()+pf.o,1);a=dk(d);b=dk(new Date(d.getFullYear(),d.getMonth()+1,0));lb=d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});lb=lb[0].toUpperCase()+lb.slice(1)}
  else if(pf.k==='y'){const y=t.getFullYear()+pf.o;a=y+'-01-01';b=y+'-12-31';lb=String(y)}
  else if(pf.k==='t'){a='0000-00-00';b='9999-99-99';lb='Todo o período'}
  else{a=pf.a<=pf.b?pf.a:pf.b;b=pf.a<=pf.b?pf.b:pf.a;lb=fd(a)+' a '+fd(b)}
  return{a,b,lb}}
const inr=(r,x)=>x.d>=r.a&&x.d<=r.b;
function perBar(){
  const r=prange(),K=[['d','Dia'],['w','Semana'],['m','Mês'],['y','Ano'],['t','Total'],['x','Datas']];
  return `<div class="seg sc">${K.map(k=>`<button class="${pf.k===k[0]?'on':''}" onclick="perK('${k[0]}')">${k[1]}</button>`).join('')}</div>`+
  (['d','w','m','y'].includes(pf.k)
    ?`<div class="row" style="margin-bottom:12px"><button class="x" aria-label="Período anterior" onclick="perO(-1)">‹</button><b style="flex:1;text-align:center">${r.lb}</b><button class="x" aria-label="Próximo período" onclick="perO(1)" ${pf.o>=0?'disabled':''}>›</button></div>`
    :pf.k==='x'?`<div class="two" style="margin-bottom:12px"><input type="date" aria-label="De" value="${pf.a}" onchange="perX('a',this.value)"><input type="date" aria-label="Até" value="${pf.b}" onchange="perX('b',this.value)"></div>`
    :`<div class="cap" style="margin-bottom:12px">${r.lb}</div>`)}
function perK(k){pf.k=k;pf.o=0;selk=-1;qi=-1;render()}
function perO(n){pf.o=Math.min(0,pf.o+n);selk=-1;qi=-1;render()}
function perX(k,x){pf[k]=x||dk();selk=-1;qi=-1;render()}

/* ===== ABA TEMPO: pizza + total grande + ranking ===== */
function pieSvg(it,tot){
  const C=110,Rd=100;
  if(!tot)return `<svg class="pie" viewBox="-12 -12 244 244" role="img" aria-label="Sem dados"><circle cx="${C}" cy="${C}" r="${Rd}" fill="#141414" stroke="#262626" stroke-width="2"/></svg>`;
  let a=-Math.PI/2,s='',top='';
  it.forEach((x,i)=>{
    const f=x.v/tot,ang=f*2*Math.PI,on=i===selk,md=a+ang/2,tr=on?` transform="translate(${(Math.cos(md)*9).toFixed(1)} ${(Math.sin(md)*9).toFixed(1)})"`:'',lab=`aria-label="${esc(x.nm)}: ${dur(x.v)}" role="button" tabindex="0"`;
    let sh;
    if(f>=.9999)sh=`<circle cx="${C}" cy="${C}" r="${Rd}" fill="${x.c}" onclick="pickSlice(${i})" ${lab}${tr}/>`;
    else{const x1=C+Rd*Math.cos(a),y1=C+Rd*Math.sin(a),x2=C+Rd*Math.cos(a+ang),y2=C+Rd*Math.sin(a+ang);sh=`<path d="M${C} ${C}L${x1.toFixed(2)} ${y1.toFixed(2)}A${Rd} ${Rd} 0 ${ang>Math.PI?1:0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z" fill="${x.c}" stroke="#0b0b0b" stroke-width="1.5" onclick="pickSlice(${i})" ${lab}${tr}/>`}
    on?top=sh:s+=sh;a+=ang});
  return `<svg class="pie" viewBox="-12 -12 244 244">${s}${top}</svg>`}
function pickSlice(i){selk=selk===i?-1:i;render()}
function setTm(m){tm=m;selk=-1;render()}
function vTempo(){
  const r=prange(),rows=S.sess.filter(x=>inr(r,x)),A={};
  rows.forEach(x=>{
    const col=mcolor(x),m=mat(x.mid);let k,nm,sb,c;
    if(tm==='m'){k=mkey(x);nm=mname(x);sb='';c=col}
    else{const tn=tname(x);k=mkey(x)+'|'+(tn?x.tid:'');nm=tn||'Sem conteúdo';sb=mname(x);c=m&&tn?shade(col,m.topics.findIndex(t=>t.id===x.tid)):col}
    const a=A[k]||(A[k]={k,nm,sb,c,v:0});a.v+=secOf(x)});
  const it=Object.values(A).sort((a,b)=>b.v-a.v),tot=it.reduce((t,a)=>t+a.v,0),mx=it.length?it[0].v:1;
  if(selk>=it.length)selk=-1;
  const days=new Set(rows.map(x=>x.d)).size,sl=selk>=0?it[selk]:null;
  const tip=sl?`<i class="dot" style="background:${sl.c}"></i><b>${esc(sl.nm)}</b><span class="mute">${dur(sl.v)} · ${pcs(sl.v/tot)}</span>`:it.length?'<small>Toque numa fatia para ver os detalhes</small>':'';
  let det='';
  if(sl&&tm==='m'){ // abre os conteúdos da matéria selecionada
    const g={};rows.filter(x=>mkey(x)===sl.k).forEach(x=>{const n=tname(x)||'Sem conteúdo';g[n]=(g[n]||0)+secOf(x)});
    const ks=Object.keys(g).sort((a,b)=>g[b]-g[a]);
    det=`<div class="subl">${ks.map(n=>`<div class="row"><span style="flex:1">${esc(n)}</span><small>${dur(g[n])}</small></div>`).join('')}</div>`}
  return `<div class="card">
    <div class="seg sm" role="group" aria-label="Agrupar por"><button class="${tm==='m'?'on':''}" onclick="setTm('m')">Matérias</button><button class="${tm==='c'?'on':''}" onclick="setTm('c')">Conteúdos</button></div>
    ${perBar()}
    <div class="tip">${tip}</div>
    ${pieSvg(it,tot)}
    <div class="tot">${dur(tot)}</div>
    <div class="cap">${tm==='m'?'Todas as matérias':'Todos os conteúdos'} · ${r.lb}</div>
    ${it.length?`<div style="margin-top:12px">${it.map((a,i)=>`<button class="rk${i===selk?' sel':''}" onclick="pickSlice(${i})"><i class="dot lg" style="background:${a.c}"></i><div class="g"><b>${esc(a.nm)}</b>${a.sb?`<small style="display:block">${esc(a.sb)}</small>`:''}<div class="thin"><i style="width:${Math.max(2,a.v/mx*100)}%;background:${a.c}"></i></div></div><div class="rt"><b>⏱ ${dur(a.v)}</b><small>${pcs(a.v/tot)}</small></div></button>${i===selk?det:''}`).join('')}</div>`
    :`<div class="empty" style="padding-top:14px">Nenhum estudo neste período.<br><button class="btn" style="margin-top:10px" onclick="stab('c')">▶ Iniciar cronômetro</button></div>`}
  </div>
  ${it.length?`<div class="grid3"><div class="stat"><b>${rows.length}</b><span>Sessões</span></div><div class="stat"><b>${dur(tot/Math.max(1,days))}</b><span>Média por dia</span></div><div class="stat"><b class="ell">${esc(it[0].nm)}</b><span>Mais estudad${tm==='m'?'a':'o'}</span></div></div>`:''}`}

/* ===== ABA CRONÔMETRO ===== */
function vCron(){
  const t=S.timer,run=t.run||t.acc>0,s=S.sel.c,m=mat(s.m),tp=tpc(s.m,s.t);
  const lab=m?`<div class="tip"><i class="dot lg" style="background:${m.color}"></i><b>${esc(m.name)}</b>${tp?`<span class="mute">· ${esc(tp.name)}</span>`:''}</div>`:'<div class="tip"><span class="mute">Escolha a matéria para começar</span></div>';
  const rec=S.sess.slice().reverse().slice(0,8);
  return `<div class="card"><h2>O que você vai estudar?</h2>${matSel('c',run)}
    <div class="timer clk" style="margin-top:16px">${clock(elapsed())}</div>${lab}
    <div class="two" style="margin-top:12px"><button class="btn" onclick="tog()">${t.run?'Pausar':(t.acc?'Continuar':'▶ Iniciar')}</button><button class="btn g" onclick="stopT()" ${run?'':'disabled'}>Salvar sessão</button></div>
    ${run?'<button class="btn g" style="width:100%;margin-top:8px;color:var(--mute)" onclick="dropT()">Descartar</button>':''}
    ${msg('c')}
    <label class="chk"><input type="checkbox" ${S.arev?'checked':''} onchange="togArev()"> Agendar revisões deste estudo (1, 7 e 30 dias)</label></div>
  <div class="card"><h2>Adicionar tempo manual</h2>${matSel('x')}
    <div class="two" style="margin-top:8px"><input id="x_m" type="number" min="1" inputmode="numeric" placeholder="Minutos"><input id="x_d" type="date" value="${dk()}"></div>${msg('x')}
    <button class="btn" style="width:100%;margin-top:8px" onclick="addMan()">Adicionar</button></div>
  <div class="card"><h2>Sessões recentes</h2>${rec.length?rec.map(x=>`<div class="item"><i class="dot lg" style="background:${mcolor(x)}"></i><div class="g"><b>${esc(mname(x))}</b><br><small>${tname(x)?esc(tname(x))+' · ':''}${fd(x.d)}</small></div><b>${dur(secOf(x))}</b><button class="x" aria-label="Apagar" onclick="del('sess','${x.id}')">×</button></div>`).join(''):empty('Nenhuma sessão ainda.')}</div>`}
function tog(){
  const t=S.timer;
  if(t.run){t.acc=elapsed();t.run=false}
  else{
    if(!t.acc){if(!S.sel.c.m){setMsg('c','Escolha a matéria antes de iniciar.');rr();return}t.mid=S.sel.c.m;t.tid=S.sel.c.t}
    setMsg('c','');t.start=Date.now();t.run=true}
  save();render()}
function stopT(){
  const t=S.timer,s=elapsed();if(!(t.run||t.acc))return;
  if(s>=30&&mat(t.mid)){const sec=Math.round(s);S.sess.push({id:uid(),d:dk(),mid:t.mid,tid:t.tid||'',s:mat(t.mid).name,m:Math.max(1,Math.round(s/60)),sec});if(S.arev)schedRev(t.mid,t.tid,dk());setMsg('c','Sessão salva: '+dur(sec)+'.',1)}
  else setMsg('c','Sessões com menos de 30 segundos não são salvas.');
  S.timer={run:false,start:0,acc:0};save();render()}
function dropT(){if(!confirm('Descartar o tempo deste cronômetro?'))return;S.timer={run:false,start:0,acc:0};setMsg('c','');save();render()}
function addMan(){
  const m=S.sel.x.m,min=Math.round(+v('x_m'));
  if(!m){setMsg('x','Escolha a matéria.');rr();return}
  if(!(min>=1)){setMsg('x','Informe os minutos.');rr();return}
  const d=v('x_d')||dk();S.sess.push({id:uid(),d,mid:m,tid:S.sel.x.t,s:mat(m).name,m:min,sec:min*60});if(S.arev)schedRev(m,S.sel.x.t,d);
  setMsg('x','Tempo adicionado.',1);save();render()}
function togArev(){S.arev=!S.arev;save()}

/* ===== ABA QUESTÕES: acertos x erros ===== */
const wk0=k=>{const d=new Date(k+'T00:00');d.setDate(d.getDate()-d.getDay());return dk(d)};
function buckets(r,recs){ // agrupa por dia, semana ou mês conforme o tamanho do período
  const today=dk();let a=r.a,b=r.b>today?today:r.b;
  if(a<'1900')a=recs.map(x=>x.d).sort()[0]||today;
  if(a>b)a=b;
  const n=Math.round((new Date(b+'T00:00')-new Date(a+'T00:00'))/864e5)+1,g=n<=31?'d':n<=140?'w':'m',B=[],ix={};
  const key=d=>g==='d'?d:g==='w'?wk0(d):d.slice(0,7);
  for(const d=new Date(a+'T00:00');dk(d)<=b;d.setDate(d.getDate()+1)){
    const k=key(dk(d));
    if(!(k in ix)){ix[k]=B.length;B.push({k,c:0,e:0,lb:g==='d'?k.slice(8):g==='w'?k.slice(8)+'/'+k.slice(5,7):MON[+k.slice(5,7)-1],full:g==='d'?fd(k):g==='w'?'Semana de '+fd(k).slice(0,5):MON[+k.slice(5,7)-1]+'/'+k.slice(2,4)})}}
  recs.forEach(x=>{const k=key(x.d);if(k in ix){B[ix[k]].c+=x.c;B[ix[k]].e+=x.n-x.c}});
  return B}
const CHW=320,CHL=28,CHR=8,CHT=8;
function qchart(B){ // barras empilhadas: acertos (verde) e erros (vermelho)
  const H=130,Bt=18,pw=CHW-CHL-CHR,ph=H-CHT-Bt,n=B.length,bw=pw/n,w=Math.max(2,Math.min(22,bw*.66)),mx=Math.max(2,...B.map(b=>b.c+b.e)),y0=CHT+ph,step=Math.ceil(n/7);
  let s=`<svg class="ch" viewBox="0 0 ${CHW} ${H}" role="img" aria-label="Acertos e erros por período">`;
  [0,.5,1].forEach(f=>{const y=CHT+ph*(1-f);s+=`<line x1="${CHL}" x2="${CHW-CHR}" y1="${y}" y2="${y}" stroke="#222"/>${f!==.5?`<text x="${CHL-5}" y="${y+3}" text-anchor="end" fill="#8A8A8A" font-size="9">${Math.round(mx*f)}</text>`:''}`});
  B.forEach((b,i)=>{
    const x=CHL+bw*i+(bw-w)/2,hc=b.c/mx*ph,he=b.e/mx*ph;
    if(i===qi)s+=`<rect x="${CHL+bw*i}" y="${CHT}" width="${bw}" height="${ph}" fill="#ffffff" opacity=".07"/>`;
    if(b.c)s+=`<rect x="${x}" y="${y0-hc}" width="${w}" height="${hc}" fill="var(--ok)" rx="1.5"/>`;
    if(b.e)s+=`<rect x="${x}" y="${y0-hc-he}" width="${w}" height="${he}" fill="var(--bad)" rx="1.5"/>`;
    if(i%step===0||i===n-1&&n<=8)s+=`<text x="${CHL+bw*i+bw/2}" y="${H-4}" text-anchor="middle" fill="#8A8A8A" font-size="9">${b.lb}</text>`;
    s+=`<rect x="${CHL+bw*i}" y="${CHT}" width="${bw}" height="${ph+Bt}" fill="transparent" onclick="pickBar(${i})"/>`});
  return s+'</svg>'}
function lchart(B){ // linha: % de acerto de cada período
  const H=120,Bt=18,pw=CHW-CHL-CHR,ph=H-CHT-Bt,n=B.length,bw=pw/n,step=Math.ceil(n/7),Y=p=>CHT+ph*(1-p/100);
  let s=`<svg class="ch" viewBox="0 0 ${CHW} ${H}" role="img" aria-label="Percentual de acerto por período">`;
  [0,50,100].forEach(p=>s+=`<line x1="${CHL}" x2="${CHW-CHR}" y1="${Y(p)}" y2="${Y(p)}" stroke="#222"/><text x="${CHL-5}" y="${Y(p)+3}" text-anchor="end" fill="#8A8A8A" font-size="9">${p}%</text>`);
  s+=`<line x1="${CHL}" x2="${CHW-CHR}" y1="${Y(70)}" y2="${Y(70)}" stroke="var(--ok)" stroke-dasharray="3 3" opacity=".55"/>`;
  const pts=[];
  B.forEach((b,i)=>{const t=b.c+b.e;if(t)pts.push({i,x:CHL+bw*i+bw/2,y:Y(b.c/t*100)})});
  if(pts.length>1)s+=`<path d="${pts.map((p,j)=>(j?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join('')}" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linejoin="round"/>`;
  pts.forEach(p=>s+=`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.i===qi?4.5:n>20?2.5:3.5}" fill="var(--acc)" stroke="#0b0b0b" stroke-width="1.5"/>`);
  B.forEach((b,i)=>{if(i%step===0)s+=`<text x="${CHL+bw*i+bw/2}" y="${H-4}" text-anchor="middle" fill="#8A8A8A" font-size="9">${b.lb}</text>`;s+=`<rect x="${CHL+bw*i}" y="${CHT}" width="${bw}" height="${ph+Bt}" fill="transparent" onclick="pickBar(${i})"/>`});
  return s+'</svg>'}
function pickBar(i){qi=qi===i?-1:i;render()}
function qFilter(x){qf=x;qi=-1;render()}
function vQuest(){
  const r=prange(),rows=S.qs.filter(x=>inr(r,x)),bm={};
  rows.forEach(x=>{const k=mkey(x),a=bm[k]||(bm[k]={k,nm:mname(x),c:mcolor(x),a:0,e:0});a.a+=x.c;a.e+=x.n-x.c});
  const L=Object.values(bm).sort((a,b)=>(b.a+b.e)-(a.a+a.e)),A=L.reduce((t,x)=>t+x.a,0),E=L.reduce((t,x)=>t+x.e,0),N=A+E,P=N?Math.round(A/N*100):null;
  if(qf&&!bm[qf])qf='';
  const B=buckets(r,qf?rows.filter(x=>mkey(x)===qf):rows),wd=B.filter(b=>b.c+b.e>0);
  let trend='';
  if(wd.length>=2){const h=Math.floor(wd.length/2),pc=a=>Math.round(a.reduce((t,b)=>t+b.c,0)/a.reduce((t,b)=>t+b.c+b.e,0)*100),p1=pc(wd.slice(0,h)),p2=pc(wd.slice(h)),d=p2-p1;trend=`<small style="display:block;margin-top:8px">Evolução no período: <b style="color:${d>0?'var(--ok)':d<0?'var(--bad)':'var(--ink)'}">${d>0?'▲ +':d<0?'▼ ':'■ '}${d} pontos</b> (${p1}% → ${p2}%)</small>`}
  const bi=qi>=0&&qi<B.length?B[qi]:null,cap=bi?`<b>${bi.full}</b> · <span class="in">✔ ${bi.c}</span> · <span class="out">✘ ${bi.e}</span> · ${bi.c+bi.e?Math.round(bi.c/(bi.c+bi.e)*100)+'%':'–'}`:'<small>Toque numa barra para ver o detalhe</small>';
  const rec=S.qs.slice().reverse().slice(0,8);
  return `<div class="card"><h2>Registrar questões</h2>${matSel('q')}
    <div class="two" style="margin-top:8px"><input id="q_a" type="number" min="0" inputmode="numeric" placeholder="✔ Acertos"><input id="q_e" type="number" min="0" inputmode="numeric" placeholder="✘ Erros"></div>
    <input id="q_d" type="date" value="${dk()}" style="margin-top:8px" aria-label="Data">${msg('q')}
    <button class="btn" style="width:100%;margin-top:8px" onclick="addQ()">Registrar</button></div>
  <div class="card">${perBar()}
    <div class="row" style="align-items:flex-end;margin-bottom:6px"><div><div class="tot" style="text-align:left;color:${P===null?'var(--mute)':P>=70?'var(--ok)':P>=50?'var(--warn)':'var(--bad)'}">${P===null?'–':P+'%'}</div><small>de acerto · ${N} questões</small></div><div style="margin-left:auto;text-align:right"><b class="in">✔ ${A}</b> acertos<br><b class="out">✘ ${E}</b> erros</div></div>
    ${N?`<div class="split" style="margin:10px 0 14px"><i style="width:${A/N*100}%;background:var(--ok)"></i><i style="width:${E/N*100}%;background:var(--bad)"></i></div>
    <select aria-label="Filtrar matéria" onchange="qFilter(this.value)" style="margin-bottom:10px"><option value="">Todas as matérias</option>${L.map(x=>`<option value="${x.k}"${x.k===qf?' selected':''}>${esc(x.nm)}</option>`).join('')}</select>
    <h2 style="margin-bottom:2px">Acertos x erros</h2>${qchart(B)}
    <h2 style="margin:12px 0 2px">Evolução do % de acerto <small>(linha tracejada = 70%)</small></h2>${lchart(B)}
    <div class="tip" style="margin-top:6px">${cap}</div>${trend}`:empty('Nenhuma questão neste período.')}</div>
  ${L.length?`<div class="card"><h2>Por matéria</h2>${L.map(x=>{const t=x.a+x.e,p=Math.round(x.a/t*100);return `<div style="margin-bottom:12px"><div class="row"><i class="dot" style="background:${x.c}"></i><b style="flex:1">${esc(x.nm)}</b><small>✔ ${x.a} · ✘ ${x.e} · <b style="color:${p>=70?'var(--ok)':p>=50?'var(--warn)':'var(--bad)'}">${p}%</b></small></div><div class="split" style="margin-top:5px"><i style="width:${x.a/t*100}%;background:var(--ok)"></i><i style="width:${x.e/t*100}%;background:var(--bad)"></i></div></div>`}).join('')}</div>`:''}
  <div class="card"><h2>Registros recentes</h2>${rec.length?rec.map(q=>`<div class="item"><i class="dot lg" style="background:${mcolor(q)}"></i><div class="g"><b>${esc(mname(q))}</b><br><small>${tname(q)?esc(tname(q))+' · ':''}${fd(q.d)}</small></div><span><span class="in">✔${q.c}</span> <span class="out">✘${q.n-q.c}</span></span><button class="x" aria-label="Apagar" onclick="del('qs','${q.id}')">×</button></div>`).join(''):empty('Nada registrado.')}</div>`}
function addQ(){
  const m=S.sel.q.m,a=Math.max(0,Math.round(+v('q_a')||0)),e=Math.max(0,Math.round(+v('q_e')||0));
  if(!m){setMsg('q','Escolha a matéria.');rr();return}
  if(a+e<1){setMsg('q','Informe os acertos e/ou os erros.');rr();return}
  S.qs.push({id:uid(),d:v('q_d')||dk(),mid:m,tid:S.sel.q.t,s:mat(m).name,n:a+e,c:a});
  setMsg('q','Registrado: '+a+' acertos e '+e+' erros.',1);save();render()}
/* ===== ABA REVISÕES ===== */
function schedRev(mid,tid,base){ // 1 sessão (matéria+conteúdo) por dia gera 3 revisões; não duplica
  tid=tid||'';if(S.rev.some(r=>r.mid===mid&&(r.tid||'')===tid&&r.base===base&&r.n>0))return;
  RI.forEach((n,i)=>{const d=new Date(base+'T00:00');d.setDate(d.getDate()+n);S.rev.push({id:uid(),mid,tid,s:(mat(mid)||{}).name||'',base,d:dk(d),n:i+1,done:false})})}
function revList(){
  const t=dk(),p=S.rev.filter(r=>!r.done).sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
  return{late:p.filter(r=>r.d<t),today:p.filter(r=>r.d===t),next:p.filter(r=>r.d>t),due:p.filter(r=>r.d<=t),done:S.rev.filter(r=>r.done).sort((a,b)=>(b.dd||'')<(a.dd||'')?-1:1)}}
function revRow(r){
  const n=left(r.d),tp=tname(r),pl=r.done?'':n<0?`<span class="pill" style="color:var(--bad)">atrasada ${-n}d</span>`:n===0?'<span class="pill" style="color:var(--warn)">hoje</span>':`<span class="pill" style="color:var(--mute)">${n===1?'amanhã':fd(r.d).slice(0,5)}</span>`;
  return `<div class="item"><button class="pay ${r.done?'on':''}" aria-label="${r.done?'Desmarcar revisão':'Marcar revisão como feita'}" onclick="revDone('${r.id}')">${r.done?'✓':''}</button><i class="dot" style="background:${mcolor(r)};margin:0"></i><div class="g ${r.done?'done':''}"><b>${esc(mname(r))}</b><br><small>${tp?esc(tp)+' · ':''}${r.n?`Revisão ${r.n}/${RI.length} · estudado em ${fd(r.base).slice(0,5)}`:'Revisão avulsa'}</small><div style="margin-top:4px">${pl}</div></div><button class="x" aria-label="Apagar" onclick="del('rev','${r.id}')">×</button></div>`}
function revDone(id){const r=S.rev.find(x=>x.id===id);r.done=!r.done;r.dd=r.done?dk():'';save();render()}
function addRev(){
  const m=S.sel.r.m;if(!m){setMsg('r','Escolha a matéria.');rr();return}
  S.rev.push({id:uid(),mid:m,tid:S.sel.r.t,s:mat(m).name,base:dk(),d:v('r_d')||dk(),n:0,done:false});
  setMsg('r','Revisão agendada.',1);save();render()}
function vRev(){
  const L=revList(),w=S.rev.filter(r=>r.done&&r.dd&&left(r.dd)>-7).length;
  const sec=(t,a,c)=>a.length?`<div class="card"><h2 ${c?`style="color:${c}"`:''}>${t} <small>(${a.length})</small></h2>${a.map(revRow).join('')}</div>`:'';
  return `<div class="grid3"><div class="stat"><b>${L.due.length}</b><span>Para hoje</span></div><div class="stat"><b class="${L.late.length?'out':''}">${L.late.length}</b><span>Atrasadas</span></div><div class="stat"><b>${w}</b><span>Feitas em 7 dias</span></div></div>
  ${!S.rev.length?`<div class="card">${empty('Nenhuma revisão ainda.<br>Ao salvar um estudo, o app agenda revisões para 1, 7 e 30 dias depois.')}</div>`:''}
  ${sec('Atrasadas',L.late,'var(--bad)')}${sec('Hoje',L.today)}${sec('Próximas',L.next.slice(0,20))}
  ${L.done.length?`<div class="card"><h2>Feitas <small>(últimas ${Math.min(6,L.done.length)})</small></h2>${L.done.slice(0,6).map(revRow).join('')}</div>`:''}
  <div class="card"><h2>Agendar revisão avulsa</h2>${matSel('r')}<div class="row" style="margin-top:8px"><input id="r_d" type="date" value="${dk()}" aria-label="Data"><button class="btn" onclick="addRev()">Agendar</button></div>${msg('r')}</div>
  <div class="card"><label class="chk" style="margin:0"><input type="checkbox" ${S.arev?'checked':''} onchange="togArev()"> Agendar revisões automaticamente ao salvar um estudo (1, 7 e 30 dias)</label></div>`}
function revCard(){ // aparece no painel
  const n=revList().due.length;
  return n?`<div class="card"><div class="row"><span class="ic">🔁</span><div class="g" style="flex:1"><b>${n} revis${n>1?'ões':'ão'} para hoje</b><br><small>Revisar na hora certa fixa o conteúdo</small></div><button class="btn" onclick="ss='r';go('study')">Ver</button></div></div>`:''}

/* ===== ABA MATÉRIAS: cadastro de matérias e conteúdos ===== */
function addMat(){
  const n=v('mn').trim();if(!n)return;
  if(S.mats.some(m=>m.name.toLowerCase()===n.toLowerCase())){setMsg('m','Essa matéria já existe.');rr();return}
  const id=uid();S.mats.push({id,name:n,color:ncol||MC[S.mats.length%MC.length],topics:[]});ncol='';mo=id;setMsg('m','');save();render()}
function addSug(i){const id=ensureMat(SUGG[i]);mo=id;save();render()}
function openMat(id){mo=mo===id?'':id;render()}
function matColor(id,c){mat(id).color=c;save();render()}
function matRename(id){const m=mat(id),n=prompt('Novo nome da matéria:',m.name);if(!n||!n.trim())return;m.name=n.trim();[...S.sess,...S.qs,...S.rev].forEach(x=>{if(x.mid===id)x.s=m.name});save();render()}
function matDel(id){
  const m=mat(id);
  if((S.timer.run||S.timer.acc)&&S.timer.mid===id){alert('Salve ou descarte o cronômetro desta matéria antes de apagá-la.');return}
  if(!confirm(`Apagar "${m.name}" e seus conteúdos?\nO tempo e as questões já registrados continuam nos totais. Revisões pendentes dela serão removidas.`))return;
  S.mats=S.mats.filter(x=>x.id!==id);S.rev=S.rev.filter(r=>r.mid!==id||r.done);
  Object.keys(S.sel).forEach(k=>{if(S.sel[k].m===id)S.sel[k]={m:'',t:''}});mo='';save();render()}
function addTopicIn(id){const n=v('tn_'+id).trim(),m=mat(id);if(!n||!m)return;if(!m.topics.some(t=>t.name.toLowerCase()===n.toLowerCase()))m.topics.push({id:uid(),name:n});save();render();const e=document.getElementById('tn_'+id);if(e)e.focus()}
function topRename(mid,tid){const t=tpc(mid,tid),n=prompt('Novo nome do conteúdo:',t.name);if(!n||!n.trim())return;t.name=n.trim();save();render()}
function topDel(mid,tid){const t=tpc(mid,tid);if(!confirm(`Apagar o conteúdo "${t.name}"? O tempo já registrado fica na matéria.`))return;const m=mat(mid);m.topics=m.topics.filter(x=>x.id!==tid);Object.keys(S.sel).forEach(k=>{if(S.sel[k].t===tid)S.sel[k].t=''});save();render()}
function vMats(){
  const free=SUGG.map((n,i)=>[n,i]).filter(a=>!S.mats.some(m=>m.name.toLowerCase()===a[0].toLowerCase()));
  const sw=(cur,fn)=>MC.map(c=>`<button class="sw s${c===cur?' on':''}" style="background:${c}" aria-label="Cor ${c}" onclick="${fn(c)}"></button>`).join('');
  return `<div class="card"><h2>Nova matéria</h2><div class="stack"><input id="mn" placeholder="Ex.: Língua Portuguesa"><div class="row" style="flex-wrap:wrap">${sw(ncol||MC[S.mats.length%MC.length],c=>`ncol='${c}';rr()`)}</div>${msg('m')}<button class="btn" onclick="addMat()">Cadastrar matéria</button><small>Cada matéria tem uma cor no gráfico. Os conteúdos (assuntos) são opcionais: adicione dentro de cada matéria.</small></div></div>
  ${free.length?`<div class="card"><h2>Sugestões</h2><div class="cats">${free.map(a=>`<button class="chip" onclick="addSug(${a[1]})">＋ ${a[0]}</button>`).join('')}</div></div>`:''}
  ${S.mats.length?S.mats.map(m=>{
    const open=mo===m.id,tt=S.sess.filter(x=>x.mid===m.id).reduce((t,x)=>t+secOf(x),0),nq=S.qs.filter(x=>x.mid===m.id).reduce((t,x)=>t+x.n,0);
    return `<div class="card" style="padding:2px 16px"><button class="rk" style="border-top:0" onclick="openMat('${m.id}')" aria-expanded="${open}"><i class="dot lg" style="background:${m.color}"></i><div class="g"><b>${esc(m.name)}</b><small style="display:block">${m.topics.length} conteúdo${m.topics.length===1?'':'s'}${nq?' · '+nq+' questões':''}</small></div><div class="rt"><b>⏱ ${dur(tt)}</b><small>${open?'▲':'▼'}</small></div></button>
    ${open?`<div style="padding:4px 0 14px"><small>Cor no gráfico</small><div class="row" style="flex-wrap:wrap;margin:6px 0 12px">${sw(m.color,c=>`matColor('${m.id}','${c}')`)}</div>
      <small>Conteúdos (opcional)</small>${m.topics.length?m.topics.map(t=>`<div class="item"><div class="g"><b>${esc(t.name)}</b></div><small>${dur(S.sess.filter(x=>x.mid===m.id&&x.tid===t.id).reduce((s,x)=>s+secOf(x),0))}</small><button class="x" aria-label="Renomear" onclick="topRename('${m.id}','${t.id}')">✎</button><button class="x" aria-label="Apagar" onclick="topDel('${m.id}','${t.id}')">×</button></div>`).join(''):'<div class="empty" style="padding:6px 0">Nenhum conteúdo. Você pode estudar só pela matéria.</div>'}
      <div class="row" style="margin-top:8px"><input id="tn_${m.id}" placeholder="Novo conteúdo (ex.: Crase)" onkeydown="if(event.key==='Enter')addTopicIn('${m.id}')"><button class="btn" onclick="addTopicIn('${m.id}')">Adicionar</button></div>
      <div class="two" style="margin-top:12px"><button class="btn g" onclick="matRename('${m.id}')">Renomear</button><button class="btn g" style="color:var(--bad)" onclick="matDel('${m.id}')">Apagar matéria</button></div></div>`:''}</div>`}).join(''):''}`}

/* ===== ABA PROVAS (como já era) ===== */
function vProvas(){
  const all=S.exams.slice().sort((a,b)=>a.d<b.d?-1:1);
  return `<div class="card"><h2>Nova prova</h2><div class="stack"><input id="en" placeholder="Matéria ou prova" list="subs"><div class="row"><input id="ed" type="date" value="${dk()}"><button class="btn" onclick="addExam()">Adicionar</button></div></div></div><div class="card"><h2>Provas</h2>${all.length?all.map(examRow).join(''):empty('Nenhuma prova cadastrada.')}</div>`}

S.fo=Object.assign({ph:'i',min:25,end:0,st:0,tx:''},S.fo||{});S.sel.f=Object.assign({m:'',t:''},S.sel.f);
const fT=()=>Math.max(0,Math.round((S.fo.end-Date.now())/1000));
function foStart(){if(!mat(S.sel.f.m)){setMsg('f','Escolha a matéria antes de começar.');rr();return}const tx=v('fi').trim();if(!tx){setMsg('f','Escreva o que vai aprender nesta sessão.');rr();return}setMsg('f','');const m=+v('fm')||25;S.fo={ph:'f',min:m,st:Date.now(),end:Date.now()+m*60000,tx};save();rr()}
function foStop(){S.fo.ph='r';S.fo.end=Math.min(S.fo.end,Date.now());save();rr()}
function foDone(){const m=Math.max(1,Math.round((S.fo.end-S.fo.st)/60000));S.sess.push({id:uid(),d:dk(),m,sec:m*60,mid:S.sel.f.m,tid:S.sel.f.t||'',s:'',n:v('fr2').trim()});S.fo={ph:'i',min:S.fo.min,end:0,st:0,tx:''};save();render()}
setInterval(()=>{const f=S.fo;if(f.ph!=='f')return;const t=fT();document.querySelectorAll('.fclk').forEach(e=>e.textContent=pad(Math.floor(t/60))+':'+pad(t%60));if(t<=0){f.ph='r';save();render();toast('Tempo! Agora o resgate ativo','big')}},500);
function vFoco(){
  const f=S.fo,why=`<div class="card"><h2>Por que esse protocolo funciona</h2>${[['Intenção clara','Definir o que vai aprender antes de começar reduz a dispersão.'],['Foco sem celular','Pesquisas sugerem que só ter o celular por perto já atrapalha a atenção.'],['Resgate ativo','Tentar lembrar sem olhar fixa muito mais do que reler.'],['Pausas curtas','Descansar entre blocos ajuda a manter a atenção e a consolidar.'],['Revisão espaçada','Rever em 1, 7 e 30 dias combate o esquecimento. O app agenda isso nas Revisões.']].map(w=>`<details><summary><b>${w[0]}</b></summary><p class="mute" style="margin:6px 0 2px">${w[1]}</p></details>`).join('')}</div>`;
  if(f.ph==='f'){const t=fT();return `<div class="card hero"><small>Foco total</small><div class="timer fclk">${pad(Math.floor(t/60))+':'+pad(t%60)}</div><p class="q">${esc(f.tx)}</p><small>Se a mente fugir, anote numa linha e volte.</small></div><button class="btn g" style="width:100%;margin-bottom:12px" onclick="foStop()">Encerrar agora</button>`+why}
  if(f.ph==='r')return `<div class="card"><h2>Resgate ativo</h2><p class="mute" style="margin:0 0 10px">Sem olhar o material, escreva 3 coisas que você lembra de: <b>${esc(f.tx)}</b></p><div class="stack"><input id="fr2" placeholder="1) … 2) … 3) …"><button class="btn" onclick="foDone()">Concluir e ganhar XP</button><small>Depois, 5 minutos de pausa: levante, beba água, olhe longe.</small></div></div>`+why;
  return `<div class="card"><h2>Nova sessão de foco</h2>${matSel('f')}<div class="stack" style="margin-top:8px"><input id="fi" placeholder="O que exatamente vou aprender agora?"><select id="fm"><option value="25"${f.min===25?' selected':''}>25 min (bloco curto)</option><option value="50"${f.min===50?' selected':''}>50 min (bloco longo)</option></select><div class="cats"><span class="chip">📵 Celular longe</span><span class="chip">💧 Água</span><span class="chip">🧹 Mesa limpa</span></div><button class="btn" onclick="foStart()">Começar foco</button>${msg('f')}</div></div>`+why}

let kmode='home',kq=[],kshow=false,kst={n:0,ok:0,xp:0,combo:0,best:0,total:0},kf='',kb='',kn='',ksrc='n',ksub='',kmsg='',kbrw='',kflt='';
const kdue=mid=>S.cards.filter(c=>c.due<=dk()&&(!mid||c.mid===mid));
const kGoal=()=>+S.prof.kgoal||20;
const nl2=t=>esc(t).replace(/\n/g,'<br>');
const kLbl=n=>n<=0?'<1 min':n===1?'1 dia':n<30?n+' dias':n<365?(Math.round(n/30)===1?'1 mês':Math.round(n/30)+' meses'):'1 ano+';
/* repetição espaçada (parecida com o Anki): g = 0 errei, 1 difícil, 2 bom, 3 fácil */
function kNext(c,g){const ez=c.ez||2.5,iv=c.iv||0,rp=c.rp||0;
  if(g===0)return{iv:0,ez:Math.max(1.3,ez-.2)};
  if(g===1)return{iv:Math.max(1,Math.round(iv*1.2)),ez:Math.max(1.3,ez-.15)};
  if(g===2)return{iv:rp===0?1:rp===1?3:Math.max(iv+1,Math.round(iv*ez)),ez};
  return{iv:rp===0?4:Math.max(iv+2,Math.round(iv*ez*1.3)),ez:ez+.15}}
function kkeep(){kf=v('kf_');kb=v('kb_');kn=v('kn_');ksub=v('kc_m')||ksub}
function kGo(mode,src,mid){kmode=mode;if(src)ksrc=src;if(mid)ksub=mid;kmsg='';tab='study';ss='k';render();scrollTo(0,0)}
function kSrc(x){kkeep();ksrc=x;kmsg='';render()}
function kExit(){kmode='home';render();scrollTo(0,0)}
function kOpen(){tab='study';ss='k';kmode='home';kStart()}
function kStart(mid,flt){
  let q=kdue(mid);if(flt==='e')q=q.filter(c=>c.src==='e');
  q=q.map(c=>[Math.random(),c.id]).sort((a,b)=>a[0]-b[0]).map(a=>a[1]).slice(0,40);
  if(!q.length){kmsg='Nada para revisar agora. 🎉';render();return}
  kq=q;kshow=false;kst={n:0,ok:0,xp:0,combo:0,best:0,total:q.length};kmode='study';kmsg='';render();scrollTo(0,0)}
function kAns(g){
  const c=S.cards.find(x=>x.id===kq[0]);if(!c)return;const r=kNext(c,g);
  kst.n++;if(g>=2){kst.ok++;kst.combo++;kst.best=Math.max(kst.best,kst.combo)}else if(g===0)kst.combo=0;
  c.ez=r.ez;c.last=dk();
  if(g===0){c.lp=(c.lp||0)+1;c.iv=0;c.rp=0;c.due=dk();kq.push(kq.shift())}
  else{c.iv=r.iv;c.rp=(c.rp||0)+1;const d=now5();d.setDate(d.getDate()+r.iv);c.due=dk(d);kq.shift()}
  const x=[1,2,3,4][g]+(g>=2?Math.min(5,Math.floor(kst.combo/3)):0);
  S.bonus=(S.bonus||0)+x;kst.xp+=x;S.kr[dk()]=(S.kr[dk()]||0)+1;
  kshow=false;if(!kq.length)kmode='done';save();render();scrollTo(0,0)}
function kSave(){
  kkeep();const m=v('kc_m');if(!m){kmsg='Escolha a matéria.';render();return}
  const mk=(a,z,src,note)=>({id:uid(),mid:m,f:a,b:z,n:note||'',src:src||'n',d:dk(),due:dk(),iv:0,ez:2.5,rp:0,lp:0});
  if(ksrc==='b'){let n=0;kf.split('\n').map(x=>x.trim()).filter(Boolean).forEach(l=>{const i=l.search(/::|;|\t/);if(i<1)return;const a=l.slice(0,i).trim(),z=l.slice(i).replace(/^(::|;|\t)/,'').trim();if(a&&z){S.cards.push(mk(a,z));n++}});
    if(!n){kmsg='Use uma linha por cartão: pergunta :: resposta';render();return}S.bonus=(S.bonus||0)+n;kmsg=n+' cartões criados ✓'}
  else{if(!kf.trim()||!kb.trim()){kmsg=ksrc==='e'?'Preencha o enunciado e a resposta correta.':'Preencha a pergunta e a resposta.';render();return}
    S.cards.push(mk(kf.trim(),kb.trim(),ksrc,ksrc==='e'?kn.trim():''));S.bonus=(S.bonus||0)+(ksrc==='e'?5:1);kmsg=(ksrc==='e'?'Erro salvo: agora ele volta até você acertar ✓':'Cartão salvo ✓')}
  kf=kb=kn='';save();render();scrollTo(0,0)}
function kDel(id){S.cards=S.cards.filter(c=>c.id!==id);save();render()}
function kBr(mid){kbrw=mid;kflt='';kmode='browse';render();scrollTo(0,0)}
function kFlt(x){kflt=x;render()}

function vCards(){
  if(kmode==='study')return kStudy();if(kmode==='done')return kDone();if(kmode==='add')return kAdd();if(kmode==='browse')return kBrowse();
  const D=kdue(),tot=S.cards.length,er=S.cards.filter(c=>c.src==='e').length,de=D.filter(c=>c.src==='e').length,hj=S.kr[dk()]||0,g=kGoal();
  const decks=S.mats.map(m=>({m,t:S.cards.filter(c=>c.mid===m.id),d:kdue(m.id)})).filter(x=>x.t.length);
  return `<div class="card kh"><div class="row"><div><div class="kbig">${D.length}</div><small>cartões para revisar hoje</small></div><div style="margin-left:auto;text-align:right"><small>${tot} no total<br>${er} erros salvos</small></div></div>
  <div class="meter" style="margin:12px 0 4px"><i style="width:${pct(hj,g)}%"></i></div><small>Hoje: ${hj} de ${g} cartões${hj>=g?' · meta batida! 🔥':''}</small>
  <button class="btn kgo" onclick="kStart()" ${D.length?'':'disabled'}>▶ Estudar ${D.length||''} cartões</button>
  ${de?`<button class="btn g" style="width:100%;margin-top:8px" onclick="kStart('','e')">📝 Só os meus erros (${de})</button>`:''}${kmsg?`<small style="display:block;margin-top:8px">${kmsg}</small>`:''}</div>
  <div class="two" style="margin-bottom:12px"><button class="btn g" onclick="kGo('add','n')">＋ Novo cartão</button><button class="btn g" onclick="kGo('add','e')">📝 Questão que errei</button></div>
  ${decks.length?`<div class="card"><h2>Baralhos por matéria</h2>${decks.map(x=>`<div class="item"><i class="dot lg" style="background:${x.m.color}"></i><div class="g"><b>${esc(x.m.name)}</b><br><small>${x.t.length} cartões · ${x.t.filter(c=>c.src==='e').length} erros</small></div>${x.d.length?`<span class="pill" style="color:var(--warn)">${x.d.length}</span>`:'<span class="pill" style="color:var(--ok)">✓</span>'}<button class="chip" onclick="kStart('${x.m.id}')" ${x.d.length?'':'disabled'}>Estudar</button><button class="x" aria-label="Ver cartões" onclick="kBr('${x.m.id}')">⋯</button></div>`).join('')}</div>`
  :`<div class="card"><h2>Seus baralhos aparecem aqui</h2><p class="mute" style="margin:0 0 10px">Crie cartões de pergunta e resposta. Eles ficam separados por matéria e voltam na hora certa para você não esquecer. Errou uma questão? Salve ela aqui e ela só sai da fila quando você acertar.</p><button class="chip" onclick="kGo('add','b')">Colar vários de uma vez</button></div>`}
  ${decks.length?`<button class="chip" onclick="kGo('add','b')">Colar vários de uma vez</button>`:''}`}
function kStudy(){
  const c=S.cards.find(x=>x.id===kq[0]);if(!c){kmode='home';return vCards()}
  const m=mat(c.mid)||{name:'Sem matéria',color:'#6B7280'},pc=Math.round((kst.total-kq.length)/kst.total*100),lb=[0,1,2,3].map(g=>kLbl(kNext(c,g).iv));
  return `<div class="kt"><button class="x" aria-label="Sair" onclick="kExit()">✕</button><div class="meter kbar"><i style="width:${pc}%"></i></div><small>${kq.length}</small></div>
  ${kst.combo>=2?`<div class="kcombo">🔥 ${kst.combo} seguidos${kst.combo>=3?' · +'+Math.min(5,Math.floor(kst.combo/3))+' XP extra':''}</div>`:''}
  <div class="kc" style="--c:${m.color}"><div class="khd"><span class="kchip"><i class="dot" style="background:${m.color}"></i>${esc(m.name)}</span>${c.src==='e'?'<span class="ker">ERRO</span>':''}</div><div class="kf">${nl2(c.f)}</div>
  ${kshow?`<div class="kb"><hr><div class="kbt">${nl2(c.b)}</div>${c.n?`<div class="kn">💡 ${nl2(c.n)}</div>`:''}</div>`:''}</div>
  ${kshow?`<div class="kans">${[['Errei','bad'],['Difícil','warn'],['Bom','ok'],['Fácil','acc']].map((a,g)=>`<button class="ka ${a[1]}" onclick="kAns(${g})"><b>${a[0]}</b><small>${lb[g]}</small></button>`).join('')}</div>`:`<button class="btn kshow" onclick="kshow=true;render()">Mostrar resposta</button>`}`}
function kDone(){const p=kst.n?Math.round(kst.ok/kst.n*100):0,left=kdue().length;
  return `<div class="card kdone"><div style="font-size:54px">${p>=80?'🏆':p>=50?'💪':'📚'}</div><h2 style="font-size:22px;margin:6px 0">Sessão concluída!</h2><div class="grid3" style="margin:12px 0"><div class="stat"><b>${kst.n}</b><span>respostas</span></div><div class="stat"><b>${p}%</b><span>acertos</span></div><div class="stat"><b>+${kst.xp}</b><span>XP</span></div></div><small>Melhor sequência: 🔥 ${kst.best}</small>
  <button class="btn" style="width:100%;margin-top:14px" onclick="kmode='home';render()">Voltar aos baralhos</button>${left?`<button class="btn g" style="width:100%;margin-top:8px" onclick="kStart()">Ainda tem ${left} para revisar</button>`:''}</div>`}
function kAdd(){
  if(!S.mats.length)return `<div class="card"><h2>Crie uma matéria primeiro</h2><p class="mute">Os cartões ficam separados por matéria, como baralhos.</p><button class="btn" onclick="kmode='home';stab('m')">Ir para Matérias</button></div>`;
  const sub=ksub&&mat(ksub)?ksub:S.mats[0].id,L={n:['Pergunta (frente)','Resposta (verso)'],e:['Enunciado da questão que errei','Resposta correta'],b:['','']}[ksrc];
  return `<button class="chip" onclick="kkeep();kmode='home';render()">‹ Voltar</button>
  <div class="card" style="margin-top:10px"><div class="seg">${[['n','Cartão'],['e','Questão que errei'],['b','Vários']].map(a=>`<button class="${ksrc===a[0]?'on':''}" onclick="kSrc('${a[0]}')">${a[1]}</button>`).join('')}</div>
  <div class="stack"><select id="kc_m" aria-label="Matéria">${S.mats.map(m=>`<option value="${m.id}"${m.id===sub?' selected':''}>${esc(m.name)}</option>`).join('')}</select>
  ${ksrc==='b'?`<small>Uma linha por cartão, assim: pergunta :: resposta</small><textarea id="kf_" rows="8" placeholder="Capital do Brasil? :: Brasília">${esc(kf)}</textarea>`
  :`<textarea id="kf_" rows="3" placeholder="${L[0]}">${esc(kf)}</textarea><textarea id="kb_" rows="3" placeholder="${L[1]}">${esc(kb)}</textarea>${ksrc==='e'?`<textarea id="kn_" rows="2" placeholder="Por que errei? Macete (opcional)">${esc(kn)}</textarea>`:''}`}
  ${kmsg?`<small style="color:var(--ok)">${kmsg}</small>`:''}<button class="btn" onclick="kSave()">Salvar e continuar</button></div></div>`}
function kBrowse(){
  const m=mat(kbrw)||{name:'Matéria',color:'#6B7280'},L=S.cards.filter(c=>c.mid===kbrw&&(kflt!=='e'||c.src==='e')).sort((a,b)=>a.due<b.due?-1:1);
  return `<button class="chip" onclick="kmode='home';render()">‹ Voltar</button>
  <div class="card" style="margin-top:10px"><div class="row"><i class="dot lg" style="background:${m.color}"></i><h2 style="margin:0;flex:1">${esc(m.name)}</h2><button class="chip" onclick="kGo('add','n','${kbrw}')">＋ Novo</button></div>
  <div class="seg" style="margin:10px 0"><button class="${kflt!=='e'?'on':''}" onclick="kFlt('')">Todos</button><button class="${kflt==='e'?'on':''}" onclick="kFlt('e')">Só erros</button></div>
  ${L.length?L.map(c=>{const n=left(c.due);return `<div class="item"><div class="g"><b class="ell">${esc(c.f.split('\n')[0])}</b><small class="ell" style="display:block">${esc(c.b.split('\n')[0])}</small></div>${c.src==='e'?'<span class="ker">ERRO</span>':''}<span class="pill" style="color:${n<=0?'var(--warn)':'var(--mute)'}">${n<=0?'hoje':n+'d'}</span><button class="x" aria-label="Apagar" onclick="kDel('${c.id}')">×</button></div>`}).join(''):empty('Nenhum cartão aqui.')}</div>`}

/* aba Estudo ganha "Cartões" */

/* ===== PROVAS (auxiliares) ===== */
const nextExams=()=>S.exams.filter(e=>left(e.d)>=0).sort((a,b)=>a.d<b.d?-1:1);
const tone=n=>n<=3?'var(--bad)':n<=10?'var(--warn)':'var(--ok)';
function examRow(e){const n=left(e.d);return `<div class="item"><div class="g"><b>${esc(e.name)}</b><br><small>${fd(e.d)}</small></div><span class="pill" style="color:${n<0?'var(--mute)':tone(n)}">${n<0?'passou':n===0?'hoje':n+'d'}</span><button class="x" aria-label="Apagar" onclick="del('exams','${e.id}')">×</button></div>`}
function addExam(){const n=v('en').trim(),d=v('ed');if(!n||!d)return;if(n&&!S.subs.includes(n))S.subs.push(n);S.exams.push({id:uid(),name:n,d});save();render()}

/* ===== QUESTÕES: atalho para salvar erro ===== */
const _vQuest=vQuest;
vQuest=function(){return `<button class="chip" style="margin-bottom:10px" onclick="kGo('add','e','${(S.sel.q||{}).m||''}')">📝 Salvar uma questão que errei no Anki</button>`+_vQuest()};

/* ===== LEITURA ===== */
let rbook='';
const bookRead=id=>S.rd.filter(r=>r.b===id).reduce((t,r)=>t+(r.p||0),0);
function addRd(m,p){
  m=Math.round(+m);p=Math.round(+p||0);const nb=v('rb_n').trim();let b=v('rb_s')||rbook;
  if(b==='__new'||(!b&&nb)){if(!nb){setMsg('l','Dê um nome ao livro.');rr();return}const tp=Math.round(+v('rb_t'))||0;b=uid();S.books.push({id:b,t:nb,pages:tp,done:false})}
  if(!(m>=1)){setMsg('l','Informe os minutos lidos.');rr();return}
  S.rd.push({id:uid(),d:v('rb_d')||dk(),b,m,p});rbook=b;setMsg('l','Leitura registrada. +'+m+' XP',1);save();render()}
function quickRd(m){const b=S.books.find(x=>!x.done);S.rd.push({id:uid(),d:dk(),b:b?b.id:'',m,p:0});save();render()}
function finBook(id){const b=S.books.find(x=>x.id===id);if(!b||b.done)return;b.done=true;b.fd=dk();S.bonus=(S.bonus||0)+100;save();render();toast('📕 Livro concluído! +100 XP','ach')}
function delBook(id){if(!confirm('Apagar o livro e as leituras dele?'))return;S.books=S.books.filter(b=>b.id!==id);S.rd=S.rd.filter(r=>r.b!==id);save();render()}
function vLeitura(){
  const ds=stat(dk()),M_=ds.M.find(a=>a.id==='r'),hoje=DAY(dk()),mo=dk().slice(0,7);
  const w=[...Array(7)].map((_,i)=>{const k=addD(dk(),i-6);return{k,w:DOW[new Date(k+'T00:00').getDay()][0],m:DAY(k).rm}}),mx=Math.max(20,...w.map(x=>x.m));
  const pgM=S.rd.filter(r=>r.d.startsWith(mo)).reduce((t,r)=>t+(r.p||0),0),bk=S.books.filter(b=>b.done&&(b.fd||'').startsWith(dk().slice(0,4))).length;
  const act=S.books.filter(b=>!b.done),dn=S.books.filter(b=>b.done);
  const sel=rbook||(act[0]||{}).id||'',rec=S.rd.slice().reverse().slice(0,6);
  return `<div class="card hero-m"><div class="row">${ring(pct(hoje.rm,M_.g),'📖')}<div class="g"><small>Leitura de hoje</small><div class="big2">${hoje.rm}<small> / ${M_.g} min</small></div><small>${M_.ok?'✓ Meta batida':'Falta cumprir: perde −'+ds.perMiss(M_)+' XP'}</small></div></div>
    <div class="three" style="margin-top:12px"><button class="btn g" onclick="quickRd(10)">+10 min</button><button class="btn g" onclick="quickRd(20)">+20 min</button><button class="btn g" onclick="quickRd(30)">+30 min</button></div></div>
  <div class="grid3"><div class="stat"><b>${hm(w.reduce((t,x)=>t+x.m,0))}</b><span>Lido em 7 dias</span></div><div class="stat"><b>${pgM}</b><span>Páginas no mês</span></div><div class="stat"><b>${bk}</b><span>Livros no ano</span></div></div>
  <div class="card"><h2>Registrar leitura</h2><div class="stack">
    <select id="rb_s" aria-label="Livro" onchange="rbook=this.value;rr()"><option value="">Escolha o livro…</option>${act.map(b=>`<option value="${b.id}"${b.id===sel?' selected':''}>${esc(b.t)}</option>`).join('')}<option value="__new"${rbook==='__new'?' selected':''}>＋ Novo livro…</option></select>
    ${rbook==='__new'||!act.length?`<div class="two"><input id="rb_n" placeholder="Título do livro"><input id="rb_t" type="number" inputmode="numeric" placeholder="Total de páginas"></div>`:''}
    <div class="two"><input id="rb_m" type="number" inputmode="numeric" min="1" placeholder="Minutos lidos"><input id="rb_p" type="number" inputmode="numeric" min="0" placeholder="Páginas (opcional)"></div>
    <input id="rb_d" type="date" value="${dk()}" aria-label="Data">${msg('l')}<button class="btn" onclick="addRd(v('rb_m'),v('rb_p'))">Registrar</button></div></div>
  <div class="card"><h2>Minutos por dia</h2><div class="bars">${w.map((x,i)=>`<div class="bar${i===6?' t':''}"><small>${x.m||''}</small><i style="height:${Math.max(3,x.m/mx*70)}px;${x.m>=M_.g?'background:var(--ok)':''}"></i>${x.w}</div>`).join('')}</div><small>Verde = bateu a meta de ${M_.g} min.</small></div>
  ${act.length?`<div class="card"><h2>Lendo agora</h2>${act.map(b=>{const r=bookRead(b.id),p=pct(r,b.pages);return `<div class="item"><div class="g"><b>${esc(b.t)}</b><small style="display:block">${b.pages?r+' de '+b.pages+' páginas · '+p+'%':r+' páginas lidas'}</small>${b.pages?bar(p):''}</div><button class="chip" onclick="finBook('${b.id}')">Terminei</button><button class="x" aria-label="Apagar" onclick="delBook('${b.id}')">×</button></div>`}).join('')}</div>`:''}
  ${dn.length?`<div class="card"><h2>Concluídos <small>(${dn.length})</small></h2>${dn.map(b=>`<div class="item"><span class="ic">📕</span><div class="g"><b>${esc(b.t)}</b><small style="display:block">${b.fd?fd(b.fd):''}</small></div></div>`).join('')}</div>`:''}
  ${rec.length?`<div class="card"><h2>Registros recentes</h2>${rec.map(r=>{const b=S.books.find(x=>x.id===r.b);return `<div class="item"><div class="g"><b>${esc(b?b.t:'Leitura livre')}</b><small style="display:block">${fd(r.d)}${r.p?' · '+r.p+' pág.':''}</small></div><b>${r.m} min</b><button class="x" aria-label="Apagar" onclick="del('rd','${r.id}')">×</button></div>`}).join('')}</div>`:''}`}

/* ===== HUB DO ESTUDO ===== */
const SPAGES={c:['Cronômetro','⏱️'],f:['Foco total','🎯'],k:['Cartões','🃏'],r:['Revisões','🔁'],q:['Questões','✍️'],l:['Leitura','📖'],t:['Tempo estudado','📊'],p:['Provas','🗓️'],m:['Matérias','📚'],v:['Vila','🏘️']};
function stab(k){ss=k;ssub='';MSG={};qa='';selk=-1;qi=-1;render();scrollTo(0,0)}
let ssub='';
function runLabel(){const t=S.timer,m=mat(t.mid),tp=tpc(t.mid,t.tid);return(m?m.name:'Estudo')+(tp?' · '+tp.name:'')}
function splitPage(k,html){
  const defs={c:[['Cronômetro','Manual e histórico'],/O que você vai estudar/],q:[['Registrar','Desempenho'],/Registrar questões|Registros recentes/]}[k];
  if(!defs)return html;
  const P=html.split(/(?=<div class="card[ "])/).filter(x=>x.trim()),isA=x=>!x.startsWith('<div class="card')||defs[1].test(x);
  const a=P.filter(isA),b=P.filter(x=>!isA(x));if(!a.length||!b.length)return html;
  const cur=ssub||'0';
  return `<div class="seg">${defs[0].map((n,i)=>`<button class="${cur===String(i)?'on':''}" onclick="ssub='${i}';render()">${n}</button>`).join('')}</div>`+(cur==='0'?a:b).join('')}
function vHub(){
  const ds=stat(dk()),t=S.timer,run=t.run||t.acc>0,rv=revList().due.length,kd=kdue().length,hj=S.kr[dk()]||0,ne=nextExams()[0],rd=DAY(dk()).rm,rg=ds.M.find(a=>a.id==='r');
  const tl=(ic,nm,sb,go_,bd)=>`<button class="tile" onclick="${go_}"><b>${ic}</b><span>${nm}</span><small>${sb}</small>${bd?`<i class="nb">${bd}</i>`:''}</button>`;
  return `<div class="card hero-m"><div class="row"><div class="g"><small>Estudo de hoje</small><div class="big2">${hm(ds.M[0].v)}<small> de ${hm(ds.dg)}</small></div></div>${ring(pct(ds.M[0].v,ds.dg),'🧠')}</div>
    ${bar(pct(ds.M[0].v,ds.dg))}
    <button class="btn kgo" onclick="stab('c')">${run?(t.run?'● Continuar ':'❚❚ Retomar ')+clock(elapsed()):'▶ Começar a estudar'}</button>
    <small style="display:block;margin-top:8px">${ds.M[0].ok?'✓ Meta de estudo batida.':'Não cumprir custa −'+ds.perMiss(ds.M[0])+' XP.'} ${hj?'· '+hj+' cartões hoje':''}</small></div>
  ${vilaCard()}
  <h2 class="sec">Estudar</h2><div class="tiles">${tl('⏱️','Cronômetro',run?clock(elapsed()):'registre seu tempo',"stab('c')")}${tl('🎯','Foco total','sessão guiada',"stab('f')")}${tl('🃏','Cartões',kd?kd+' para revisar':'Anki por matéria',"stab('k')",kd)}${tl('🔁','Revisões',rv?rv+' para hoje':'em dia',"stab('r')",rv)}</div>
  <h2 class="sec">Praticar</h2><div class="tiles">${tl('✍️','Questões',ds.M[1].v?ds.M[1].v+' hoje':'acertos e erros',"stab('q')")}${tl('📝','Caderno de erros','salvar questão errada',"kGo('add','e')")}${tl('📖','Leitura',rg?rd+' / '+rg.g+' min hoje':'livros e páginas',"stab('l')")}</div>
  <h2 class="sec">Acompanhar</h2><div class="tiles">${tl('📊','Tempo','gráficos por matéria',"stab('t')")}${tl('🗓️','Provas',ne?'próxima em '+left(ne.d)+' d':'datas das provas',"stab('p')")}${tl('📚','Matérias',S.mats.length+' cadastradas',"stab('m')")}${tl('🏘️','Vila','cresce com o estudo',"stab('v')")}</div>`}
V.study=function(){
  if(!SPAGES[ss])ss='h';if(ss==='h')return vHub();
  const t=S.timer,run=t.run||t.acc>0,pg=SPAGES[ss],due=revList().due.length,kd=kdue().length,bd=ss==='r'?due:ss==='k'?kd:0;
  const bar_=`<div class="sbar"><button class="back" onclick="stab('h')">‹ Estudo</button><b>${pg[1]} ${pg[0]}</b>${bd?`<span class="bdg">${bd}</span>`:''}</div>`;
  const ban=run&&ss!=='c'?`<button class="runb" onclick="stab('c')"><span>${t.run?'●':'❚❚'}</span><b class="clk">${clock(elapsed())}</b><span class="lb">${esc(runLabel())}</span><span>Abrir ›</span></button>`:'';
  return bar_+ban+splitPage(ss,({t:vTempo,c:vCron,q:vQuest,k:vCards,r:vRev,m:vMats,p:vProvas,f:vFoco,l:vLeitura,v:vVilaPage}[ss])())};
