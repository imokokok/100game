import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// Read-only smoke test. Run against a started build or the deployed Vercel site.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=process.argv[2]||'http://localhost:3017';
const release='production-20260928';
const checks=[];
for(const locale of ['zh','en']){
 for(const route of ['/','/process','/survey']){
  const response=await fetch(new URL(route,base),{headers:{cookie:`hundred-language=${locale}`}});
  assert.equal(response.status,200,route);
  assert.equal(response.headers.get('x-100game-release'),release,`Wrong deployment at ${base}`);
  const html=await response.text();
  assert.ok(html.includes(`<html lang="${locale==='zh'?'zh-CN':'en'}"`),`SSR language ${route}`);
  if(route==='/process'){
   assert.ok(html.includes('id="week-3"'),'Week 3 is missing');
   assert.ok(html.includes('2026.09.25'),'September 25 records are missing');
  }
  checks.push(`${route} [${locale}]`);
 }
}
const source=await readFile(path.join(root,'app/process-archive.tsx'),'utf8');
const files=[...new Set(source.match(/\/process\/[a-z0-9-]+\.(?:docx|xlsx|xls|pdf|txt|jpg)/g))];
for(let offset=0;offset<files.length;offset+=4){
 await Promise.all(files.slice(offset,offset+4).map(async file=>{
  const response=await fetch(new URL(file,base));
  assert.equal(response.status,200,file);
  const actual=Buffer.from(await response.arrayBuffer());
  const expected=await readFile(path.join(root,'public',file));
  assert.ok(actual.equals(expected),`File content mismatch: ${file}`);
 }));
}
for(const route of ['/api/groups','/api/lead/responses']){
 const response=await fetch(new URL(route,base));
 assert.equal(response.status,401,`Unauthenticated access must be refused: ${route}`);
 checks.push(`${route} [unauthenticated: 401]`);
}
console.log(JSON.stringify({base,release,checks,archiveFilesVerified:files.length,result:'PASS'},null,2));
