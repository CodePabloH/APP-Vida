/* =====================================================================
   HOJE: tudo o que importa agora, em uma tela, sem rolar à toa.
   Ordem: alerta → personagem e XP → próxima ação → contrato do dia →
          baú → 4 pilares da vida → semana
   ===================================================================== */
const ciXP=()=>10+Math.min(streak(),10)*2;
function checkin(){if(S.ci===dk())return;S.ci=dk();S.bonus=(S.bonus||0)+ciXP();save();render()}
function chest(){const k=dk(),ds=stat(k);if(S.ch[k]||ds.okN<2)return;
  const crit=Math.random()<.1,b=crit?150:Math.round(20+Math.random()*(ds.win?60:30));
  S.ch[k]=b;S.bonus=(S.bonus||0)+b;save();render();if(crit)toast('💎 CRÍTICO!','big')}
function chestCard(ds){const o=S.ch[dk()],n=ds.okN;
  return o?`<div class="card chest"><span class="ic">🎁</span><div class="g"><b>Baú de hoje aberto</b><br><small>Você ganhou +${o} XP${o===150?' (crítico!)':''}</small></div></div>`
  :n>=2?`<button class="card chest ready" onclick="chest()"><span class="ic">🎁</span><div class="g"><b>Baú pronto!</b><br><small>Toque para abrir. O prêmio é surpresa.</small></div></button>`
  :`<div class="card chest"><span class="ic">🔒</span><div class="g"><b>Baú diário</b><br><small>Cumpra 2 missões para abrir (${n}/2). Completar tudo aumenta o prêmio.</small></div></div>`}

function nextAct(ds){
  const t=S.timer,rv=revList().due.length,cd_=kdue().length,M_=id=>ds.M.find(a=>a.id===id);
  if(t.run||t.acc>0)return['●','Continuar estudando',clock(elapsed())+' · '+runLabel(),"ss='c';go('study')"];
  if(rv)return['🔁',rv+' revis'+(rv>1?'ões':'ão')+' para hoje','Fixe o que você já estudou',"ss='r';go('study')"];
  if(cd_)return['🃏','Revisar '+cd_+' cartões','Cerca de '+Math.max(1,Math.round(cd_*.4))+' min · XP e combo','kOpen()'];
  const m=M_('m');if(!m.ok)return['▶','Estudar agora','Faltam '+(m.g-m.v)+' min · não cumprir: −'+ds.perMiss(m)+' XP',"ss='c';go('study')"];
  const q=M_('q');if(!q.ok)return['✍️','Resolver questões','Faltam '+(q.g-q.v)+' · não cumprir: −'+ds.perMiss(q)+' XP',"ss='q';go('study')"];
  const t_=M_('t');if(!t_.ok)return['💪','Treinar hoje','Falta o treino · não cumprir: −'+ds.perMiss(t_)+' XP',"bs='t';go('body')"];
  const r=M_('r');if(r&&!r.ok)return['📖','Ler hoje','Faltam '+(r.g-r.v)+' min · não cumprir: −'+ds.perMiss(r)+' XP',"ss='l';go('study')"];
  const h=M_('h');if(h&&!h.ok)return['🌱','Fechar os hábitos','Faltam '+(h.g-h.v),"bs='h';go('body')"];
  return['🏆','Dia vencido!','Quer mais? Estudar a mais sobe o rank mais rápido',"ss='c';go('study')"]}

function pillars(){
  const p=S.prof,ne=nextExams(),tg=p.date&&left(p.date)>=0?{n:p.goal||'o concurso',d:p.date}:ne[0]?{n:ne[0].name,d:ne[0].d}:null;
  const wkMin=[...Array(7)].reduce((t,_,i)=>t+DAY(addD(dk(),-i)).m,0),wkGoal=Math.round(S.goal),wkQ=S.qs.filter(q=>left(q.d)>-7),qa_=wkQ.reduce((t,q)=>t+q.n,0),qc=wkQ.reduce((t,q)=>t+q.c,0);
  const I=wInfo(),tgw=+p.tgoal||4,wkT=new Set(S.tr.filter(x=>left(x.d)>-7).map(x=>x.d)).size;
  const mo=dk().slice(0,7),pgM=S.rd.filter(r=>r.d.startsWith(mo)).reduce((t,r)=>t+(r.p||0),0),rdW=[...Array(7)].reduce((t,_,i)=>t+DAY(addD(dk(),-i)).rm,0),bk=S.books.filter(b=>!b.done)[0];
  const mst=moneyStatus(mo),lvl_={red:['var(--bad)','No vermelho'],yel:['var(--warn)','Atenção'],ok:['var(--ok)','No azul'],none:['var(--mute)','Sem dados']}[mst.lv],md_=mst.d;
  const card=(ic,nm,big,sub,pc,go_,col)=>`<button class="pillar" onclick="${go_}" style="--c:${col||'var(--acc)'}"><div class="row"><span class="ic">${ic}</span><small>${nm}</small></div><b>${big}</b><small>${sub}</small>${bar(pc,col)}</button>`;
  return `<h2 class="sec">Seus objetivos</h2><div class="pils">
  ${card('🎯','Concurso',tg?left(tg.d)+' dias':'Defina',tg?esc(tg.n)+' · '+hm(wkMin)+' na semana':'Cadastre em Perfil',pct(wkMin,wkGoal),"ss='t';go('study')",'var(--acc)')}
  ${card('⚖️','Peso',I.ok?fx(I.cur)+' kg':'Defina a meta',I.ok?(I.hit?'Meta atingida!':'faltam '+fx(I.rest)+' kg · '+wkT+'/'+tgw+' treinos'):'em Corpo › Peso',I.ok?I.p:pct(wkT,tgw),"bs='w';go('body')",'#3987e5')}
  ${card('📖','Leitura',bk?esc(bk.t):pgM+' pág.',bk&&bk.pages?bookRead(bk.id)+' de '+bk.pages+' págs':hm(rdW)+' em 7 dias',bk&&bk.pages?pct(bookRead(bk.id),bk.pages):pct(rdW,(+p.rgoal||20)*7),"ss='l';go('study')",'#9085e9')}
  ${card(mst.lv==='red'?'🚨':'💰','Grana',lvl_[1],md_.lim?R0(Math.max(0,md_.lim-md_.G))+' livres de '+R0(md_.lim):'Saldo '+R0(md_.saldo),md_.lim?pct(md_.G,md_.lim):0,"ms='v';go('money')",lvl_[0])}
  </div>`}

