import {getChatGPTUser} from '../../chatgpt-auth';
import {database,snapshot,categories,activeStatus,isAdmin} from '../../../lib/freelah';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>Response.json({error},{status});
export async function GET(){try{return Response.json(await snapshot(await getChatGPTUser()),{headers:{'Cache-Control':'no-store'}})}catch{return fail('Não foi possível carregar os dados. Tente novamente.',503)}}
export async function POST(req:Request){
 try {
 const u=await getChatGPTUser();if(!u)return fail('Entre na sua conta para continuar.',401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return fail('Origem inválida.',403);
 const d:any=await req.json(), db=database(), now=new Date().toISOString(), id=crypto.randomUUID();
 const clean=(v:any,max=200)=>typeof v==='string'?v.trim().slice(0,max):'';
 await db.prepare('INSERT OR IGNORE INTO profiles (id,name) VALUES (?,?)').bind(u.userId,u.fullName||'Usuário Freelah').run();
 if(d.action==='profile'){
 const name=clean(d.name,80),city=clean(d.city,120),phone=clean(d.phone,30);if(!name||!city||!phone)return fail('Preencha nome, telefone e cidade.');
 await db.prepare('UPDATE profiles SET name=?,phone=?,city=?,bio=? WHERE id=?').bind(name,phone,city,clean(d.bio,500),u.userId).run();
 } else if(d.action==='job'){
 const title=clean(d.title,100),description=clean(d.description,2000),location=clean(d.location,150),price=Number(d.price),today=now.slice(0,10);
 if(!title||!description||!location||!categories.includes(d.category)||!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!/^\d{4}-\d{2}-\d{2}$/.test(d.expires)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)||!Number.isFinite(price)||price<=0||price>100000||d.date<today||d.expires<today||d.expires>d.date)return fail('Confira os campos, valores e datas. O prazo deve ser até a data do serviço.');
 const status=d.draft?'RASCUNHO':'PUBLICADA';
 if(d.id){const job:any=await db.prepare('SELECT * FROM jobs WHERE id=?').bind(d.id).first();if(!job||job.owner!==u.userId||['CONTRATADA','CONCLUÍDA','CANCELADA'].includes(job.status))return fail('Esta oportunidade não pode ser editada.',403);await db.prepare('UPDATE jobs SET title=?,description=?,category=?,location=?,date=?,time=?,price=?,negotiable=?,expires=?,status=? WHERE id=? AND owner=? AND status NOT IN (\'CONTRATADA\',\'CONCLUÍDA\',\'CANCELADA\')').bind(title,description,d.category,location,d.date,d.time,Math.round(price*100),d.negotiable?1:0,d.expires,status,d.id,u.userId).run();}
 else await db.prepare('INSERT INTO jobs (id,owner,title,description,category,location,date,time,price,negotiable,expires,status,created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,u.userId,title,description,d.category,location,d.date,d.time,Math.round(price*100),d.negotiable?1:0,d.expires,status,now).run();
 } else if(d.action==='interest'){
 const j:any=await db.prepare('SELECT * FROM jobs WHERE id=?').bind(d.job).first();if(!j||j.owner===u.userId||!['PUBLICADA','EM NEGOCIAÇÃO'].includes(activeStatus(j)))return fail('Esta oportunidade não aceita novos interessados.');
 const blocked=await db.prepare('SELECT id FROM blocks WHERE (owner=? AND blocked=?) OR (owner=? AND blocked=?)').bind(u.userId,j.owner,j.owner,u.userId).first();if(blocked)return fail('Não é possível entrar em contato com este usuário.',403);
 await db.prepare('INSERT OR IGNORE INTO interests (id,job,worker,created) SELECT ?,id,?,? FROM jobs WHERE id=? AND status IN (\'PUBLICADA\',\'EM NEGOCIAÇÃO\') AND expires>=?').bind(id,u.userId,now,j.id,now.slice(0,10)).run();
 } else if(['message','hire'].includes(d.action)){
 const i:any=await db.prepare('SELECT i.*,j.owner,j.status,j.expires,j.selected FROM interests i JOIN jobs j ON j.id=i.job WHERE i.id=?').bind(d.interest).first();if(!i||![i.worker,i.owner].includes(u.userId))return fail('Conversa indisponível.',403);
 if(d.action==='hire'){if(i.owner!==u.userId||!['PUBLICADA','EM NEGOCIAÇÃO'].includes(activeStatus(i)))return fail('Contratação indisponível.',403);await db.prepare('UPDATE jobs SET status=\'CONTRATADA\',selected=? WHERE id=? AND status IN (\'PUBLICADA\',\'EM NEGOCIAÇÃO\') AND expires>=?').bind(i.worker,i.job,now.slice(0,10)).run();}
 else {const content=clean(d.content,2000);if(!content)return fail('Escreva uma mensagem.');const other=i.owner===u.userId?i.worker:i.owner;const block=await db.prepare('SELECT id FROM blocks WHERE (owner=? AND blocked=?) OR (owner=? AND blocked=?)').bind(u.userId,other,other,u.userId).first();if(block)return fail('Esta conversa está bloqueada.',403);await db.batch([db.prepare('INSERT INTO messages (id,interest,sender,content,created) VALUES (?,?,?,?,?)').bind(id,i.id,u.userId,content,now),db.prepare('UPDATE jobs SET status=\'EM NEGOCIAÇÃO\' WHERE id=? AND status=\'PUBLICADA\' AND expires>=?').bind(i.job,now.slice(0,10))]);}
 } else if(['cancel','complete'].includes(d.action)){
 const j:any=await db.prepare('SELECT * FROM jobs WHERE id=?').bind(d.job).first();if(!j||j.owner!==u.userId)return fail('Ação não permitida.',403);if(d.action==='complete'&&j.status!=='CONTRATADA')return fail('Contrate alguém antes de concluir.');if(d.action==='cancel'&&['CONCLUÍDA','CANCELADA'].includes(j.status))return fail('A oportunidade já está encerrada.');await db.prepare(d.action==='complete'?'UPDATE jobs SET status=\'CONCLUÍDA\' WHERE id=? AND owner=? AND status=\'CONTRATADA\'':'UPDATE jobs SET status=\'CANCELADA\' WHERE id=? AND owner=? AND status NOT IN (\'CONCLUÍDA\',\'CANCELADA\')').bind(j.id,u.userId).run();
 } else if(d.action==='moderate'){if(!isAdmin(u))return fail('Ação não permitida.',403);const target=clean(d.target);await db.prepare('UPDATE jobs SET status=\'CANCELADA\' WHERE id=? AND status<>\'CONCLUÍDA\'').bind(target).run();
 } else if(d.action==='dismiss-report'){if(!isAdmin(u))return fail('Ação não permitida.',403);await db.prepare('DELETE FROM reports WHERE id=?').bind(clean(d.id)).run();
 } else if(d.action==='report') {const reason=clean(d.reason,1000),target=clean(d.target);if(!reason||!target)return fail('Informe o motivo.');await db.prepare('INSERT INTO reports (id,reporter,target,reason,created) VALUES (?,?,?,?,?)').bind(id,u.userId,target,reason,now).run();
 } else if(d.action==='block'){if(!clean(d.target)||d.target===u.userId)return fail('Usuário inválido.');await db.prepare('INSERT OR IGNORE INTO blocks (id,owner,blocked) VALUES (?,?,?)').bind(id,u.userId,d.target).run();
 } else if(d.action==='unblock'){await db.prepare('DELETE FROM blocks WHERE owner=? AND blocked=?').bind(u.userId,clean(d.target)).run();
 } else return fail('Ação inválida.');
 return Response.json(await snapshot(u));
 }catch(e){console.error('Freelah operation failed',e);return fail('Não foi possível salvar. Seus dados continuam no formulário; tente novamente.',503)}
}



