/* =====================================================================
   ESTUDOS: matérias, conteúdos, cronômetro, gráficos, questões e revisões
   (carregado depois do app.js; usa S, save, dk, fd, v, uid, esc, clock...)
   ===================================================================== */

/* ===== CONSTANTES E ESTADO DA TELA ===== */
const MC=['#2ECC71','#3B82F6','#F59E0B','#A855F7','#EC4899','#22D3EE','#EF4444','#EAB308','#14B8A6','#F97316','#8B5CF6','#94A3B8'];
const RI=[1,7,30];                       // revisões espaçadas (dias depois do estudo)
const SUGG=['Língua Portuguesa','Matemática','Raciocínio Lógico','Direito Constitucional','Direito Administrativo','Noções de Informática','Redação','Atualidades'];
const MON=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
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
function rr(){const o={};document.querySelectorAll('#view input[id]').forEach(e=>o[e.id]=e.value);render();for(const k in o){const e=document.getElementById(k);if(e&&e.tagName==='INPUT'&&e.type!=='checkbox')e.value=o[k]}}
const setMsg=(c,t,ok)=>{MSG[c]=t?{t,ok}:null};
const msg=c=>MSG[c]?`<small style="display:block;margin-top:8px;color:${MSG[c].ok?'var(--ok)':'var(--warn)'}">${MSG[c].t}</small>`:'';
const empty=t=>`<div class="empty">${t}</div>`;

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
  const t=new Date();t.setHours(0,0,0,0);let a,b,lb;
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

/* ===== TELA PRINCIPAL DE ESTUDO ===== */
const ST=[['t','Tempo'],['c','Cronômetro'],['q','Questões'],['r','Revisões'],['m','Matérias'],['p','Provas']];
function stab(k){ss=k;MSG={};qa='';selk=-1;qi=-1;render();scrollTo(0,0)}
function runLabel(){const t=S.timer,m=mat(t.mid),tp=tpc(t.mid,t.tid);return(m?m.name:'Estudo')+(tp?' · '+tp.name:'')}
V.study=function(){
  const due=revList().due.length,t=S.timer,run=t.run||t.acc>0;
  const seg=`<div class="seg sc">${ST.map(a=>`<button class="${ss===a[0]?'on':''}" onclick="stab('${a[0]}')">${a[1]}${a[0]==='r'&&due?` <span class="bdg">${due}</span>`:''}</button>`).join('')}</div>`;
  const ban=run&&ss!=='c'?`<button class="runb" onclick="stab('c')"><span>${t.run?'●':'❚❚'}</span><b class="clk">${clock(elapsed())}</b><span class="lb">${esc(runLabel())}</span><span>Abrir ›</span></button>`:'';
  return seg+ban+({t:vTempo,c:vCron,q:vQuest,r:vRev,m:vMats,p:vProvas,f:vFoco}[ss]||vTempo)()};

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


/* =====================================================================
   V3: novo painel (4 pilares), plano de salário e dívidas, página de XP,
   menu inferior. Sobrescreve V.home, V.money e adiciona V.more e V.xp.
   ===================================================================== */
Object.assign(TT,{more:'Mais',xp:'XP e níveis'});
S.sal=Object.assign({inc:0,day:5,fix:0,pd:50,pf:30,pl:20},S.sal||{});
S.debts=S.debts||[];
ms='s';
const pct=(a,b)=>b>0?Math.min(100,Math.round(a/b*100)):0;
const ring=(p,ic)=>`<div class="ring" style="--p:${p}"><span>${ic}</span></div>`;
const pil=(go_,ic,nm,p,l1,l2)=>`<button class="pil" onclick="go('${go_}')">${ring(p,ic)}<b>${nm}</b><small>${l1}</small><small>${l2}</small></button>`;

/* ===== TELA INICIAL ===== */
V.home=function(){
  const p=S.prof,X=xp(),li=lvl(X),cur=STEPS[li],nx=STEPS[li+1],ri=cur.i,pc=nx?Math.round((X-cur.x)/(nx.x-cur.x)*100):100,nr=RK[ri+1];
  const ds=dayStat(dk()),ne=nextExams(),tg=p.date&&left(p.date)>=0?{n:p.goal||'o concurso',d:p.date}:ne[0]?{n:ne[0].name,d:ne[0].d}:null;
  const hr=new Date().getHours(),gr=hr<12?'Bom dia':hr<18?'Boa tarde':'Boa noite',st=streak(),mk=Object.keys(MS).map(Number).find(m=>m>st);
  const mo=S.fin.filter(x=>x.d.startsWith(dk().slice(0,7))&&!x.x&&isP(x)),rec=sum(mo,'r'),gas=sum(mo,'g'),inc=S.sal.inc||rec,sob=inc-gas;
  const up=[...S.ag.map(a=>({d:a.d,t:a.t,n:a.n})),...S.exams.map(e=>({d:e.d,t:'',n:'Prova: '+e.name}))].filter(a=>a.d>=dk()).sort((a,b)=>(a.d+a.t)<(b.d+b.t)?-1:1).slice(0,3);
  const tasks=S.plan.filter(x=>x.dow===new Date().getDay()),bd=board(),wk=S.tr.filter(x=>left(x.d)>-7).length;
  const mente=Math.round((Math.min(1,ds.m/ds.dg)+Math.min(1,ds.q/ds.qg))/2*100);
  const mm=[['Estudo',ds.m,ds.dg,' min','study'],['Questões',ds.q,ds.qg,'','study'],['Treino',ds.t,1,'','train']].filter(a=>a[1]<a[2]).sort((a,b)=>b[1]/b[2]-a[1]/a[2])[0];
  const why=p.why?esc(p.why):QT[Math.floor(Date.now()/864e5)%QT.length];
  return `<div class="hero2"><div class="top2"><small>${gr}${p.nome?', '+esc(p.nome):''}</small><span class="flame">🔥 ${st} ${st===1?'dia':'dias'}</span></div>
  <button class="stage" onclick="go('xp')" aria-label="Ver XP e personagens">${heroImg(ri,260,false,true)}<div class="nm">${RK[ri][0]}</div><small class="slog">${SLOG[ri]}</small></button>
  ${xpBar('home',X,ds)}
  <div class="cnt2"><b>${tg?left(tg.d):'—'}</b><span>${tg?(left(tg.d)===1?'dia':'dias')+' para '+esc(tg.n):'Defina seu alvo em Mais › Vida'}</span></div><p class="q">${why}</p><div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="chip" onclick="go('map')">🗺️ Mapa da jornada</button><button class="chip" onclick="go('goals')">🎯 Metas</button><button class="chip" onclick="go('xp')">⚡ XP</button></div></div>
  ${mm?`<button class="card near" onclick="go('${mm[4]}')"><span class="ic">⚡</span><div class="g"><b>Falta pouco: ${mm[0]}</b><br><small>${mm[2]-mm[1]}${mm[3]} para fechar. Toque e vá.</small></div><span>›</span></button>`:''}
  <h2 class="sec">Hoje nos 4 pilares</h2>
  <div class="pils">${pil('study','🧠','Mente',mente,hm(ds.m)+' de '+hm(ds.dg),ds.q+' de '+ds.qg+' questões')+pil('train','💪','Corpo',ds.t>=1?100:0,ds.t>=1?'Treinou hoje':'Falta treinar',wk+' treinos em 7 dias')+pil('habits','🌱','Vida',S.habits.length?pct(ds.h,S.habits.length):0,S.habits.length?ds.h+' de '+S.habits.length+' hábitos':'Crie hábitos','agenda e rotina')+pil('money','💰','Grana',inc?Math.max(0,100-pct(gas,inc)):0,inc?'sobra '+R(sob):'Defina o salário','gasto '+R(gas))}</div>
  ${chestCard(ds)}
  ${mk?`<div class="card"><div class="row"><b>🔥 Próximo prêmio de sequência</b><span class="mute" style="margin-left:auto">${mk} dias: +${MS[mk]} XP</span></div><div class="meter" style="margin:8px 0 4px"><i style="width:${pct(st,mk)}%"></i></div><small>Faltam ${mk-st} ${mk-st===1?'dia':'dias'}. Faltar um dia zera a sequência.</small></div>`:''}
  <div class="card"><h2>Missões do dia</h2>${mis('Estudo',ds.m,ds.dg,'min')}${mis('Questões',ds.q,ds.qg,'')}${mis('Treino',ds.t,1,'')}${ds.hv?mis('Hábitos',ds.h,S.habits.length,''):''}<small>${ds.win?'Dia vencido! 🔥':ds.loss?'Cumpra as metas para evitar −'+ds.loss+' XP. Seu rank nunca cai.':''}</small></div>
  ${revCard()}
  <div class="card"><h2>Próximos compromissos</h2>${up.length?up.map(a=>`<div class="item"><b style="width:64px">${left(a.d)===0?'Hoje':left(a.d)===1?'Amanhã':fd(a.d).slice(0,5)}</b><div class="g">${esc(a.n)}</div><small>${a.t}</small></div>`).join(''):'<div class="empty">Nada marcado.</div>'}</div>
  ${tasks.length?`<div class="card"><h2>Tarefas de hoje</h2>${tasks.map(taskRow).join('')}</div>`:''}
  <div class="card"><h2>Quadro de dias <small>${bd.tot?bd.won+' de '+bd.tot+' vencidos':''}</small></h2><div class="heat">${bd.h}</div></div>`};

/* ===== MENU "MAIS" ===== */
V.more=function(){const I=[['agenda','▦','Agenda','compromissos'],['habits','✔','Hábitos','sequências'],['plan','☰','Tarefas','semana'],['mentor','✦','Mentor','mentalidade'],['map','🗺','Mapa da jornada','seu caminho'],['goals','🎯','Metas','passos e gatilhos'],['xp','⚡','XP e níveis','como funciona'],['life','◆','Vida','cadastro e cores']];
  return `<div class="more">${I.map(i=>`<button class="mb" onclick="go('${i[0]}')"><b>${i[1]}</b><span>${i[2]}</span><small>${i[3]}</small></button>`).join('')}</div>`};

