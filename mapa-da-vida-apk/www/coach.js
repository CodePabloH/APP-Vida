/* =====================================================================
   CRONOGRAMA até a prova · COACH · CIÊNCIA DO ESTUDO · ANÁLISE DE ERROS
   HUB organizado · GUIA FINANCEIRO
   ===================================================================== */
S.qh=S.qh||[];S.cel=S.cel||{};
const wd=d=>new Date(d+'T12:00').toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','');
const WGT={'Legislação Municipal':4,'Direito Administrativo':3,'Português':3,'Direito Constitucional':2,'Raciocínio Lógico':2,'Redação Oficial':1,'Administração Pública':1,'Informática':1};
const HEAVY=['Lei Orgânica de Cristalina','Regimento Interno','Estatuto dos Servidores (Lei 1.207/94)'];

/* ---------- CRONOGRAMA (se refaz sozinho se você atrasar) ---------- */
function cronograma(){
  const d=examDays();if(d<=0)return null;
  const days=[];for(let i=0;i<d;i++)days.push(addD(dk(),i));
  const nf=days.length>6?3:days.length>3?2:0,learn=days.slice(0,days.length-nf),fin=days.slice(days.length-nf);
  const Q={};Object.keys(WGT).forEach(n=>{const m=matN(n);Q[n]=m?m.topics.filter(t=>topStat(m.id,t.id).sec===0).map(t=>({m,t,u:HEAVY.includes(t.name)?2:1})):[]});
  const cur={},seq=[],tot=Object.keys(WGT).reduce((a,n)=>a+WGT[n],0);Object.keys(WGT).forEach(n=>cur[n]=0);
  let left_=Object.values(Q).reduce((a,q)=>a+q.length,0);
  while(left_>0){Object.keys(WGT).forEach(n=>{if(Q[n].length)cur[n]+=WGT[n]});
    const n=Object.keys(WGT).filter(k=>Q[k].length).sort((a,b)=>cur[b]-cur[a])[0];cur[n]-=tot;seq.push(Q[n].shift());left_--}
  const units=seq.reduce((a,x)=>a+x.u,0),per=learn.length?units/learn.length:0,plan=learn.map(date=>({date,items:[],kind:'a'}));
  let acc=0,di=0;seq.forEach(x=>{while(di<plan.length-1&&acc>=(di+1)*per-.01)di++;plan[di].items.push(x);acc+=x.u});
  plan.forEach((p,i)=>{if(i>=5&&(i-5)%4===0)p.simu=true});
  const F=['Simulado completo + corrigir cada erro','Só revisão: cartões, erros e Legislação Municipal','Revisão leve, separe os documentos e durma cedo'];
  fin.forEach((date,i)=>plan.push({date,items:[],kind:'f',txt:F[F.length-fin.length+i]}));
  return{plan,units,days:learn.length,topics:seq.length,d}}
function vCrono(){
  const C=cronograma();if(!C)return `<div class="card">${empty('Defina a data da prova em Mais › Perfil.')}</div>`;
  const rit=C.topics?(C.topics/Math.max(1,C.days)).toFixed(1):0;
  return `<div class="card hero-m"><small>Cronograma até a prova (20/12)</small><div class="big2">${C.d} dias<small> · ${C.topics} assuntos novos · ~${rit}/dia</small></div><small>Se você atrasar, é só abrir de novo: o app refaz o plano com os dias que sobraram. Todo dia: revisões + cartões + 20 questões. Assuntos já estudados saem da lista.</small></div>
  ${C.plan.map((p,i)=>{const hoje=p.date===dk();
    return `<div class="card${hoje?' plano':''}"><div class="row"><b style="flex:1">${hoje?'HOJE · ':''}${wd(p.date)} ${fd(p.date).slice(0,5)}</b><small>${p.kind==='f'?'Fase final':'Dia '+(i+1)}</small></div>
    ${p.items.map(x=>`<button class="qr" onclick="goStudy('${x.m.id}','${x.t.id}')"><span class="ic">📖</span><div class="g"><b>${esc(x.t.name)}</b><small>${esc(x.m.name)} · ${x.u>1?'2 blocos de 30 min':'30 min'}</small></div></button>`).join('')}
    ${p.txt?`<p class="mute" style="margin:6px 0">🏁 ${p.txt}</p>`:''}${p.simu?'<p class="mute" style="margin:6px 0">⏱ Simulado de 50 questões hoje (com cronômetro).</p>':''}
    ${!p.items.length&&p.kind==='a'?'<p class="mute" style="margin:6px 0">Dia de consolidar: cartões, erros e questões dos assuntos já vistos.</p>':''}
    <small class="mute">Sempre: revisões do dia · cartões · 20 questões</small></div>`}).join('')}
  <div class="card"><div class="row"><b style="flex:1">20/12 · DIA DA PROVA</b><span>🏁</span></div><p class="mute" style="margin:6px 0">Portões fecham às 8h (cargo de nível médio). Leve documento original com foto e caneta transparente azul ou preta. Chegue 45 min antes. Sem celular e sem relógio.</p></div>`}

