/* =====================================================================
   VILA: cada hora estudada constrói a sua vila (como as árvores do Forest,
   mas aqui nasce uma vila). A vila cresce com o tempo de estudo e fica forte
   junto com o seu personagem: Herói (rank) + Vila (construções) = Força total.
   Tudo é calculado a partir das suas sessões de estudo (S.sess), então
   também conta o que você já estudou antes de existir a Vila.
   ===================================================================== */
const VM=2; // peso dos bônus das construções nos atributos
/* [horas de estudo necessárias, emoji, nome, ataque, defesa, provisão, sabedoria] */
const VB=[
 [0,'🔥','Fogueira',0,0,1,1],
 [1,'⛺','Barraca',0,1,1,0],
 [3,'🛖','Cabana',0,2,0,0],
 [6,'⛲','Poço',0,0,2,0],
 [10,'🌾','Horta',0,0,3,0],
 [15,'🏠','Casa',0,2,1,0],
 [21,'🪓','Lenhador',2,0,1,0],
 [28,'🏡','Casa de campo',0,2,2,0],
 [36,'🏪','Mercado',0,0,4,1],
 [45,'🔨','Ferraria',5,0,0,0],
 [55,'🐎','Estábulo',3,1,0,0],
 [66,'🏹','Campo de tiro',4,0,0,0],
 [78,'🍺','Taverna',1,0,3,0],
 [91,'🔔','Torre do sino',0,3,0,1],
 [105,'🗼','Torre de vigia',0,5,0,0],
 [120,'🏫','Escola',0,0,0,5],
 [136,'⛪','Capela',0,2,0,4],
 [153,'📚','Biblioteca',0,0,0,7],
 [171,'🏭','Oficina',6,0,2,0],
 [190,'⛩\uFE0F','Santuário',0,0,0,6],
 [210,'🏛\uFE0F','Prefeitura',0,6,3,0],
 [235,'🏯','Fortaleza',2,10,0,0],
 [260,'⚔\uFE0F','Quartel',10,2,0,0],
 [300,'🏰','Castelo',8,8,8,8]];
const VT=[[0,'Acampamento'],[6,'Povoado'],[28,'Aldeia'],[78,'Vila'],[171,'Cidade'],[300,'Reino']];
const VS=[['⚔\uFE0F','Ataque',3],['🛡\uFE0F','Defesa',4],['🌾','Provisão',5],['📖','Sabedoria',6]];

const vMin=()=>S.sess.reduce((t,s)=>t+secOf(s)/60,0);
const vBuilt=(m)=>{m=m==null?vMin():m;let n=0;VB.forEach((b,i)=>{if(m>=b[0]*60)n=i+1});return n};
const vTier=(m)=>{let t=VT[0][1];VT.forEach(x=>{if(m>=x[0]*60)t=x[1]});return t};
const vBonus=(b)=>VS.map(s=>b[s[2]]?'+'+b[s[2]]*VM+' '+s[1].slice(0,3).toUpperCase():'').filter(Boolean).join(' ');
const vHero=(rk)=>10+rk*8;                       // cada atributo do herói: 10 (Preguiçoso) até 90 (Supremo)
const vVila=(n,k)=>VB.slice(0,n).reduce((t,b)=>t+b[k]*VM,0);

/* lotes da vila: 7 x 5, do centro para fora. Os 24 mais próximos recebem construções; o resto vira floresta */
function vLots(){const C=7,R=5,cx=(C-1)/2,cy=(R-1)/2,a=[];
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){const dx=(c-cx)/1.15,dy=r-cy;a.push({c,r,d:Math.hypot(dx,dy),an:Math.atan2(dy,dx)})}
  return a.sort((p,q)=>p.d-q.d||p.an-q.an)}

function vScene(n,m){
  const L=vLots(),W=392,H=280,cs=56,trees=Math.min(L.length-VB.length,Math.floor(m/60/2)+1);
  let s=`<svg viewBox="0 0 ${W} ${H}" class="vsvg" role="img" aria-label="Mapa da sua vila"><defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f7d4b"/><stop offset="1" stop-color="#285234"/></linearGradient></defs><rect width="${W}" height="${H}" rx="14" fill="url(#vg)"/>`;
  L.forEach((l,i)=>{
    const x=l.c*cs,y=l.r*cs,cx=x+cs/2,cy=y+cs/2+2;
    if((l.c+l.r)%2)s+=`<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="#000" opacity=".05"/>`;
    if(i<VB.length){
      if(i<n)s+=`<rect x="${x+4}" y="${y+4}" width="${cs-8}" height="${cs-8}" rx="10" fill="#c9a96b" opacity=".3"/><text x="${cx}" y="${cy}" font-size="32" text-anchor="middle" dominant-baseline="central"${i===n-1?' class="vnew"':''}>${VB[i][1]}</text>`;
      else if(i===n)s+=`<rect x="${x+4}" y="${y+4}" width="${cs-8}" height="${cs-8}" rx="10" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="5 4"/><text x="${cx}" y="${cy}" font-size="24" text-anchor="middle" dominant-baseline="central">🚧</text>`;
      else s+=`<rect x="${x+4}" y="${y+4}" width="${cs-8}" height="${cs-8}" rx="10" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="1.5" stroke-dasharray="3 5"/>`}
    else{const k=i-VB.length;if(k<trees)s+=`<text x="${cx}" y="${cy}" font-size="30" text-anchor="middle" dominant-baseline="central">${k%3===0?'🌳':'🌲'}</text>`}
  });
  return s+'</svg>'}