/* ===== PÁGINA DE XP ===== */
V.xp=function(){
  const g=gross(),pn=penalty(),X=xp(),ri=rank(X),sl=5+ri;
  const src=[['Tempo de estudo','1 XP por minuto'],['Questões','2 XP por questão feita + 3 por acerto'],['Treino','30 XP + 1,5 por minuto'],['Tarefas do plano','15 XP cada'],['Revisões','10 XP cada'],['Hábitos','10 XP cada, por dia'],['Lançar gasto pago','5 XP cada']];
  const wh=[['Neurociência da repetição','Rever o conteúdo em 1, 7 e 30 dias combate a curva do esquecimento. Por isso as revisões valem XP.'],['Gatilho + ação','Decidir antes "quando X, faço Y" reduz a dependência de vontade. As missões diárias fazem esse papel.'],['Meta que sobe 1% ao dia','Aumentar um pouco todo dia evita o choque de começar pesado e constrói consistência.'],['Perder dói mais que ganhar','Por isso metas não cumpridas descontam XP: o app usa a aversão à perda a seu favor.'],['Recompensa imediata e surpresa','O cérebro libera mais dopamina quando a recompensa vem logo após o ato e quando é um pouco imprevisível. Por isso o +XP aparece na hora e o baú diário sorteia o bônus.'],['Ver o progresso chegando','Quanto mais perto da meta, mais motivação. Por isso os anéis e a barra mostram sempre quanto falta.'],['Dinheiro também é disciplina','Lançar gastos dá XP porque o que você mede, você controla.']];
  return `<div class="hero2"><small>Seu total</small><div class="cnt">${X}<span>XP · ${STEPS[lvl(X)].n}</span></div><small>Ganho ${g} XP · perdido ${pn} XP por metas não cumpridas</small></div>
  <div class="card"><h2>De onde vem o XP</h2>${src.map(s=>`<div class="item"><b>${s[0]}</b><span class="mute" style="margin-left:auto;text-align:right">${s[1]}</span></div>`).join('')}</div>
  <div class="card"><h2>Como se perde XP</h2><p class="mute" style="margin:0">No começo a perda é pequena: hoje ela vale ${Math.round(HF()*100)}% do valor cheio (estudo −40, questões −30, treino −30, hábitos −30). A cada rank ela cresce, até passar de 100%. Seu rank nunca cai: você só perde XP dentro do rank atual. O dia de hoje só pesa quando acaba.</p></div>
  <div class="card"><h2>Personagens e ranks</h2><div class="gal">${RK.map((r,k)=>`<div class="gi${k===ri?' on':''}">${heroSvg(k,64,k>ri)}<b>${k>ri?'???':r[0]}</b><small>${r[1]} XP</small></div>`).join('')}</div><small>Cada rank sobe 5% a meta diária, mas libera +1 vaga de hábito (você tem ${sl}).</small></div>
  <div class="card"><h2>Por que funciona</h2>${wh.map(w=>`<details><summary><b>${w[0]}</b></summary><p class="mute" style="margin:6px 0 2px">${w[1]}</p></details>`).join('')}</div>`};

/* ===== GRANA: PLANO DE SALÁRIO + DÍVIDAS ===== */
function payoff(extra){ // método avalanche: maior juros primeiro; devolve meses e juros pagos
  let d=S.debts.map(x=>({s:+x.t||0,p:+x.p||0,j:(+x.j||0)/100})).filter(x=>x.s>0),m=0,ju=0;
  while(d.length&&m<600){m++;let ex=extra;d.sort((a,b)=>b.j-a.j);
    d.forEach(x=>{const j=x.s*x.j;ju+=j;x.s+=j;const pg=Math.min(x.s,x.p);x.s-=pg});
    d.forEach(x=>{if(x.s>0&&ex>0){const pg=Math.min(x.s,ex);x.s-=pg;ex-=pg}});
    d=d.filter(x=>x.s>.5);}
  return{m,ju:Math.round(ju),ok:m<600}}
function saveSal(){const s=S.sal;s.inc=+v('si')||0;s.fix=+v('sf')||0;s.day=+v('sd')||5;s.pd=+v('spd')||0;s.pf=+v('spf')||0;s.pl=Math.max(0,100-s.pd-s.pf);save();rr()}
function addD(){const n=v('dn').trim(),t=+v('dt');if(!n||!t)return;S.debts.push({id:uid(),n,t,p:+v('dp')||0,j:+v('dj')||0});save();rr()}
function payD(i){const x=+v('dv'+i),d=S.debts.find(a=>a.id===i);if(!x||!d)return;d.t=Math.max(0,d.t-x);save();rr()}
M.s=function(){
  const s=S.sal,pg=S.debts.reduce((t,d)=>t+(+d.p||0),0),liv=Math.max(0,s.inc-s.fix-pg),dv=S.debts.length?Math.round(liv*s.pd/100):0,pdv=S.debts.length?s.pd:0;
  const fu=Math.round(liv*(S.debts.length?s.pf:s.pf+s.pd)/100),li=Math.max(0,liv-dv-fu);
  const parts=[['Contas fixas',s.fix,'#3B82F6'],['Parcelas de dívidas',pg,'#E5322D'],['Dívida extra',dv,'#F59E0B'],['Futuro (reserva e metas)',fu,'var(--acc)'],['Livre / lazer',li,'#A855F7']].filter(a=>a[1]>0);
  const cur=payoff(dv),sem=payoff(0);
  return `<div class="card"><h2>Meu salário</h2><div class="stack"><div class="two"><div><small>Salário líquido (R$)</small><input id="si" type="number" value="${s.inc||''}" placeholder="0,00"></div><div><small>Dia que cai</small><input id="sd" type="number" min="1" max="31" value="${s.day}"></div></div><div class="two"><div><small>Contas fixas por mês (R$)</small><input id="sf" type="number" value="${s.fix||''}" placeholder="aluguel, luz, mercado"></div><div><small>% do que sobra para dívida</small><input id="spd" type="number" min="0" max="100" value="${s.pd}"></div></div><div class="two"><div><small>% do que sobra para o futuro</small><input id="spf" type="number" min="0" max="100" value="${s.pf}"></div><div><small>% livre (automático)</small><input disabled value="${Math.max(0,100-s.pd-s.pf)}"></div></div><button class="btn" onclick="saveSal()">Calcular plano</button></div></div>
  ${s.inc?`<div class="card"><h2>Para onde vai cada real</h2><div class="split big8">${parts.map(a=>`<i style="width:${a[1]/s.inc*100}%;background:${a[2]}"></i>`).join('')}</div>${parts.map(a=>`<div class="item"><i class="dot" style="background:${a[2]}"></i><b>${a[0]}</b><span style="margin-left:auto"><b>${R(a[1])}</b> <small>${Math.round(a[1]/s.inc*100)}%</small></span></div>`).join('')}${s.inc-s.fix-pg<0?'<small class="out">Fixos + parcelas passam do salário. Renegocie ou corte antes de tudo.</small>':''}</div>
  <div class="card"><h2>Foco no futuro</h2><div class="grid3" style="margin:0"><div class="stat"><b>${R(fu)}</b><span>guardado por mês</span></div><div class="stat"><b>${R(fu*12)}</b><span>em 12 meses</span></div><div class="stat"><b>${S.debts.length?(cur.ok?cur.m+' meses':'sem fim'):'sem dívidas'}</b><span>para quitar tudo</span></div></div>${S.debts.length&&cur.ok&&sem.ok&&sem.m>cur.m?`<small style="display:block;margin-top:10px">Com a dívida extra você quita ${sem.m-cur.m} meses antes e economiza cerca de ${R(sem.ju-cur.ju)} em juros.</small>`:''}</div>`:'<div class="empty">Informe o salário para ver o plano.</div>'}`};
M.d=function(){
  const tot=S.debts.reduce((t,d)=>t+(+d.t||0),0),ord=S.debts.slice().sort((a,b)=>(+b.j||0)-(+a.j||0));
  return `<div class="card bal"><small>Total devido</small><div class="bn out">${R(tot)}</div><small>Ordem de ataque: maior juros primeiro (economiza mais)</small></div>
  ${ord.map((d,i)=>`<div class="card"><div class="row"><b style="flex:1">${i===0?'🎯 ':''}${esc(d.n)}</b><button class="x" aria-label="Apagar" onclick="del('debts','${d.id}')">×</button></div><div style="font-size:24px;font-weight:800;margin:4px 0">${R(d.t)}</div><small>parcela ${R(d.p)} · juros ${d.j}% ao mês</small><div class="row" style="margin-top:10px"><input id="dv${d.id}" type="number" placeholder="Abater (R$)"><button class="btn" onclick="payD('${d.id}')">Abater</button></div></div>`).join('')||'<div class="empty">Nenhuma dívida. Ótimo.</div>'}
  <div class="card"><h2>Nova dívida</h2><div class="stack"><input id="dn" placeholder="Cartão, financiamento, empréstimo"><div class="two"><input id="dt" type="number" placeholder="Saldo devedor (R$)"><input id="dp" type="number" placeholder="Parcela por mês (R$)"></div><input id="dj" type="number" step="0.1" placeholder="Juros ao mês (%)"><button class="btn" onclick="addD()">Adicionar</button></div></div>`};
