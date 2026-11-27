/* =====================================================================
   REVISÕES (mostram ASSUNTO), PÓS-SESSÃO (questões feitas) e EDITAL
   ===================================================================== */
S.qa=S.qa||{};S.kn=S.kn||{};
const exDate=()=>{const p=S.prof&&S.prof.date;return p&&left(p)>0?p:''};
function schedRev(mid,tid,base,tx){
  tid=tid||'';tx=(tx||'').trim();
  const ex=S.rev.filter(r=>r.mid===mid&&(r.tid||'')===tid&&r.base===base&&r.n>0);
  if(ex.length){if(tx)ex.forEach(r=>{if(!(r.tx||'').includes(tx))r.tx=(r.tx?r.tx+'; ':'')+tx});return}
  const lim=exDate();
  RI.forEach((n,i)=>{const d=addD(base,n);if(lim&&d>=lim)return;S.rev.push({id:uid(),mid,tid,s:(mat(mid)||{}).name||'',tx,base,d,n:i+1,of:RI.length,done:false})})}
function revList(){
  const t=dk(),p=S.rev.filter(r=>!r.done).sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
  return{late:p.filter(r=>r.d<t),today:p.filter(r=>r.d===t),next:p.filter(r=>r.d>t),due:p.filter(r=>r.d<=t),done:S.rev.filter(r=>r.done).sort((a,b)=>(b.dd||'')<(a.dd||'')?-1:1)}}
const revTitle=r=>tname(r)||r.tx||'';
function revRow(r){
  const n=left(r.d),tp=tname(r),ttl=revTitle(r),nc=S.cards.filter(c=>c.mid===r.mid&&(!r.tid||c.tid===r.tid)).length;
  const pl=r.done?'':n<0?`<span class="pill" style="color:var(--bad)">atrasada ${-n}d</span>`:n===0?'<span class="pill" style="color:var(--warn)">hoje</span>':`<span class="pill" style="color:var(--mute)">${n===1?'amanhã':fd(r.d).slice(0,5)}</span>`;
  const sub=[tp&&r.tx?esc(r.tx):'',r.ref?'Reforço':r.n?`Revisão ${r.n}/${r.of||3} · estudado em ${fd(r.base).slice(0,5)}`:'Revisão avulsa'].filter(Boolean).join(' · ');
  return `<div class="item"><button class="pay ${r.done?'on':''}" aria-label="Marcar revisão" onclick="revDone('${r.id}')">${r.done?'✓':''}</button><i class="dot" style="background:${mcolor(r)};margin:0"></i><div class="g ${r.done?'done':''}"><b>${ttl?esc(ttl):'<span style="color:var(--warn)">Sem assunto definido</span>'}</b><br><small>${esc(mname(r))} · ${sub}</small><div style="margin-top:4px">${pl} ${!r.tid?`<button class="chip" onclick="revSetTop('${r.id}')">Definir assunto</button>`:''} ${nc&&!r.done?`<button class="chip" onclick="kStart('${r.mid}','','${r.tid||''}')">🃏 ${nc}</button>`:''}</div></div><button class="x" aria-label="Apagar" onclick="del('rev','${r.id}')">×</button></div>`}
function revDone(id){
  const r=S.rev.find(x=>x.id===id);r.done=!r.done;r.dd=r.done?dk():'';save();render();
  if(r.done)sheet(`<h2>Como foi revisar “${esc(revTitle(r)||mname(r))}”?</h2><div class="stack"><button class="btn" onclick="revFb('${id}',0)">😀 Lembrei bem</button><button class="btn g" onclick="revFb('${id}',3)">😐 Lembrei pouco · revisar em 3 dias</button><button class="btn g" onclick="revFb('${id}',1)">😖 Esqueci · revisar amanhã</button></div>`)}
function revFb(id,d){const r=S.rev.find(x=>x.id===id);closeSheet();if(d&&r){S.rev.push({id:uid(),mid:r.mid,tid:r.tid||'',s:r.s,tx:r.tx||'',base:dk(),d:addD(dk(),d),n:0,ref:1,done:false});save();render();toast('Reforço agendado','big')}}
function topOpts(mid,sel){const m=mat(mid);return m?m.topics.map(t=>`<option value="${t.id}"${t.id===sel?' selected':''}>${esc(t.name)}</option>`).join(''):''}
function revSetTop(id){const r=S.rev.find(x=>x.id===id);sheet(`<h2>Qual assunto?</h2><div class="stack"><select id="rs_t"><option value="">Escolha…</option>${topOpts(r.mid,'')}</select><input id="rs_n" placeholder="ou crie um assunto novo"><button class="btn" onclick="revSetApply('${id}')">Salvar</button></div>`)}
function revSetApply(id){const r=S.rev.find(x=>x.id===id),m=mat(r.mid);let t=v('rs_t');const nn=v('rs_n').trim();
  if(nn&&m){let x=m.topics.find(y=>y.name.toLowerCase()===nn.toLowerCase());if(!x){x={id:uid(),name:nn};m.topics.push(x)}t=x.id}
  if(!t)return;S.rev.forEach(x=>{if(x.mid===r.mid&&x.base===r.base&&!x.tid&&!x.done)x.tid=t});S.sess.forEach(s=>{if(s.mid===r.mid&&s.d===r.base&&!s.tid)s.tid=t});closeSheet();save();render()}