function weekStrip(){const a=[];
  for(let i=6;i>=0;i--){const k=addD(dk(),-i),isT=i===0;let z='e';
    if(k>=S.since){const s=stat(k);z=s.win?'w':s.act?'p':isT?'t':'m'}else z=stat(k).act?'p':'e';
    a.push(`<div class="wk1 ${z}${isT?' now':''}"><small>${DOW[new Date(k+'T00:00').getDay()][0]}</small><i>${z==='w'?'✓':z==='p'?'•':z==='m'?'×':''}</i></div>`)}return a.join('')}
function wonDays(){let won=0,tot=0;const c=C();for(const k in c.days){if(k===dk()||k<S.since)continue;tot++;if(c.days[k].win)won++}return{won,tot}}

V.home=function(){
  const p=S.prof,c=C(),X=c.X,ri=rank(X),ds=stat(dk()),st=streak(),hr=now5().getHours(),gr=hr<12?'Bom dia':hr<18?'Boa tarde':'Boa noite',na=nextAct(ds),A=alerts().slice(0,2),wd=wonDays();
  const mode=MODES[modeAt(dk())],why=p.why?esc(p.why):QT[Math.floor(now5().getTime()/864e5)%QT.length];
  const row=a=>{const dn=a.ok;return `<button class="qr${dn?' ok':''}" onclick="${a.go}"><span class="ic">${a.ic}</span><div class="g"><div class="row"><b>${a.n}</b><small style="margin-left:auto">${Math.min(a.v,a.g)}${a.u?' '+a.u:''} / ${a.g}${a.u?' '+a.u:''}</small></div>${bar(pct(a.v,a.g),dn?'var(--ok)':'')}</div><span class="qx${dn?' ok':''}">${dn?'✓':'−'+ds.perMiss(a)}</span></button>`};
  return `${A.map(a=>`<button class="alert ${a.lv}" onclick="${a.go}"><span>${a.ic}</span><div class="g"><b>${a.t}</b><small>${esc(a.s)}</small></div><i>›</i></button>`).join('')}
  <div class="hud" style="--rc:${RC[ri]}"><div class="top2"><small>${gr}${p.nome?', '+esc(p.nome):''}</small><span class="flame">🔥 ${st} ${st===1?'dia':'dias'}</span></div>
  <div class="hud-m"><button class="hud-av" onclick="go('map')" aria-label="Ver mapa">${heroImg(ri,104)}</button><div class="hud-i"><div class="hud-r">${RK[ri][0]}</div><small class="slog">${SLOG[ri]}</small>${xpBar('home',ds)}${riskLine(ds)}</div></div>
  ${S.ci!==dk()?`<button class="ci" onclick="checkin()">🎁 Check-in do dia <b>+${ciXP()} XP</b></button>`:''}</div>
  <button class="cta" style="--rc:${RC[ri]}" onclick="${na[3]}"><span class="cta-i">${na[0]}</span><div class="g"><b>${na[1]}</b><small>${na[2]}</small></div><span class="cta-a">›</span></button>
  <div class="card"><div class="row" style="margin-bottom:6px"><h2 style="margin:0">Contrato de hoje</h2><button class="modechip" onclick="go('law')">${mode[0]} · perda ×${fx(ds.hf)}${ds.mult>1?' · ⛓ ×'+fx(ds.mult):''}</button></div>${ds.M.map(row).join('')}
  <small style="display:block;margin-top:8px;color:${ds.win?'var(--ok)':'var(--mute)'}">${ds.win?'Dia vencido! 🔥 Nada a perder.':'O número vermelho é o XP que você perde se não cumprir. '+(ds.mult>1?'Você falhou ontem: hoje custa ×'+fx(ds.mult)+'.':'Nunca falhe duas vezes seguidas.')}</small></div>
  ${chestCard(ds)}
  ${pillars()}
  <div class="card"><div class="row" style="margin-bottom:8px"><h2 style="margin:0">Sua semana</h2><small style="margin-left:auto">${wd.tot?wd.won+' de '+wd.tot+' dias vencidos ('+Math.round(wd.won/wd.tot*100)+'%)':''}</small></div><div class="wks">${weekStrip()}</div><p class="q">${why}</p></div>
  <button class="card achr" onclick="go('ach')"><div class="row"><h2 style="margin:0;flex:1;text-align:left">🏆 Conquistas</h2><small>${ACH.filter(a=>S.ach[a[0]]).length} de ${ACH.length} ›</small></div></button>`};
