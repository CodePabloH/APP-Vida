/* Servidor de desenvolvimento do Mapa da Vida (sem instalar nada, só precisa do Node.js).
   Uso:  node dev-server.js   (ou: npm start, ou clique em iniciar.bat no Windows)
   - Abre o editor com a moldura do celular no navegador (editor.html).
   - Recarrega sozinho toda vez que você salva um arquivo do projeto.
   - Mostra também o endereço para abrir no celular de verdade (mesmo Wi-Fi). */
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),{exec}=require('child_process');
const ROOT=__dirname,PORT=+process.env.PORT||5173;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
const LIVE='<script>(function(){try{var e=new EventSource("/__events");e.onmessage=function(m){if(m.data==="reload")location.reload()}}catch(x){}})()</script>';
const clients=new Set();

const server=http.createServer((req,res)=>{
  const url=decodeURIComponent((req.url||'/').split('?')[0]);
  if(url==='/__events'){
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store',Connection:'keep-alive'});
    res.write('retry: 800\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;
  }
  // o editor grava aqui os 4 arquivos do app; só aceita pedidos vindos deste mesmo computador
  const sm=url.match(/^\/__save\/([\w.-]+)$/);
  if(sm){
    const ok=['index.html','style.css','app.js','estudos.js'].includes(sm[1])&&req.method==='POST'&&/^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(req.socket.remoteAddress||'');
    if(!ok){res.writeHead(403);res.end('Proibido');return}
    const parts=[];req.on('data',c=>parts.push(c));req.on('end',()=>{fs.writeFile(path.join(ROOT,sm[1]),Buffer.concat(parts),e=>{res.writeHead(e?500:200);res.end(e?'erro':'ok')})});return;
  }
  const rel=url==='/'?'index.html':url.replace(/^\/+/,'');
  const file=path.join(ROOT,rel);
  if(!file.startsWith(ROOT+path.sep)||/(^|[\\/])\./.test(rel)){res.writeHead(403);res.end('Proibido');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Não encontrado: '+url);return}
    const ext=path.extname(file).toLowerCase();
    // o app (index.html) recebe o código que recarrega a página quando um arquivo muda
    if(path.basename(file)==='index.html')data=Buffer.from(data.toString('utf8').replace('</body>',LIVE+'</body>'));
    res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  });
});

let t=null;
fs.watch(ROOT,(ev,name)=>{
  if(!name||/^\./.test(name)||/\.(zip|bak)$/i.test(name)||name==='node_modules')return;
  clearTimeout(t);t=setTimeout(()=>{console.log('  ↻ alterado:',name);clients.forEach(c=>c.write('data: reload\n\n'))},80);
});

server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`A porta ${PORT} já está em uso. Feche o outro servidor ou rode com outra porta (PORT=3000 node dev-server.js).`:e.message);process.exit(1)});
server.listen(PORT,'0.0.0.0',()=>{
  const lan=[].concat(...Object.values(os.networkInterfaces())).filter(i=>i.family==='IPv4'&&!i.internal).map(i=>i.address);
  console.log('\n  Mapa da Vida rodando\n');
  console.log('  Editor + celular   : http://localhost:'+PORT+'/editor.html');
  console.log('  App puro           : http://localhost:'+PORT+'/');
  lan.forEach(a=>console.log('  No seu celular     : http://'+a+':'+PORT+'/   (mesmo Wi-Fi do computador)'));
  console.log('\n  Edite no editor (Ctrl+S salva no projeto) ou no seu programa de código: a tela atualiza sozinha. Ctrl+C para parar.\n');
  if(!process.env.NO_OPEN){const u='http://localhost:'+PORT+'/editor.html';exec(process.platform==='win32'?`start "" "${u}"`:process.platform==='darwin'?`open "${u}"`:`xdg-open "${u}"`,()=>{})}
});
