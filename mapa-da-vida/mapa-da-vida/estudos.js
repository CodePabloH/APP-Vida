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
  return seg+ban+({t:vTempo,c:vCron,q:vQuest,r:vRev,m:vMats,p:vProvas}[ss]||vTempo)()};

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
  const p=S.prof,X=xp(),li=lvl(X),cur=STEPS[li],nx=STEPS[li+1],pc=nx?Math.round((X-cur.x)/(nx.x-cur.x)*100):100;
  const ds=dayStat(dk()),ne=nextExams(),tg=p.date&&left(p.date)>=0?{n:p.goal||'o concurso',d:p.date}:ne[0]?{n:ne[0].name,d:ne[0].d}:null;
  const hr=new Date().getHours(),gr=hr<12?'Bom dia':hr<18?'Boa tarde':'Boa noite';
  const mo=S.fin.filter(x=>x.d.startsWith(dk().slice(0,7))&&!x.x&&isP(x)),rec=sum(mo,'r'),gas=sum(mo,'g'),inc=S.sal.inc||rec,sob=inc-gas;
  const up=[...S.ag.map(a=>({d:a.d,t:a.t,n:a.n})),...S.exams.map(e=>({d:e.d,t:'',n:'Prova: '+e.name}))].filter(a=>a.d>=dk()).sort((a,b)=>(a.d+a.t)<(b.d+b.t)?-1:1).slice(0,3);
  const tasks=S.plan.filter(x=>x.dow===new Date().getDay()),bd=board(),wk=S.tr.filter(x=>left(x.d)>-7).length;
  const mente=Math.round((Math.min(1,ds.m/ds.dg)+Math.min(1,ds.q/ds.qg))/2*100);
  const why=p.why?esc(p.why):QT[Math.floor(Date.now()/864e5)%QT.length];
  return `<div class="hero2"><small>${gr}${p.nome?', '+esc(p.nome):''}</small>
  <div class="cnt">${tg?left(tg.d):'—'}<span>${tg?(left(tg.d)===1?'dia':'dias')+' para '+esc(tg.n):'Defina seu alvo em Mais › Vida'}</span></div>
  <p class="q">${why}</p>
  <button class="rk2" onclick="go('xp')"><span class="avatar">${AV[cur.i]}</span><div class="g"><b>${cur.n}</b><div class="meter"><i style="width:${pc}%"></i></div><small>${X} XP · ${nx?'faltam '+(nx.x-X)+' para '+nx.n:'topo'} · 🔥 ${streak()}d</small></div><span>›</span></button></div>
  <h2 class="sec">Hoje nos 4 pilares</h2>
  <div class="pils">${pil('study','🧠','Mente',mente,hm(ds.m)+' de '+hm(ds.dg),ds.q+' de '+ds.qg+' questões')+pil('train','💪','Corpo',ds.t>=1?100:0,ds.t>=1?'Treinou hoje':'Falta treinar',wk+' treinos em 7 dias')+pil('habits','🌱','Vida',S.habits.length?pct(ds.h,S.habits.length):0,S.habits.length?ds.h+' de '+S.habits.length+' hábitos':'Crie hábitos','agenda e rotina')+pil('money','💰','Grana',inc?Math.max(0,100-pct(gas,inc)):0,inc?'sobra '+R(sob):'Defina o salário','gasto '+R(gas))}</div>
  ${chestCard(ds)}<div class="card"><h2>Missões do dia</h2>${mis('Estudo',ds.m,ds.dg,'min')}${mis('Questões',ds.q,ds.qg,'')}${mis('Treino',ds.t,1,'')}${ds.hv?mis('Hábitos',ds.h,S.habits.length,''):''}<small>${ds.win?'Dia vencido! 🔥':ds.loss?'Cumpra as metas para evitar −'+ds.loss+' XP. Seu rank nunca cai.':''}</small></div>
  ${revCard()}
  <div class="card"><h2>Próximos compromissos</h2>${up.length?up.map(a=>`<div class="item"><b style="width:64px">${left(a.d)===0?'Hoje':left(a.d)===1?'Amanhã':fd(a.d).slice(0,5)}</b><div class="g">${esc(a.n)}</div><small>${a.t}</small></div>`).join(''):'<div class="empty">Nada marcado.</div>'}</div>
  ${tasks.length?`<div class="card"><h2>Tarefas de hoje</h2>${tasks.map(taskRow).join('')}</div>`:''}
  <div class="card"><h2>Quadro de dias <small>${bd.tot?bd.won+' de '+bd.tot+' vencidos':''}</small></h2><div class="heat">${bd.h}</div></div>`};

/* ===== MENU "MAIS" ===== */
V.more=function(){const I=[['agenda','▦','Agenda','compromissos'],['habits','✔','Hábitos','sequências'],['plan','☰','Tarefas','semana'],['mentor','✦','Mentor','mentalidade'],['xp','⚡','XP e níveis','como funciona'],['life','◆','Vida','cadastro e cores']];
  return `<div class="more">${I.map(i=>`<button class="mb" onclick="go('${i[0]}')"><b>${i[1]}</b><span>${i[2]}</span><small>${i[3]}</small></button>`).join('')}</div>`};

