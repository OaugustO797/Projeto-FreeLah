import { env } from 'cloudflare:workers';
export const categories = ['Serviços Domésticos','Serviços Comerciais','Construção Civil','Serviços de Manutenção','Aulas Particulares'];
export const isAdmin = (user:any) => user?.email==='onofreaugusto63@gmail.com';
export function database() { if (!env.DB) throw new Error('Banco indisponível'); return env.DB; }
export const activeStatus = (job: any) => ['PUBLICADA','EM NEGOCIAÇÃO','RASCUNHO'].includes(job.status) && job.expires < new Date().toISOString().slice(0,10) ? 'EXPIRADA' : job.status;
export async function snapshot(user: any) {
 const db=database();
 const [j,p,i,m,b] = await Promise.all([db.prepare('SELECT * FROM jobs ORDER BY created DESC').all(),db.prepare('SELECT id,name,city,bio FROM profiles').all(),user?db.prepare('SELECT i.* FROM interests i JOIN jobs j ON j.id=i.job WHERE i.worker=? OR j.owner=?').bind(user.userId,user.userId).all():Promise.resolve({results:[]}),user?db.prepare('SELECT m.* FROM messages m JOIN interests i ON i.id=m.interest JOIN jobs j ON j.id=i.job WHERE i.worker=? OR j.owner=? ORDER BY m.created').bind(user.userId,user.userId).all():Promise.resolve({results:[]}),user?db.prepare('SELECT blocked FROM blocks WHERE owner=?').bind(user.userId).all():Promise.resolve({results:[]})]);
 const own = user?await db.prepare('SELECT * FROM profiles WHERE id=?').bind(user.userId).first():null;
 const reports=isAdmin(user)?(await db.prepare('SELECT * FROM reports ORDER BY created DESC').all()).results:[];
 return { user:user?{id:user.userId,name:own?.name||user.fullName||'Minha conta',email:user.email,phone:own?.phone||'',city:own?.city||'',bio:own?.bio||'',admin:isAdmin(user)}:null, jobs:j.results.filter((x:any)=>x.status!=='RASCUNHO'||x.owner===user?.userId).map((x:any)=>({...x,status:activeStatus(x)})),profiles:p.results,interests:i.results,messages:m.results,blocks:b.results.map((x:any)=>x.blocked),reports};
}
