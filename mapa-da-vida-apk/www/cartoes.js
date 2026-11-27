/* =====================================================================
   CARTÕES (estilo Anki, 100% offline)
   Estados: n = novo · l = aprendendo/reaprendendo (em minutos) · r = revisão (em dias)
   Novo/aprendendo: Errei 1 min · Difícil ~6 min · Bom 10 min → 1 dia · Fácil 4 dias
   Revisão: Errei 10 min (e volta com intervalo menor) · Difícil ×1,2 · Bom ×facilidade · Fácil ×facilidade×1,3
   Modo prova: nenhum intervalo passa de metade do tempo que falta para a prova.
   ===================================================================== */
const LEARN=[1,10],RELEARN=[10],LA=20*60000;
let kmode='home',kq=[],kshow=false,kcur='',kst={n:0,ok:0,xp:0,combo:0,best:0,total:0},kfree=false,kTs=0,kTid='',kT={},kf='',kb='',kn='',ksrc='n',ksub='',ksubt='',kmsg='',kbrw='',kflt='',kbt='';
S.cards.forEach(c=>{if(!c.st)c.st=((c.rp||0)>0||(c.iv||0)>0)?'r':'n'});
const kNewLeft=()=>Math.max(0,(+S.prof.knew||30)-(S.kn[dk()]||0));
const examDays=()=>{const p=S.prof&&S.prof.date;return p?left(p):0};
const nl2=t=>esc(t).replace(/\n/g,'<br>');
const kLbl=n=>n<=0?'<1 min':n===1?'1 dia':n<30?n+' dias':n<365?(Math.round(n/30)===1?'1 mês':Math.round(n/30)+' meses'):'1 ano+';
const kLblMs=ms=>ms<6e4?'1 min':ms<36e5?Math.round(ms/6e4)+' min':ms<864e5?Math.round(ms/36e5)+' h':kLbl(Math.round(ms/864e5));
function kdue(mid,tid){const t=Date.now(),td=dk();let nl=kNewLeft();const o=[];
  S.cards.forEach(c=>{if(mid&&c.mid!==mid)return;if(tid&&c.tid!==tid)return;
    if(c.st==='r'){if(c.due<=td)o.push(c)}else if(c.st==='l'){if((c.dt||0)<=t)o.push(c)}else if(nl>0){o.push(c);nl--}});return o}
const kGoal=()=>+S.prof.kgoal||20;

/* agendador (função pura: devolve o novo estado e o tempo até a próxima vez) */
function kSched(c,g){
  const now=Date.now(),td=dk(),st=c.st||'n',ez=c.ez||2.5,d=examDays();
  const cap=iv=>d>0?Math.max(1,Math.min(iv,Math.floor(d/2))):iv;
  const G=(iv,e)=>{iv=cap(iv);return{set:{st:'r',ls:0,dt:0,rl:0,iv,due:addD(td,iv),ez:Math.max(1.3,e==null?ez:e),rp:(c.rp||0)+1},ms:iv*864e5}};
  const L=(i,min,rl)=>({set:{st:'l',ls:i,dt:now+min*6e4,rl:rl?1:0,ez},ms:min*6e4});
  if(st!=='r'){
    const rl=!!c.rl,steps=rl?RELEARN:LEARN,i=st==='n'?0:Math.min(c.ls||0,steps.length-1);
    if(g===0)return L(0,steps[0],rl);
    if(g===1)return L(i,i===0&&steps.length>1?Math.round((steps[0]+steps[1])/2):steps[i],rl);
    if(g===2)return i+1<steps.length?L(i+1,steps[i+1],rl):G(rl?Math.max(1,c.iv||1):1);
    return G(rl?Math.max(2,(c.iv||1)+1):4)}
  const iv=c.iv||1;
  if(g===0){const r=L(0,RELEARN[0],1);r.set.iv=Math.max(1,Math.round(iv*.4));r.set.ez=Math.max(1.3,ez-.2);r.lapse=1;return r}
  if(g===1)return G(Math.max(iv+1,Math.round(iv*1.2)),ez-.15);
  if(g===2)return G(Math.max(iv+1,Math.round(iv*ez)),ez);
  return G(Math.max(iv+2,Math.round(iv*ez*1.3)),ez+.15)}