/* ---------- COACH ---------- */
function mx(){ // indicadores de preparo
  let tot=0,vis=0;S.mats.forEach(m=>m.topics.forEach(t=>{tot++;if(topStat(m.id,t.id).sec>0)vis++}));
  const q=S.qh.slice(-80),acc=q.length>=10?q.filter(x=>x.ok).length/q.length:null;
  const ch=S.cards.filter(c=>c.st==='r').length,dom=S.cards.filter(c=>c.st==='r'&&(c.iv||0)>=7).length;
  return{cov:tot?vis/tot:0,acc,dom:S.cards.length?dom/S.cards.length:0,vis,tot,nq:S.qh.length,ch}}
function coachCard(){
  const d=examDays(),m=mx(),P=planoDia(),ok=P.filter(x=>x.ok).length,seed=+dk().replace(/-/g,'')%7;
  const hoje=minHoje()+((S.kr[dk()]||0)>0?1:0);
  let msg;
  if(d>0&&d<=7)msg=`Reta final: ${d} dias. Nada de matéria nova pesada. Cartões, erros e simulados. Você já fez o grosso: agora é consolidar.`;
  else if(ok===P.length)msg='Dia ganho. É assim que se passa em concurso: um dia cumprido por vez. Amanhã, repita.';
  else if(!hoje)msg=['Comece pelo mínimo: 20 minutos. Depois da primeira revisão, o cérebro pede o resto.','Não pense, só abra o plano e faça o item 1. A motivação vem DEPOIS de começar.','Hoje conta. Um bloco de 25 minutos já é um dia que não foi perdido.'][seed%3];
  else if(m.acc!==null&&m.acc<.7)msg=`Seu acerto recente é ${Math.round(m.acc*100)}%. Normal no começo: cada erro de hoje é um ponto que você NÃO perde na prova. Revise os erros nos cartões.`;
  else msg=['Você está no caminho. Falta só repetir o que já está funcionando.','Revisão espaçada + questões é o que a ciência mais confirma. Você já faz os dois.','Mais um bloco e o plano de hoje fecha.'][seed%3];
  const bar3=(l,p)=>`<div style="margin-top:6px"><small>${l} · ${p===null?'faça 10 questões':Math.round(p*100)+'%'}</small>${bar(p===null?0:Math.round(p*100))}</div>`;
  return `<div class="card coach"><div class="row"><span style="font-size:30px">🧠</span><div class="g"><b>Seu coach</b><br><small>${esc(msg)}</small></div></div>${bar3('Edital visto ('+m.vis+' de '+m.tot+' assuntos)',m.cov)}${bar3('Acerto nas últimas questões',m.acc)}${bar3('Cartões dominados (intervalo de 7+ dias)',m.dom)}
  <small class="mute" style="display:block;margin-top:8px">Indicadores de preparo, não promessa de resultado. Quem mantém ritmo até a prova chega muito mais forte.</small></div>`}
