/* =====================================================================
   CORE: dados, motor de XP/disciplina (calculado UMA vez por mudança),
   alertas, navegação e peças de interface compartilhadas.
   Os dados continuam na mesma chave do navegador: nada do que você já
   registrou se perde ao trocar de versão.
   ===================================================================== */

/* ===== DADOS ===== */
const K='mapa-vida-v1';
let S=null;try{S=JSON.parse(localStorage.getItem(K))}catch(e){}
S=Object.assign({exams:[],sess:[],qs:[],plan:[],goal:840,timer:{run:false,start:0,acc:0},subs:[],tsub:'',mats:[],rev:[],sel:{},arev:true,fin:[],tr:[],prof:{},habits:[],hd:{},hsince:'',ag:[],acc:[],bud:{},goals:[],sal:{},debts:[],bonus:0,ch:{},peak:0,cards:[],kr:{},ach:{},rd:[],books:[],wt:[],gl:[],tplan:{},md:{},fo:{},mg:{}},S||{});
S.sal=Object.assign({inc:0,fix:0,day:5,pd:20,pf:20,pl:60},S.sal);
let _w=0;
function flush(){clearTimeout(_w);try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}}
function save(){touch();clearTimeout(_w);_w=setTimeout(flush,250)}
addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});

/* ===== AUXILIARES ===== */
const $=s=>document.querySelector(s),v=i=>(document.getElementById(i)||{}).value||'';
const uid=()=>Math.random().toString(36).slice(2,9);
const pad=n=>String(n).padStart(2,'0');
const dk=d=>{d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const addD=(k,n)=>{const d=new Date(k+'T00:00');d.setDate(d.getDate()+n);return dk(d)};
const left=k=>Math.round((new Date(k+'T00:00')-new Date(dk()+'T00:00'))/864e5);
const hm=m=>m>=60?Math.floor(m/60)+'h'+(m%60?pad(m%60):''):m+'min';
const R=n=>(+n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const R0=n=>(+n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fd=k=>{const[a,b,c]=k.split('-');return c+'/'+b+'/'+a};
const DOW=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MON=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const pct=(a,b)=>b>0?Math.min(100,Math.round(a/b*100)):0;
const nf=n=>Math.round(n).toLocaleString('pt-BR'),fx=n=>String(+n.toFixed(2)).replace('.',',');
const sum=(a,t)=>a.filter(x=>x.t===t).reduce((s,x)=>s+x.v,0);
const isP=x=>x.p!==false;
const stepAt=(map,k,def)=>{let b=null;for(const x in map)if(x<=k&&(b===null||x>b))b=x;return b===null?def:map[b]};
const QT=['Ninguém vem te salvar. Levanta e faz.','A mente desiste bem antes do corpo. Não dê ouvido.','Conforto é o inimigo da aprovação.','Faça hoje o que dói. Colha amanhã.','Disciplina é agir sem vontade.','Quem falha duas vezes seguidas começa um novo hábito: o de falhar.'];

/* ===== RANKS E DIFICULDADE ===== */
const RK=[['Preguiçoso',0],['Recruta',300],['Soldado',900],['Cabo',2000],['Sargento',3800],['Tenente',6500],['Capitão',10500],['Major',16000],['Coronel',24000],['General',35000],['Supremo',50000]];
const STEPS=[];RK.forEach((r,i)=>{const n=RK[i+1];if(!n)STEPS.push({n:r[0],x:r[1],i});else for(let s=0;s<3;s++)STEPS.push({n:r[0]+' '+(s+1),x:Math.round(r[1]+(n[1]-r[1])*s/3),i})});
const lvl=X=>{let j=0;STEPS.forEach((s,k)=>{if(X>=s.x)j=k});return j};
const rank=X=>{let i=0;RK.forEach((r,j)=>{if(X>=r[1])i=j});return i};
/* DIFICULDADE POR RANK: [multiplicador da meta, multiplicador da perda de XP]. Sobe sozinha conforme você evolui. */
const DIFF=[[1,.15],[1.05,.3],[1.1,.5],[1.2,.8],[1.3,1.2],[1.45,1.8],[1.6,2.6],[1.85,3.8],[2.2,5.5],[2.7,8],[3.5,12]];
/* MODO (você escolhe): [nome, multiplicador da meta, multiplicador da perda, descrição] */
const MODES=[['Fácil',.8,.5,'Ritmo leve para criar o hábito.'],['Normal',1,1,'Equilíbrio entre meta e consequência.'],['Difícil',1.25,1.5,'Meta maior e errar custa caro.'],['Insano',1.5,2.2,'Sem desculpa. Modo Goggins.']];
/* peso de cada missão na perda de XP */
const MW={m:40,q:30,t:30,r:25,h:30};

/* ===== ESTADO DERIVADO (migrações leves) ===== */
if(!S.acc.length){S.acc.push({id:'carteira',name:'Carteira',ic:'👛',type:'conta',ini:0});S.fin.forEach(x=>{if(!x.a)x.a='carteira'})}
if(!S.since){const a=[...S.sess,...S.qs,...S.tr].map(x=>x.d).sort();S.since=a[0]||dk()}
if(!S.rsince)S.rsince=dk();          /* leitura vira missão a partir da atualização */
if(!S.law)S.law=dk();                /* regra do "nunca falhe duas vezes" vale a partir daqui */
S.dr=S.dr||{};if(S.dr0==null)S.dr0=0;if(S.dr[dk()]==null)S.dr[dk()]=S.peak||0;
if(S.md[dk()]==null&&Object.keys(S.md).length===0)S.md['0000-00-00']=1;
flush();

const ramp=k=>Math.min(1,.4*Math.pow(1.01,Math.max(0,Math.round((new Date(k+'T00:00')-new Date(S.since+'T00:00'))/864e5))));
const tier=k=>Math.min(10,stepAt(S.dr,k,k<dk()?S.dr0:(S.peak||0)));
const modeAt=k=>stepAt(S.md,k,1);

/* ===== MOTOR: tudo calculado uma vez por mudança de dados ===== */
let _v=0,_C=null;
const touch=()=>{_v++;_C=null};
const EMPTY={m:0,q:0,qc:0,t:0,tm:0,rm:0,rp:0,h:0,kr:0};
function mk(k,x,mult){
  const hv=S.habits.length>0&&k>=S.hsince,rv=k>=S.rsince,f=DIFF[tier(k)],md=MODES[modeAt(k)];
  const G=b=>Math.round(b*ramp(k)*f[0]*md[1]);
  const M=[{id:'m',n:'Estudo',ic:'🧠',v:x.m,g:G(S.goal/7),u:'min',w:MW.m,go:"ss='c';go('study')"},
           {id:'q',n:'Questões',ic:'✍️',v:x.q,g:Math.max(5,G(+S.prof.qgoal||20)),u:'',w:MW.q,go:"ss='q';go('study')"},
           {id:'t',n:'Treino',ic:'💪',v:x.t,g:1,u:'',w:MW.t,go:"bs='t';go('body')"}];
  if(rv)M.push({id:'r',n:'Leitura',ic:'📖',v:x.rm,g:Math.max(5,G(+S.prof.rgoal||20)),u:'min',w:MW.r,go:"ss='l';go('study')"});
  if(hv)M.push({id:'h',n:'Hábitos',ic:'🌱',v:x.h,g:S.habits.length,u:'',w:MW.h,go:"bs='h';go('body')"});
  M.forEach(a=>a.ok=a.v>=a.g);
  const base=M.reduce((s,a)=>s+(a.ok?0:a.w),0),hf=f[1]*md[2],okN=M.filter(a=>a.ok).length;
  return{k,M,loss:Math.round(base*hf*mult),perMiss:a=>Math.round(a.w*hf*mult),mult,hf,okN,win:okN===M.length,fail:okN*2<M.length,act:(x.m+x.q+x.t+x.rm+x.h+x.kr)>0,dg:M[0].g,qg:M[1].g}}
function build(){
  const T=dk(),D={},g=k=>D[k]||(D[k]=Object.assign({},EMPTY));
  S.sess.forEach(s=>g(s.d).m+=s.m);
  S.qs.forEach(q=>{const x=g(q.d);x.q+=q.n;x.qc+=q.c});
  S.tr.forEach(t=>{const x=g(t.d);x.t++;x.tm+=t.m});
  S.rd.forEach(r=>{g(r.d).rm+=r.m;D[r.d].rp+=r.p||0});
  const hs=new Set(S.habits.map(h=>h.id));
  for(const k in S.hd)g(k).h=S.hd[k].filter(i=>hs.has(i)).length;
  for(const k in S.kr)g(k).kr=S.kr[k];
  /* percorre os dias UMA vez: perda de XP + regra do segundo erro */
  const days={};let pen=0,run=0;
  for(const d=new Date(S.since+'T00:00');dk(d)<=T;d.setDate(d.getDate()+1)){
    const k=dk(d),on=k>=S.law,mult=on?(run===0?1:run===1?1.5:2):1,st=mk(k,D[k]||EMPTY,mult);days[k]=st;
    if(k<T){pen+=st.loss;if(on)run=st.fail?run+1:0}}
  let gr=S.bonus||0;
  S.sess.forEach(s=>gr+=s.m);S.qs.forEach(q=>gr+=q.n*2+q.c*3);S.tr.forEach(w=>gr+=30+Math.round(w.m*1.5));
  S.plan.forEach(p=>{if(p.done)gr+=15});S.rev.forEach(r=>{if(r.done)gr+=10});S.fin.forEach(f=>{if(f.p!==false)gr+=5});
  for(const k in S.hd)gr+=S.hd[k].length*10;
  S.rd.forEach(r=>gr+=r.m);gr+=S.wt.length*10;
  const net=Math.max(0,gr-pen),r=rank(net);
  if((S.peak||0)<r){S.peak=r;clearTimeout(_w);_w=setTimeout(flush,250)}
  const floor=RK[S.peak||0][1];
  return{D,days,gross:gr,pen,run,net,floor,X:Math.max(net,floor)}}
const C=()=>_C||(_C=build());
const xp=()=>C().X,gross=()=>C().gross,penalty=()=>C().pen;
const stat=k=>C().days[k]||mk(k,C().D[k]||EMPTY,1);
const DAY=k=>C().D[k]||EMPTY;
const todayMin=()=>DAY(dk()).m;
function streak(){const c=C();let n=0,d=dk();const a=k=>{const x=c.D[k];return x&&(x.m+x.q+x.t+x.rm+x.kr)>0};if(!a(d))d=addD(d,-1);while(a(d)){n++;d=addD(d,-1)}return n}
const MS={3:50,7:150,14:300,30:700,60:1500};

/* ===== ALERTAS (o app te avisa antes de você se perder) ===== */
function alerts(){
  const A=[],ds=stat(dk()),h=new Date().getHours(),c=C();
  const ms=typeof moneyStatus==='function'?moneyStatus(dk().slice(0,7)):null;
  if(ms&&ms.lv==='red')A.push({lv:'red',ic:'🚨',t:'Grana no vermelho',s:ms.items[0].t,go:"ms='v';go('money')"});
  else if(ms&&ms.lv==='yel')A.push({lv:'yel',ic:'⚠️',t:'Atenção com os gastos',s:ms.items[0].t,go:"ms='v';go('money')"});
  if(c.run>0&&!ds.win)A.push({lv:'red',ic:'⛓️',t:'Regra do segundo erro ativa',s:'Você falhou ontem. Hoje errar custa ×'+fx(ds.mult)+'.',go:"go('law')"});
  const lateRev=typeof revList==='function'?revList().late.length:0;
  if(lateRev)A.push({lv:'yel',ic:'🔁',t:lateRev+' revisã'+(lateRev>1?'ões atrasadas':'o atrasada'),s:'Revisar na hora fixa o conteúdo.',go:"ss='r';go('study')"});
  const st=streak();
  if(h>=18&&st>0&&!ds.act)A.push({lv:'red',ic:'🔥',t:'Sua sequência de '+st+' dias acaba hoje',s:'Faça qualquer missão antes de dormir.',go:"go('home')"});
  const ex=typeof nextExams==='function'?nextExams()[0]:null;
  if(ex&&left(ex.d)<=7)A.push({lv:'yel',ic:'📝',t:'Prova em '+left(ex.d)+' dia'+(left(ex.d)===1?'':'s'),s:ex.name,go:"ss='p';go('study')"});
  return A.sort((a,b)=>(a.lv==='red'?0:1)-(b.lv==='red'?0:1))}

/* ===== PEÇAS REUTILIZÁVEIS ===== */
const V={},M={};
const ring=(p,ic,c)=>`<div class="ring" style="--p:${p};--c:${c||'var(--acc)'}"><span>${ic}</span></div>`;
const empty=t=>`<div class="empty">${t}</div>`;
const bar=(p,c)=>`<div class="meter"><i style="width:${Math.max(0,Math.min(100,p))}%;background:${c||'var(--acc)'}"></i></div>`;
function toast(t,cls){const d=document.createElement('div');d.className='toast '+(cls||'');d.textContent=t;document.body.appendChild(d);try{navigator.vibrate&&navigator.vibrate(cls==='bad'?[90,50,90]:25)}catch(x){}setTimeout(()=>d.remove(),cls?2400:1700)}
function applyColor(c){c=c||'#2ECC71';const r=document.documentElement.style,n=parseInt(c.slice(1),16),l=.299*(n>>16)+.587*(n>>8&255)+.114*(n&255);r.setProperty('--acc',c);r.setProperty('--on',l>150?'#000':'#fff')}

/* personagens */
const PIMG=['n01_preguicoso','n02_recruta','n03_soldado','n04_cabo','n05_sargento','n06_tenente','n07_capitao','n08_major','n09_coronel','n10_general','n11_supremo'].map(n=>'personagens/'+n+'.webp');
const RC=['#cbd5e1','#f59e0b','#22c55e','#22d3ee','#4ade80','#3b82f6','#2563eb','#a855f7','#ef4444','#ff4d2e','#fbbf24'];
const SLOG=['Comece devagar...','Dê o primeiro passo!','Mostre sua força!','Disciplina é tudo!','Assuma o comando!','Supere seus limites!','Lidere com honra!','Conquiste mais!','Mostre sua superioridade!','Estratégia e poder!','Você é a Lenda!'];
const AR=[.95,.936,.936,.945,.959,1.061,1.104,1.104,1.235,1.56,1.9];
const OP=['50% 20%','50% 20%','50% 20%','50% 20%','50% 20%','50% 20%','50% 20%','50% 20%','50% 20%','62% 25%','44% 25%'];
function heroImg(i,sz,lock,full){
  const w=typeof sz==='number'?sz+'px':sz;
  return `<div class="hi${lock?' lock':''}" style="--s:${w};--c:${RC[i]};--ar:${full?AR[i]:1}" role="img" aria-label="${lock?'Personagem bloqueado':RK[i][0]}"><div class="fr"><img src="${PIMG[i]}" alt="" loading="lazy" decoding="async" draggable="false" style="object-position:${OP[i]}"></div></div>`}

/* barra de XP: faixa vermelha = XP que você perde se o dia acabasse agora */
const xbPrev={};
function xpBar(key,ds){
  const c=C(),X=c.X,fl=c.floor,ri=rank(X),lo=RK[ri][1],nx=RK[ri+1],hi=nx?nx[1]:lo,span=Math.max(1,hi-lo);
  const p=nx?Math.max(0,Math.min(100,(X-lo)/span*100)):100;
  const risk=ds&&ds.loss?Math.max(0,X-Math.max(c.net-ds.loss,fl)):0,rp=nx?Math.min(p,risk/span*100):0;
  const tk=STEPS.filter(s=>s.i===ri&&s.x>lo).map(s=>`<b class="tk" style="left:${((s.x-lo)/span*100).toFixed(2)}%"></b>`).join('');
  const pv=xbPrev[key]==null?0:xbPrev[key];xbPrev[key]=p;
  return `<div class="xb" data-p="${p.toFixed(2)}" style="--rc:${RC[ri]};--p:${pv}%;--r:${rp.toFixed(2)}%"><div class="xh"><b>${STEPS[lvl(X)].n}</b><span>${nf(X)} / ${nx?nf(hi):'∞'} XP</span></div><div class="xbar"><i class="fill"></i><i class="risk"></i>${tk}</div><div class="xf"><small>${nx?`faltam <b>${nf(hi-X)}</b> XP para <b>${nx[0]}</b>`:'Você chegou ao topo. Agora é manter.'}</small></div></div>`}
function riskLine(ds){const c=C(),risk=ds.loss?Math.max(0,c.X-Math.max(c.net-ds.loss,c.floor)):0;
  return ds.win?'<div class="xr ok">✓ Contrato de hoje cumprido. Nada a perder.</div>':risk>0?`<div class="xr">⚠ Se o dia acabasse agora: <b>−${nf(risk)} XP</b></div>`:'<div class="xr ok">Missões pendentes, mas o piso do rank te protege agora.</div>'}

function levelUp(r){
  const d=document.createElement('div');d.className='lvlup';d.style.setProperty('--c',RC[r]);d.onclick=()=>d.remove();
  d.innerHTML=`<div class="lub"><small>NOVO RANK DESBLOQUEADO</small>${heroImg(r,'min(70vw,300px)',false,true)}<h1>${RK[r][0]}</h1><p>${SLOG[r]}</p><small>Toque para continuar</small></div>`;
  document.body.appendChild(d);try{navigator.vibrate&&navigator.vibrate([60,40,120])}catch(x){}}

/* gaveta inferior (formulários rápidos) */
function sheet(html,cls){closeSheet();const d=document.createElement('div');d.id='sheet';d.className='sheet';d.innerHTML=`<div class="sh-bg" onclick="closeSheet()"></div><div class="sh-box ${cls||''}"><div class="sh-grip"></div>${html}</div>`;document.body.appendChild(d);document.body.style.overflow='hidden'}
function closeSheet(){const d=$('#sheet');if(d)d.remove();document.body.style.overflow=''}

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
 ['rd1','📖','Leitor','Leia 5 horas no total',T=>[T.rd,300],80],
 ['rd2','📕','Primeiro livro','Termine um livro',T=>[T.bk,1],200],
 ['rd3','🦉','Rato de biblioteca','Termine 5 livros',T=>[T.bk,5],800],
 ['k100','🗂️','100 revisões','Revise 100 cartões',T=>[T.cr,100],150],
 ['k1k','🧩','1.000 revisões','Revise 1.000 cartões',T=>[T.cr,1000],600],
 ['e10','📝','Caderno de erros','Salve 10 erros como cartões',T=>[T.er,10],150],
 ['w1','⚖️','Na balança','Registre seu peso 4 vezes',T=>[T.wt,4],60],
 ['r2','🪖','Soldado','Chegue ao rank Soldado',T=>[T.pk,2],50],
 ['r4','🎖️','Sargento','Chegue ao rank Sargento',T=>[T.pk,4],120],
 ['r6','⭐','Capitão','Chegue ao rank Capitão',T=>[T.pk,6],250],
 ['r9','🐉','General','Chegue ao rank General',T=>[T.pk,9],800],
 ['r10','👑','Supremo','Chegue ao rank Supremo',T=>[T.pk,10],2000]];
function achT(){return{min:S.sess.reduce((t,s)=>t+s.m,0),q:S.qs.reduce((t,q)=>t+q.n,0),tr:S.tr.length,st:streak(),cr:Object.values(S.kr).reduce((a,b)=>a+b,0),er:S.cards.filter(c=>c.src==='e').length,pk:S.peak||0,rd:S.rd.reduce((t,r)=>t+r.m,0),bk:S.books.filter(b=>b.done).length,wt:S.wt.length}}
function achCheck(){const T=achT(),n=[];ACH.forEach(a=>{if(!S.ach[a[0]]){const p=a[4](T);if(p[0]>=p[1]){S.ach[a[0]]=dk();S.bonus=(S.bonus||0)+a[5];n.push(a)}}});if(n.length)save();return n}

/* ===== NAVEGAÇÃO E DESENHO ===== */
let tab='home',ss='h',bs='t',ms='v',ts={};
const TT={home:'Hoje',study:'Estudo',body:'Corpo',money:'Grana',more:'Mais',law:'Lei da Disciplina',map:'Mapa',ach:'Conquistas',goals:'Metas',agenda:'Agenda',plan:'Tarefas',mentor:'Mentor',life:'Perfil'};
const NAV=[['home','◉','Hoje'],['study','◷','Estudo'],['body','✚','Corpo'],['money','＄','Grana'],['more','⋯','Mais']];
const SUB=new Set(['law','map','ach','goals','agenda','plan','mentor','life']);
function go(t){closeSheet();tab=t;render();scrollTo(0,0)}
function rr(){const o={};document.querySelectorAll('#view input[id],#view textarea[id]').forEach(e=>o[e.id]=e.value);render();for(const k in o){const e=document.getElementById(k);if(e&&e.type!=='checkbox')e.value=o[k]}}
const opt=a=>[...new Set(a.filter(Boolean))].map(s=>`<option value="${esc(s)}">`).join('');

function navBadge(id){
  if(id==='study'){const n=(typeof revList==='function'?revList().due.length:0)+(typeof kdue==='function'?kdue().length:0);return n?`<i class="nbd">${n>99?'99+':n}</i>`:''}
  if(id==='money'){const m=typeof moneyStatus==='function'?moneyStatus(dk().slice(0,7)):null;return m&&m.lv==='red'?'<i class="nbd red pulse">!</i>':m&&m.lv==='yel'?'<i class="nbd yel">!</i>':''}
  return ''}
function pre(){ /* conquistas e marcos antes de desenhar */
  let ms_='';const sk=streak();Object.keys(MS).forEach(k=>{if(sk>=k&&!S.mg[k]){S.mg[k]=1;S.bonus=(S.bonus||0)+MS[k];ms_='🔥 '+k+' dias! +'+MS[k]+' XP'}});
  const nw=achCheck();if(ms_)save();return{ms:ms_,nw}}
function render(){
  const P=pre();applyColor(S.prof.color);
  $('#view').innerHTML=(V[tab]||V.home)();
  $('#ttl').textContent=tab==='home'&&S.prof.nome?S.prof.nome:TT[tab]||'';
  const cur=SUB.has(tab)?'more':tab;
  $('#nav').innerHTML=NAV.map(n=>`<button class="${n[0]===cur?'on':''}" onclick="${n[0]==='study'?"ss='h';":''}go('${n[0]}')"><b>${n[1]}</b>${n[2]}${navBadge(n[0])}</button>`).join('');
  $('#subs').innerHTML=opt([...S.mats.map(m=>m.name),...S.subs]);$('#tks').innerHTML=opt(S.tr.map(x=>x.k));
  const c=C(),r=rank(c.X);
  if(S.lg==null){S.lg=c.gross;S.lr=r;flush()}
  else{
    const d=c.gross-S.lg;if(d!==0){S.lg=c.gross;flush()}
    if(r>S.lr){S.lr=r;flush();levelUp(r)}else if(P.ms)toast(P.ms,'big');else if(d>0)toast('+'+d+' XP')}
  P.nw.slice(0,3).forEach((a,i)=>setTimeout(()=>toast(a[1]+' '+a[2]+' +'+a[5]+' XP','ach'),500+i*2300));
  requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll('.xb[data-p]').forEach(e=>e.style.setProperty('--p',e.dataset.p+'%'))));
  /* aviso de XP perdido ontem */
  if(S.lt!==dk()&&S.lg!=null){S.lt=dk();flush();const yk=addD(dk(),-1);
    if(yk>=S.since){const yl=stat(yk).loss;if(yl>0){const b=c.net,fl=c.floor,eff=Math.max(b+yl,fl)-Math.max(b,fl);
      if(eff>0)setTimeout(()=>{toast('−'+nf(eff)+' XP por ontem','bad');document.querySelectorAll('.hi').forEach(h=>h.classList.add('hit'))},600)}}}
}
$('#date').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
setInterval(()=>{if(document.hidden)return;document.querySelectorAll('.clk').forEach(c=>c.textContent=clock(elapsed()))},500);
window.addEventListener('DOMContentLoaded',()=>render());
const elapsed=()=>S.timer.acc+(S.timer.run?(Date.now()-S.timer.start)/1000:0);
const clock=s=>{s=Math.floor(s);return pad(Math.floor(s/3600))+':'+pad(Math.floor(s%3600/60))+':'+pad(s%60)};
function del(k,i){S[k]=S[k].filter(x=>x.id!==i);save();render()}