const kById=id=>S.cards.find(c=>c.id===id);
function kPick(){const t=Date.now();for(const id of kq){const c=kById(id);if(c&&(kfree||c.st!=='l'||(c.dt||0)<=t))return c}return null}
function kkeep(){kf=v('kf_');kb=v('kb_');kn=v('kn_');ksub=v('kc_m')||ksub;ksubt=v('kc_t')}
function kGo(mode,src,mid){kmode=mode;if(src)ksrc=src;if(mid)ksub=mid;kmsg='';tab='study';ss='k';render();scrollTo(0,0)}
function kSrc(x){kkeep();ksrc=x;kmsg='';render()}
function kExit(){kFlush();kfree=false;kmode='home';render();scrollTo(0,0)}
function kOpen(){tab='study';ss='k';kmode='home';kStart()}
function kStart(mid,flt,tid){
  tab='study';ss='k';kfree=false;
  const t=Date.now(),td=dk();let nl=kNewLeft();const Lr=[],R=[],N=[];
  S.cards.forEach(c=>{if(mid&&c.mid!==mid)return;if(tid&&c.tid!==tid)return;if(flt==='e'&&c.src!=='e')return;
    if(c.st==='l'){if((c.dt||0)<=t+LA)Lr.push(c)}else if(c.st==='r'){if(c.due<=td)R.push(c)}else N.push(c)});
  Lr.sort((a,b)=>a.dt-b.dt);R.sort(()=>Math.random()-.5);
  const nn=N.slice(0,nl),q=[...Lr],a=[...R],b=[...nn];
  while(a.length||b.length){for(let i=0;i<3&&a.length;i++)q.push(a.shift());if(b.length)q.push(b.shift());if(!a.length)while(b.length)q.push(b.shift())}
  kq=q.slice(0,80).map(c=>c.id);
  if(!kq.length){kmode='home';kmsg='Nada para revisar agora. 🎉';render();return}
  kshow=false;kst={n:0,ok:0,xp:0,combo:0,best:0,total:kq.length};kmode='study';kmsg='';render();scrollTo(0,0)}
function kAns(g){
  const c=kById(kcur);if(!c)return;
  kT[c.mid]=(kT[c.mid]||0)+Math.min(90,Math.round((Date.now()-kTs)/1000));
  if(kfree){kq=kq.filter(id=>id!==c.id);if(g===0&&!c.fr){c.fr=1;kq.push(c.id)}else c.fr=0;kst.n++;if(g>=2){kst.ok++;kst.combo++;kst.best=Math.max(kst.best,kst.combo)}else if(g===0)kst.combo=0;S.kr[dk()]=(S.kr[dk()]||0)+1;const x=g>=2?2:1;S.bonus=(S.bonus||0)+x;kst.xp+=x;kshow=false;save();render();scrollTo(0,0);return}
  if(c.st==='n')S.kn[dk()]=(S.kn[dk()]||0)+1;
  const r=kSched(c,g);Object.assign(c,r.set);if(r.lapse)c.lp=(c.lp||0)+1;c.last=dk();
  kst.n++;if(g>=2){kst.ok++;kst.combo++;kst.best=Math.max(kst.best,kst.combo)}else if(g===0)kst.combo=0;
  if(c.st==='r')kq=kq.filter(id=>id!==c.id);
  const x=[1,2,3,4][g]+(g>=2?Math.min(5,Math.floor(kst.combo/3)):0);
  S.bonus=(S.bonus||0)+x;kst.xp+=x;S.kr[dk()]=(S.kr[dk()]||0)+1;
  kshow=false;save();render();scrollTo(0,0)}