function addRev(){
  const m=S.sel.r.m;if(!m){setMsg('r','Escolha a matéria.');rr();return}
  S.rev.push({id:uid(),mid:m,tid:S.sel.r.t,s:mat(m).name,tx:v('r_tx').trim(),base:dk(),d:v('r_d')||dk(),n:0,done:false});
  setMsg('r','Revisão agendada.',1);save();render()}
function vRev(){
  const L=revList(),w=S.rev.filter(r=>r.done&&r.dd&&left(r.dd)>-7).length;
  const sec=(t,a,c)=>a.length?`<div class="card"><h2 ${c?`style="color:${c}"`:''}>${t} <small>(${a.length})</small></h2>${a.map(revRow).join('')}</div>`:'';
  const amanha=L.next.filter(r=>left(r.d)===1),semana=L.next.filter(r=>left(r.d)>1&&left(r.d)<=7),depois=L.next.filter(r=>left(r.d)>7).slice(0,15);
  return `<div class="grid3"><div class="stat"><b>${L.due.length}</b><span>Para hoje</span></div><div class="stat"><b class="${L.late.length?'out':''}">${L.late.length}</b><span>Atrasadas</span></div><div class="stat"><b>${w}</b><span>Feitas em 7 dias</span></div></div>
  ${!S.rev.length?`<div class="card">${empty('Nenhuma revisão ainda.<br>Ao salvar um estudo, o app agenda revisões para 1, 3, 7, 15 e 30 dias depois, com o ASSUNTO.')}</div>`:''}
  ${sec('Atrasadas',L.late,'var(--bad)')}${sec('Hoje',L.today)}${sec('Amanhã',amanha)}${sec('Esta semana',semana)}${sec('Depois',depois)}
  ${L.done.length?`<div class="card"><h2>Feitas <small>(últimas ${Math.min(6,L.done.length)})</small></h2>${L.done.slice(0,6).map(revRow).join('')}</div>`:''}
  <div class="card"><h2>Agendar revisão avulsa</h2>${matSel('r')}<input id="r_tx" placeholder="O que revisar? (opcional)" style="margin-top:8px"><div class="row" style="margin-top:8px"><input id="r_d" type="date" value="${dk()}" aria-label="Data"><button class="btn" onclick="addRev()">Agendar</button></div>${msg('r')}</div>
  <div class="card"><label class="chk" style="margin:0"><input type="checkbox" ${S.arev?'checked':''} onchange="togArev()"> Agendar revisões automaticamente ao salvar um estudo (1, 3, 7, 15 e 30 dias; nada depois da prova)</label></div>`}
function revCard(){const n=revList().due.length;return n?`<div class="card"><div class="row"><span class="ic">🔁</span><div class="g" style="flex:1"><b>${n} revis${n>1?'ões':'ão'} para hoje</b></div><button class="btn" onclick="ss='r';go('study')">Ver</button></div></div>`:''}

/* ===== QUESTÕES FEITAS EM CADA SESSÃO ===== */
function sessQ(x){const q=S.qs.filter(o=>o.sid===x.id),n=q.reduce((t,o)=>t+o.n,0),c=q.reduce((t,o)=>t+o.c,0);
  return n?`<br><small>✍️ ${n} questões · <span class="in">✔ ${c}</span> <span class="out">✘ ${n-c}</span> · ${Math.round(c/n*100)}%</small>`:`<br><button class="chip" onclick="postSess('${x.id}')">＋ questões</button>`}
