/* =====================================================================
   BANCO DE QUESTÕES (treino e simulado) + GUIA DA BANCA
   ===================================================================== */
const QQ=QB.map((q,i)=>({id:'q'+(i+1),m:q[0],t:q[1],e:q[2],a:q[3],r:q[4],x:q[5],k:q[6]||'',src:q[7]||''}));
const QL='ABCD';
let qz={ph:'home',m:'',t:'',n:10,mode:'t',src:'n',list:[],i:0,show:false,t0:0,done:false};
const QCAT=m=>m==='Português'?'p':m==='Raciocínio Lógico'?'r':m==='Informática'?'i':(m==='Direito Administrativo'||m==='Direito Constitucional')?'d':m==='Legislação Municipal'?'l':'c';
const SIMU={p:10,r:5,i:5,d:10,l:10,c:10};
const shuf=a=>a.map(x=>[Math.random(),x]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function qzTopic(m,t){const mm=mat(m),tt=tpc(m,t);qz={...qz,ph:'home',m:mm?mm.name:'',t:tt?tt.name:'',mode:'t'};tab='study';ss='b';render();scrollTo(0,0)}
function qzPick(){
  let pool=QQ.filter(q=>(!qz.m||q.m===qz.m)&&(!qz.t||q.t===qz.t));
  const A=q=>S.qa[q.id]||{n:0,c:0};
  if(qz.src==='w')pool=pool.filter(q=>A(q).n>A(q).c);
  else if(qz.src==='n')pool=[...shuf(pool.filter(q=>!A(q).n)),...shuf(pool.filter(q=>A(q).n))];
  if(qz.src!=='n')pool=shuf(pool);
  return pool.slice(0,qz.n)}
function qzStart(simu){
  let L;
  if(simu){L=[];const g={};QQ.forEach(q=>(g[QCAT(q.m)]=g[QCAT(q.m)]||[]).push(q));Object.keys(SIMU).forEach(k=>L.push(...shuf(g[k]||[]).slice(0,SIMU[k])));
    if(L.length<20)L=shuf(QQ).slice(0,50);L=shuf(L);qz.mode='s';qz.simu=true}
  else{L=qzPick();qz.simu=false}
  if(!L.length){qz.msg='Nenhuma questão com esse filtro.';render();return}
  qz.list=L.map(q=>({q,p:shuf([0,1,2,3]),a:-1}));qz.i=0;qz.show=false;qz.t0=Date.now();qz.ph='run';qz.msg='';qz.done=false;render();scrollTo(0,0)}
function qzAns(k){const it=qz.list[qz.i];if(it.a>=0&&qz.mode==='t')return;if(it.sec==null)it.sec=Math.round((Date.now()-(it.ts||Date.now()))/1000);it.a=it.p[k];if(qz.mode==='t')qz.show=true;render()}
function qzMot(m){qz.list[qz.i].mot=m;render()}
function qzNext(){if(qz.i<qz.list.length-1){qz.i++;qz.show=false;render();scrollTo(0,0)}else qzEnd()}
function qzPrev(){if(qz.i>0){qz.i--;qz.show=false;render()}}
function qzEnd(){
  const ans=qz.list.filter(x=>x.a>=0);if(!ans.length){qz.ph='home';render();return}
  const grp={};
  ans.forEach(x=>{const q=x.q,ok=x.a===q.r,a=S.qa[q.id]||(S.qa[q.id]={n:0,c:0});a.n++;if(ok)a.c++;a.l=dk();S.qh.push({d:dk(),id:q.id,ok,sec:x.sec==null?0:x.sec,mot:x.mot||''});if(S.qh.length>3000)S.qh.shift();
    const mid=ensureMat(q.m),tid=ensureTop(mid,q.t),k=mid+'|'+tid,o=grp[k]||(grp[k]={mid,tid,n:0,c:0});o.n++;if(ok)o.c++;
    if(!ok){const st='qt:'+q.id;if(!S.cards.some(c=>c.sd===st))S.cards.push({id:uid(),mid,tid,f:'Teoria: '+q.t+' — qual é a regra por trás desta questão?\n“'+q.e.slice(0,150)+(q.e.length>150?'…':'')+'”',b:q.x,n:q.k,src:'e',sd:st,d:dk(),due:dk(),st:'n',iv:0,ez:2.5,rp:0,lp:0});
      const sd='qb:'+q.id;if(!S.cards.some(c=>c.sd===sd)){const f=q.e+'\n\n'+q.a.map((t,i)=>QL[i]+') '+t).join('\n');
      S.cards.push({id:uid(),mid,tid,f,b:'Correta: '+QL[q.r]+') '+q.a[q.r]+'\n\n'+q.x,n:q.k,src:'e',sd,d:dk(),due:dk(),st:'n',iv:0,ez:2.5,rp:0,lp:0})}}});
  Object.values(grp).forEach(o=>S.qs.push({id:uid(),d:dk(),mid:o.mid,tid:o.tid,s:(mat(o.mid)||{}).name,n:o.n,c:o.c,sid:'qb'}));
  if(qz.simu)S.simuLast=dk();qz.res={n:ans.length,c:ans.filter(x=>x.a===x.q.r).length,min:Math.max(1,Math.round((Date.now()-qz.t0)/60000)),all:qz.list};qz.ph='res';save();render();scrollTo(0,0)}
function vBanco(){
  if(qz.ph==='run')return qzRun();if(qz.ph==='res')return qzRes();
  const ms=[...new Set(QQ.map(q=>q.m))],ts=[...new Set(QQ.filter(q=>!qz.m||q.m===qz.m).map(q=>q.t))],A=Object.values(S.qa),feitas=A.length,n=A.reduce((t,x)=>t+x.n,0),c=A.reduce((t,x)=>t+x.c,0),er=QQ.filter(q=>(S.qa[q.id]||{n:0,c:0}).n>(S.qa[q.id]||{c:0}).c).length;
  const opt=(a,sel,all)=>`<option value="">${all}</option>`+a.map(x=>`<option${x===sel?' selected':''}>${esc(x)}</option>`).join('');
  return `<div class="card hero-m"><small>Banco do Técnico Legislativo</small><div class="big2">${QQ.length}<small> questões no estilo da banca</small></div><small>${feitas} já feitas · ${n?Math.round(c/n*100)+'% de acerto':'comece agora'} · ${er} para refazer</small></div>
  <div class="card"><h2>Treinar</h2><div class="stack"><select onchange="qz.m=this.value;qz.t='';rr()">${opt(ms,qz.m,'Todas as matérias')}</select><select onchange="qz.t=this.value;rr()">${opt(ts,qz.t,'Todos os assuntos')}</select>
  <div class="seg sm">${[5,10,20,40].map(x=>`<button class="${qz.n===x?'on':''}" onclick="qz.n=${x};rr()">${x}</button>`).join('')}</div>
  <div class="seg sm">${[['n','Novas primeiro'],['w','Só as que errei'],['a','Aleatórias']].map(a=>`<button class="${qz.src===a[0]?'on':''}" onclick="qz.src='${a[0]}';rr()">${a[1]}</button>`).join('')}</div>
  <div class="seg sm"><button class="${qz.mode==='t'?'on':''}" onclick="qz.mode='t';rr()">Treino (corrige na hora)</button><button class="${qz.mode==='s'?'on':''}" onclick="qz.mode='s';rr()">Corrige no fim</button></div>
  ${qz.msg?`<small style="color:var(--warn)">${qz.msg}</small>`:''}<button class="btn" onclick="qzStart(false)">▶ Começar</button></div></div>
  <div class="card"><h2>Simulado nos moldes da prova</h2><p class="mute" style="margin:0 0 10px">Até 50 questões (10 Português, 5 Raciocínio, 5 Informática, 10 Dir. Adm/Const., 10 Legislação, 10 do cargo, conforme o banco), sem correção até o fim. Meta: 95% (57 de 60).</p><button class="btn" onclick="qzStart(true)">⏱ Fazer simulado</button></div>
  <p class="mute" style="font-size:12px">Inclui questões REAIS de provas anteriores da Consulplan (marcadas com 📄) e questões originais baseadas no seu edital. Erros viram cartões do Anki sozinhos.</p>`}
function qzRun(){
  const it=qz.list[qz.i],q=it.q,tot=qz.list.length;if(!it.ts)it.ts=Date.now();const fb=qz.mode==='t'&&it.a>=0,sim=qz.mode==='s';
  const el=Math.floor((Date.now()-qz.t0)/1000);
  return `<div class="kt"><button class="x" onclick="if(confirm('Encerrar e registrar o que respondeu?'))qzEnd()">✕</button><div class="meter kbar"><i style="width:${(qz.i+1)/tot*100}%"></i></div><small>${qz.i+1}/${tot}${sim?' · '+pad(Math.floor(el/60))+':'+pad(el%60):''}</small></div>
  <div class="card"><small class="mute">${esc(q.m)} · ${esc(q.t)}${q.src&&q.src!=='Original'?' · 📄 '+esc(q.src):''}</small><p style="font-size:16px;line-height:1.45;margin:8px 0 12px">${esc(q.e)}</p>
  ${it.p.map((o,k)=>{const picked=it.a===o,right=fb&&o===q.r,wrong=fb&&picked&&o!==q.r;
    return `<button class="qo${picked?' pk':''}${right?' ok':''}${wrong?' bad':''}" onclick="qzAns(${k})"><b>${QL[k]}</b><span>${esc(q.a[o])}</span></button>`}).join('')}
  ${fb?`<div class="qx2"><b>${it.a===q.r?'✔ Correto!':'✘ Era a '+QL[it.p.indexOf(q.r)]}</b> <small class="mute">${it.sec}s</small>${it.a!==q.r?`<div class="seg sm" style="margin:8px 0">${['Não sabia','Pegadinha','Distração'].map(m=>`<button class="${it.mot===m?'on':''}" onclick="qzMot('${m}')">${m}</button>`).join('')}</div>`:''}<p>${esc(q.x)}</p>${q.k?`<p>💡 <b>Macete:</b> ${esc(q.k)}</p>`:''}</div>`:''}</div>
  <div class="two">${qz.i>0&&sim?'<button class="btn g" onclick="qzPrev()">‹ Anterior</button>':'<span></span>'}<button class="btn" ${(fb||sim)?'':'disabled'} onclick="qzNext()">${qz.i<tot-1?'Próxima ›':'Finalizar'}</button></div>`}
function qzRes(){
  const r=qz.res,p=Math.round(r.c/r.n*100),W=r.all.filter(x=>x.a>=0&&x.a!==x.q.r),B={};
  r.all.filter(x=>x.a>=0).forEach(x=>{const o=B[x.q.m]||(B[x.q.m]={n:0,c:0});o.n++;if(x.a===x.q.r)o.c++});
  return `<div class="card kdone"><div style="font-size:54px">${p>=95?'🏆':p>=80?'💪':'📚'}</div><h2 style="font-size:24px;margin:6px 0">${r.c} de ${r.n} · ${p}%</h2><small>${r.min} min · meta da prova: 95% (57/60)</small>
  ${Object.keys(B).map(k=>`<div class="row" style="margin-top:8px"><b style="flex:1;text-align:left">${esc(k)}</b><small>${B[k].c}/${B[k].n}</small></div>${bar(pct(B[k].c,B[k].n),B[k].c/B[k].n>=.9?'var(--ok)':B[k].c/B[k].n>=.7?'var(--warn)':'var(--bad)')}`).join('')}
  ${W.length?'<small style="display:block;margin-top:10px">Cada erro virou 2 cartões no Anki: a questão e a teoria por trás dela.</small>':''}<button class="btn" style="width:100%;margin-top:12px" onclick="qz.ph='home';render()">Voltar</button>${W.length?`<button class="btn g" style="width:100%;margin-top:8px" onclick="qz.src='w';qz.m='';qz.t='';qz.n=40;qz.mode='t';qzStart(false)">Refazer as que errei</button>`:''}</div>
  ${W.length?`<div class="card"><h2>O que você errou</h2>${W.map(x=>`<div style="margin-bottom:14px"><small class="mute">${esc(x.q.m)} · ${esc(x.q.t)}</small><p style="margin:4px 0">${esc(x.q.e)}</p><p class="out" style="margin:2px 0">Você: ${esc(x.q.a[x.a])}</p><p class="in" style="margin:2px 0">Certa: ${esc(x.q.a[x.q.r])}</p><small>${esc(x.q.x)}</small>${x.q.k?`<br><small>💡 ${esc(x.q.k)}</small>`:''}</div>`).join('')}</div>`:''}`}
function vGuia(){
  const d=examDays(),nc=S.cards.filter(c=>c.st==='n').length;
  return `<div class="card hero-m"><small>Prova em</small><div class="big2">${d>0?d+' dias':'—'}<small> · 20/12/2026</small></div><small>${d>0?'Cartões novos restantes: '+nc+' → '+(nc&&d>2?Math.ceil(nc/Math.max(1,d-7))+' por dia para terminar 1 semana antes da prova.':'ok'):''}</small></div>
  ${TIPS.map(t=>`<div class="card"><h2>${esc(t[0])}</h2><p class="mute" style="margin:0;line-height:1.5">${esc(t[1])}</p></div>`).join('')}`}