function kSave(){
  kkeep();const m=v('kc_m');if(!m){kmsg='Escolha a matéria.';render();return}
  const tid=v('kc_t');
  const mk=(a,z,src,note)=>({id:uid(),mid:m,tid,f:a,b:z,n:note||'',src:src||'n',d:dk(),due:dk(),st:'n',iv:0,ez:2.5,rp:0,lp:0});
  if(ksrc==='b'){let n=0;kf.split('\n').map(x=>x.trim()).filter(Boolean).forEach(l=>{const i=l.search(/::|;|\t/);if(i<1)return;const a=l.slice(0,i).trim(),z=l.slice(i).replace(/^(::|;|\t)/,'').trim();if(a&&z){S.cards.push(mk(a,z));n++}});
    if(!n){kmsg='Use uma linha por cartão: pergunta :: resposta';render();return}S.bonus=(S.bonus||0)+n;kmsg=n+' cartões criados ✓'}
  else{if(!kf.trim()||!kb.trim()){kmsg=ksrc==='e'?'Preencha o enunciado e a resposta correta.':'Preencha a pergunta e a resposta.';render();return}
    S.cards.push(mk(kf.trim(),kb.trim(),ksrc,ksrc==='e'?kn.trim():''));S.bonus=(S.bonus||0)+(ksrc==='e'?5:1);kmsg=ksrc==='e'?'Erro salvo: ele volta até você acertar ✓':'Cartão salvo ✓'}
  kf=kb=kn='';save();render();scrollTo(0,0)}
function kDel(id){S.cards=S.cards.filter(c=>c.id!==id);save();render()}
function kBr(mid){kbrw=mid;kflt='';kbt='';kmode='browse';render();scrollTo(0,0)}
function kFlt(x){kflt=x;render()}

function vCards(){
  if(kmode==='study')return kStudy();if(kmode==='done')return kDone();if(kmode==='add')return kAdd();if(kmode==='browse')return kBrowse();
  const D=kdue(),tot=S.cards.length,er=S.cards.filter(c=>c.src==='e').length,hj=S.kr[dk()]||0,g=kGoal();
  const nN=D.filter(c=>c.st==='n').length,nL=D.filter(c=>c.st==='l').length,nR=D.filter(c=>c.st==='r').length,de=D.filter(c=>c.src==='e').length,ed=examDays();
  const decks=S.mats.map(m=>({m,t:S.cards.filter(c=>c.mid===m.id),d:kdue(m.id)})).filter(x=>x.t.length);
  return `<div class="card kh"><div class="row"><div><div class="kbig">${D.length}</div><small>cartões para hoje</small></div><div style="margin-left:auto;text-align:right"><small>🔵 ${nN} novos · 🔴 ${nL} aprendendo · 🟢 ${nR} revisão<br>${tot} no total · ${er} erros salvos</small></div></div>
  <div class="meter" style="margin:12px 0 4px"><i style="width:${pct(hj,g)}%"></i></div><small>Hoje: ${hj} de ${g}${hj>=g?' · meta batida! 🔥':''}${ed>0?' · prova em '+ed+' dias: os intervalos são limitados para você ver tudo antes':''}</small>
  <button class="btn kgo" onclick="kPickDeck()" ${S.cards.length?'':'disabled'}>▶ Estudar · escolher baralho</button>
  ${de?`<button class="btn g" style="width:100%;margin-top:8px" onclick="kStart('','e')">📝 Só os meus erros (${de})</button>`:''}${kmsg?`<small style="display:block;margin-top:8px">${kmsg}</small>`:''}</div>
  <div class="two" style="margin-bottom:12px"><button class="btn g" onclick="kGo('add','n')">＋ Novo cartão</button><button class="btn g" onclick="kGo('add','e')">📝 Questão que errei</button></div>
  ${decks.length?`<div class="card"><h2>Baralhos por matéria</h2>${decks.map(x=>`<div class="item"><i class="dot lg" style="background:${x.m.color}"></i><div class="g"><b>${esc(x.m.name)}</b><br><small>${x.t.length} cartões · ${x.t.filter(c=>c.src==='e').length} erros</small></div>${x.d.length?`<span class="pill" style="color:var(--warn)">${x.d.length}</span>`:'<span class="pill" style="color:var(--ok)">✓</span>'}<button class="chip" onclick="kStart('${x.m.id}')" ${x.d.length?'':'disabled'}>Estudar</button><button class="x" aria-label="Ver cartões" onclick="kBr('${x.m.id}')">⋯</button></div>`).join('')}</div>`:`<div class="card"><h2>Nenhum cartão ainda</h2><button class="btn" onclick="seedImport(true);render()">Carregar baralho do edital</button></div>`}
  <div class="two"><button class="chip" onclick="kGo('add','b')">Colar vários de uma vez</button><button class="chip" onclick="seedImport(true);kmsg='Baralho do edital conferido ✓';render()">↻ Restaurar baralho do edital</button></div>
  <small style="display:block;margin-top:10px">Novos por dia: ${+S.prof.knew||30} (mude em Mais › Perfil). Sem internet: tudo funciona offline.</small>`}