V.money=function(){const t=new Date(fm+'-01T00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  const hide=ms==='s'||ms==='d';
  return `<div class="seg sc">${[['s','Plano'],['d','Dívidas'],['r','Resumo'],['c','Contas'],['p','Tetos'],['m','Metas']].map(a=>`<button class="${ms===a[0]?'on':''}" onclick="ms='${a[0]}';render()">${a[1]}</button>`).join('')}</div>`+(hide?'':`<div class="row" style="margin-bottom:10px"><button class="x" aria-label="Mês anterior" onclick="fmv(-1)">‹</button><b style="flex:1;text-align:center;text-transform:capitalize">${t}</b><button class="x" aria-label="Próximo mês" onclick="fmv(1)">›</button></div>`)+M[ms]()};


/* ===== V4: personagem, recompensas imediatas e baú diário ===== */
const AV=['🥚','🐣','🐺','🦊','🐅','🦅','🦁','🐲','🔥','👑','⚡'];
function toast(t,big){const d=document.createElement('div');d.className='toast'+(big?' big':'');d.textContent=t;document.body.appendChild(d);try{navigator.vibrate&&navigator.vibrate(25)}catch(x){}setTimeout(()=>d.remove(),1700)}
function levelUp(r){const d=document.createElement('div');d.className='lvlup';d.onclick=()=>d.remove();
  d.innerHTML='<div class="cf">'+Array.from({length:24},(_,i)=>`<i style="left:${Math.random()*100}%;animation-delay:${Math.random()*.8}s">${['✨','⭐','🎉'][i%3]}</i>`).join('')+`</div><div class="lb2"><small>NOVO RANK</small><div class="av">${heroSvg(r,170)}</div><h1>${RK[r][0]}</h1><small>Toque para continuar</small></div>`;
  document.body.appendChild(d);try{navigator.vibrate&&navigator.vibrate([60,40,120])}catch(x){}}
const _render=render;
render=function(){let ms='';S.mg=S.mg||{};const sk=streak();Object.keys(MS).forEach(k=>{if(sk>=k&&!S.mg[k]){S.mg[k]=1;S.bonus=(S.bonus||0)+MS[k];ms='🔥 '+k+' dias! +'+MS[k]+' XP'}});_render();const g=gross(),r=rank(xp());
  if(S.lg==null){S.lg=g;S.lr=r;save();return}
  const d=g-S.lg;if(d!==0){S.lg=g;save()}
  if(r>S.lr){S.lr=r;save();levelUp(r)}else if(ms)toast(ms,1);else if(d>0)toast('+'+d+' XP')};
function chest(){const k=dk(),ds=dayStat(k);if(S.ch[k]||ds.ok.filter(Boolean).length<2)return;
  const crit=Math.random()<.1,b=crit?150:Math.round(20+Math.random()*(ds.win?60:30));
  S.ch[k]=b;S.bonus=(S.bonus||0)+b;save();render();if(crit)toast('💎 CRÍTICO!',1)}
function chestCard(ds){const k=dk(),o=S.ch[k],n=ds.ok.filter(Boolean).length;
  return o?`<div class="card chest"><span class="ic">🎁</span><div class="g"><b>Baú de hoje aberto</b><br><small>Você ganhou +${o} XP${o===150?' (crítico!)':''}</small></div></div>`
  :n>=2?`<button class="card chest ready" onclick="chest()"><span class="ic">🎁</span><div class="g"><b>Baú pronto!</b><br><small>Toque para abrir e ver o prêmio</small></div></button>`
  :`<div class="card chest"><span class="ic">🔒</span><div class="g"><b>Baú diário</b><br><small>Cumpra 2 missões para abrir (${n}/2). Completar tudo aumenta o prêmio.</small></div></div>`}


/* ===== V5: um personagem por rank ===== */
const MS={3:50,7:150,14:300,30:700,60:1500};
/* ===== GASTOS: painel de controle ===== */
const _Mr=M.r;
M.r=function(){
  const all=S.fin.filter(x=>x.d.startsWith(fm)),e=all.filter(x=>!x.x),rp=e.filter(isP),pe=e.filter(x=>!isP(x)),r=sum(rp,'r'),g=sum(rp,'g'),pr=sum(pe,'r'),pg=sum(pe,'g'),G=g+pg,lim=+S.prof.budget||S.sal.inc||(r+pr),p=pct(G,lim),col=p>=100?'var(--bad)':p>=80?'var(--warn)':'var(--acc)';
  const by={};e.filter(x=>x.t==='g').forEach(x=>by[x.c||'Outros']=(by[x.c||'Outros']||0)+x.v);
  const tk=Object.keys(by).sort((a,b)=>by[b]-by[a])[0],tg=sum(e,'g'),now=new Date(),cur=fm===dk().slice(0,7),dl=cur?new Date(now.getFullYear(),now.getMonth()+1,0).getDate()-now.getDate()+1:0,day=cur&&lim?Math.max(0,(lim-G)/dl):0;
  return `<div class="mr"><div class="card cock"><div class="gauge" style="--p:${p};--c:${col}"><div><b>${p}%</b><small>do limite</small></div></div><div class="g"><small>Saldo realizado</small><div class="bn ${r-g>=0?'in':'out'}">${R(r-g)}</div>${cur&&lim?`<small>Pode gastar por dia</small><b class="dayv">${R(day)}</b>`:`<small>Previsto: <b>${R(r+pr-g-pg)}</b></small>`}</div></div>
  <div class="grid3"><div class="stat"><b class="in">${R(r)}</b><span>Entrou</span></div><div class="stat"><b class="out">${R(g)}</b><span>Saiu</span></div><div class="stat"><b>${R(r+pr-g-pg)}</b><span>Previsto no fim</span></div></div>
  ${tk?`<div class="card tip2">🔎 Maior gasto: <b>${esc(tk)}</b> · ${Math.round(by[tk]/tg*100)}% (${R(by[tk])})${pg?' · a pagar '+R(pg):''}</div>`:''}${_Mr()}</div>`};

/* =====================================================================
   V6: personagens animados + companheiro, mapa, treino semanal,
   lançamento rápido, metas (se...então), sessão de foco
   ===================================================================== */
Object.assign(TT,{map:'Mapa da jornada',goals:'Metas'});
const UC=['#6b7280','#78716c','#65a30d','#16a34a','#15803d','#2563eb','#1d4ed8','#7c3aed','#c2410c','#b91c1c','#d97706'];
const UD=UC.map(c=>{const n=parseInt(c.slice(1),16);return '#'+[n>>16,n>>8&255,n&255].map(x=>Math.round(x*.6).toString(16).padStart(2,'0')).join('')});
const PC=['#a3b18a','#d4a373','#c08457','#8d99ae','#9ca3af','#f59e0b','#fbbf24','#34d399','#fb923c','#f87171','#fde047'];
const PN=['Slime sonolento','Filhote','Cão de guarda','Lobo jovem','Lobo','Lobo de elite','Lobo dourado','Lobo alado','Lobo flamejante','Dragão jovem','Dragão lendário'];
function star(x,y,r,f){const p=[];for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,q=k%2?r*.42:r;p.push((x+q*Math.cos(a)).toFixed(1)+','+(y+q*Math.sin(a)).toFixed(1))}return `<polygon points="${p.join(' ')}" fill="${f}"/>`}
function petSvg(i){
  const p=PC[i],g='#fbbf24',s=(.8+i*.045).toFixed(2);let o;
  if(i===0)o=`<path d="M-15 12Q-15-9 0-9Q15-9 15 12Z" fill="${p}"/><path d="M-6 0h5M3 0h5" stroke="#222" stroke-width="2" stroke-linecap="round"/><text x="10" y="-10" font-size="9" font-weight="800" fill="#9ca3af" font-family="sans-serif">z</text>`;
  else{
    const w=i>=7?`<ellipse cx="-9" cy="-15" rx="6" ry="15" transform="rotate(-38 -9 -15)" fill="${p}" opacity=".9" stroke="#0004" stroke-width=".8"/><ellipse cx="3" cy="-17" rx="5.5" ry="14" transform="rotate(22 3 -17)" fill="${p}" opacity=".65"/>`:'';
    const tl=i===8||i===10?`<path class="tl" d="M-12 2Q-26-4-24-16Q-18-6-12-4Z" fill="#fb923c"/><path class="tl" d="M-12 2Q-20-2-20-10Q-16-4-12-3Z" fill="#fde047"/>`:`<path class="tl" d="M-12 2Q-25-4-22-15" stroke="${p}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    const er=i<9?`<path d="M9-15L11-24L16-16ZM17-16L21-24L24-14Z" fill="${p}"/>`:`<path d="M9-15L8-26L15-17ZM18-17L24-26L25-14Z" fill="${g}"/>`;
    o=`${w}${tl}<rect x="-9" y="6" width="5" height="9" rx="2" fill="${p}"/><rect x="5" y="6" width="5" height="9" rx="2" fill="${p}"/><ellipse cx="0" cy="0" rx="14" ry="10" fill="${p}"/><circle cx="13" cy="-8" r="9" fill="${p}"/>${er}<circle cx="16" cy="-9" r="1.9" fill="#111"/><circle cx="21" cy="-6" r="1.6" fill="#111"/>`}
  return `<g transform="translate(-2 100) scale(${s})"><g class="pt">${o}</g></g>`}
function heroSvg(i,sz,lock,nopet){
  const c=UC[i],d=UD[i],g='#fbbf24',sk='#f1c27d',id='a'+i+Math.random().toString(36).slice(2,6);let a='',b='',h='',n='';
  const defs=`<defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${d}"/></linearGradient><radialGradient id="${id}"><stop offset="0" stop-color="${i>=10?g:c}" stop-opacity=".6"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>`;
  if(i>=6)a=`<circle class="au" cx="50" cy="60" r="${44+(i-6)*3}" fill="url(#${id})"/>`;
  if(i>=7)b=`<path class="cp" d="M30 52H70L${78+(i-7)*2} 108H${22-(i-7)*2}Z" fill="${i>=9?'#7f1d1d':'#991b1b'}"/>`;
  const body=`<rect x="35" y="90" width="12" height="22" rx="4" fill="#374151"/><rect x="53" y="90" width="12" height="22" rx="4" fill="#374151"/><rect x="32" y="108" width="17" height="7" rx="3" fill="#111827"/><rect x="51" y="108" width="17" height="7" rx="3" fill="#111827"/><rect x="30" y="50" width="40" height="42" rx="12" fill="url(#${id}b)" stroke="#0005" stroke-width="1.2"/><rect x="30" y="80" width="40" height="5" fill="#111827" opacity=".7"/><rect x="46" y="79.5" width="8" height="6" rx="1.5" fill="${i>=2?g:'#4b5563'}"/><rect x="22" y="52" width="10" height="30" rx="5" fill="${c}" stroke="#0005" stroke-width="1"/><rect x="68" y="52" width="10" height="30" rx="5" fill="${c}" stroke="#0005" stroke-width="1"/><circle cx="27" cy="84" r="5" fill="${sk}"/><circle cx="73" cy="84" r="5" fill="${sk}"/>${i>=4?`<ellipse cx="28" cy="53" rx="8" ry="5" fill="${i>=7?g:'#111827'}"/><ellipse cx="72" cy="53" rx="8" ry="5" fill="${i>=7?g:'#111827'}"/>`:''}`;
  const ey=i===0?'<path d="M40 36h7M53 36h7" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>':i===10?`<g class="bl"><ellipse cx="44" cy="36" rx="3.4" ry="3.8" fill="${g}"/><ellipse cx="56" cy="36" rx="3.4" ry="3.8" fill="${g}"/></g>`:'<g class="bl"><ellipse cx="44" cy="36" rx="3" ry="3.6" fill="#222"/><ellipse cx="56" cy="36" rx="3" ry="3.6" fill="#222"/><circle cx="45" cy="34.8" r="1" fill="#fff"/><circle cx="57" cy="34.8" r="1" fill="#fff"/></g>';
  const head=`<circle cx="33" cy="37" r="3.2" fill="${sk}"/><circle cx="67" cy="37" r="3.2" fill="${sk}"/><circle cx="50" cy="35" r="17" fill="${sk}" stroke="#0004" stroke-width="1"/><ellipse cx="39" cy="42" rx="3" ry="2" fill="#f87171" opacity=".35"/><ellipse cx="61" cy="42" rx="3" ry="2" fill="#f87171" opacity=".35"/>${ey}<path d="M44 44q6 ${i===0?-2:4} 12 0" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  if(i===0)h='<path d="M34 28q16-14 32 0q-8-4-16 1q-8-5-16-1z" fill="#57534e"/><text x="62" y="24" font-size="14" font-weight="800" fill="#9ca3af" font-family="sans-serif">z</text><text x="70" y="14" font-size="10" font-weight="800" fill="#9ca3af" font-family="sans-serif">z</text>';
  else if(i===1)h='<path d="M33 32q17-18 34 0q-17-6-34 0z" fill="#44403c"/>';
  else if(i<4)h='<path d="M32 33q18-24 36 0z" fill="#4d5d2a"/><rect x="31" y="31" width="38" height="5" rx="2" fill="#3b4a1e"/>';
  else if(i===4)h='<ellipse cx="46" cy="20" rx="20" ry="8" fill="#7f1d1d" transform="rotate(-8 46 20)"/>';
  else if(i<7)h=`<path d="M32 28q18-18 36 0z" fill="${c}"/><rect x="30" y="26" width="40" height="5" rx="2" fill="${i===6?g:'#111'}"/>`;
  else if(i<9)h=`<path d="M31 27q19-22 38 0z" fill="#111827"/><rect x="29" y="25" width="42" height="6" rx="3" fill="${g}"/>`;
  else if(i===9)h=`<path d="M30 28L34 6H66L70 28z" fill="#111827"/><rect x="29" y="25" width="42" height="6" rx="3" fill="${g}"/>${star(50,16,6,g)}`;
  else h=`<path d="M32 26L36 8L44 18L50 4L56 18L64 8L68 26z" fill="${g}"/><circle class="sp" cx="22" cy="20" r="2" fill="${g}"/><circle class="sp" cx="80" cy="30" r="2.4" fill="${g}" style="animation-delay:.7s"/><circle class="sp" cx="14" cy="62" r="1.8" fill="${g}" style="animation-delay:1.4s"/>`;
  if(i===3||i===4)for(let k=0;k<i-2;k++)n+=`<path d="M42 ${60+k*7}l8 6 8-6" stroke="${g}" stroke-width="3" fill="none"/>`;
  else if(i===5||i===6)for(let k=0;k<i-4;k++)n+=`<rect x="42" y="${62+k*8}" width="16" height="3.5" fill="${g}"/>`;
  else if(i===7)n=star(50,66,8,g);else if(i===8)n=star(42,66,7,g)+star(58,66,7,g);else if(i===9)n=star(50,58,6,g)+star(41,72,6,g)+star(59,72,6,g);
  else if(i===10)n=`<path d="M53 56L42 74h8L47 90 60 68h-8z" fill="${g}"/>`;
  if(i>=5&&i<10)n+=`<circle cx="39" cy="60" r="2.6" fill="${g}"/>`;
  const vb=nopet?'-10 -6 120 126':'-46 -6 156 126',w=nopet?sz:Math.round(sz*1.24),ht=nopet?Math.round(sz*1.05):Math.round(sz*(126/156)*1.24);
  const out=`<svg viewBox="${vb}" width="${w}" height="${ht}" role="img" aria-label="${RK[i][0]}">${defs}<g class="hb">${a}${b}${body}${head}${h}${n}</g>${nopet?'':petSvg(i)}</svg>`;
  return lock?out.replace(/(fill|stop-color|stroke)="(#[0-9a-fA-F]{3,8}|url\([^)]*\))"/g,'$1="#262626"'):out}

/* ===== MAPA DA JORNADA ===== */
V.map=function(){
  const X=xp(),ri=rank(X),W=340,Hh=124,N=RK.length,pos=i=>({x:i%2?250:90,y:(N-1-i)*Hh+80}),ZN={0:'ACAMPAMENTO',3:'QUARTEL',6:'FORTALEZA',9:'TRONO'};
  let on='',off='',nd='';
  for(let i=0;i<N-1;i++){const p=pos(i),q=pos(i+1),m=(p.y+q.y)/2,sg=`M${p.x} ${p.y}C${p.x} ${m} ${q.x} ${m} ${q.x} ${q.y}`;if(i<ri)on+=sg;else off+=sg}
  for(let i=0;i<N;i++){const p=pos(i),cur=i===ri,u=i<=ri,sz=cur?92:58;
    nd+=`${ZN[i]?`<text x="${i%2?20:320}" y="${p.y+4}" text-anchor="${i%2?'start':'end'}" font-size="11" font-weight="800" letter-spacing="2" fill="#ffffff22" font-family="sans-serif">${ZN[i]}</text>`:''}<circle cx="${p.x}" cy="${p.y}" r="${cur?46:30}" fill="${u?UC[i]+'33':'#141414'}" stroke="${u?UC[i]:'#333'}" stroke-width="3"${cur?' class="pls"':''}/>${heroSvg(i,sz,i>ri,!cur).replace('<svg ',`<svg x="${p.x-(cur?sz*.62:sz/2)}" y="${p.y-(cur?sz*.55:sz*.58)}" `)}<text x="${p.x}" y="${p.y+(cur?64:44)}" text-anchor="middle" font-size="${cur?15:12}" font-weight="800" fill="${u?'#fff':'#666'}" font-family="sans-serif">${u?RK[i][0]:'???'}</text><text x="${p.x}" y="${p.y+(cur?80:58)}" text-anchor="middle" font-size="10.5" fill="${cur?UC[i]:'#777'}" font-family="sans-serif">${cur?'VOCÊ ESTÁ AQUI':RK[i][1]+' XP'}</text>`}
  const nx=RK[ri+1];
  return `<div class="card"><h2>Seu caminho até o Supremo</h2><p class="mute" style="margin:0">Cada parada é um rank e um personagem novo. Seu companheiro, <b>${PN[ri]}</b>, evolui com você.${nx?` Próxima parada: <b>${nx[0]}</b>, faltam <b>${nx[1]-X} XP</b>.`:' Você chegou ao topo.'}</p></div>
  <div class="card" style="padding:6px"><svg viewBox="0 0 ${W} ${N*Hh+40}" width="100%" role="img" aria-label="Mapa da jornada"><path d="${off}" stroke="#333" stroke-width="5" stroke-dasharray="3 10" stroke-linecap="round" fill="none"/><path d="${on}" stroke="var(--acc)" stroke-width="6" stroke-linecap="round" fill="none"/>${nd}</svg></div>`};

/* ===== TREINO SEMANAL ===== */
S.tplan=S.tplan||{};let tsel=new Date().getDay();
const TIPOS=['Peito e tríceps','Costas e bíceps','Pernas','Ombros','Cardio','Corrida','Descanso'];
function weekDays(){const t=new Date();t.setHours(0,0,0,0);t.setDate(t.getDate()-t.getDay());return[...Array(7)].map((_,i)=>{const x=new Date(t);x.setDate(t.getDate()+i);return{i,k:dk(x),w:DOW[i]}})}
function setTP(i,t){S.tplan[i]=t;save();rr()}
function addTD(k){const m=Math.round(+v('tm'));if(!m)return;S.tr.push({id:uid(),d:k,k:v('tk').trim(),m,i:+v('ti')});save();rr()}
function setTG(n){S.prof.tgoal=Math.max(1,Math.min(7,(+S.prof.tgoal||4)+n));save();render()}
V.train=function(){
  const td=dk(),tg=+S.prof.tgoal||4,rows=weekDays().map(d=>({...d,e:S.tr.filter(x=>x.d===d.k),p:S.tplan[d.i]||''}));
  const mins=rows.map(r=>r.e.reduce((t,x)=>t+x.m,0)),done=rows.filter(r=>r.e.length).length,tot=mins.reduce((a,b)=>a+b,0),mx=Math.max(30,...mins),sel=rows[tsel],fut=sel.k>td,rec=S.tr.slice().reverse().slice(0,8);
  return `<div class="card cock"><div class="gauge" style="--p:${pct(done,tg)};--c:var(--acc)"><div><b>${done}/${tg}</b><small>treinos</small></div></div><div class="g"><small>Meta da semana</small><div class="row" style="margin:4px 0"><button class="x" aria-label="Menos" onclick="setTG(-1)">−</button><b style="font-size:20px">${tg} treinos</b><button class="x" aria-label="Mais" onclick="setTG(1)">+</button></div><small>${hm(tot)} treinados · ${done>=tg?'meta batida! 🔥':'faltam '+(tg-done)}</small></div></div>
  <div class="wk">${rows.map(r=>`<button class="wd${r.i===tsel?' sel':''}${r.k===td?' td':''}${r.e.length?' ok':''}" onclick="tsel=${r.i};render()"><small>${r.w}</small><b>${r.e.length?'✓':r.p==='Descanso'?'z':'·'}</b><small>${esc((r.p||'—').split(' ')[0])}</small></button>`).join('')}</div>
  <div class="card"><h2>${sel.w}${sel.k===td?' · hoje':''}</h2><div class="stack"><div><small>Treino planejado</small><select onchange="setTP(${sel.i},this.value)"><option value="">Escolher…</option>${TIPOS.map(t=>`<option${t===sel.p?' selected':''}>${t}</option>`).join('')}</select></div>
  ${fut?'<small>Dia futuro: só dá para registrar quando chegar.</small>':`<input id="tk" placeholder="Tipo (musculação, corrida…)" list="tks" value="${esc(sel.p&&sel.p!=='Descanso'?sel.p:'')}"><div class="two"><input id="tm" type="number" min="1" placeholder="Minutos"><select id="ti"><option value="1">Leve</option><option value="2">Médio</option><option value="3" selected>Pesado</option><option value="4">Insano</option></select></div><button class="btn" onclick="addTD('${sel.k}')">Registrar treino de ${sel.w}</button>`}</div>${sel.e.map(x=>`<div class="item"><div class="g"><b>${esc(x.k||'Treino')}</b><br><small>${['','Leve','Médio','Pesado','Insano'][x.i]}</small></div><b>${hm(x.m)}</b><button class="x" aria-label="Apagar" onclick="del('tr','${x.id}')">×</button></div>`).join('')}</div>
  <div class="card"><h2>Minutos na semana</h2><div class="bars">${rows.map((r,i)=>`<div class="bar${r.k===td?' t':''}">${mins[i]?hm(mins[i]):''}<i style="height:${Math.max(3,mins[i]/mx*68)}px"></i>${r.w[0]}</div>`).join('')}</div></div>
  <div class="card"><h2>Histórico</h2>${rec.length?rec.map(x=>`<div class="item"><div class="g"><b>${esc(x.k||'Treino')}</b><br><small>${fd(x.d)} · ${['','Leve','Médio','Pesado','Insano'][x.i]}</small></div><b>${hm(x.m)}</b></div>`).join(''):'<div class="empty">Nenhum treino. Hoje é um bom dia.</div>'}</div>`};

/* ===== LANÇAMENTO RÁPIDO DE GASTOS ===== */
function qadd(){const x=+v('qv');if(!x)return;S.fin.push({id:uid(),d:dk(),t:ft,v:x,c:fcat,n:'',a:(S.acc.find(a=>a.type!=='cartao')||S.acc[0]).id,p:true});fm=dk().slice(0,7);save();render()}
const _Mr2=M.r;
M.r=function(){return `<div class="card quick"><div class="seg"><button class="${ft==='g'?'on':''}" onclick="ft='g';fcat='Alimentação';rr()">Gastei</button><button class="${ft==='r'?'on':''}" onclick="ft='r';fcat='Salário';rr()">Entrou</button></div><input id="qv" class="qv" type="number" inputmode="decimal" placeholder="R$ 0,00"><div class="cats" style="margin:10px 0">${CATS[ft].map(c=>`<button class="chip ${fcat===c[1]?'sel':''}" onclick="pick(this,'${c[1]}')">${c[0]} ${c[1]}</button>`).join('')}</div><button class="btn" style="width:100%" onclick="qadd()">Lançar</button></div>`+_Mr2()};

/* ===== METAS COM "SE... ENTÃO..." ===== */
S.gl=S.gl||[];
function addGL(){const n=v('gln').trim();if(!n)return;S.gl.push({id:uid(),n,d:v('gld'),w:v('glw').trim(),i:v('gli').trim(),t:v('glt').trim(),st:[]});save();rr()}
function addST(g){const t=v('gs'+g).trim(),o=S.gl.find(x=>x.id===g);if(!t||!o)return;o.st.push({id:uid(),t,done:false});save();rr()}
function togST(g,s){const o=S.gl.find(x=>x.id===g),p=o.st.find(x=>x.id===s);p.done=!p.done;S.bonus=Math.max(0,(S.bonus||0)+(p.done?20:-20));save();render()}
V.goals=function(){
  return `<div class="card"><h2>Nova meta</h2><div class="stack"><input id="gln" placeholder="Qual é a meta? (ex.: passar no concurso)"><div class="two"><input id="gld" type="date" aria-label="Prazo"><input id="glw" placeholder="Por que importa?"></div><input id="gli" placeholder="SE... (ex.: eu chegar do trabalho)"><input id="glt" placeholder="ENTÃO... (ex.: estudo 40 min antes de tudo)"><button class="btn" onclick="addGL()">Criar meta</button><small>Quebrar a meta em passos pequenos e decidir o "se... então..." antes aumenta a chance de cumprir. Cada passo concluído vale 20 XP.</small></div></div>`+
  (S.gl.length?S.gl.map(g=>{const dn=g.st.filter(s=>s.done).length,p=pct(dn,g.st.length);return `<div class="card"><div class="row"><b style="flex:1">${esc(g.n)}</b><button class="x" aria-label="Apagar" onclick="del('gl','${g.id}')">×</button></div><small>${g.d?(left(g.d)>=0?left(g.d)+' dias restantes':'prazo passou'):'sem prazo'}${g.w?' · '+esc(g.w):''}</small>${g.i||g.t?`<p class="ifx">SE ${esc(g.i||'…')}, ENTÃO ${esc(g.t||'…')}</p>`:''}<div class="meter" style="margin:8px 0"><i style="width:${p}%"></i></div>${g.st.map(s=>`<div class="item"><input type="checkbox" ${s.done?'checked':''} onchange="togST('${g.id}','${s.id}')" aria-label="Concluir passo"><div class="g ${s.done?'done':''}">${esc(s.t)}</div></div>`).join('')}<div class="row" style="margin-top:8px"><input id="gs${g.id}" placeholder="Próximo passo pequeno"><button class="btn" onclick="addST('${g.id}')">+</button></div></div>`}).join(''):'<div class="empty">Nenhuma meta ainda.</div>')};

/* ===== SESSÃO DE FOCO (aba Estudo › Foco) ===== */
S.fo=Object.assign({ph:'i',min:25,end:0,st:0,tx:''},S.fo||{});S.sel.f=Object.assign({m:'',t:''},S.sel.f);
ST.splice(1,0,['f','Foco']);
const fT=()=>Math.max(0,Math.round((S.fo.end-Date.now())/1000));
function foStart(){if(!mat(S.sel.f.m)){setMsg('f','Escolha a matéria antes de começar.');rr();return}const tx=v('fi').trim();if(!tx){setMsg('f','Escreva o que vai aprender nesta sessão.');rr();return}setMsg('f','');const m=+v('fm')||25;S.fo={ph:'f',min:m,st:Date.now(),end:Date.now()+m*60000,tx};save();rr()}
function foStop(){S.fo.ph='r';S.fo.end=Math.min(S.fo.end,Date.now());save();rr()}
function foDone(){const m=Math.max(1,Math.round((S.fo.end-S.fo.st)/60000));S.sess.push({id:uid(),d:dk(),m,sec:m*60,mid:S.sel.f.m,tid:S.sel.f.t||'',s:'',n:v('fr2').trim()});S.fo={ph:'i',min:S.fo.min,end:0,st:0,tx:''};save();render()}
setInterval(()=>{const f=S.fo;if(f.ph!=='f')return;const t=fT();document.querySelectorAll('.fclk').forEach(e=>e.textContent=pad(Math.floor(t/60))+':'+pad(t%60));if(t<=0){f.ph='r';save();render();toast('Tempo! Agora o resgate ativo',1)}},500);
function vFoco(){
  const f=S.fo,why=`<div class="card"><h2>Por que esse protocolo funciona</h2>${[['Intenção clara','Definir o que vai aprender antes de começar reduz a dispersão.'],['Foco sem celular','Pesquisas sugerem que só ter o celular por perto já atrapalha a atenção.'],['Resgate ativo','Tentar lembrar sem olhar fixa muito mais do que reler.'],['Pausas curtas','Descansar entre blocos ajuda a manter a atenção e a consolidar.'],['Revisão espaçada','Rever em 1, 7 e 30 dias combate o esquecimento. O app agenda isso nas Revisões.']].map(w=>`<details><summary><b>${w[0]}</b></summary><p class="mute" style="margin:6px 0 2px">${w[1]}</p></details>`).join('')}</div>`;
  if(f.ph==='f'){const t=fT();return `<div class="card hero"><small>Foco total</small><div class="timer fclk">${pad(Math.floor(t/60))+':'+pad(t%60)}</div><p class="q">${esc(f.tx)}</p><small>Se a mente fugir, anote numa linha e volte.</small></div><button class="btn g" style="width:100%;margin-bottom:12px" onclick="foStop()">Encerrar agora</button>`+why}
  if(f.ph==='r')return `<div class="card"><h2>Resgate ativo</h2><p class="mute" style="margin:0 0 10px">Sem olhar o material, escreva 3 coisas que você lembra de: <b>${esc(f.tx)}</b></p><div class="stack"><input id="fr2" placeholder="1) … 2) … 3) …"><button class="btn" onclick="foDone()">Concluir e ganhar XP</button><small>Depois, 5 minutos de pausa: levante, beba água, olhe longe.</small></div></div>`+why;
  return `<div class="card"><h2>Nova sessão de foco</h2>${matSel('f')}<div class="stack" style="margin-top:8px"><input id="fi" placeholder="O que exatamente vou aprender agora?"><select id="fm"><option value="25"${f.min===25?' selected':''}>25 min (bloco curto)</option><option value="50"${f.min===50?' selected':''}>50 min (bloco longo)</option></select><div class="cats"><span class="chip">📵 Celular longe</span><span class="chip">💧 Água</span><span class="chip">🧹 Mesa limpa</span></div><button class="btn" onclick="foStart()">Começar foco</button>${msg('f')}</div></div>`+why}


/* =====================================================================
   V9: personagens com a arte nova (pasta personagens/), animações,
   barra de XP, mapa novo e tela de dificuldade por rank.
   A tabela de dificuldade (DIFF) fica no app.js.
   ===================================================================== */
const PIMG=['n01_preguicoso','n02_recruta','n03_soldado','n04_cabo','n05_sargento','n06_tenente','n07_capitao','n08_major','n09_coronel','n10_general','n11_supremo'].map(n=>'personagens/'+n+'.webp');
const RC=['#cbd5e1','#f59e0b','#22c55e','#22d3ee','#4ade80','#3b82f6','#2563eb','#a855f7','#ef4444','#ff4d2e','#fbbf24'];   // cor de cada rank (moldura e brilho)
const SLOG=['Comece devagar...','Dê o primeiro passo!','Mostre sua força!','Disciplina é tudo!','Assuma o comando!','Supere seus limites!','Lidere com honra!','Conquiste mais!','Mostre sua superioridade!','Estratégia e poder!','Você é a Lenda!'];
const AR=[.95,.936,.936,.945,.959,1.061,1.104,1.104,1.235,1.56,1.9];                        // proporção de cada imagem
const OP=['50% 20%','50% 20%','50% 20%','50% 20%','50% 20%','50% 20%','50% 20%','50% 20%','50% 20%','62% 25%','44% 25%'];   // enquadramento quando a imagem é cortada em quadrado
const GL=[.2,.3,.35,.4,.45,.55,.65,.75,.85,.95,1];     // intensidade do brilho: cresce a cada rank
const PCN=[3,0,0,2,2,4,5,6,8,10,14];                    // partículas flutuando (zzz no Preguiçoso, faíscas nos outros)
const nf=n=>Math.round(n).toLocaleString('pt-BR'),fx=n=>String(+n.toFixed(2)).replace('.',',');

/* personagem: sz = largura (número em px ou texto tipo '100%'), lock = silhueta, full = proporção original */
function heroImg(i,sz,lock,full){
  const r=(k,m)=>((k*9301+i*49297+m*233)%1000)/1000;let p='';
  if(!lock)for(let k=0;k<PCN[i];k++)p+=`<i class="pt" style="--x:${(8+r(k,1)*84).toFixed(0)}%;--d:${(r(k,2)*4).toFixed(1)}s;--t:${(2.6+r(k,3)*2.4).toFixed(1)}s;--dx:${((r(k,4)-.5)*34).toFixed(0)}px;--z:${(3+r(k,5)*3).toFixed(1)}px"></i>`;
  const w=typeof sz==='number'?sz+'px':sz;
  return `<div class="hi t${i}${lock?' lock':''}" style="--s:${w};--c:${RC[i]};--g:${GL[i]};--ar:${full?AR[i]:1}" role="img" aria-label="${lock?'Personagem bloqueado':RK[i][0]}"><div class="fr"><img src="${PIMG[i]}" alt="" draggable="false" style="object-position:${OP[i]}"><u class="sh"></u></div>${p}</div>`}
heroSvg=function(i,sz,lock){return heroImg(i,sz,lock,sz>=140)};   // o resto do app chama heroSvg: agora mostra a arte nova

/* barra de XP do rank atual: ticks = subníveis, faixa vermelha = XP que você perde se o dia acabasse agora */
const xbPrev={};
function xpBar(key,X,ds){
  const fl=RK[S.peak||0][1],ri=rank(X),lo=RK[ri][1],nx=RK[ri+1],hi=nx?nx[1]:lo,span=Math.max(1,hi-lo);
  const p=nx?Math.max(0,Math.min(100,(X-lo)/span*100)):100;
  const risk=ds&&ds.loss?Math.max(0,X-Math.max(gross()-penalty()-ds.loss,fl)):0,rp=nx?Math.min(p,risk/span*100):0;
  const tk=STEPS.filter(s=>s.i===ri&&s.x>lo).map(s=>`<b class="tk" style="left:${((s.x-lo)/span*100).toFixed(2)}%"></b>`).join('');
  const pv=xbPrev[key]==null?0:xbPrev[key];xbPrev[key]=p;
  const warn=ds&&ds.win?'<div class="xr ok">✓ Metas de hoje batidas: nada a perder.</div>':ds&&ds.loss?(risk>0?`<div class="xr">⚠ Se o dia acabasse agora: <b>−${nf(risk)} XP</b></div>`:'<div class="xr ok">Metas pendentes, mas o piso do rank te protege agora.</div>'):'';
  return `<div class="xb" data-p="${p.toFixed(2)}" style="--rc:${RC[ri]};--p:${pv}%;--r:${rp.toFixed(2)}%"><div class="xh"><b>${STEPS[lvl(X)].n}</b><span>${nf(X)} / ${nx?nf(hi):'∞'} XP</span></div><div class="xbar"><i class="fill"></i><i class="risk"></i>${tk}</div><div class="xf"><small>${nx?`faltam <b>${nf(hi-X)}</b> XP para <b>${nx[0]}</b>`:'Você chegou ao topo. Agora é manter.'}</small>${nx?`<span class="xn">${heroImg(ri+1,36,1)}</span>`:''}</div>${warn}</div>`}

/* ===== MAPA DA JORNADA (arte nova) ===== */
V.map=function(){
  const X=xp(),ri=rank(X),nx=RK[ri+1],W=340,Hh=1700,ds=dayStat(dk());
  const pos=i=>i===10?{x:170,y:138}:i===9?{x:170,y:352}:{x:i%2?252:88,y:552+(8-i)*132};
  const seg=i=>{const p=pos(i),q=pos(i+1),m=(p.y+q.y)/2;return `M${p.x} ${p.y}C${p.x} ${m} ${q.x} ${m} ${q.x} ${q.y}`};
  let base='',done='',cur='';for(let i=0;i<10;i++){if(i<ri)done+=seg(i);else if(i===ri)cur=seg(i);else base+=seg(i)}
  const pc=nx?Math.max(0,Math.min(100,(X-RK[ri][1])/(nx[1]-RK[ri][1])*100)):100;
  const zn=[['ACAMPAMENTO',Hh-30],['QUARTEL',(pos(2).y+pos(3).y)/2],['FORTALEZA',(pos(5).y+pos(6).y)/2],['TRONO',(pos(8).y+pos(9).y)/2]].map(z=>`<text x="170" y="${z[1]}" text-anchor="middle" font-size="17" font-weight="800" letter-spacing="7" fill="#ffffff0d" font-family="sans-serif">${z[0]}</text>`).join('');
  const svg=`<svg viewBox="0 0 ${W} ${Hh}" aria-hidden="true">${zn}<path d="${base}${cur}" stroke="#2c2c2c" stroke-width="5" stroke-dasharray="3 10" stroke-linecap="round" fill="none"/>${done?`<path d="${done}" stroke="var(--acc)" stroke-width="6" stroke-linecap="round" fill="none"/>`:''}${cur?`<path d="${cur}" pathLength="100" stroke="${RC[ri]}" stroke-width="7" stroke-linecap="round" fill="none" stroke-dasharray="${pc.toFixed(1)} 100" class="mpg"/>`:''}</svg>`;
  let nd='';
  for(let i=0;i<RK.length;i++){
    const p=pos(i),st=i<ri?'dn':i===ri?'cur':'lk',lock=i>ri,w=i===10?88:i===9?66:i===ri?40:27;
    nd+=`<div class="mn ${st}" style="left:${(p.x/W*100).toFixed(2)}%;top:${(p.y/Hh*100).toFixed(2)}%;--w:${w}%;--c:${RC[i]}"><div class="hw">${heroImg(i,'100%',lock,true)}${st==='dn'?'<s class="ck">✓</s>':''}</div><b class="mt">${lock?'???':RK[i][0]}</b>${st==='cur'?`<span class="you">VOCÊ ESTÁ AQUI</span><small>${Math.round(pc)}% até ${nx?nx[0]:'o topo'}</small>`:`<small class="mx">${nf(RK[i][1])} XP</small>`}<small class="md">perda ×${fx(DIFF[i][1])}</small></div>`}
  return `<div class="card"><h2>Seu caminho até o Supremo</h2><p class="mute" style="margin:0">Cada parada é um rank e um personagem novo. Quanto mais alto você chega, mais difícil fica a meta e mais caro é errar.</p>${xpBar('map',X,ds)}<div class="dchips"><span>meta ×${fx(DIFF[tier()][0])}</span><span class="bad">perda ×${fx(DIFF[tier()][1])}</span></div></div>
  <div class="card" style="padding:6px"><div class="mapw">${svg}${nd}</div></div>`};

/* ===== XP E DIFICULDADE ===== */
V.xp=function(){
  const g=gross(),pn=penalty(),X=xp(),ri=rank(X),sl=5+rank(gross()),ds=dayStat(dk()),base=S.habits.length?130:100;
  const src=[['Tempo de estudo','1 XP por minuto'],['Questões','2 XP por questão feita + 3 por acerto'],['Treino','30 XP + 1,5 por minuto'],['Tarefas do plano','15 XP cada'],['Revisões','10 XP cada'],['Hábitos','10 XP cada, por dia'],['Lançar gasto pago','5 XP cada']];
  const wh=[['Neurociência da repetição','Rever o conteúdo em 1, 7 e 30 dias combate a curva do esquecimento. Por isso as revisões valem XP.'],['Gatilho + ação','Decidir antes "quando X, faço Y" reduz a dependência de vontade. As missões diárias fazem esse papel.'],['Meta que sobe 1% ao dia','Aumentar um pouco todo dia evita o choque de começar pesado e constrói consistência.'],['Perder dói mais que ganhar','Por isso metas não cumpridas descontam XP: o app usa a aversão à perda a seu favor. E quanto mais alto o rank, mais caro é errar.'],['Recompensa imediata e surpresa','O cérebro libera mais dopamina quando a recompensa vem logo após o ato e quando é um pouco imprevisível. Por isso o +XP aparece na hora e o baú diário sorteia o bônus.'],['Ver o progresso chegando','Quanto mais perto da meta, mais motivação. Por isso a barra mostra sempre quanto falta.'],['Dinheiro também é disciplina','Lançar gastos dá XP porque o que você mede, você controla.']];
  return `<div class="hero2"><small>Seu total</small><div class="cnt">${nf(X)}<span>XP · ${STEPS[lvl(X)].n}</span></div>${xpBar('xp',X,ds)}<small>Ganho ${nf(g)} XP · perdido ${nf(pn)} XP por metas não cumpridas</small></div>
  <div class="card"><h2>De onde vem o XP</h2>${src.map(s=>`<div class="item"><b>${s[0]}</b><span class="mute" style="margin-left:auto;text-align:right">${s[1]}</span></div>`).join('')}</div>
  <div class="card"><h2>Dificuldade por rank</h2><p class="mute" style="margin:0 0 10px">Cada missão que você não cumpre tira XP: estudo −40, questões −30, treino −30, hábitos −30, vezes a <b>perda</b> do seu rank. A <b>meta</b> também cresce. Seu rank nunca cai: você só perde XP dentro do rank atual. A dificuldade de cada dia vale a partir do rank que você tinha ao acordar.</p>
  ${RK.map((r,k)=>`<div class="dr${k===ri?' on':''}${k>ri?' lk':''}"><div class="g"><b>${r[0]}${k===10?' <em>quase impossível</em>':''}</b><small>meta ×${fx(DIFF[k][0])} · perda ×${fx(DIFF[k][1])}</small></div><div class="dm"><i style="width:${(DIFF[k][1]/12*100).toFixed(1)}%"></i></div><span class="dl">−${nf(base*DIFF[k][1])}</span></div>`).join('')}<small>O número à direita é o XP que você perde num dia em que falha em tudo.</small></div>
  <div class="card"><h2>Personagens e ranks</h2><div class="gal">${RK.map((r,k)=>`<div class="gi${k===ri?' on':''}">${heroImg(k,'100%',k>ri)}<b>${k>ri?'???':r[0]}</b><small>${nf(r[1])} XP</small></div>`).join('')}</div><small>Cada rank sobe a meta diária, mas libera +1 vaga de hábito (você tem ${sl}).</small></div>
  <div class="card"><h2>Por que funciona</h2>${wh.map(w=>`<details><summary><b>${w[0]}</b></summary><p class="mute" style="margin:6px 0 2px">${w[1]}</p></details>`).join('')}</div>`};

/* ===== SUBIU DE RANK: tela cheia com o personagem novo ===== */
levelUp=function(r){
  const d=document.createElement('div');d.className='lvlup lu';d.style.setProperty('--c',RC[r]);d.onclick=()=>d.remove();
  const cf=Array.from({length:40},(_,i)=>`<i style="left:${(Math.random()*100).toFixed(1)}%;animation-delay:${(Math.random()*1.2).toFixed(2)}s;animation-duration:${(2+Math.random()*1.6).toFixed(2)}s;background:${i%3?RC[r]:'#fff'}"></i>`).join('');
  d.innerHTML=`<div class="cf">${cf}</div><div class="lub"><small>NOVO RANK DESBLOQUEADO</small>${heroImg(r,'min(78vw,330px)',false,true)}<h1>${RK[r][0]}</h1><p>${SLOG[r]}</p><small>Toque para continuar</small></div>`;
  document.body.appendChild(d);try{navigator.vibrate&&navigator.vibrate([60,40,120])}catch(x){}};

/* ===== render: anima a barra e avisa o XP perdido ontem ===== */
const _render9=render;
render=function(){
  _render9();
  requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll('.xb[data-p]').forEach(e=>e.style.setProperty('--p',e.dataset.p+'%'))));
  if(tab==='map')setTimeout(()=>{const c=document.querySelector('.mn.cur');if(c&&tab==='map')c.scrollIntoView({block:'center',behavior:'smooth'})},250);
  if(S.lt!==dk()&&S.lg!=null){S.lt=dk();save();
    const y=new Date();y.setDate(y.getDate()-1);const yk=dk(y);
    if(yk>=S.since){const yl=dayStat(yk).loss;
      if(yl>0){const b=gross()-penalty(),fl=RK[S.peak||0][1],eff=Math.max(b+yl,fl)-Math.max(b,fl);
        if(eff>0)setTimeout(()=>{const t=document.createElement('div');t.className='toast bad';t.textContent='−'+nf(eff)+' XP por ontem';document.body.appendChild(t);document.querySelectorAll('.stage .hi').forEach(h=>h.classList.add('hit'));try{navigator.vibrate&&navigator.vibrate([90,50,90])}catch(x){}setTimeout(()=>t.remove(),2400)},600)}}}
};


/* =====================================================================
   V10: ANKI (cartões por matéria + caderno de erros), tela inicial nova,
   conquistas, check-in diário e combo. Cartões: S.cards, revisões do dia: S.kr
   ===================================================================== */
S.cards=S.cards||[];S.kr=S.kr||{};S.ach=S.ach||{};
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
  else{c.iv=r.iv;c.rp=(c.rp||0)+1;const d=new Date();d.setDate(d.getDate()+r.iv);c.due=dk(d);kq.shift()}
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
if(!ST.some(a=>a[0]==='k'))ST.splice(3,0,['k','Cartões']);
V.study=function(){
  const due=revList().due.length,kd=kdue().length,t=S.timer,run=t.run||t.acc>0;
  const seg=`<div class="seg sc">${ST.map(a=>`<button class="${ss===a[0]?'on':''}" onclick="stab('${a[0]}')">${a[1]}${a[0]==='r'&&due?` <span class="bdg">${due}</span>`:''}${a[0]==='k'&&kd?` <span class="bdg">${kd}</span>`:''}</button>`).join('')}</div>`;
  const ban=run&&ss!=='c'?`<button class="runb" onclick="stab('c')"><span>${t.run?'●':'❚❚'}</span><b class="clk">${clock(elapsed())}</b><span class="lb">${esc(runLabel())}</span><span>Abrir ›</span></button>`:'';
  return seg+ban+({t:vTempo,c:vCron,q:vQuest,k:vCards,r:vRev,m:vMats,p:vProvas,f:vFoco}[ss]||vTempo)()};
const _vQuest=vQuest;
vQuest=function(){return `<button class="chip" style="margin-bottom:10px" onclick="kGo('add','e','${(S.sel.q||{}).m||''}')">📝 Salvar uma questão que errei no Anki</button>`+_vQuest()};

/* ===== CONQUISTAS ===== */
const ACH=[
 ['p1','🚀','Primeiro passo','Registre sua 1ª sessão de estudo',T=>[T.min>0?1:0,1],30],
 ['h10','⏱️','10 horas','Estude 10 horas no total',T=>[T.min,600],100],
 ['h50','📚','50 horas','Estude 50 horas no total',T=>[T.min,3000],300],
 ['h200','🧠','200 horas','Estude 200 horas no total',T=>[T.min,12000],1000],
 ['q100','✍️','100 questões','Resolva 100 questões',T=>[T.q,100],80],
 ['q1k','🎯','1.000 questões','Resolva 1.000 questões',T=>[T.q,1000],400],
 ['s3','🔥','Pegando fogo','3 dias seguidos',T=>[T.st,3],50],
 ['s7','🔥','Semana de ferro','7 dias seguidos',T=>[T.st,7],150],
 ['s30','🌋','Mês inabalável','30 dias seguidos',T=>[T.st,30],700],
 ['t10','💪','Corpo em ação','Faça 10 treinos',T=>[T.tr,10],100],
 ['t50','🏋️','Máquina','Faça 50 treinos',T=>[T.tr,50],300],
 ['k1','🃏','Primeiro cartão','Crie um cartão no Anki',T=>[T.cards,1],20],
 ['k100','🗂️','100 revisões','Revise 100 cartões',T=>[T.cr,100],150],
 ['k1k','🧩','1.000 revisões','Revise 1.000 cartões',T=>[T.cr,1000],600],
 ['e10','📝','Caderno de erros','Salve 10 erros como cartões',T=>[T.er,10],150],
 ['r2','🪖','Soldado','Chegue ao rank Soldado',T=>[T.pk,2],50],
 ['r4','🎖️','Sargento','Chegue ao rank Sargento',T=>[T.pk,4],120],
 ['r6','⭐','Capitão','Chegue ao rank Capitão',T=>[T.pk,6],250],
 ['r9','🐉','General','Chegue ao rank General',T=>[T.pk,9],800],
 ['r10','👑','Supremo','Chegue ao rank Supremo',T=>[T.pk,10],2000]];
function achT(){return{min:S.sess.reduce((t,s)=>t+s.m,0),q:S.qs.reduce((t,q)=>t+q.n,0),tr:S.tr.length,st:streak(),cr:Object.values(S.kr).reduce((a,b)=>a+b,0),er:S.cards.filter(c=>c.src==='e').length,pk:S.peak||0,cards:S.cards.length}}
function achCheck(){const T=achT(),n=[];ACH.forEach(a=>{if(!S.ach[a[0]]){const p=a[4](T);if(p[0]>=p[1]){S.ach[a[0]]=dk();S.bonus=(S.bonus||0)+a[5];n.push(a)}}});if(n.length)save();return n}
Object.assign(TT,{ach:'Conquistas'});
V.ach=function(){const T=achT(),got=ACH.filter(a=>S.ach[a[0]]).length;
  return `<div class="card hero2"><small>Conquistas</small><div class="cnt">${got}<span>de ${ACH.length} desbloqueadas</span></div><div class="meter" style="margin-top:10px"><i style="width:${pct(got,ACH.length)}%"></i></div></div>
  <div class="card">${ACH.map(a=>{const p=a[4](T),ok=!!S.ach[a[0]];return `<div class="item ach${ok?' on':''}"><span class="abadge">${a[1]}</span><div class="g"><b>${a[2]}</b><br><small>${a[3]}</small>${ok?'':`<div class="thin"><i style="width:${pct(p[0],p[1])}%;background:var(--acc)"></i></div>`}</div><span class="pill" style="color:${ok?'var(--ok)':'var(--mute)'}">${ok?'✓':'+'+a[5]+' XP'}</span></div>`}).join('')}</div>`};
V.more=function(){const I=[['agenda','▦','Agenda','compromissos'],['habits','✔','Hábitos','sequências'],['plan','☰','Tarefas','semana'],['mentor','✦','Mentor','mentalidade'],['map','🗺','Mapa da jornada','seu caminho'],['ach','🏆','Conquistas',ACH.filter(a=>S.ach[a[0]]).length+' de '+ACH.length],['goals','🎯','Metas','passos e gatilhos'],['xp','⚡','XP e níveis','dificuldade'],['life','◆','Vida','cadastro e cores']];
  return `<div class="more">${I.map(i=>`<button class="mb" onclick="go('${i[0]}')"><b>${i[1]}</b><span>${i[2]}</span><small>${i[3]}</small></button>`).join('')}</div>`};

/* ===== CHECK-IN DIÁRIO ===== */
const ciXP=()=>10+Math.min(streak(),10)*2;
function checkin(){if(S.ci===dk())return;const x=ciXP();S.ci=dk();S.bonus=(S.bonus||0)+x;save();render()}

/* ===== TELA INICIAL NOVA ===== */
function weekStrip(){const t=new Date(),a=[];
  for(let i=6;i>=0;i--){const d=new Date(t);d.setDate(t.getDate()-i);const k=dk(d),isT=i===0,act=S.sess.some(x=>x.d===k)||S.qs.some(x=>x.d===k)||S.tr.some(x=>x.d===k)||(S.kr[k]||0)>0;let z='e';
    if(k>=S.since){const s=dayStat(k);z=s.win?'w':act?'p':isT?'t':'m'}else z=act?'p':'e';
    a.push(`<div class="wk1 ${z}${isT?' now':''}"><small>${DOW[d.getDay()][0]}</small><i>${z==='w'?'✓':z==='p'?'•':z==='m'?'×':''}</i></div>`)}return a.join('')}
function nextAct(ds){const t=S.timer,rv=revList().due.length,cd=kdue().length;
  if(t.run||t.acc>0)return['●','Continuar estudando',clock(elapsed())+' · '+runLabel(),"ss='c';go('study')"];
  if(rv)return['🔁',rv+' revis'+(rv>1?'ões':'ão')+' para hoje','Fixe o que você já estudou',"ss='r';go('study')"];
  if(cd)return['🃏','Revisar '+cd+' cartões','Cerca de '+Math.max(1,Math.round(cd*.4))+' min · XP e combo','kOpen()'];
  if(ds.m<ds.dg)return['▶','Estudar agora','Faltam '+(ds.dg-ds.m)+' min para a meta de hoje',"ss='c';go('study')"];
  if(ds.q<ds.qg)return['✍️','Resolver questões','Faltam '+(ds.qg-ds.q)+' para a meta',"ss='q';go('study')"];
  if(ds.t<1)return['💪','Treinar hoje','Falta o treino do dia',"go('train')"];
  if(ds.hv&&ds.h<S.habits.length)return['✔','Fechar os hábitos','Faltam '+(S.habits.length-ds.h),"go('habits')"];
  return['🏆','Dia vencido!','Quer mais? Estudar a mais sobe o rank mais rápido',"ss='c';go('study')"]}
V.home=function(){
  const p=S.prof,X=xp(),ri=rank(X),ds=dayStat(dk()),st=streak(),hf=HF(dk()),hr=new Date().getHours(),gr=hr<12?'Bom dia':hr<18?'Boa tarde':'Boa noite';
  const ne=nextExams(),tg=p.date&&left(p.date)>=0?{n:p.goal||'o concurso',d:p.date}:ne[0]?{n:ne[0].name,d:ne[0].d}:null;
  const why=p.why?esc(p.why):QT[Math.floor(Date.now()/864e5)%QT.length],na=nextAct(ds),bd=board();
  const hj=S.kr[dk()]||0,kg=kGoal(),W=[40,30,30,30];
  const Q=[['🧠','Estudo',ds.m,ds.dg,' min',"ss='c';go('study')",0],['✍️','Questões',ds.q,ds.qg,'',"ss='q';go('study')",1],['💪','Treino',ds.t,1,'',"go('train')",2]];
  if(ds.hv)Q.push(['🌱','Hábitos',ds.h,S.habits.length,'',"go('habits')",3]);
  const qrow=q=>{const dn=q[2]>=q[3];return `<button class="qr${dn?' ok':''}" onclick="${q[5]}"><span class="ic">${q[0]}</span><div class="g"><div class="row"><b>${q[1]}</b><small style="margin-left:auto">${Math.min(q[2],q[3])}${q[4]} / ${q[3]}${q[4]}</small></div><div class="meter"><i style="width:${pct(q[2],q[3])}%"></i></div></div><span class="qx${dn?' ok':''}">${dn?'✓':'−'+Math.round(W[q[6]]*hf)}</span></button>`};
  const kd=hj>=kg;
  const mo=S.fin.filter(x=>x.d.startsWith(dk().slice(0,7))&&!x.x&&isP(x)),sd=sum(mo,'r')-sum(mo,'g'),w7=last7(),tot7=w7.reduce((t,x)=>t+x.m,0),wk=S.tr.filter(x=>left(x.d)>-7).length;
  const tasks=S.plan.filter(x=>x.dow===new Date().getDay()),up=[...S.ag.map(a=>({d:a.d,t:a.t,n:a.n})),...S.exams.map(e=>({d:e.d,t:'',n:'Prova: '+e.name}))].filter(a=>a.d>=dk()).sort((a,b)=>(a.d+a.t)<(b.d+b.t)?-1:1).slice(0,3);
  const got=ACH.filter(a=>S.ach[a[0]]);
  return `<div class="hud" style="--rc:${RC[ri]}"><div class="top2"><small>${gr}${p.nome?', '+esc(p.nome):''}</small><span class="flame">🔥 ${st} ${st===1?'dia':'dias'}</span></div>
  <div class="hud-m"><button class="hud-av" onclick="go('xp')" aria-label="Ver XP e personagens">${heroImg(ri,112)}</button><div class="hud-i"><div class="hud-r">${RK[ri][0]}</div><small class="slog">${SLOG[ri]}</small>${xpBar('home',X,ds)}</div></div>
  ${S.ci!==dk()?`<button class="ci" onclick="checkin()">🎁 Check-in do dia <b>+${ciXP()} XP</b></button>`:''}</div>
  <button class="cta" style="--rc:${RC[ri]}" onclick="${na[3]}"><span class="cta-i">${na[0]}</span><div class="g"><b>${na[1]}</b><small>${na[2]}</small></div><span class="cta-a">›</span></button>
  <div class="card"><div class="row" style="margin-bottom:10px"><h2 style="margin:0">Missões de hoje</h2><small style="margin-left:auto">${ds.ok.filter(Boolean).length} de ${ds.ok.length}</small></div>${Q.map(qrow).join('')}
  <button class="qr${kd?' ok':''}" onclick="kOpen()"><span class="ic">🃏</span><div class="g"><div class="row"><b>Cartões</b><small style="margin-left:auto">${Math.min(hj,kg)} / ${kg}</small></div><div class="meter"><i style="width:${pct(hj,kg)}%"></i></div></div><span class="qx ${kd?'ok':'bn'}">${kd?'✓':'bônus'}</span></button>
  <small style="display:block;margin-top:8px">${ds.win?'Dia vencido! 🔥 Nada a perder.':'Os números em vermelho são o XP que você perde se não cumprir.'}</small></div>
  ${chestCard(ds)}
  <div class="card"><div class="row" style="margin-bottom:8px"><h2 style="margin:0">Sua semana</h2><small style="margin-left:auto">${bd.tot?bd.won+' de '+bd.tot+' dias vencidos':''}</small></div><div class="wks">${weekStrip()}</div></div>
  ${revCard()}
  ${tg?`<div class="card"><div class="row"><span class="ic">⏳</span><div class="g"><b>${left(tg.d)} ${left(tg.d)===1?'dia':'dias'} para ${esc(tg.n)}</b><br><small>${why}</small></div></div></div>`:`<div class="card"><p class="q" style="margin:0">${why}</p><small>Cadastre o concurso em Mais › Vida para ver a contagem.</small></div>`}
  <button class="card achr" onclick="go('ach')"><div class="row"><h2 style="margin:0;flex:1;text-align:left">🏆 Conquistas</h2><small>${got.length} de ${ACH.length} ›</small></div><div class="abs">${ACH.slice(0,10).map(a=>`<span class="abadge${S.ach[a[0]]?' on':''}">${a[1]}</span>`).join('')}</div></button>
  <div class="grid3"><div class="stat"><b>${hm(tot7)}</b><span>Estudo em 7 dias</span></div><div class="stat"><b>${wk}</b><span>Treinos em 7 dias</span></div><div class="stat"><b class="${sd>=0?'in':'out'}">${R(sd)}</b><span>Saldo do mês</span></div></div>
  ${up.length?`<div class="card"><h2>Próximos compromissos</h2>${up.map(a=>`<div class="item"><b style="width:64px">${left(a.d)===0?'Hoje':left(a.d)===1?'Amanhã':fd(a.d).slice(0,5)}</b><div class="g">${esc(a.n)}</div><small>${a.t}</small></div>`).join('')}</div>`:''}
  ${tasks.length?`<div class="card"><h2>Tarefas de hoje</h2>${tasks.map(taskRow).join('')}</div>`:''}
  <div class="card"><h2>Quadro de dias</h2><div class="heat">${bd.h}</div></div>`};

/* ===== render: confere conquistas antes de desenhar ===== */
const _render10=render;
render=function(){const nw=achCheck();_render10();
  nw.slice(0,3).forEach((a,i)=>setTimeout(()=>{const t=document.createElement('div');t.className='toast ach';t.textContent=a[1]+' '+a[2]+' +'+a[5]+' XP';document.body.appendChild(t);try{navigator.vibrate&&navigator.vibrate([40,30,80])}catch(x){}setTimeout(()=>t.remove(),2200)},500+i*2300))};


/* =====================================================================
   V11: Estudo organizado. Tocar em "Estudo" abre uma página inicial com
   blocos (Estudar, Praticar, Acompanhar). Cada bloco abre a sua página.
   ===================================================================== */
ss='h';let ssub='';
const SPAGES={c:['Cronômetro','⏱️'],f:['Foco total','🎯'],k:['Cartões','🃏'],r:['Revisões','🔁'],q:['Questões','✍️'],t:['Tempo estudado','📊'],p:['Provas','🗓️'],m:['Matérias','📚']};
stab=function(k){ss=k;ssub='';MSG={};qa='';selk=-1;qi=-1;render();scrollTo(0,0)};
/* divide uma página cheia em duas abas, pelo título dos cartões */
function splitPage(k,html){
  const defs={c:[['Cronômetro','Manual e histórico'],/O que você vai estudar/],q:[['Registrar','Desempenho'],/Registrar questões|Registros recentes/]}[k];
  if(!defs)return html;
  const P=html.split(/(?=<div class="card[ "])/).filter(x=>x.trim()),isA=x=>!x.startsWith('<div class="card')||defs[1].test(x);
  const a=P.filter(isA),b=P.filter(x=>!isA(x));if(!a.length||!b.length)return html;
  const cur=ssub||'0';
  return `<div class="seg">${defs[0].map((n,i)=>`<button class="${cur===String(i)?'on':''}" onclick="ssub='${i}';render()">${n}</button>`).join('')}</div>`+(cur==='0'?a:b).join('')}
function vHub(){
  const ds=dayStat(dk()),t=S.timer,run=t.run||t.acc>0,rv=revList().due.length,kd=kdue().length,hj=S.kr[dk()]||0,ne=nextExams()[0];
  const tl=(ic,nm,sb,go_,bd)=>`<button class="mb" onclick="${go_}"><b>${ic}</b><span>${nm}</span><small>${sb}</small>${bd?`<i class="nb">${bd}</i>`:''}</button>`;
  return `<div class="card shub"><div class="row" style="margin-bottom:10px"><h2 style="margin:0">Hoje</h2><small style="margin-left:auto">meta ${hm(ds.dg)}</small></div>
  <div class="meter" style="height:10px"><i style="width:${pct(ds.m,ds.dg)}%"></i></div>
  <div class="grid3" style="margin:12px 0 0"><div class="stat"><b>${hm(ds.m)}</b><span>Estudo</span></div><div class="stat"><b>${ds.q}</b><span>Questões</span></div><div class="stat"><b>${hj}</b><span>Cartões</span></div></div>
  <button class="btn kgo" onclick="stab('c')">${run?(t.run?'● Continuar ':'❚❚ Retomar ')+clock(elapsed()):'▶ Começar a estudar'}</button></div>
  <h2 class="sec">Estudar</h2>
  <div class="more" style="margin-bottom:14px">${tl('⏱️','Cronômetro',run?clock(elapsed()):'registre seu tempo',"stab('c')")}${tl('🎯','Foco total','sessão guiada',"stab('f')")}${tl('🃏','Cartões',kd?kd+' para revisar':'Anki por matéria',"stab('k')",kd)}${tl('🔁','Revisões',rv?rv+' para hoje':'em dia',"stab('r')",rv)}</div>
  <h2 class="sec">Praticar</h2>
  <div class="more" style="margin-bottom:14px">${tl('✍️','Questões',ds.q?ds.q+' hoje':'registrar e ver acertos',"stab('q')")}${tl('📝','Caderno de erros','salvar questão que errei',"kGo('add','e')")}</div>
  <h2 class="sec">Acompanhar</h2>
  <div class="more">${tl('📊','Tempo','gráficos por matéria',"stab('t')")}${tl('🗓️','Provas',ne?'próxima em '+left(ne.d)+' d':'datas das provas',"stab('p')")}${tl('📚','Matérias',S.mats.length+' cadastradas',"stab('m')")}</div>`}
V.study=function(){
  if(!SPAGES[ss])ss='h';if(ss==='h')return vHub();
  const t=S.timer,run=t.run||t.acc>0,pg=SPAGES[ss],due=revList().due.length,kd=kdue().length,bd=ss==='r'?due:ss==='k'?kd:0;
  const bar=`<div class="sbar"><button class="back" onclick="stab('h')">‹ Estudo</button><b>${pg[1]} ${pg[0]}</b>${bd?`<span class="bdg">${bd}</span>`:''}</div>`;
  const ban=run&&ss!=='c'?`<button class="runb" onclick="stab('c')"><span>${t.run?'●':'❚❚'}</span><b class="clk">${clock(elapsed())}</b><span class="lb">${esc(runLabel())}</span><span>Abrir ›</span></button>`:'';
  return bar+ban+splitPage(ss,({t:vTempo,c:vCron,q:vQuest,k:vCards,r:vRev,m:vMats,p:vProvas,f:vFoco}[ss])())};
