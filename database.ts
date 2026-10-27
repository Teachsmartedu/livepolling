import { Pool, types } from 'pg';
types.setTypeParser(20, value=>Number(value));
export type Executor={query:(sql:string,params?:any[])=>Promise<{rows:any[],rowCount?:number|null}>,connect?:()=>Promise<any>};
const tableNames='sessions|polls|participants|responses|votes|teacher_access';
export function postgresSQL(sql:string){let i=0;return sql.replace(new RegExp(`\\b(FROM|JOIN|INTO|UPDATE)\\s+(${tableNames})\\b`,'gi'),(_,keyword,name)=>`${keyword} teachsmart.${name}`).replace(/\?/g,()=>`$${++i}`);}
export function databaseAdapter(executor:Executor){
 class Statement{sql:string;params:any[];constructor(sql:string,params:any[]=[]){this.sql=sql;this.params=params;}bind(...params:any[]){return new Statement(this.sql,params);}async query(client:Executor=executor){return client.query(postgresSQL(this.sql),this.params);}async first(){return (await this.query()).rows[0]||null;}async all(){return {results:(await this.query()).rows};}async run(){return {meta:{changes:(await this.query()).rowCount||0}};}}
 return {prepare:(sql:string)=>new Statement(sql),async batch(statements:Statement[]){const client=executor.connect?await executor.connect():executor;try{await client.query('BEGIN');const out=[];for(const statement of statements)out.push(await statement.query(client));await client.query('COMMIT');return out;}catch(e){await client.query('ROLLBACK');throw e;}finally{if('release' in client)client.release();}}};
}
let pool:Pool|undefined;
export async function getDatabase(){if(!process.env.DATABASE_URL)throw Error('SETUP_REQUIRED');pool??=new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,allowExitOnIdle:true,ssl:{rejectUnauthorized:true}});return databaseAdapter(pool);}