function kStudy(){
  const c=kPick();
  if(!c){const w=kq.map(kById).filter(x=>x&&x.st==='l').sort((a,b)=>a.dt-b.dt)[0];
    if(w){const ms=w.dt-Date.now();if(ms<=LA)return `<div class="kt"><button class="x" onclick="kExit()">✕</button><small>${kq.length} na fila</small></div><div class="card kdone"><div style="font-size:44px">⏳</div><h2>Próximo cartão em <b class="kwt" data-t="${w.dt}">${Math.ceil(ms/1000)}s</b></h2><small>Cartões que você errou voltam em poucos minutos, como no Anki.</small><button class="btn" style="width:100%;margin-top:12px" onclick="kq.forEach(i=>{const k=kById(i);if(k&&k.st==='l')k.dt=0});render()">Continuar agora</button><button class="btn g" style="width:100%;margin-top:8px" onclick="kmode='done';render()">Encerrar por hoje</button></div>`}
    kmode='done';return kDone()}
  kcur=c.id;if(kTid!==c.id){kTid=c.id;kTs=Date.now()}
  const m=mat(c.mid)||{name:'Sem matéria',color:'#6B7280'},tp=tpc(c.mid,c.tid),pc=Math.round((kst.total-kq.length)/Math.max(1,kst.total)*100),lb=kfree?['repete','próximo','próximo','próximo']:[0,1,2,3].map(g=>kLblMs(kSched(c,g).ms));
  const tag=c.st==='n'?'<span class="kchip">NOVO</span>':c.st==='l'?'<span class="kchip">APRENDENDO</span>':'';
  return `<div class="kt"><button class="x" aria-label="Sair" onclick="kExit()">✕</button><div class="meter kbar"><i style="width:${pc}%"></i></div><small>${kq.length}</small></div>
  ${kst.combo>=2?`<div class="kcombo">🔥 ${kst.combo} seguidos${kst.combo>=3?' · +'+Math.min(5,Math.floor(kst.combo/3))+' XP extra':''}</div>`:''}
  <div class="kc" style="--c:${m.color}"><div class="khd"><span class="kchip"><i class="dot" style="background:${m.color}"></i>${esc(m.name)}${tp?' · '+esc(tp.name):''}</span>${tag}${c.src==='e'?'<span class="ker">ERRO</span>':''}</div><div class="kf">${nl2(c.f)}</div>
  ${kshow?`<div class="kb"><hr><div class="kbt">${nl2(c.b)}</div>${c.n?`<div class="kn">💡 ${nl2(c.n)}</div>`:''}</div>`:''}</div>
  ${kshow?`<div class="kans">${[['Errei','bad'],['Difícil','warn'],['Bom','ok'],['Fácil','acc']].map((a,g)=>`<button class="ka ${a[1]}" onclick="kAns(${g})"><b>${a[0]}</b><small>${lb[g]}</small></button>`).join('')}</div>`:`<button class="btn kshow" onclick="kshow=true;render()">Mostrar resposta</button>`}`}
function kDone(){kFlush();const p=kst.n?Math.round(kst.ok/kst.n*100):0,left_=kdue().length,pend=S.cards.filter(c=>c.st==='l').length;
  return `<div class="card kdone"><div style="font-size:54px">${p>=80?'🏆':p>=50?'💪':'📚'}</div><h2 style="font-size:22px;margin:6px 0">Sessão concluída!</h2><div class="grid3" style="margin:12px 0"><div class="stat"><b>${kst.n}</b><span>respostas</span></div><div class="stat"><b>${p}%</b><span>acertos</span></div><div class="stat"><b>+${kst.xp}</b><span>XP</span></div></div><small>Melhor sequência: 🔥 ${kst.best}${pend?' · '+pend+' em aprendizado voltam em breve':''}</small>
  <button class="btn" style="width:100%;margin-top:14px" onclick="kmode='home';render()">Voltar aos baralhos</button>${left_?`<button class="btn g" style="width:100%;margin-top:8px" onclick="kStart()">Ainda tem ${left_} para hoje</button>`:''}</div>`}
