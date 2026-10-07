import Freelah from './freelah';
import {getChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){const u=await getChatGPTUser();return <Freelah identity={u?{id:u.userId,name:u.fullName||'Minha conta',email:u.email}:null}/>}
