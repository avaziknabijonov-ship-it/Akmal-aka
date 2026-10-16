import {getDb} from '../../../db/index';
import {leads} from '../../../db/schema';
export async function POST(req:Request){
 try{if(req.headers.get('origin') && req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Недопустимый источник запроса'},{status:403});
 if(Number(req.headers.get('content-length')||0)>4096)return Response.json({error:'Слишком большой запрос'},{status:413});
 const b=await req.json() as Record<string,unknown>;const name=String(b.name||'').trim(),phone=String(b.phone||'').trim(),program=String(b.program||'').trim();
 if(name.length<2||name.length>80||!/^\+?[0-9 ()-]{9,22}$/.test(phone)||phone.replace(/\D/g,'').length<9||!program||program.length>100||b.consent!=='on')return Response.json({error:'Проверьте имя, телефон и согласие.'},{status:400});
 const id=crypto.randomUUID();await getDb().insert(leads).values({id,name,phone,program,createdAt:new Date().toISOString()});
 return Response.json({ok:true,id});
 }catch{return Response.json({error:'Не удалось сохранить заявку. Попробуйте ещё раз.'},{status:503})}
}
