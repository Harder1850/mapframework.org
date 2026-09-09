import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('..', import.meta.url));
execFileSync(process.execPath,[join(root,'scripts/build.mjs')],{stdio:'inherit'});
const required=['index.html','framework/index.html','map/index.html','relational-intelligence/index.html','applications/index.html','experiments/index.html','experiments/delta/index.html','research/index.html','research/rcp/index.html','alive/index.html','library/index.html','roadmap/index.html','assets/global.css','assets/visuals/31.webp','assets/visuals/32.webp','assets/visuals/33.webp','assets/visuals/34.webp','assets/visuals/35.webp','sitemap.xml','robots.txt'];
for(const f of required) await access(join(root,'dist',f));
const home=await readFile(join(root,'dist/index.html'),'utf8');
const delta=await readFile(join(root,'dist/experiments/delta/index.html'),'utf8');
const scoring=await readFile(join(root,'dist/assets/delta-scoring.mjs'),'utf8');
const alive=await readFile(join(root,'dist/alive/index.html'),'utf8');
const failures=[];
for(const phrase of ['Reality into understanding.','Relational Intelligence','RCP','ALIVE']) if(!home.includes(phrase)) failures.push(`home missing ${phrase}`);
for(const phrase of ['Evidence status:','not empirical evidence','Appropriate escalation']) if(!delta.includes(phrase)) failures.push(`delta missing ${phrase}`);
for(const phrase of ['Meaningful-delta detection','False-delta rate','Appropriate escalation']) if(!scoring.includes(phrase)) failures.push(`scoring missing ${phrase}`);
for(const forbidden of ['exact relational data structures are','learning/decay implementation code','private test instance']) if(alive.toLowerCase().includes(forbidden.toLowerCase())) failures.push(`ALIVE leakage marker: ${forbidden}`);
const htmlFiles=[]; async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await walk(p);else if(e.name.endsWith('.html'))htmlFiles.push(p)}} await walk(join(root,'dist'));
for(const f of htmlFiles){const s=await readFile(f,'utf8');if(!s.includes('<meta name="description"') && !f.endsWith('404.html')) failures.push(`metadata missing ${f}`);if(!s.includes('Skip to content') && !f.endsWith('404.html')) failures.push(`skip link missing ${f}`)}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
const notFound=await readFile(join(root,'dist/404.html'),'utf8');
if(/http-equiv="refresh"/i.test(notFound)) throw new Error('404 must not redirect');
for(const f of htmlFiles){
  const html=await readFile(f,'utf8');
  if(!html.includes('noindex')) throw new Error(`Staging indexing guard missing: ${f}`);
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
    if(!match[1].includes('application/ld+json') && match[2].trim()) throw new Error(`Executable inline script: ${f}`);
  }
  for(const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) await access(join(root,'dist',match[1].slice(1)));
}
const config=JSON.parse(await readFile(join(root,'wrangler.jsonc'),'utf8'));
if(config.name!=='mapframework-org-staging'||config.workers_dev!==true||config.routes.length||config.d1_databases||config.r2_buckets) throw new Error('Staging deployment boundary violated');
console.log(`PASS: ${required.length} required artifacts; ${htmlFiles.length} HTML files; metadata/accessibility smoke checks; publication-firewall smoke checks.`);
