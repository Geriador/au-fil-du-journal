import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare, convertV4MiniflareOptions} from 'miniflare';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const origin='https://geriador.github.io';
const code='classe-exemple-test-2026';
const compiled=await build({entryPoints:['server/worker.mjs'],bundle:true,write:false,format:'esm',platform:'neutral'});
const script=compiled.outputFiles[0].text;
const validBody=()=>({version:1,corpusVersion:'1.0.0',message:'Tu avais peur dans cette cachette ?',history:[]});
const validResult=(id='sentiments',usage=true)=>({status:'completed',...(usage?{usage:{input_tokens:4000,output_tokens:20}}:{}),output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({replyId:id,includeFollowUp:true})}]}]});

async function fixture(overrides={},persist) {
  const calls=[];
  let provider=()=>Response.json(validResult());
  const mf=new Miniflare(convertV4MiniflareOptions({
    modules:true,script,name:'anne-frank-test',compatibilityDate:'2026-09-28',cf:false,
    durableObjects:{CLASSROOM:{className:'Classroom',useSQLite:true}},
    ...(persist?{resourcePersistencePath:persist}:{}),
    bindings:{ENABLE_AI:'true',ALLOWED_ORIGINS:origin,OPENAI_API_KEY:'fake-test-key-never-billed',CLASS_ACCESS_CODE:code,SESSION_SECRET:'test-secret-32-characters-minimum-123456',...overrides},
    outboundService:async request=>{
      assert.equal(request.url,'https://api.openai.com/v1/responses');
      calls.push(await request.json());
      return provider();
    }
  }));
  const request=(path,body,token='',other={})=>mf.dispatchFetch('https://worker.test'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(other.headers||{})},body:JSON.stringify(body)});
  async function login(){const result=await request('/session',{code});assert.equal(result.status,200,await result.clone().text());return (await result.json()).token;}
  return {mf,calls,request,login,setProvider(fn){provider=fn;}};
}

test('Code de classe, session signée, validation et absence d’appel non autorisé',async t=>{
  const f=await fixture();t.after(()=>f.mf.dispose());
  assert.equal((await f.request('/session',{code:'incorrect'})).status,401);
  assert.equal((await f.request('/dialogue',validBody())).status,401);
  assert.equal((await f.request('/session',{code},'',{headers:{Origin:'https://inconnu.test'}})).status,403);
  const token=await f.login();
  assert.equal((await f.request('/dialogue',validBody(),token+'x')).status,401);
  assert.equal((await f.request('/dialogue',{...validBody(),message:'x'.repeat(1001)},token)).status,400);
  assert.equal((await f.request('/dialogue',{...validBody(),corpusVersion:'autre'},token)).status,409);
  const local=await f.request('/dialogue',{...validBody(),message:'Qui est Kitty ?'},token);
  assert.equal(local.status,200);assert.equal((await local.json()).replyId,'kitty');
  assert.equal(f.calls.length,0);
  const assisted=await f.request('/dialogue',validBody(),token);
  assert.equal(assisted.status,200,await assisted.clone().text());
  assert.equal((await assisted.json()).replyId,'sentiments');
  assert.equal(f.calls.length,1);
  assert.equal(f.calls[0].store,false);
  assert.equal(f.calls[0].max_output_tokens,128);
  assert.equal(f.calls[0].text.format.strict,true);
});

test('Les erreurs fournisseur et identifiants inventés sont refusés sans réessai payant',async t=>{
  const f=await fixture();t.after(()=>f.mf.dispose());const token=await f.login();
  f.setProvider(()=>Response.json(validResult('invention')));
  assert.equal((await f.request('/dialogue',validBody(),token)).status,503);
  f.setProvider(()=>Response.json({status:'incomplete',output:[]}));
  assert.equal((await f.request('/dialogue',validBody(),token)).status,503);
  f.setProvider(()=>new Response('temporarily unavailable',{status:429}));
  assert.equal((await f.request('/dialogue',validBody(),token)).status,429);
  assert.equal(f.calls.length,3);
});

test('60 sessions simultanées indépendantes, même origine et même réseau',async t=>{
  const f=await fixture();t.after(()=>f.mf.dispose());
  const tokens=await Promise.all(Array.from({length:60},()=>f.login()));
  assert.equal(new Set(tokens).size,60);
  const responses=await Promise.all(tokens.map(token=>f.request('/dialogue',validBody(),token)));
  for (const response of responses) assert.equal(response.status,200,await response.clone().text());
  assert.equal(f.calls.length,60);
});

test('Le quota persiste après un redémarrage du service',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'anne-frank-quota-'));
  let f;
  try {
    f=await fixture({DAILY_REQUEST_LIMIT:'1'},directory);
    const token=await f.login();
    assert.equal((await f.request('/dialogue',validBody(),token)).status,200);
    await f.mf.dispose();f=null;
    f=await fixture({DAILY_REQUEST_LIMIT:'1'},directory);
    const second=await f.login();
    assert.equal((await f.request('/dialogue',validBody(),second)).status,429);
    assert.equal(f.calls.length,0);
  } finally {if(f)await f.mf.dispose();await rm(directory,{recursive:true,force:true});}
});

test('Les réservations concurrentes empêchent de dépasser le budget configuré',async t=>{
  const f=await fixture({MONTHLY_BUDGET_CENTS:'1'});t.after(()=>f.mf.dispose());
  // Missing usage: the full reservation must remain after the call.
  f.setProvider(()=>Response.json(validResult('sentiments',false)));
  const tokens=await Promise.all(Array.from({length:6},()=>f.login()));
  const responses=await Promise.all(tokens.map(token=>f.request('/dialogue',validBody(),token)));
  assert.ok(responses.some(r=>r.status===429));
  assert.ok(f.calls.length>=1,'le fournisseur simulé a réellement été appelé');
  assert.ok(f.calls.length<=2,'budget de 0,01 USD respecté avant les appels');
});

test('Un service désactivé ne transmet rien au fournisseur',async t=>{
  const f=await fixture({ENABLE_AI:'false'});t.after(()=>f.mf.dispose());
  assert.equal((await f.request('/session',{code})).status,503);
  assert.equal(f.calls.length,0);
});