/* ===== PÁGINA DE XP ===== */
V.xp=function(){
  const g=gross(),pn=penalty(),X=xp(),ri=rank(X),sl=5+ri;
  const src=[['Tempo de estudo','1 XP por minuto'],['Questões','2 XP por questão feita + 3 por acerto'],['Treino','30 XP + 1,5 por minuto'],['Tarefas do plano','15 XP cada'],['Revisões','10 XP cada'],['Hábitos','10 XP cada, por dia'],['Lançar gasto pago','5 XP cada']];
  const wh=[['Neurociência da repetição','Rever o conteúdo em 1, 7 e 30 dias combate a curva do esquecimento. Por isso as revisões valem XP.'],['Gatilho + ação','Decidir antes "quando X, faço Y" reduz a dependência de vontade. As missões diárias fazem esse papel.'],['Meta que sobe 1% ao dia','Aumentar um pouco todo dia evita o choque de começar pesado e constrói consistência.'],['Perder dói mais que ganhar','Por isso metas não cumpridas descontam XP: o app usa a aversão à perda a seu favor.'],['Recompensa imediata e surpresa','O cérebro libera mais dopamina quando a recompensa vem logo após o ato e quando é um pouco imprevisível. Por isso o +XP aparece na hora e o baú diário sorteia o bônus.'],['Ver o progresso chegando','Quanto mais perto da meta, mais motivação. Por isso os anéis e a barra mostram sempre quanto falta.'],['Dinheiro também é disciplina','Lançar gastos dá XP porque o que você mede, você controla.']];
  return `<div class="hero2"><small>Seu total</small><div class="cnt">${X}<span>XP · ${STEPS[lvl(X)].n}</span></div><small>Ganho ${g} XP · perdido ${pn} XP por metas não cumpridas</small></div>
  <div class="card"><h2>De onde vem o XP</h2>${src.map(s=>`<div class="item"><b>${s[0]}</b><span class="mute" style="margin-left:auto;text-align:right">${s[1]}</span></div>`).join('')}</div>
  <div class="card"><h2>Como se perde XP</h2><p class="mute" style="margin:0">No começo a perda é pequena: hoje ela vale ${Math.round(HF()*100)}% do valor cheio (estudo −40, questões −30, treino −30, hábitos −30). A cada rank ela cresce, até passar de 100%. Seu rank nunca cai: você só perde XP dentro do rank atual. O dia de hoje só pesa quando acaba.</p></div>
  <div class="card"><h2>Ranks</h2>${RK.map((r,i)=>`<div class="item"><b style="color:${i===ri?'var(--acc)':i<ri?'var(--ink)':'var(--mute)'}">${i<ri?'✓ ':i===ri?'▶ ':''}${r[0]}</b><span class="mute" style="margin-left:auto">${r[1]} XP</span></div>`).join('')}<small>Cada rank sobe 5% a meta diária, mas libera +1 vaga de hábito (você tem ${sl}).</small></div>
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
  d.innerHTML='<div class="cf">'+Array.from({length:24},(_,i)=>`<i style="left:${Math.random()*100}%;animation-delay:${Math.random()*.8}s">${['✨','⭐','🎉'][i%3]}</i>`).join('')+`</div><div class="lb2"><small>NOVO RANK</small><div class="av">${AV[r]}</div><h1>${RK[r][0]}</h1><small>Toque para continuar</small></div>`;
  document.body.appendChild(d);try{navigator.vibrate&&navigator.vibrate([60,40,120])}catch(x){}}
const _render=render;
render=function(){_render();const g=gross(),r=rank(xp());
  if(S.lg==null){S.lg=g;S.lr=r;save();return}
  const d=g-S.lg;if(d!==0){S.lg=g;save()}
  if(r>S.lr){S.lr=r;save();levelUp(r)}else if(d>0)toast('+'+d+' XP')};
function chest(){const k=dk(),ds=dayStat(k);if(S.ch[k]||ds.ok.filter(Boolean).length<2)return;
  const crit=Math.random()<.1,b=crit?150:Math.round(20+Math.random()*(ds.win?60:30));
  S.ch[k]=b;S.bonus=(S.bonus||0)+b;save();render();if(crit)toast('💎 CRÍTICO!',1)}
function chestCard(ds){const k=dk(),o=S.ch[k],n=ds.ok.filter(Boolean).length;
  return o?`<div class="card chest"><span class="ic">🎁</span><div class="g"><b>Baú de hoje aberto</b><br><small>Você ganhou +${o} XP${o===150?' (crítico!)':''}</small></div></div>`
  :n>=2?`<button class="card chest ready" onclick="chest()"><span class="ic">🎁</span><div class="g"><b>Baú pronto!</b><br><small>Toque para abrir e ver o prêmio</small></div></button>`
  :`<div class="card chest"><span class="ic">🔒</span><div class="g"><b>Baú diário</b><br><small>Cumpra 2 missões para abrir (${n}/2). Completar tudo aumenta o prêmio.</small></div></div>`}
