/* ===== DADOS (salvos no navegador) ===== */
const K='mapa-vida-v1';
let S=null;try{S=JSON.parse(localStorage.getItem(K))}catch(e){}
S=Object.assign({exams:[],sess:[],qs:[],plan:[],goal:840,timer:{run:false,start:0,acc:0},subs:[],tsub:'',mats:[],rev:[],sel:{},arev:true,fin:[],tr:[],prof:{},habits:[],hd:{},hsince:'',ag:[],acc:[],bud:{},goals:[],sal:{},debts:[],bonus:0,ch:{},peak:0},S||{});
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};
/* ===== FUNCOES AUXILIARES ===== */
const $=s=>document.querySelector(s),v=i=>(document.getElementById(i)||{}).value||'';
const uid=()=>Math.random().toString(36).slice(2,9);
const pad=n=>String(n).padStart(2,'0');
const dk=d=>{d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const left=k=>Math.round((new Date(k+'T00:00')-new Date(dk()+'T00:00'))/864e5);
const hm=m=>m>=60?Math.floor(m/60)+'h'+(m%60?pad(m%60):''):m+'min';
const R=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fd=k=>{const[a,b,c]=k.split('-');return c+'/'+b+'/'+a};
const DOW=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const QT=['Ninguém vem te salvar. Levanta e faz.','A mente desiste bem antes do corpo. Não dê ouvido.','Conforto é o inimigo da aprovação.','Faça hoje o que dói. Colha amanhã.','Disciplina é agir sem vontade.','Stay hard.'];
const RK=[['Preguiçoso',0],['Recruta',300],['Soldado',900],['Cabo',2000],['Sargento',3800],['Tenente',6500],['Capitão',10500],['Major',16000],['Coronel',24000],['General',35000],['Foda',50000]];
const STEPS=[];RK.forEach((r,i)=>{const n=RK[i+1];if(!n)STEPS.push({n:r[0],x:r[1],i});else for(let s=0;s<3;s++)STEPS.push({n:r[0]+' '+(s+1),x:Math.round(r[1]+(n[1]-r[1])*s/3),i})});
function lvl(X){let j=0;STEPS.forEach((s,k)=>{if(X>=s.x)j=k});return j}
const CL=['#2ECC71','#E5322D','#3B82F6','#F59E0B','#A855F7','#EC4899','#22D3EE','#FFFFFF'];
let ms='r',hmsg='',fm=dk().slice(0,7),cm=dk().slice(0,7),cd=dk(),ft='g',fcat='Alimentação',fform=false,tab='home',ss='t',pd=new Date().getDay();
const sub=s=>{s=s.trim();if(s&&!S.subs.includes(s))S.subs.push(s);return s};
const sum=(a,t)=>a.filter(x=>x.t===t).reduce((s,x)=>s+x.v,0);
function last7(){const a=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);a.push({k:dk(d),w:DOW[d.getDay()][0],m:0})}S.sess.forEach(s=>{const x=a.find(y=>y.k===s.d);if(x)x.m+=s.m});return a}
const todayMin=()=>S.sess.filter(s=>s.d===dk()).reduce((t,s)=>t+s.m,0);
const acc=a=>{const f=a.reduce((t,q)=>t+q.n,0),c=a.reduce((t,q)=>t+q.c,0);return f?Math.round(c/f*100):null};
const nextExams=()=>S.exams.filter(e=>left(e.d)>=0).sort((a,b)=>a.d<b.d?-1:1);
const tone=n=>n<=3?'var(--bad)':n<=10?'var(--warn)':'var(--ok)';
const elapsed=()=>S.timer.acc+(S.timer.run?(Date.now()-S.timer.start)/1000:0);
const clock=s=>{s=Math.floor(s);return pad(Math.floor(s/3600))+':'+pad(Math.floor(s%3600/60))+':'+pad(s%60)};
const gross=()=>S.sess.reduce((t,s)=>t+s.m,0)+S.qs.reduce((t,q)=>t+q.n*2+q.c*3,0)+S.tr.reduce((t,w)=>t+30+Math.round(w.m*1.5),0)+S.plan.filter(p=>p.done).length*15+S.rev.filter(r=>r.done).length*10+S.fin.filter(x=>x.p!==false).length*5+Object.values(S.hd).reduce((t,a)=>t+a.length*10,0)+(S.bonus||0);
function streak(){const s=new Set([...S.sess,...S.qs,...S.tr].map(x=>x.d));let n=0,d=new Date();if(!s.has(dk(d)))d.setDate(d.getDate()-1);while(s.has(dk(d))){n++;d.setDate(d.getDate()-1)}return n}
/* ===== NIVEIS, XP E PENALIDADES ===== */
if(!S.acc.length){S.acc.push({id:'carteira',name:'Carteira',ic:'👛',type:'conta',ini:0});S.fin.forEach(x=>{if(!x.a)x.a='carteira'});save()}
if(!S.since){const a=[...S.sess,...S.qs,...S.tr].map(x=>x.d).sort();S.since=a[0]||dk();save()}
const ramp=k=>Math.min(1,.4*Math.pow(1.01,Math.max(0,Math.round((new Date(k+'T00:00')-new Date(S.since+'T00:00'))/864e5))));
const HF=()=>Math.min(1.5,.15+.12*rank(gross()));
const DG=k=>Math.round(S.goal/7*ramp(k||dk())*(1+.05*rank(gross())));
const QG=k=>Math.max(5,Math.round((+S.prof.qgoal||20)*ramp(k||dk())*(1+.05*rank(gross()))));
function dayStat(k){const m=S.sess.filter(s=>s.d===k).reduce((t,s)=>t+s.m,0),q=S.qs.filter(s=>s.d===k).reduce((t,s)=>t+s.n,0),t=S.tr.filter(s=>s.d===k).length,hv=S.habits.length>0&&k>=S.hsince,h=(S.hd[k]||[]).filter(i=>S.habits.some(x=>x.id===i)).length,dg=DG(k),qg=QG(k),ok=[m>=dg,q>=qg,t>=1];if(hv)ok.push(h>=S.habits.length);const w=[40,30,30,30],loss=Math.round(ok.reduce((s,o,i)=>s+(o?0:w[i]),0)*HF());return{m,q,t,h,dg,qg,hv,ok,loss,win:ok.every(Boolean)}}
function board(){const t=new Date(),f=new Date(t);f.setDate(t.getDate()-83);let c=Array(f.getDay()).fill('<i class="b"></i>'),won=0,tot=0;for(let i=83;i>=0;i--){const d=new Date(t);d.setDate(t.getDate()-i);const k=dk(d);let z='b';if(k>=S.since){const s=dayStat(k);if(k===dk())z=s.win?'w':'t';else{tot++;if(s.win){won++;z='w'}else z=(s.m+s.q+s.t+s.h)>0?'p':'m'}}c.push(`<i class="${z}" title="${fd(k)}"></i>`)}return{h:c.join(''),won,tot}}
function penalty(){let t=0;for(const d=new Date(S.since+'T00:00');dk(d)<dk();d.setDate(d.getDate()+1))t+=dayStat(dk(d)).loss;return t}
const xp=()=>{const n=Math.max(0,gross()-penalty()),r=rank(n);if((S.peak||0)<r){S.peak=r;save()}return Math.max(n,RK[S.peak||0][1])};
function rank(X){let i=0;RK.forEach((r,j)=>{if(X>=r[1])i=j});return i}
function applyColor(c){c=c||'#2ECC71';const r=document.documentElement.style,n=parseInt(c.slice(1),16),l=.299*(n>>16)+.587*(n>>8&255)+.114*(n&255);r.setProperty('--acc',c);r.setProperty('--on',l>150?'#000':'#fff')}
const isP=x=>x.p!==false,accN=id=>(S.acc.find(a=>a.id===id)||{}).name||'';
const PAL=['#2ECC71','#3B82F6','#F59E0B','#A855F7','#EC4899','#22D3EE','#E5322D','#9CA3AF'];
function donut(by,g){let a=0;const s=[];Object.keys(by).sort((x,y)=>by[y]-by[x]).forEach((k,i)=>{const p=by[k]/g*100;s.push(PAL[i%8]+' '+a+'% '+(a+p)+'%');a+=p});return `<div class="donut" style="background:conic-gradient(${s.join(',')})"><div><small>Gastos</small><b>${R(g)}</b></div></div>`}
const mis=(n,a,b,u)=>{const p=Math.min(100,Math.round(a/b*100));return `<div style="margin-bottom:10px"><div class="row"><b>${p>=100?'✓ ':''}${n}</b><span class="mute" style="margin-left:auto">${a}${u} de ${b}${u}</span></div><div class="meter" style="margin-top:4px"><i style="width:${p}%;background:${p>=100?'var(--ok)':'var(--acc)'}"></i></div></div>`};