const CIENCIA=[
['Teste-se em vez de reler','Tentar lembrar (cartões e questões) fixa muito mais do que reler ou grifar. É o ‘efeito do teste’. No app: sempre responda ANTES de ver a resposta.'],
['Espaçar vence maratonar','Rever em intervalos crescentes (1, 3, 7, 15, 30 dias) segura o conteúdo por mais tempo do que estudar tudo de uma vez. No app: revisões automáticas e o Anki com intervalos.'],
['Intercale as matérias','Alternar assuntos (Legislação, Português, Direito) no mesmo dia ajuda a distinguir regras parecidas, que é o que a banca explora. O cronograma já intercala.'],
['Dificuldade desejável','Se estiver fácil demais, você não está aprendendo. Errar e corrigir é parte do processo: por isso erro vira dois cartões.'],
['Sono consolida','A memória do dia se consolida dormindo. Na véspera da prova, dormir bem rende mais que 2 horas extras de estudo.'],
['Explique em voz alta','Tente explicar o artigo como se ensinasse a alguém. O que você não consegue explicar é o que você ainda não sabe.'],
['Blocos curtos e foco','25 a 50 minutos sem celular e 5 de pausa. Um bloco bom vale mais que 3 horas distraído. Use o Foco total.'],
['Plano ‘se-então’','Defina gatilhos: ‘Se for 6h40, então abro o plano do dia’. Quem decide antes não depende de motivação.'],
['Caderno de erros','Cada erro: qual regra, qual armadilha, qual macete. O app guarda sozinho; olhe a Análise de erros toda semana.'],
['Simulado como treino de prova','Treine o ritmo (3 min por questão em média), a leitura do comando (INCORRETA/EXCETO) e o cartão-resposta. Não deixe em branco: não há nota negativa.'],
['Pequenas vitórias','Progresso visível motiva. Por isso o plano do dia tem checklist e o app dá XP ao fechar o dia.']];
function vCiencia(){return CIENCIA.map(c=>`<div class="card"><h2>${esc(c[0])}</h2><p class="mute" style="margin:0;line-height:1.5">${esc(c[1])}</p></div>`).join('')}