function kAdd(){
  if(!S.mats.length)return `<div class="card"><h2>Crie uma matéria primeiro</h2><button class="btn" onclick="kmode='home';stab('m')">Ir para Matérias</button></div>`;
  const sub=ksub&&mat(ksub)?ksub:S.mats[0].id,L={n:['Pergunta (frente)','Resposta (verso)'],e:['Enunciado da questão que errei','Resposta correta'],b:['','']}[ksrc];
  return `<button class="chip" onclick="kkeep();kmode='home';render()">‹ Voltar</button>
  <div class="card" style="margin-top:10px"><div class="seg">${[['n','Cartão'],['e','Questão que errei'],['b','Vários']].map(a=>`<button class="${ksrc===a[0]?'on':''}" onclick="kSrc('${a[0]}')">${a[1]}</button>`).join('')}</div>
  <div class="stack"><select id="kc_m" aria-label="Matéria" onchange="kkeep();ksubt='';render()">${S.mats.map(m=>`<option value="${m.id}"${m.id===sub?' selected':''}>${esc(m.name)}</option>`).join('')}</select>
  <select id="kc_t" aria-label="Assunto"><option value="">Assunto (opcional)</option>${topOpts(sub,ksubt)}</select>
  ${ksrc==='b'?`<small>Uma linha por cartão: pergunta :: resposta</small><textarea id="kf_" rows="8" placeholder="Prazo do veto na LO? :: 15 dias úteis">${esc(kf)}</textarea>`
  :`<textarea id="kf_" rows="3" placeholder="${L[0]}">${esc(kf)}</textarea><textarea id="kb_" rows="3" placeholder="${L[1]}">${esc(kb)}</textarea>${ksrc==='e'?`<textarea id="kn_" rows="2" placeholder="Por que errei? Macete (opcional)">${esc(kn)}</textarea>`:''}`}
  ${kmsg?`<small style="color:var(--ok)">${kmsg}</small>`:''}<button class="btn" onclick="kSave()">Salvar e continuar</button></div></div>`}
function kBrowse(){
  const m=mat(kbrw)||{name:'Matéria',color:'#6B7280',topics:[]},L=S.cards.filter(c=>c.mid===kbrw&&(kflt!=='e'||c.src==='e')&&(!kbt||c.tid===kbt)).sort((a,b)=>(a.st==='r'?a.due:'0')<(b.st==='r'?b.due:'0')?-1:1).slice(0,150);
  const stl=c=>c.st==='n'?'nova':c.st==='l'?'aprendendo':(left(c.due)<=0?'hoje':left(c.due)+'d');
  return `<button class="chip" onclick="kmode='home';render()">‹ Voltar</button>
  <div class="card" style="margin-top:10px"><div class="row"><i class="dot lg" style="background:${m.color}"></i><h2 style="margin:0;flex:1">${esc(m.name)}</h2><button class="chip" onclick="kGo('add','n','${kbrw}')">＋ Novo</button></div>
  <div class="seg" style="margin:10px 0"><button class="${kflt!=='e'?'on':''}" onclick="kFlt('')">Todos</button><button class="${kflt==='e'?'on':''}" onclick="kFlt('e')">Só erros</button></div>
  <select onchange="kbt=this.value;render()" style="margin-bottom:8px"><option value="">Todos os assuntos</option>${topOpts(kbrw,kbt)}</select>
  ${L.length?L.map(c=>`<div class="item"><div class="g"><b class="ell">${esc(c.f.split('\n')[0])}</b><small class="ell" style="display:block">${esc(c.b.split('\n')[0])}</small></div>${c.src==='e'?'<span class="ker">ERRO</span>':''}<span class="pill" style="color:var(--mute)">${stl(c)}</span><button class="x" aria-label="Apagar" onclick="kDel('${c.id}')">×</button></div>`).join(''):empty('Nenhum cartão aqui.')}</div>`}
