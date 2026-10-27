import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {databaseAdapter,postgresSQL} from '../lib/database';
import {createLiveHandlers} from '../lib/live-handler';
import {tally} from '../app/model';
test('all eight poll types use PostgreSQL and protect teacher/student boundaries',async()=>{
const pg=new PGlite();await pg.exec(fs.readFileSync('database/setup.sql','utf8'));const d=databaseAdapter({query:async(sql,params)=>{const r=await pg.query(sql,params);return {rows:r.rows,rowCount:r.affectedRows??r.rows.length};}});let user:{userId:string,email:string}|null=null;
const {GET,POST}=createLiveHandlers({getDatabase:async()=>d,getTeacherUser:async()=>user});
async function call(action:string,data:any=null,params:any={},teacher=false,token:string|null=null,status=200){user=teacher?{userId:'teacher-one',email:'teacher@example.test'}:null;const r=await (data?POST:GET)(new Request('https://teachsmart.example/api/live?'+new URLSearchParams({action,...params}),{method:data?'POST':'GET',headers:{'Content-Type':'application/json','oai-authenticated-user-id':'forged-user',...(token?{'x-participant-token':token}:{})},...(data?{body:JSON.stringify({action,...data})}:{})}));const b=await r.json();assert.equal(r.status,status,JSON.stringify({action,b}));return b;}
const {id:sid}=await call('create',{title:'Constitution Era'},{},true);const {session}=await call('teacher',null,{id:sid},true);const tokens=[];for(const name of ['Student One','Student Two','Student Three'])tokens.push((await call('join',{code:session.code,name})).token);
assert.deepEqual(await call('list'),{signedIn:false,sessions:[]});await call('teacher',null,{id:sid},false,null,403);await call('add',{session:sid,type:'text',question:'Blocked'},{},false,null,403);await call('join',{code:session.code,name:' '},{},false,null,400);
const config={options:['A','B','C'],max:5};const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jFOsAAAAASUVORK5CYII=';
let last='';for(const type of ['multiple','cloud','text','qa','ideas','ranking','rating','pin']){
const {id:p}=await call('add',{session:sid,type,question:'Question '+type,config:{...config,...(type==='pin'?{image}:{})}},{},true);last=p;await call('activate',{session:sid,poll:p},{},true);
const values:any={multiple:['A','B','B'],cloud:['Freedom','FREEDOM',' freedom '],text:['One','Two','Three'],qa:['Why?','When?','How?'],ideas:['One idea','Another idea','A third idea'],ranking:[['A','C','B'],['B','A','C'],['C','B','A']],rating:[3,4,5],pin:[{x:.1,y:.2},{x:.5,y:.5},{x:.9,y:.8}]};for(let i=0;i<3;i++)await call('respond',{poll:p,value:values[type][i]},{},false,tokens[i]);
const pub=await call('present',null,{key:session.present});const priv=await call('teacher',null,{id:sid,poll:p},true);const mine=await call('join',null,{code:session.code},false,tokens[0]);assert.equal(pub.responses.length,3);assert.equal(priv.responses.length,3);assert.equal(mine.mine.length,1);assert.ok(pub.responses.every((r:any)=>!('name' in r)&&!('participant' in r)));assert.ok(priv.responses.every((r:any)=>r.name&&r.participant));assert.ok(!JSON.stringify(mine).includes('Student One'));
if(type==='cloud'){assert.ok(pub.responses.every((r:any)=>r.value==='freedom'));assert.deepEqual(tally(pub.poll,pub.responses),[{label:'freedom',n:3}]);}
if(['qa','ideas'].includes(type)){const rid=pub.responses[0].id;await call('vote',{poll:p,response:rid},{},false,tokens[1]);assert.equal((await call('present',null,{key:session.present})).responses.find((r:any)=>r.id===rid).votes,1);await call('vote',{poll:p,response:rid},{},false,tokens[1]);assert.equal((await call('present',null,{key:session.present})).responses.find((r:any)=>r.id===rid).votes,0);for(let n=1;n<10;n++)await call('respond',{poll:p,value:'Extra '+n},{},false,tokens[0]);await call('respond',{poll:p,value:'Over limit'},{},false,tokens[0],400);}else await call('respond',{poll:p,value:values[type][0]},{},false,tokens[0],400);
const rid=pub.responses[0].id;const before=(await call('present',null,{key:session.present})).responses.length;await call('moderate',{session:sid,response:rid,hidden:true,answered:type==='qa'},{},true);assert.equal((await call('present',null,{key:session.present})).responses.length,before-1);assert.ok((await call('teacher',null,{id:sid,poll:p},true)).responses.some((r:any)=>r.id===rid&&r.hidden===1));await call('close',{session:sid,poll:p},{},true);await call('respond',{poll:p,value:values[type][0]},{},false,tokens[0],400);
console.log(type+': PostgreSQL submissions, privacy, moderation, pause and duplicate checks passed');}
const {id:other}=await call('create',{title:'Other session'},{},true);await call('teacher',null,{id:other,poll:last},true,null,404);
const {id:p}=await call('add',{session:sid,type:'rating',question:'Validation',config},{},true);await call('activate',{session:sid,poll:p},{},true);await call('respond',{poll:p,value:99},{},false,tokens[0],400);await call('respond',{poll:p,value:3},{},false,'fake-token',403);
// Concurrent duplicate insertions are blocked by the PostgreSQL UNIQUE constraint.
const participant=(await pg.query<any>('SELECT id FROM teachsmart.participants LIMIT 1')).rows[0].id;
const q='INSERT INTO teachsmart.responses(id,poll,participant,value,created,slot) VALUES($1,$2,$3,$4,$5,0) ON CONFLICT(poll,participant,slot) DO NOTHING';
const writes=await Promise.all(Array.from({length:6},(_,i)=>pg.query(q,['race-'+i,p,participant,'3',Date.now()])));assert.equal(writes.reduce((n,r)=>n+(r.affectedRows||0),0),1);
// Cross-origin writes are refused before touching the database.
const cross=await POST(new Request('https://teachsmart.example/api/live',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://other.example'},body:JSON.stringify({action:'create',title:'CSRF'})}));assert.equal(cross.status,403);
// Tables are outside the public schema, with RLS enabled.
const rls=await pg.query<any>("SELECT relrowsecurity FROM pg_class JOIN pg_namespace ON pg_namespace.oid=pg_class.relnamespace WHERE nspname='teachsmart' AND relkind='r'");assert.equal(rls.rows.length,6);assert.ok(rls.rows.every(r=>r.relrowsecurity));
await call('delete',{session:sid},{},true);assert.equal((await pg.query<any>('SELECT COUNT(*) AS n FROM teachsmart.responses')).rows[0].n,0);assert.equal((await pg.query<any>('SELECT COUNT(*) AS n FROM teachsmart.participants')).rows[0].n,0);await pg.close();
});
test('SQL adapter qualifies tables and binds values instead of interpolating input',()=>{assert.equal(postgresSQL('SELECT s.*, (SELECT COUNT(*) FROM participants p WHERE p.session=s.id) AS participants FROM sessions s WHERE owner=?'), 'SELECT s.*, (SELECT COUNT(*) FROM teachsmart.participants p WHERE p.session=s.id) AS participants FROM teachsmart.sessions s WHERE owner=$1');});