/* ---------- ANÁLISE DE ERROS ---------- */
const PAD=[
['neg','Comando negativo (INCORRETA/EXCETO/NÃO)',q=>/INCORRET|EXCETO|\bNÃO\b|não (se|é|está|foi)/i.test(q.e),'Circule o comando antes de ler as alternativas e marque V ou F em cada uma.'],
['num','Número, prazo ou quórum',q=>q.a.some(o=>/\d/.test(o)),'A banca troca o número. Revise as famílias de prazos nos cartões da Legislação Municipal.'],
['abs','Palavra absoluta (sempre, nunca, somente)',q=>q.a.some(o=>/\b(sempre|nunca|somente|exclusivamente|apenas|todos)\b/i.test(o)),'Desconfie dos absolutos, a menos que a lei use o mesmo termo.'],
['afi','Afirmativas I, II, III',q=>/\bI\s*[-–.)]|afirmativas|itens/i.test(q.e),'Julgue cada item separado e só depois combine as letras.'],
['lei','Legislação Municipal (texto da lei)',q=>q.m==='Legislação Municipal','Releia o artigo e use os cartões; é a matéria de maior peso.']];
function vAnalise(){
  const H=S.qh;if(H.length<5)return `<div class="card">${empty('Faça pelo menos 5 questões no banco para ver seus padrões de erro, tempo e dicas.')}<button class="btn" style="width:100%;margin-top:10px" onclick="stab('b')">🧪 Fazer questões</button></div>`;
  const Q=Object.fromEntries(QQ.map(q=>[q.id,q])),ok=H.filter(x=>x.ok),er=H.filter(x=>!x.ok),avg=a=>a.length?Math.round(a.reduce((t,x)=>t+(x.sec||0),0)/a.length):0;
  const mot={};er.forEach(x=>{if(x.mot)mot[x.mot]=(mot[x.mot]||0)+1});
  const pads=PAD.map(p=>{const s=H.filter(x=>Q[x.id]&&p[2](Q[x.id]));const e=s.filter(x=>!x.ok).length;return{p,n:s.length,e,r:s.length?e/s.length:0}}).filter(x=>x.n>=3).sort((a,b)=>b.r-a.r);
  const tp={};H.forEach(x=>{const q=Q[x.id];if(!q)return;const k=q.m+'|'+q.t,o=tp[k]||(tp[k]={m:q.m,t:q.t,n:0,e:0});o.n++;if(!x.ok)o.e++});
  const weak=Object.values(tp).filter(x=>x.n>=3).sort((a,b)=>b.e/b.n-a.e/a.n).slice(0,5);
  const fast=er.filter(x=>(x.sec||0)<20&&x.sec!=null).length,slow=H.filter(x=>(x.sec||0)>240).length,tips=[];
  if(er.length&&fast/er.length>.35)tips.push('⚡ Muitos erros em menos de 20 s: você está respondendo no impulso. Leia o comando e TODAS as alternativas antes de marcar.');
  if(slow>=3)tips.push('🐌 Questões acima de 4 min: na prova, marque a melhor opção, anote e volte depois. O ritmo é ~3 min por questão.');
  if(avg(er)>avg(ok)*1.5&&er.length>=3)tips.push('Você demora mais nas que erra: sinal de dúvida real. Transforme em cartão e revise a teoria antes de tentar de novo.');
  pads.filter(x=>x.r>=.4&&x.e>=2).slice(0,2).forEach(x=>tips.push('🎯 '+x.p[1]+': '+x.p[3]));
  if(mot['Distração']>=2)tips.push('😵 Várias distrações: estude sem celular e faça simulados sem pausa.');
  if(mot['Não sabia']>=3)tips.push('📚 Muitos “não sabia”: volte ao assunto, faça cartões e só depois refaça as questões.');
  if(!tips.length)tips.push('Continue assim. Quanto mais questões, mais claro o padrão.');
  return `<div class="grid3"><div class="stat"><b>${Math.round(ok.length/H.length*100)}%</b><span>acerto (${H.length})</span></div><div class="stat"><b>${avg(ok)}s</b><span>tempo nas certas</span></div><div class="stat"><b class="out">${avg(er)}s</b><span>tempo nas erradas</span></div></div>
  <div class="card"><h2>O que fazer agora</h2>${tips.map(t=>`<p style="margin:6px 0">${esc(t)}</p>`).join('')}</div>
  ${pads.length?`<div class="card"><h2>Padrões de erro</h2>${pads.map(x=>`<div class="row" style="margin-top:6px"><span style="flex:1;font-size:14px">${esc(x.p[1])}</span><small>${x.e}/${x.n}</small></div>${bar(Math.round(x.r*100),x.r>=.4?'var(--bad)':x.r>=.2?'var(--warn)':'var(--ok)')}`).join('')}</div>`:''}
  ${Object.keys(mot).length?`<div class="card"><h2>Por que você erra</h2>${Object.keys(mot).map(k=>`<div class="row"><span style="flex:1">${esc(k)}</span><b>${mot[k]}</b></div>`).join('')}</div>`:''}
  ${weak.length?`<div class="card"><h2>Assuntos para reforçar</h2>${weak.map(x=>`<div class="item"><div class="g"><b>${esc(x.t)}</b><br><small>${esc(x.m)} · ${x.e} erros em ${x.n}</small></div><button class="chip" onclick="qz.m='${esc(x.m)}';qz.t='${esc(x.t)}';qz.src='w';stab('b')">🧪 Refazer</button></div>`).join('')}</div>`:''}`}