setInterval(()=>{if(kmode!=='study')return;document.querySelectorAll('.kwt').forEach(e=>{const ms=e.dataset.t-Date.now();if(ms<=0){render();return}e.textContent=Math.ceil(ms/1000)+'s'})},1000);

/* ===== IMPORTAÇÃO DO BARALHO DO EDITAL (só acrescenta o que falta) ===== */
const hk=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return 'c'+(h>>>0).toString(36)};
function ensureTop(mid,name){const m=mat(mid);let t=m.topics.find(x=>x.name.toLowerCase()===name.toLowerCase());if(!t){t={id:uid(),name};m.topics.push(t)}return t.id}
function seedImport(force){
  if(typeof SEEDM==='undefined')return 0;
  SEEDM.forEach(a=>{const mid=ensureMat(a[0]);a[1].forEach(t=>ensureTop(mid,t))});
  const have=new Set(S.cards.map(c=>c.sd).filter(Boolean));let n=0;
  SEEDC.forEach(g=>{const mid=ensureMat(g[0]),tid=ensureTop(mid,g[1]);
    g[2].forEach(p=>{const k=hk(g[0]+'|'+p[0]);if(have.has(k))return;have.add(k);
      S.cards.push({id:uid(),mid,tid,f:p[0],b:p[1],n:'',src:'s',sd:k,d:dk(),due:dk(),st:'n',iv:0,ez:2.5,rp:0,lp:0});n++})});
  if(!S.prof.goal)S.prof.goal='Técnico Legislativo · Câmara de Cristalina';
  if(!S.prof.date)S.prof.date='2026-12-20';
  S.seedv=SEEDV;save();return n}
if((S.seedv||0)<SEEDV)seedImport();

/* tempo estudado nos cartões vira histórico sozinho */
function kFlush(){Object.keys(kT).forEach(mid=>{const s=kT[mid];if(s>=20&&mat(mid))S.sess.push({id:uid(),d:dk(),mid,tid:'',s:mat(mid).name,m:Math.max(1,Math.round(s/60)),sec:s,tx:'Anki (automático)',auto:1})});kT={};save()}
function kPickDeck(){
  const opts=S.mats.filter(m=>S.cards.some(c=>c.mid===m.id)).map(m=>`<optgroup label="${esc(m.name)}"><option value="m:${m.id}">${esc(m.name)} — toda a matéria</option>${m.topics.filter(t=>S.cards.some(c=>c.tid===t.id)).map(t=>`<option value="t:${m.id}:${t.id}">${esc(t.name)}</option>`).join('')}</optgroup>`).join('');
  sheet(`<h2>Qual baralho?</h2><div class="stack"><select id="kd_s"><option value="">Todos os baralhos (misturado)</option>${opts}</select><button class="btn" onclick="kGoDeck(0)">▶ Estudar o que vence hoje</button><button class="btn g" onclick="kGoDeck(1)">🎲 Aleatório · 30 cartões (treino livre)</button><button class="btn g" onclick="kGoDeck(2)">📝 Só os meus erros</button><small>Treino livre não mexe na agenda do Anki. O tempo estudado entra sozinho no histórico.</small></div>`)}
function kGoDeck(mode){
  const p=v('kd_s').split(':');let mid='',tid='';if(p[0]==='m')mid=p[1];if(p[0]==='t'){mid=p[1];tid=p[2]}closeSheet();
  if(mode!==1){kStart(mid,mode===2?'e':'',tid);return}
  const L=S.cards.filter(c=>(!mid||c.mid===mid)&&(!tid||c.tid===tid)).map(c=>[Math.random(),c]).sort((a,b)=>a[0]-b[0]).slice(0,30).map(x=>x[1].id);
  if(!L.length){kmsg='Nenhum cartão nesse baralho.';render();return}
  kq=L;kfree=true;kshow=false;kst={n:0,ok:0,xp:0,combo:0,best:0,total:L.length};kmode='study';tab='study';ss='k';render();scrollTo(0,0)}
