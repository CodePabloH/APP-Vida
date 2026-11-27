/* =====================================================================
   PLANO DO DIA: diz O QUE fazer, NA ORDEM, sem você precisar pensar.
   Faltando pouco para a prova, o plano muda de “aprender” para “revisar”.
   ===================================================================== */
const PRIO=['Legislação Municipal','Direito Administrativo','Direito Constitucional','Português','Redação Oficial','Administração Pública','Raciocínio Lógico','Informática'];
const matN=n=>S.mats.find(m=>m.name.toLowerCase()===n.toLowerCase());
const minHoje=mid=>Math.round(S.sess.filter(x=>x.d===dk()&&(!mid||x.mid===mid)).reduce((t,x)=>t+secOf(x),0)/60);
const qHoje=()=>S.qs.filter(x=>x.d===dk()).reduce((t,x)=>t+x.n,0);
function proxAssunto(){
  for(const n of PRIO){const m=matN(n);if(!m)continue;
    for(const t of m.topics){if(topStat(m.id,t.id).sec===0)return{m,t}}}
  return null}
function fracoAssunto(){
  let best=null;
  S.mats.forEach(m=>m.topics.forEach(t=>{const x=topStat(m.id,t.id);if(x.n>=5){const p=x.c/x.n;if(!best||p<best.p)best={m,t,p}}}));
  return best}
function planoDia(){
  const d=examDays(),P=[],rv=revList().due.length,kd=kdue().length;
  const rev=d>0&&d<=7;                       // semana final: só revisão
  P.push({ic:'🔁',t:rv?`Revisões do dia (${rv})`:'Revisões do dia',s:rv?'Abra e revise cada assunto agendado. 10 a 15 min.':'Nenhuma revisão pendente. 👏',go:"ss='r';go('study')",ok:rv===0,min:rv?12:0});
  P.push({ic:'🃏',t:kd?`Cartões do Anki (${kd})`:'Cartões do Anki',s:kd?'Responda rápido e sem dó: errou, volta. 10 a 20 min.':'Tudo em dia hoje. 👏',go:'kOpen()',ok:kd===0&&(S.kr[dk()]||0)>0||kd===0,min:kd?Math.min(20,Math.ceil(kd/3)):0});
  if(!rev){
    const nx=proxAssunto();
    if(nx)P.push({ic:'📖',t:`Estudar: ${nx.t.name}`,s:`${nx.m.name} · 30 min no cronômetro, com o edital do lado. Ao terminar, registre as questões.`,go:`goStudy('${nx.m.id}','${nx.t.id}')`,ok:minHoje(nx.m.id)>=25,min:30});
    else P.push({ic:'📖',t:'Todo o edital já foi estudado!',s:'Agora o jogo é revisar e fazer questões.',go:"stab('e')",ok:true,min:0});
  }
  const fr=fracoAssunto(),alvo=fr||(proxAssunto()&&{m:proxAssunto().m,t:proxAssunto().t});
  P.push({ic:'🧪',t:fr?`20 questões: ${fr.t.name}`:'20 questões do banco',s:fr?`Seu ponto mais fraco (${Math.round(fr.p*100)}% de acerto). Erro vira cartão sozinho.`:'Treino com correção na hora. Erro vira cartão sozinho.',go:fr?`qz.n=20;qz.src='n';qzTopic('${fr.m.id}','${fr.t.id}')`:"qz.n=20;qz.m='';qz.t='';stab('b')",ok:qHoje()>=20,min:25});
  const dias=S.simuLast?-left(S.simuLast):99;
  if(d<=26&&dias>=3)P.push({ic:'⏱',t:'Simulado de 50 questões',s:'Com cronômetro, sem consulta. Meta: 95% (57/60). Hoje é dia dele.',go:"qz.src='n';qzStart(true);stab('b')",ok:false,min:70});
  return P}
function planCard(){
  const d=examDays(),P=planoDia(),ok=P.filter(x=>x.ok).length,min=P.filter(x=>!x.ok).reduce((t,x)=>t+(x.min||0),0);
  return `<div class="card plano"><div class="row"><div class="g"><small>Plano do dia · ${d>0?'prova em '+d+' dias':'sem data de prova'}</small><div class="big2">${ok} de ${P.length}<small> feitos${min?' · faltam ~'+min+' min':' · dia ganho! 🏆'}</small></div></div></div>${bar(pct(ok,P.length))}
  ${P.map((x,i)=>`<button class="qr${x.ok?' ok':''}" onclick="${x.go}"><span class="ic">${x.ok?'✅':x.ic}</span><div class="g"><b>${i+1}. ${esc(x.t)}</b><small>${esc(x.s)}</small></div></button>`).join('')}
  <small style="display:block;margin-top:8px">Corrido hoje? Faça só 1 e 2 (uns 20 min). Constância vence a prova.</small></div>`}