function postSess(sid){
  const s=S.sess.find(x=>x.id===sid);if(!s)return;
  const nrev=S.rev.filter(r=>r.mid===s.mid&&r.base===s.d&&r.n>0&&!r.done).length;
  sheet(`<h2>✅ Sessão salva</h2><p style="margin:0 0 10px"><b>${esc(mname(s))}</b> · ${dur(secOf(s))}</p>
  <div class="stack"><small>Assunto estudado</small><select id="ps_t"><option value="">Sem assunto</option>${topOpts(s.mid,s.tid)}</select>
  <input id="ps_nt" placeholder="ou crie um assunto novo"><input id="ps_tx" placeholder="O que você estudou? (opcional)" value="${esc(s.tx||'')}">
  <h2 style="margin:8px 0 0">✍️ Fez questões? <small>(opcional)</small></h2>
  <div class="two"><input id="ps_a" type="number" min="0" inputmode="numeric" placeholder="✔ Acertos"><input id="ps_e" type="number" min="0" inputmode="numeric" placeholder="✘ Erros"></div>
  <small>${nrev?'🔁 '+nrev+' revisões agendadas (1, 3, 7, 15 e 30 dias) com este assunto.':'Revisões automáticas desligadas.'}</small>
  <div class="two"><button class="btn g" onclick="closeSheet()">Pular</button><button class="btn" onclick="postApply('${sid}')">Salvar</button></div></div>`)}
function postApply(sid){
  const s=S.sess.find(x=>x.id===sid),m=mat(s.mid);let t=v('ps_t');const nn=v('ps_nt').trim(),tx=v('ps_tx').trim();
  if(nn&&m){let x=m.topics.find(y=>y.name.toLowerCase()===nn.toLowerCase());if(!x){x={id:uid(),name:nn};m.topics.push(x)}t=x.id}
  const old=s.tid||'';
  S.rev.forEach(r=>{if(r.mid===s.mid&&r.base===s.d&&(r.tid||'')===old&&r.n>0&&!r.done){r.tid=t;if(tx)r.tx=tx}});
  s.tid=t;s.tx=tx;
  const a=Math.max(0,Math.round(+v('ps_a')||0)),e=Math.max(0,Math.round(+v('ps_e')||0));
  if(a+e>0)S.qs.push({id:uid(),d:s.d,mid:s.mid,tid:t,s:mname(s),n:a+e,c:a,sid});
  closeSheet();save();render();toast(a+e>0?'Sessão e '+(a+e)+' questões registradas':'Sessão atualizada')}

/* ===== EDITAL: o que já foi estudado em cada assunto ===== */
function topStat(mid,tid){
  const se=S.sess.filter(x=>x.mid===mid&&(x.tid||'')===tid),q=S.qs.filter(x=>x.mid===mid&&(x.tid||'')===tid);
  const n=q.reduce((t,x)=>t+x.n,0),c=q.reduce((t,x)=>t+x.c,0),last=se.map(x=>x.d).sort().pop()||'';
  const nr=S.rev.filter(r=>!r.done&&r.mid===mid&&(r.tid||'')===tid).map(r=>r.d).sort()[0]||'';
  const cards=S.cards.filter(k=>k.mid===mid&&(k.tid||'')===tid);
  return{sec:se.reduce((t,x)=>t+secOf(x),0),n,c,last,nr,cards:cards.length,due:cards.filter(k=>k.st==='r'?k.due<=dk():k.st==='l'?true:false).length}}
function goStudy(mid,tid){S.sel.c={m:mid,t:tid};save();stab('c')}
function vEdital(){
  let tot=0,vis=0;
  const blocks=S.mats.map(m=>{
    const tops=m.topics.length?m.topics:[{id:'',name:'Geral'}];
    const rows=tops.map(t=>{const x=topStat(m.id,t.id);tot++;if(x.sec>0)vis++;
      const p=x.n?Math.round(x.c/x.n*100):null,col=p===null?'var(--mute)':p>=85?'var(--ok)':p>=70?'var(--warn)':'var(--bad)';
      return `<div class="item"><div class="g"><b>${esc(t.name)}</b><br><small>${x.sec?dur(x.sec)+' · último '+fd(x.last).slice(0,5):'<span style="color:var(--warn)">nunca estudado</span>'}${x.nr?' · rev. '+fd(x.nr).slice(0,5):''}${x.cards?' · 🃏 '+x.cards:''}</small></div><span class="pill" style="color:${col}">${p===null?'–':p+'%'}</span><button class="chip" onclick="goStudy('${m.id}','${t.id}')">▶</button><button class="chip" onclick="qzTopic('${m.id}','${t.id}')">🧪</button></div>`}).join('');
    return `<div class="card"><div class="row"><i class="dot lg" style="background:${m.color}"></i><h2 style="margin:0;flex:1">${esc(m.name)}</h2></div>${rows}</div>`}).join('');
  return `<div class="card hero-m"><small>Edital</small><div class="big2">${vis}<small> de ${tot} assuntos já estudados</small></div>${bar(pct(vis,tot))}<small style="display:block;margin-top:6px">▶ estuda o assunto · 🧪 treina questões dele · a % é o seu acerto nas questões</small></div>${blocks}`}