/* ---------- HUB ORGANIZADO ---------- */
function vHub(){
  const ds=stat(dk()),t=S.timer,run=t.run||t.acc>0,rv=revList().due.length,kd=kdue().length,ne=nextExams()[0];
  const tl=(ic,nm,sb,g,bd)=>`<button class="tile" onclick="${g}"><b>${ic}</b><span>${nm}</span><small>${sb}</small>${bd?`<i class="nb">${bd}</i>`:''}</button>`;
  const bk=(S.lastExp||'')<addD(dk(),-3)?`<div class="card"><div class="row"><span class="ic">💾</span><div class="g" style="flex:1"><b>Faça backup dos seus dados</b><br><small>${S.lastExp?'Último em '+fd(S.lastExp):'Você ainda não exportou'}.</small></div><button class="btn" onclick="exportD()">Exportar</button></div></div>`:'';
  return `${planCard()}${coachCard()}${bk}
  <div class="card"><div class="row"><div class="g"><small>Estudo de hoje</small><div class="big2">${hm(ds.M[0].v)}<small> de ${hm(ds.dg)}</small></div></div>${ring(pct(ds.M[0].v,ds.dg),'🧠')}</div>${bar(pct(ds.M[0].v,ds.dg))}<button class="btn kgo" onclick="stab('c')">${run?(t.run?'● Continuar ':'❚❚ Retomar ')+clock(elapsed()):'▶ Começar a estudar'}</button></div>${vilaCard()}
  <h2 class="sec">1 · Fazer agora</h2><div class="tiles">${tl('⏱️','Cronômetro',run?clock(elapsed()):'registrar tempo',"stab('c')")}${tl('🎯','Foco total','sessão guiada',"stab('f')")}${tl('🃏','Cartões (Anki)',kd?kd+' para hoje':'tudo em dia',"stab('k')",kd||'')}${tl('🧪','Questões',QB.length+' no banco',"stab('b')")}${tl('🔁','Revisões',rv?rv+' para hoje':'em dia',"stab('r')",rv||'')}</div>
  <h2 class="sec">2 · Planejar</h2><div class="tiles">${tl('📅','Cronograma','dia a dia até a prova',"stab('j')")}${tl('📋','Edital','o que já estudou',"stab('e')")}${tl('🗓️','Provas',ne?'próxima em '+left(ne.d)+' d':'datas',"stab('p')")}${tl('📚','Matérias',S.mats.length+' cadastradas',"stab('m')")}</div>
  <h2 class="sec">3 · Entender e melhorar</h2><div class="tiles">${tl('🔎','Análise de erros','padrões e dicas',"stab('a')")}${tl('📊','Tempo','gráficos por matéria',"stab('t')")}${tl('🎓','Guia da banca','pegadinhas',"stab('g')")}${tl('🧬','Ciência do estudo','como aprender mais',"stab('s')")}${tl('✍️','Registrar questões','manual',"stab('q')")}${tl('📖','Leitura','livros',"stab('l')")}</div>`}

/* ---------- FINANÇAS: GUIA PASSO A PASSO ---------- */
function finGuide(){
  const m=dk().slice(0,7),d=md(m),sal=S.sal||{},inc=+sal.inc||d.r||0,fix=+sal.fix||0,res=Math.round(inc*.1);
  const lim=+S.prof.budget||0,sug=Math.max(0,Math.round(inc-fix-res)),days=Math.max(1,d.N-d.dN+1),base=lim||sug,rest=Math.max(0,base-d.G),dia=Math.round(rest/days);
  const rec3=S.fin.some(x=>left(x.d)>=-3&&left(x.d)<=0);
  const steps=[[inc>0,'Dizer quanto você ganha e suas contas fixas',"ms='p';pl='s';render()"],[!!lim,'Definir o limite de gasto do mês',sug?`S.prof.budget=${sug};save();render()`:"ms='p';pl='l';render()"],[rec3,'Registrar os gastos de hoje (5 segundos)','openLanc()']];
  const next=steps.find(s=>!s[0]);
  return `<div class="card plano"><small>Guia financeiro</small>${next?`<div style="margin:6px 0"><b>Próximo passo:</b> ${next[1]}</div><button class="btn kgo" onclick="${next[2]}">${next[1].startsWith('Definir')&&sug?'Usar limite sugerido de '+R(sug):'Fazer agora'}</button>`
  :`<div class="big2" style="margin:6px 0">${R(dia)}<small> pode gastar HOJE</small></div><small>${R(rest)} sobram do limite de ${R(base)} em ${days} dias.${dia<=0?' Hoje o ideal é gastar zero.':''}</small>`}
  <div style="margin-top:8px">${steps.map(s=>`<small style="display:block">${s[0]?'✅':'⬜'} ${s[1]}</small>`).join('')}</div>
  <small class="mute" style="display:block;margin-top:8px">${inc?`Regra simples: da renda de ${R(inc)}, ${R(fix)} em contas fixas, ${R(res)} (10%) para reserva${fix?' e o resto ('+R(sug)+') para viver':''}. Cada gasto sem registro é um buraco no plano.`:'Comece pela renda: sem ela o app não consegue te dizer quanto pode gastar.'}</small></div>`}
const _vmoney=V.money;V.money=function(){const h=_vmoney();return (ms==='v'?finGuide():'')+h};
const _exp=exportD;exportD=function(){S.lastExp=dk();save();return _exp.apply(this,arguments)};
const _vhome=V.home;V.home=function(){const h=_vhome();return h.replace(/(<button class="cta")/,planCard()+'$1')};