function vilaNome(t){S.vila=S.vila||{};S.vila.nome=t.trim().slice(0,30);save()}

/* aviso quando uma nova construção é liberada (chamado a cada render) */
function vilaCheck(){try{
  S.vila=S.vila||{};const n=vBuilt();
  if(S.vila.seen==null){S.vila.seen=n;flush();return}
  if(n>S.vila.seen){const b=VB[n-1];S.vila.seen=n;flush();setTimeout(()=>toast('🏘️ Nova construção: '+b[1]+' '+b[2]+'!','ach'),1400)}
  else if(n<S.vila.seen){S.vila.seen=n;flush()}
}catch(e){}}

/* cartão que aparece no topo do hub de Estudo */
function vilaCard(){
  const m=vMin(),n=vBuilt(m),nx=VB[n],nome=(S.vila&&S.vila.nome)||vTier(m);
  const last=VB.slice(Math.max(0,n-4),n).map(b=>b[1]).join('');
  const sub=nx?'Próxima: '+nx[1]+' '+nx[2]+' em '+hm(Math.max(1,Math.ceil(nx[0]*60-m))):'Vila completa 🏰';
  return `<button class="card vcard" onclick="stab('v')"><div class="row"><span class="vmini">${last}</span><div class="g"><b>${esc(nome)}</b><small>${n}/${VB.length} construções · ${sub}</small></div><span class="mute">›</span></div></button>`}

/* tela da Vila */
function vVilaPage(){
  S.vila=S.vila||{};
  const m=vMin(),n=vBuilt(m),rk=rank(xp()),nome=S.vila.nome||'',tier=vTier(m),hoje=(DAY(dk())||{}).m||0;
  /* atributos: herói + vila */
  const st=VS.map(s=>{const h=vHero(rk),vl=vVila(n,s[2]),mx=vHero(RK.length-1)+VB.reduce((t,b)=>t+b[s[2]]*VM,0);return{ic:s[0],nm:s[1],h,v:vl,mx}});
  const tot=st.reduce((t,x)=>t+x.h+x.v,0);
  const head=`<div class="card hero-m"><div class="row"><div>${heroImg(rk,78)}</div><div class="g"><small>${tier} de ${RK[rk][0]}</small>
    <input class="vnome" id="vn" value="${esc(nome)}" placeholder="Dê um nome à sua vila" maxlength="30" onchange="vilaNome(this.value)" aria-label="Nome da vila">
    <small>${hm(Math.round(m))} estudadas · ${n}/${VB.length} construções</small></div></div></div>`;
  const scene=`<div class="card vscene">${vScene(n,m)}<small class="mute" style="display:block;margin-top:8px">Cada hora estudada constrói a sua vila. A floresta cresce ao redor.</small></div>`;
  let next;
  if(n<VB.length){
    const b=VB[n],pv=VB[n-1][0]*60,falta=Math.max(1,Math.ceil(b[0]*60-m));
    next=`<div class="card"><small class="mute">EM OBRAS</small><div class="row" style="margin:8px 0"><span class="vbig">${b[1]}</span><div class="g"><b>${b[2]}</b><small style="display:block">${vBonus(b)||'—'}</small></div></div>${bar(pct(m-pv,b[0]*60-pv),'#fbbf24')}
      <small style="display:block;margin-top:8px">Faltam ${hm(falta)} de estudo · hoje você já estudou ${hm(hoje)}</small>
      <button class="btn kgo" onclick="stab('c')">▶ Estudar para construir</button></div>`;
  }else next=`<div class="card hero-m"><b>🏰 Vila completa!</b><small style="display:block;margin-top:6px">Você construiu tudo. Continue estudando para manter sua vila e seu herói fortes.</small></div>`;
  const stats=`<div class="card"><div class="row"><div class="g"><small class="mute">FORÇA TOTAL (HERÓI + VILA)</small></div><b class="vforce">${tot}</b></div>
    ${st.map(x=>`<div class="vst"><div class="row"><span>${x.ic} ${x.nm}</span><span class="g"></span><b>${x.h+x.v}</b></div><div class="vbar"><i style="width:${pct(x.h,x.mx)}%;background:var(--acc)"></i><i style="width:${pct(x.v,x.mx)}%;background:#f59e0b"></i></div><small class="mute">${x.h} herói + ${x.v} vila</small></div>`).join('')}
    <small class="mute" style="display:block;margin-top:10px"><span class="vdot" style="background:var(--acc)"></span> Herói (sobe com o rank) &nbsp; <span class="vdot" style="background:#f59e0b"></span> Vila (sobe com as horas de estudo)</small></div>`;
  const list=`<h2 class="sec">Construções</h2><div class="vgrid">${VB.map((b,i)=>{const ok=i<n;return`<div class="vit${ok?'':' lk'}"><b>${b[1]}</b><span>${b[2]}</span><small>${ok?(vBonus(b)||'—'):b[0]+'h de estudo'}</small></div>`}).join('')}</div>`;
  return head+scene+next+stats+list}