/* ===== TELAS (uma funcao por aba) ===== */
const CATS={g:[['🍔','Alimentação'],['🚗','Transporte'],['🏠','Moradia'],['💊','Saúde'],['📚','Estudos'],['🎮','Lazer'],['🛒','Compras'],['🧾','Outros']],r:[['💰','Salário'],['💼','Extra'],['📈','Investimentos'],['🎁','Outros']]};
const ICON={};[...CATS.g,...CATS.r].forEach(c=>ICON[c[1]]=c[0]);
const CH=['Faça hoje a primeira tarefa que você está evitando.','Estude 10 minutos a mais que a meta, sem negociar.','Revise seus erros de questões antes de qualquer coisa nova.','Treine mesmo sem vontade. Vontade não é requisito.','Fique 1 hora sem celular e use para estudar.','Escreva o que você quer e o que está te impedindo. Seja direto.','Faça uma coisa desconfortável de propósito, só para calejar a mente.'];
const MENT=[['Mentalidade David Goggins',[['Espelho da responsabilidade','Olhe no espelho e diga com clareza o que você está evitando e o que precisa mudar. Sem desculpa e sem plateia: só você e a verdade.'],['Regra dos 40%','Quando a mente pede para parar, você ainda tem muito mais para dar. Cansaço é um aviso, não o limite. Mais uma série, mais uma página.'],['Jarra de biscoitos','Guarde suas vitórias difíceis. Quando bater o desânimo, lembre do que já superou e use como combustível.'],['Calejar a mente','Faça todo dia algo desconfortável de propósito. Quem se acostuma com o difícil pequeno aguenta o difícil grande.'],['Responsabilidade total','Ninguém vem te salvar. Rotina, sono e foco dependem de você. Tirar a culpa de fora devolve o controle.']]],
['Concurso',[['Comece pelo edital','Liste os conteúdos, o peso e o número de questões de cada um. Estude primeiro o que mais cai.'],['Questões cedo','Resolva questões da sua banca desde o início. Elas mostram o que é cobrado e onde você erra.'],['Caderno de erros','Anote cada erro e o motivo. Revise toda semana: seus erros repetidos são a sua lista de estudo.'],['Revisão espaçada','Reveja o conteúdo depois de 1, 7 e 30 dias. Esquecer é normal, revisar é a solução.'],['Simulados','Faça simulados cronometrados todo mês. Treina tempo, resistência e o emocional.']]],
['Psicologia',[['Regra dos 1%','Melhorar um pouco todo dia vence picos de motivação. Por isso a sua meta aqui cresce 1% ao dia.'],['Gatilho e ação','Decida antes: quando acontecer X, eu faço Y. Isso reduz a dependência de vontade.'],['Recuperação ativa','Feche o material e tente lembrar. Isso fixa mais do que reler.'],['Ambiente','Celular longe, mesa limpa. Facilite o que ajuda e dificulte o que atrapalha.'],['Descanso e sono','Dormir mal derruba memória e humor. Descansar faz parte do treino. Nunca falte duas vezes seguidas.']]],
['Competição',[['Seu rival é quem você foi ontem','Compare-se com o seu histórico, não com a vida dos outros.'],['Descubra a nota de corte','Concurso é corrida por posição. Veja a nota de corte e a diferença que falta: isso vira meta concreta.'],['Horas de qualidade','Quem acumula mais horas bem usadas tende a passar. Cada sessão salva é um voto no seu futuro.'],['Simule a pressão','Treine com horário, tempo e sem pausa. A ansiedade perde força quando a prova parece rotina.'],['Controle o processo','Foque no que depende de você: horas, questões e revisão. O resultado vem depois.']]]];
const M={
r(){
  const all=S.fin.filter(x=>x.d.startsWith(fm)),e=all.filter(x=>!x.x),rp=e.filter(isP),pe=e.filter(x=>!isP(x)),r=sum(rp,'r'),g=sum(rp,'g'),pr=sum(pe,'r'),pg=sum(pe,'g'),late=pe.filter(x=>x.d<dk()).length,lim=+S.prof.budget||0,G=g+pg,by={},grp={};
  e.filter(x=>x.t==='g').forEach(x=>{const c=x.c||'Outros';by[c]=(by[c]||0)+x.v});
  all.slice().sort((a,b)=>a.d<b.d?1:-1).forEach(x=>(grp[x.d]=grp[x.d]||[]).push(x));
  const ks=Object.keys(by).sort((a,b)=>by[b]-by[a]);
  return `<div class="card bal"><small>Saldo realizado</small><div class="bn ${r-g>=0?'in':'out'}">${R(r-g)}</div><div class="two"><div class="pl"><small>Recebido</small><b class="in">${R(r)}</b></div><div class="pl"><small>Pago</small><b class="out">${R(g)}</b></div><div class="pl"><small>A receber</small><b>${R(pr)}</b></div><div class="pl"><small>A pagar</small><b>${R(pg)}</b></div></div><small style="display:block;margin-top:10px">Previsto no fim do mês: <b>${R(r+pr-g-pg)}</b>${late?` · <span class="out">${late} em atraso</span>`:''}</small>${lim?`<div class="meter" style="margin-top:12px"><i style="width:${Math.min(100,G/lim*100)}%;background:${G>lim?'var(--bad)':G>lim*.8?'var(--warn)':'var(--acc)'}"></i></div><small>${R(G)} de ${R(lim)}${G>lim?' · limite estourado':' · restam '+R(lim-G)}</small>`:''}</div>
  <button class="btn" style="width:100%;margin-bottom:12px" onclick="fform=!fform;render()">${fform?'Fechar':'+ Novo lançamento'}</button>
  ${fform?`<div class="card"><div class="seg"><button class="${ft==='g'?'on':''}" onclick="ft='g';fcat='Alimentação';render()">Gasto</button><button class="${ft==='r'?'on':''}" onclick="ft='r';fcat='Salário';render()">Rendimento</button></div><div class="stack"><input id="fv" type="number" step="0.01" min="0" placeholder="R$ 0,00" style="font-size:22px;font-weight:800"><div class="cats">${CATS[ft].map(c=>`<button class="chip ${fcat===c[1]?'sel':''}" onclick="pick(this,'${c[1]}')">${c[0]} ${c[1]}</button>`).join('')}</div><div class="two"><input id="fn" placeholder="Descrição"><input id="fd" type="date" value="${dk()}"></div><div class="two"><select id="fa">${S.acc.map(a=>`<option value="${a.id}">${a.ic} ${esc(a.name)}</option>`).join('')}</select><select id="fr"><option value="1">Única</option><option value="p2">Parcelado 2x</option><option value="p3">Parcelado 3x</option><option value="p6">Parcelado 6x</option><option value="p10">Parcelado 10x</option><option value="p12">Parcelado 12x</option><option value="m12">Fixa mensal (12 meses)</option></select></div><small>Data futura vira conta a pagar ou a receber. Toque no círculo da lista para confirmar.</small><button class="btn" onclick="addF()">Lançar</button></div></div>`:''}
  ${ks.length?`<div class="card"><h2>Gastos por categoria</h2>${donut(by,sum(e,'g'))}${ks.map((k,i)=>`<div class="row" style="margin-bottom:10px"><span class="ic">${ICON[k]||'🧾'}</span><div class="g" style="flex:1"><div class="row"><b><i class="dot" style="background:${PAL[i%8]}"></i>${esc(k)}</b><span class="mute" style="margin-left:auto">${R(by[k])} · ${Math.round(by[k]/sum(e,'g')*100)}%</span></div></div></div>`).join('')}</div>`:''}
  ${Object.keys(grp).length?Object.keys(grp).map(k=>`<div class="card"><h2>${fd(k)}</h2>${grp[k].map(x=>`<div class="item"><button class="pay ${isP(x)?'on':''}" aria-label="${isP(x)?'Marcar como pendente':'Marcar como pago'}" onclick="tgp('${x.id}')">${isP(x)?'✓':''}</button><span class="ic">${x.x?'💳':ICON[x.c]||'🧾'}</span><div class="g"><b>${esc(x.c||'Outros')}</b><br><small>${esc(accN(x.a))}${x.n?' · '+esc(x.n):''}${!isP(x)?(x.d<dk()?' · <span class="out">atrasado</span>':' · pendente'):''}</small></div><b class="${x.t==='r'?'in':'out'}">${x.t==='r'?'+':'−'}${R(x.v)}</b><button class="x" aria-label="Apagar" onclick="del('fin','${x.id}')">×</button></div>`).join('')}</div>`).join(''):'<div class="empty">Nenhum lançamento neste mês.</div>'}`},
c(){
  const ct=S.acc.filter(a=>a.type!=='cartao'),cc=S.acc.filter(a=>a.type==='cartao'),bal=a=>(+a.ini||0)+sum(S.fin.filter(x=>x.a===a.id&&isP(x)),'r')-sum(S.fin.filter(x=>x.a===a.id&&isP(x)),'g'),tot=ct.reduce((t,a)=>t+bal(a),0),fat=a=>sum(S.fin.filter(x=>x.a===a.id&&x.d.startsWith(fm)),'g');
  return `<div class="card bal"><small>Saldo total nas contas</small><div class="bn ${tot>=0?'in':'out'}">${R(tot)}</div></div>
  <div class="card"><h2>Contas</h2>${ct.map(a=>`<div class="item"><span class="ic">${a.ic}</span><div class="g"><b>${esc(a.name)}</b></div><b>${R(bal(a))}</b><button class="x" aria-label="Apagar" onclick="delAcc('${a.id}')">×</button></div>`).join('')}</div>
  <div class="card"><h2>Cartões de crédito · fatura do mês</h2>${cc.length?cc.map(a=>{const f=fat(a),pg=(a.pg||{})[fm];return `<div class="item"><span class="ic">💳</span><div class="g"><b>${esc(a.name)}</b><br><small>vence dia ${a.due||'–'}${a.lim?' · limite '+R(a.lim):''}</small></div><div style="text-align:right"><b>${R(f)}</b><br>${pg?'<small class="in">paga</small>':f?`<button class="chip" onclick="payFat('${a.id}')">Pagar</button>`:''}</div><button class="x" aria-label="Apagar" onclick="delAcc('${a.id}')">×</button></div>`}).join(''):'<div class="empty">Nenhum cartão.</div>'}</div>
  <div class="card"><h2>Nova conta ou cartão</h2><div class="stack"><input id="an2" placeholder="Nome (Nubank, Itaú...)"><div class="two"><select id="at2"><option value="conta">Conta</option><option value="cartao">Cartão de crédito</option></select><input id="av2" type="number" placeholder="Saldo ou limite (R$)"></div><input id="ad2" type="number" min="1" max="31" placeholder="Dia de vencimento (só cartão)"><button class="btn" onclick="addAcc()">Adicionar</button></div></div>`},
p(){
  const by={};S.fin.filter(x=>x.d.startsWith(fm)&&!x.x&&x.t==='g').forEach(x=>by[x.c||'Outros']=(by[x.c||'Outros']||0)+x.v);
  return `<div class="card"><h2>Limite geral do mês</h2><div class="row"><input id="bl" type="number" placeholder="R$" value="${S.prof.budget||''}"><button class="btn g" onclick="S.prof.budget=+v('bl')||0;save();render()">Definir</button></div></div>
  <div class="card"><h2>Orçamento por categoria</h2><small>Defina um teto por categoria. Acima de 80% o app avisa.</small>${CATS.g.map(c=>{const s=by[c[1]]||0,l=+S.bud[c[1]]||0,p=l?s/l*100:0;return `<div style="margin-top:14px"><div class="row"><span class="ic">${c[0]}</span><div class="g" style="flex:1"><b>${c[1]}</b><br><small>${R(s)}${l?' de '+R(l):''}${p>=100?' · <span class="out">estourou</span>':p>=80?' · <span style="color:var(--warn)">atenção</span>':''}</small></div><input type="number" placeholder="Teto" value="${l||''}" style="width:96px" onchange="S.bud['${c[1]}']=+this.value||0;save();render()"></div>${l?`<div class="meter" style="margin-top:6px"><i style="width:${Math.min(100,p)}%;background:${p>=100?'var(--bad)':p>=80?'var(--warn)':'var(--acc)'}"></i></div>`:''}</div>`}).join('')}</div>`},
m(){
  return `<div class="card"><h2>Nova meta</h2><div class="stack"><input id="gn" placeholder="Ex.: reserva de emergência, viagem"><div class="row"><input id="gt" type="number" placeholder="Valor alvo (R$)"><button class="btn" onclick="addG()">Criar</button></div></div></div>`+(S.goals.length?S.goals.map(g=>{const p=Math.min(100,Math.round(g.s/g.t*100));return `<div class="card"><div class="row"><b style="flex:1">${esc(g.n)}</b><button class="x" aria-label="Apagar" onclick="del('goals','${g.id}')">×</button></div><div style="font-size:26px;font-weight:800;margin:6px 0">${R(g.s)} <small>de ${R(g.t)}</small></div><div class="meter"><i style="width:${p}%"></i></div><div class="row" style="margin-top:10px"><input id="gd${g.id}" type="number" placeholder="Guardar (R$)"><button class="btn" onclick="depG('${g.id}')">Guardar</button></div><small>${p>=100?'Meta batida!':p+'% · faltam '+R(g.t-g.s)}</small></div>`}).join(''):'<div class="empty">Nenhuma meta ainda.</div>')}
};
const V={
home(){
  const p=S.prof,ne=nextExams(),X=xp(),li=lvl(X),cur=STEPS[li],nx=STEPS[li+1],ri=cur.i,lo=cur.x,pc=nx?Math.round((X-lo)/(nx.x-lo)*100):100,ls=penalty(),yd=new Date();yd.setDate(yd.getDate()-1);const yl=dayStat(dk(yd)).loss,ds=dayStat(dk()),bd=board(),up=[...S.ag.map(a=>({d:a.d,t:a.t,n:a.n})),...S.exams.map(e=>({d:e.d,t:'',n:'Prova: '+e.name}))].filter(a=>a.d>=dk()).sort((a,b)=>(a.d+a.t)<(b.d+b.t)?-1:1).slice(0,4);
  const tg=p.date&&left(p.date)>=0?{n:p.goal||'o concurso',d:p.date}:ne[0]?{n:ne[0].name,d:ne[0].d}:null;
  const w=last7(),tot=w.reduce((t,x)=>t+x.m,0),mx=Math.max(...w.map(x=>x.m),30);
  const qt=S.qs.filter(q=>q.d===dk()),qn=qt.reduce((t,q)=>t+q.n,0),tt=S.tr.filter(x=>x.d===dk()).length;
  const mo=S.fin.filter(x=>x.d.startsWith(dk().slice(0,7))&&!x.x&&x.p!==false),sd=sum(mo,'r')-sum(mo,'g');
  const tasks=S.plan.filter(x=>x.dow===new Date().getDay());
  const why=p.why?`<p class="q">${esc(p.why)}</p>`:`<p class="q">${QT[Math.floor(Date.now()/864e5)%QT.length]}</p>`;
  return `<div class="card hero">${tg?`<div class="big">${left(tg.d)}<small>${left(tg.d)===1?'dia':'dias'} para ${esc(tg.n)}</small></div>`:`<div class="big" style="font-size:34px">Defina seu alvo</div><p class="mute">Cadastre o concurso na aba Vida.</p>`}${why}</div>
  <div class="card"><div class="row"><div class="rank">${cur.n}</div><span class="mute" style="margin-left:auto">nível ${li+1} de ${STEPS.length} · sequência ${streak()} dias</span></div><div class="meter" style="margin:10px 0 4px"><i style="width:${pc}%"></i></div><small>${X} XP · ${nx?'faltam '+(nx.x-X)+' para '+nx.n:'você chegou ao topo'}</small>${ls?`<br><small style="color:var(--bad)">Perdido por metas não cumpridas: −${ls} XP${yl?' · ontem: −'+yl+' XP':''}</small>`:''}</div>
  <div class="card"><h2>Quadro de dias</h2><div class="heat">${bd.h}</div><div class="row" style="margin-top:10px"><small>Dias vencidos: ${bd.won} de ${bd.tot}${bd.tot?' · '+Math.round(bd.won/bd.tot*100)+'%':''}</small><small style="margin-left:auto">claro = venceu · escuro = falhou</small></div></div>
  <div class="card"><h2>Missões de hoje</h2>${mis('Estudo',ds.m,ds.dg,'min')}${mis('Questões',ds.q,ds.qg,'')}${mis('Treino',ds.t,1,'')}${ds.hv?mis('Hábitos',ds.h,S.habits.length,''):''}<small>Regra dos 1%: a meta sobe todo dia (hoje você está em ${Math.round(ramp(dk())*100)}% da meta final). Se o dia acabasse agora: −${ds.loss} XP</small></div>
  ${revCard()}<div class="grid3"><div class="stat"><b>${hm(tot)}</b><span>Estudo em 7 dias</span></div><div class="stat"><b>${acc(qt)===null?'–':acc(qt)+'%'}</b><span>Acerto hoje</span></div><div class="stat"><b class="${sd>=0?'in':'out'}">${R(sd)}</b><span>Saldo do mês</span></div></div>
  <div class="card"><h2>Estudo nos últimos 7 dias</h2><div class="bars">${w.map((x,i)=>`<div class="bar${i===6?' t':''}">${x.m?hm(x.m):''}<i style="height:${Math.max(3,x.m/mx*68)}px"></i>${x.w}</div>`).join('')}</div></div>
  <div class="card"><h2>Próximos compromissos</h2>${up.length?up.map(a=>`<div class="item"><b style="width:64px">${left(a.d)===0?'Hoje':left(a.d)===1?'Amanhã':fd(a.d).slice(0,5)}</b><div class="g">${esc(a.n)}</div><small>${a.t}</small></div>`).join(''):'<div class="empty">Nada marcado. Use a Agenda.</div>'}</div>
  <div class="card"><h2>Tarefas de hoje</h2>${tasks.length?tasks.map(taskRow).join(''):'<div class="empty">Nada planejado. Vá em Tarefas.</div>'}</div>
  <div class="card"><h2>Escada de níveis</h2>${RK.map((r,i)=>`<div class="item"><b style="color:${i===ri?'var(--acc)':i<ri?'var(--ink)':'var(--mute)'}">${i<ri?'✓ ':i===ri?'▶ ':''}${r[0]}</b><span class="mute" style="margin-left:auto">${r[1]} XP</span></div>`).join('')}</div>`},
train(){
  const wk=S.tr.filter(x=>left(x.d)>-7),rec=S.tr.slice().reverse().slice(0,10);
  return `<div class="grid3"><div class="stat"><b>${wk.length}</b><span>Treinos em 7 dias</span></div><div class="stat"><b>${hm(wk.reduce((t,x)=>t+x.m,0))}</b><span>Tempo em 7 dias</span></div><div class="stat"><b>${S.tr.length}</b><span>Treinos no total</span></div></div>
  <div class="card"><h2>Registrar treino</h2><div class="stack"><input id="tk" placeholder="Tipo (corrida, musculação...)" list="tks"><div class="two"><input id="tm" type="number" min="1" placeholder="Minutos"><select id="ti"><option value="1">Leve</option><option value="2">Médio</option><option value="3" selected>Pesado</option><option value="4">Insano</option></select></div><button class="btn" onclick="addT()">Registrar</button></div></div>
  <div class="card"><h2>Histórico</h2>${rec.length?rec.map(x=>`<div class="item"><div class="g"><b>${esc(x.k||'Treino')}</b><br><small>${fd(x.d)} · ${['','Leve','Médio','Pesado','Insano'][x.i]}</small></div><b>${hm(x.m)}</b><button class="x" aria-label="Apagar" onclick="del('tr','${x.id}')">×</button></div>`).join(''):'<div class="empty">Nenhum treino. Hoje é um bom dia.</div>'}</div>`},
money(){const t=new Date(fm+'-01T00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  return `<div class="row" style="margin-bottom:10px"><button class="x" aria-label="Mês anterior" onclick="fmv(-1)">‹</button><b style="flex:1;text-align:center;text-transform:capitalize">${t}</b><button class="x" aria-label="Próximo mês" onclick="fmv(1)">›</button></div><div class="seg">${[['r','Resumo'],['c','Contas'],['p','Planejar'],['m','Metas']].map(a=>`<button class="${ms===a[0]?'on':''}" onclick="ms='${a[0]}';render()">${a[1]}</button>`).join('')}</div>`+M[ms]()},
plan(){
  const tasks=S.plan.filter(p=>p.dow===pd);
  return `<div class="card"><div class="seg">${DOW.map((d,i)=>`<button class="${i===pd?'on':''}${i===new Date().getDay()?' h':''}" onclick="pd=${i};render()">${d}</button>`).join('')}</div>
  <div class="stack"><div class="row"><input id="ps" placeholder="Matéria/área" list="subs"><input id="pt" placeholder="O que fazer"></div><button class="btn" onclick="addP()">Adicionar em ${DOW[pd]}</button></div></div>
  <div class="card">${tasks.length?tasks.map(taskRow).join(''):'<div class="empty">Nada planejado neste dia.</div>'}<button class="btn g" style="margin-top:10px" onclick="S.plan.forEach(p=>p.done=false);save();render()">Zerar checks da semana</button></div>`},
habits(){
  const k=dk(),H=S.habits,slots=5+rank(gross()),days=[...Array(7)].map((_,i)=>{const x=new Date();x.setDate(x.getDate()-6+i);return{k:dk(x),w:DOW[x.getDay()][0]}});
  const dn=(h,kk)=>(S.hd[kk]||[]).includes(h.id);
  const st=h=>{let n=0,x=new Date();if(!dn(h,dk(x)))x.setDate(x.getDate()-1);while(dn(h,dk(x))){n++;x.setDate(x.getDate()-1)}return n};
  const p30=h=>{let n=0;for(let i=0;i<30;i++){const x=new Date();x.setDate(x.getDate()-i);if(dn(h,dk(x)))n++}return Math.round(n/30*100)};
  const nd=H.filter(h=>dn(h,k)).length,pc=H.length?Math.round(nd/H.length*100):0,best=Math.max(0,...H.map(st));
  const SUG=[['📖','Ler 10 páginas'],['🙏','Rezar'],['⏰','Acordar cedo'],['💧','Beber 3L de água'],['😴','Dormir 7h ou mais'],['📵','Sem celular antes de dormir'],['🧘','Meditar 10 min'],['🏃','Caminhar 30 min']];
  return `<div class="card hero"><div class="row"><svg width="84" height="84" viewBox="0 0 84 84" style="flex:none"><circle cx="42" cy="42" r="34" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="8"/><circle cx="42" cy="42" r="34" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-dasharray="${2.136*pc} 213.6" transform="rotate(-90 42 42)"/><text x="42" y="47" text-anchor="middle" fill="currentColor" font-size="18" font-weight="800">${pc}%</text></svg><div><div style="font-size:22px;font-weight:800">${nd} de ${H.length} hábitos hoje</div><small>Maior sequência atual: ${best} dias · cada hábito vale 10 XP</small></div></div></div>
  ${H.map(h=>`<div class="card"><div class="row"><span class="ic">${h.ic||'✅'}</span><div class="g" style="flex:1"><b>${esc(h.name)}</b><br><small>🔥 ${st(h)} dias seguidos · ${p30(h)}% em 30 dias</small></div><button class="x" aria-label="Apagar" onclick="hdel('${h.id}')">×</button></div><div class="week">${days.map(x=>`<div><small>${x.w}</small><br><button class="dd ${dn(h,x.k)?'on':''}" aria-label="Marcar ${fd(x.k)}" onclick="hchk('${h.id}','${x.k}')">${dn(h,x.k)?'✓':''}</button></div>`).join('')}</div></div>`).join('')}
  <div class="card"><h2>Novo hábito · ${H.length} de ${slots} vagas</h2><div class="row"><input id="hn" placeholder="Ex.: ler livro, rezar"><button class="btn" onclick="addH()">Adicionar</button></div><div class="cats" style="margin-top:10px">${SUG.filter(s=>!H.some(h=>h.name===s[1])).map(s=>`<button class="chip" onclick="addH('${s[1]}','${s[0]}')">${s[0]} ${s[1]}</button>`).join('')}</div>${hmsg?`<small style="color:var(--warn)">${hmsg}</small>`:''}<small style="display:block;margin-top:8px">Cada rank novo libera mais uma vaga. Toque nos círculos para marcar ou corrigir os últimos 7 dias.</small></div>`},
agenda(){
  const mo=new Date(cm+'-01T00:00'),dim=new Date(mo.getFullYear(),mo.getMonth()+1,0).getDate(),cells=Array(mo.getDay()).fill('<span></span>');
  const evs=k=>[...S.ag.filter(a=>a.d===k).map(a=>({t:a.t,n:a.n,id:a.id})),...S.exams.filter(e=>e.d===k).map(e=>({t:'',n:'Prova: '+e.name,ex:1}))];
  for(let i=1;i<=dim;i++){const k=cm+'-'+pad(i);cells.push(`<button class="cd${k===cd?' sel':''}${k===dk()?' td':''}" onclick="cd='${k}';render()">${i}${evs(k).length?'<u></u>':''}</button>`)}
  const list=evs(cd).sort((a,b)=>a.t<b.t?-1:1);
  return `<div class="card"><div class="row"><button class="x" aria-label="Mês anterior" onclick="cmv(-1)">‹</button><b style="flex:1;text-align:center;text-transform:capitalize">${mo.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</b><button class="x" aria-label="Próximo mês" onclick="cmv(1)">›</button></div><div class="cal">${DOW.map(x=>`<small>${x[0]}</small>`).join('')}${cells.join('')}</div></div>
  <div class="card"><h2>${fd(cd)}${cd===dk()?' · hoje':''}</h2>${list.length?list.map(a=>`<div class="item"><b style="width:56px">${a.t||'Dia todo'}</b><div class="g">${esc(a.n)}</div>${a.ex?'':`<button class="x" aria-label="Apagar" onclick="del('ag','${a.id}')">×</button>`}</div>`).join(''):'<div class="empty">Nada marcado neste dia.</div>'}</div>
  <div class="card"><h2>Novo compromisso</h2><div class="stack"><input id="an" placeholder="O que você vai fazer?"><div class="two"><input id="ad" type="date" value="${cd}"><input id="at" type="time"></div><button class="btn" onclick="addA()">Marcar</button></div></div>`},
mentor(){return `<div class="card hero"><small>Desafio de hoje</small><p class="q">${CH[Math.floor(Date.now()/864e5)%CH.length]}</p></div>`+MENT.map(s=>`<div class="card"><h2>${s[0]}</h2>${s[1].map(i=>`<details><summary><b>${i[0]}</b></summary><p class="mute" style="margin:6px 0 2px">${i[1]}</p></details>`).join('')}</div>`).join('')},
life(){
  const p=S.prof,f=(i,l,t,x)=>`<div><small>${l}</small><input id="${i}" type="${t||'text'}" ${x||''} value="${esc(p[i]||'')}"></div>`;
  return `<div class="card"><h2>Cadastro de vida</h2><div class="stack">${f('nome','Seu nome')}${f('goal','Concurso e cargo alvo')}${f('date','Data da prova','date')}<div class="two">${f('peso','Peso atual (kg)','number','step="0.1"')}${f('pmeta','Peso meta (kg)','number','step="0.1"')}</div>${f('why','Por que você vai passar? (aparece no painel)')}<div class="two"><div><small>Estudo na semana, meta final (horas)</small><input id="gh" type="number" min="1" value="${Math.round(S.goal/60)}"></div>${f('qgoal','Questões por dia (meta final)','number','min="1" placeholder="20"')}</div><button class="btn" onclick="saveP()">Salvar</button></div></div>
  <div class="card"><h2>Aparência</h2><small>Cor de destaque</small><div class="row" style="flex-wrap:wrap;margin-top:8px">${CL.map(c=>`<button class="sw" style="background:${c}" aria-label="Cor ${c}" onclick="setColor('${c}')"></button>`).join('')}<input type="color" value="${p.color||'#2ECC71'}" onchange="setColor(this.value)" style="width:44px;height:36px;padding:2px" aria-label="Escolher outra cor"></div></div>
  <div class="card"><h2>Seus dados</h2><p class="mute">Tudo fica salvo só neste navegador. Não limpe os dados do navegador.</p></div>`}
};
/* ===== PECAS REUTILIZAVEIS ===== */
const TT={home:'Painel',study:'Estudo',train:'Treino',habits:'Hábitos',agenda:'Agenda',money:'Grana',plan:'Tarefas',mentor:'Mentor',life:'Vida'};
function examRow(e){const n=left(e.d);return `<div class="item"><div class="g"><b>${esc(e.name)}</b><br><small>${fd(e.d)}</small></div><span class="pill" style="color:${n<0?'var(--mute)':tone(n)}">${n<0?'passou':n===0?'hoje':n+'d'}</span><button class="x" aria-label="Apagar" onclick="del('exams','${e.id}')">×</button></div>`}
function taskRow(p){return `<div class="item"><input type="checkbox" ${p.done?'checked':''} onchange="chk('${p.id}')" aria-label="Concluir"><div class="g ${p.done?'done':''}"><b>${esc(p.t)}</b>${p.s?'<br><small>'+esc(p.s)+'</small>':''}</div><button class="x" aria-label="Apagar" onclick="del('plan','${p.id}')">×</button></div>`}
/* ===== ACOES (botoes e formularios) ===== */
function hchk(i,k){const a=S.hd[k]||(S.hd[k]=[]),x=a.indexOf(i);x<0?a.push(i):a.splice(x,1);save();render()}
function hdel(i){S.habits=S.habits.filter(h=>h.id!==i);save();render()}
function addH(n,ic){n=(n||v('hn')).trim();if(!n)return;if(S.habits.length>=5+rank(gross())){hmsg='Sem vagas. Suba de rank para liberar mais um hábito.';render();return}hmsg='';if(!S.habits.length)S.hsince=dk();S.habits.push({id:uid(),name:n,ic:ic||'✅'});save();render()}
function fmv(n){const t=new Date(fm+'-01T00:00');t.setMonth(t.getMonth()+n);fm=dk(t).slice(0,7);render()}
function cmv(n){const t=new Date(cm+'-01T00:00');t.setMonth(t.getMonth()+n);cm=dk(t).slice(0,7);render()}
function pick(el,c){fcat=c;el.parentNode.querySelectorAll('.chip').forEach(b=>b.classList.remove('sel'));el.classList.add('sel')}
function addA(){const n=v('an').trim();if(!n)return;const d=v('ad')||cd;S.ag.push({id:uid(),d,t:v('at'),n});cd=d;cm=d.slice(0,7);save();render()}
function go(t){tab=t;render();scrollTo(0,0)}
function del(k,i){S[k]=S[k].filter(x=>x.id!==i);save();render()}
function chk(i){const p=S.plan.find(x=>x.id===i);p.done=!p.done;save();render()}
function addExam(){const n=v('en').trim(),d=v('ed');if(!n||!d)return;sub(n);S.exams.push({id:uid(),name:n,d});save();render()}
function addP(){const t=v('pt').trim();if(!t)return;S.plan.push({id:uid(),dow:pd,s:sub(v('ps')),t,done:false});save();render()}
function addT(){const m=Math.round(+v('tm'));if(!m)return;S.tr.push({id:uid(),d:dk(),k:v('tk').trim(),m,i:+v('ti')});save();render()}
function addF(){const x=+v('fv');if(!x)return;const rp=v('fr')||'1',d0=v('fd')||dk();let n=1,vl=x;if(rp[0]==='p'){n=+rp.slice(1);vl=x/n}else if(rp[0]==='m')n=12;
  for(let i=0;i<n;i++){const t=new Date(d0+'T00:00');t.setMonth(t.getMonth()+i);const k=dk(t);S.fin.push({id:uid(),d:k,t:ft,v:Math.round(vl*100)/100,c:fcat,n:v('fn').trim()+(n>1?' ('+(i+1)+'/'+n+')':''),a:v('fa'),p:k<=dk()})}
  fm=d0.slice(0,7);fform=false;save();render()}
function tgp(i){const f=S.fin.find(x=>x.id===i);f.p=f.p===false;save();render()}
function addAcc(){const n=v('an2').trim();if(!n)return;const c=v('at2')==='cartao',x=+v('av2')||0;S.acc.push({id:uid(),name:n,ic:c?'💳':'🏦',type:c?'cartao':'conta',ini:c?0:x,lim:c?x:0,due:+v('ad2')||0});save();render()}
function delAcc(i){const a=S.acc.find(x=>x.id===i);if(a.type!=='cartao'&&S.acc.filter(x=>x.type!=='cartao').length<2)return;S.acc=S.acc.filter(x=>x.id!==i);save();render()}
function payFat(i){const a=S.acc.find(x=>x.id===i),f=sum(S.fin.filter(x=>x.a===i&&x.d.startsWith(fm)),'g'),c=S.acc.find(x=>x.type!=='cartao');if(!f||!c)return;S.fin.push({id:uid(),d:dk(),t:'g',v:f,c:'Fatura '+a.name,a:c.id,x:1,p:true,n:''});(a.pg=a.pg||{})[fm]=true;save();render()}
function addG(){const n=v('gn').trim(),t=+v('gt');if(!n||!t)return;S.goals.push({id:uid(),n,t,s:0});save();render()}
function depG(i){const x=+v('gd'+i);if(!x)return;S.goals.find(g=>g.id===i).s+=x;save();render()}
function setColor(c){S.prof.color=c;save();applyColor(c)}
function saveP(){['nome','goal','date','peso','pmeta','why','qgoal'].forEach(k=>S.prof[k]=v(k).trim());S.goal=Math.max(60,Math.round((+v('gh')||14)*60));save();go('home')}
/* ===== DESENHAR A TELA ===== */
const opt=a=>[...new Set(a.filter(Boolean))].map(s=>`<option value="${esc(s)}">`).join('');
function render(){
  applyColor(S.prof.color);
  $('#view').innerHTML=V[tab]();
  $('#ttl').textContent=tab==='home'&&S.prof.nome?S.prof.nome:TT[tab];
  $('#subs').innerHTML=opt([...S.mats.map(m=>m.name),...S.subs]);$('#cats').innerHTML=opt(S.fin.map(x=>x.c));$('#tks').innerHTML=opt(S.tr.map(x=>x.k));
  const N=[['home','◉','Hoje'],['study','◷','Estudo'],['train','✚','Treino'],['money','$','Grana'],['more','⋯','Mais']],MORE=['agenda','habits','plan','mentor','xp','life'];
  const cur=MORE.includes(tab)?'more':tab;
  $('#nav').innerHTML=N.map(n=>`<button class="${n[0]===cur?'on':''}" onclick="go('${n[0]}')"><b>${n[1]}</b>${n[2]}</button>`).join('');
}
$('#date').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
setInterval(()=>{document.querySelectorAll('.clk').forEach(c=>c.textContent=clock(elapsed()))},500);
window.addEventListener('DOMContentLoaded',()=>render());
