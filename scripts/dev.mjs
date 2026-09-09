import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, relative, sep, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import './build.mjs';
import worker from '../src/worker.js';
const root=fileURLToPath(new URL('../dist/',import.meta.url)),port=process.env.PORT||4173;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const assets = {async fetch(request) {
  const url = new URL(request.url);
  let path;
  try { path = decodeURIComponent(url.pathname); } catch { return new Response('Bad request',{status:400}); }
  let file = resolve(root, '.' + path);
  const rel = relative(root,file);
  if (rel==='..' || rel.startsWith('..'+sep) || isAbsolute(rel)) return new Response('Forbidden',{status:403});
  try {
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith('/')) return Response.redirect(url.origin+url.pathname+'/'+url.search,308);
      file = resolve(file,'index.html');
    }
    return new Response(await readFile(file),{headers:{'Content-Type':types[extname(file)]||'application/octet-stream'}});
  } catch {
    return new Response(await readFile(resolve(root,'404.html')),{status:404,headers:{'Content-Type':'text/html; charset=utf-8'}});
  }
}};
createServer(async(req,res)=>{
  try {
    const request = new Request('http://localhost:'+port+req.url,{method:req.method});
    const response = await worker.fetch(request,{ASSETS:assets});
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {res.writeHead(500);res.end('Internal error');}
}).listen(port,'127.0.0.1',()=>console.log(`http://localhost:${port}`));
