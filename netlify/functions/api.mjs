import {getStore} from "@netlify/blobs";
const st=()=>getStore("apex"),today=()=>new Date().toISOString().slice(0,10);
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const DEF=()=>({settings:{},fees:[{n:"Registration fee",a:5000},{n:"Monthly training fee",a:10000},{n:"Kit",a:15000}],schedule:[{d:"Tuesday",t:"4:00 pm"},{d:"Thursday",t:"4:00 pm"},{d:"Saturday",t:"8:30 am"}],news:[{id:1,title:"Registration is open",text:"New players can now register for a trial.",date:today()}],photos:[],players:[],pays:[],products:[{"id":"d1","name":"Academy jersey","price":15000,"oldPrice":25000,"sizes":"S,M,L,XL","img":false},{"id":"d2","name":"Match shorts","price":6000,"sizes":"S,M,L,XL","img":false},{"id":"d3","name":"Training tracksuit","price":22000,"sizes":"S,M,L,XL","img":false},{"id":"d4","name":"Football boots","price":25000,"sizes":"38,39,40,41,42,43,44,45","img":false},{"id":"d5","name":"Shin guards","price":4000,"sizes":"S,M,L","img":false},{"id":"d6","name":"Football socks","price":2500,"sizes":"","img":false},{"id":"d7","name":"Goalkeeper gloves","price":9000,"sizes":"6,7,8,9,10","img":false},{"id":"d8","name":"Training ball","price":10000,"sizes":"","img":false},{"id":"d9","name":"Kit bag","price":8000,"sizes":"","img":false},{"id":"d10","name":"Water bottle","price":2500,"sizes":"","img":false},{"id":"d11","name":"Training bib","price":2000,"sizes":"","img":false}],orders:[],next:0});
const okImg=x=>typeof x==="string"&&/^data:image\/(jpeg|png|webp);base64,/.test(x)&&x.length<3e6;
const KEYS=["wa","bankName","acctNo","acctName","phone","address","tagline"];
export default async(req)=>{
 const u=new URL(req.url),p=u.pathname.replace(/^\/api\//,"");
 try{
  if(req.method==="GET"&&p==="photo"){
   const id=(u.searchParams.get("id")||"").replace(/[^\w-]/g,""),d=await st().get("p-"+id);
   if(!d)return new Response("",{status:404});
   return new Response(Buffer.from(d.slice(d.indexOf(",")+1),"base64"),{headers:{"content-type":d.slice(5,d.indexOf(";")),"cache-control":"public,max-age=3600"}});
  }
  const s=Object.assign(DEF(),await st().get("state",{type:"json"})||{});
  if(p==="site"){const{players,pays,orders,code,next,...pub}=s;return J(pub)}
  const b=await req.json().catch(()=>({}));
  if(p==="register"){
   const n=String(b.name||"").trim().slice(0,80),ph=String(b.phone||"").trim().slice(0,30);
   if(!n||!ph)return J({error:"Name and phone are required"},400);
   const id="AE-"+String(s.next=(s.next||0)+1).padStart(4,"0");
   s.players.push({id,name:n,age:String(b.age||"").slice(0,3),grp:String(b.grp||"").slice(0,30),par:String(b.par||"").slice(0,80),phone:ph,pos:String(b.pos||"").slice(0,30),st:"Trial",date:today()});
   await st().setJSON("state",s);return J({id});
  }
  if(p==="pay"){
   const pl=s.players.find(x=>x.id===b.pid),f=s.fees.find(x=>x.n===b.type);
   if(!pl)return J({error:"Player ID not found. Register first."},404);
   if(!f)return J({error:"Choose what you are paying for"},400);
   const y={ref:"R"+Date.now().toString(36).toUpperCase(),pid:pl.id,pname:pl.name,type:f.n,amt:f.a,method:b.method==="Cash at training"?b.method:"Bank transfer",st:"Pending",date:today()};
   s.pays.push(y);await st().setJSON("state",s);return J(y);
  }
  if(p==="order"){
   const n=String(b.name||"").trim().slice(0,80),ph=String(b.phone||"").trim().slice(0,30),ad=String(b.addr||"").trim().slice(0,200);
   if(!n||!ph||!ad)return J({error:"Name, phone and address are required"},400);
   const items=(Array.isArray(b.items)?b.items:[]).slice(0,30).map(i=>{const pr=s.products.find(x=>x.id===i.id);return pr&&{id:pr.id,name:pr.name,price:pr.price,size:String(i.size||"").slice(0,20),qty:Math.min(99,Math.max(1,parseInt(i.qty)||1))}}).filter(Boolean);
   if(!items.length)return J({error:"Your cart is empty"},400);
   const o={ref:"O"+Date.now().toString(36).toUpperCase(),name:n,phone:ph,addr:ad,items,total:items.reduce((t,i)=>t+i.price*i.qty,0),delivery:0,method:b.method==="Cash at training"?b.method:"Bank transfer",st:"Pending",date:today()};
   s.orders.push(o);await st().setJSON("state",s);return J(o);
  }
  if(p==="admin"){
   const MC=s.code||process.env.ADMIN_CODE||"APEX2026",master=b.code===MC,staff=!master&&!!s.staffCode&&b.code===s.staffCode;
   if(!master&&!staff){await new Promise(r=>setTimeout(r,800));return J({error:"Wrong admin code"},401)}
   const PM={player:"players",confirm:"payments",order:"orders",addNews:"news",delNews:"news",addPhoto:"gallery",delPhoto:"gallery"},perms=s.perms||{players:true,news:true,gallery:true};
   if(staff&&b.action!=="load"&&(!PM[b.action]||!perms[PM[b.action]]||(b.action==="player"&&(b.data||{}).del)))return J({error:"Only the master admin can do that"},403);
   const d=b.data||{};
   switch(b.action){
    case"load":break;
    case"settings":KEYS.forEach(k=>{if(k in d)s.settings[k]=String(d[k]).slice(0,300)});break;
    case"lists":s.fees=(d.fees||[]).map(f=>({n:String(f.n).slice(0,60),a:Number(f.a)||0})).filter(f=>f.n);s.schedule=(d.schedule||[]).map(x=>({d:String(x.d).slice(0,30),t:String(x.t).slice(0,30)})).filter(x=>x.d);break;
    case"addNews":s.news.unshift({id:Date.now(),title:String(d.title||"").slice(0,120),text:String(d.text||"").slice(0,1000),date:today()});break;
    case"delNews":s.news=s.news.filter(x=>x.id!==d.id);break;
    case"addPhoto":{if(!okImg(d.img))return J({error:"Invalid image"},400);const id="g"+Date.now().toString(36);await st().set("p-"+id,d.img);s.photos.push({id});break}
    case"delPhoto":s.photos=s.photos.filter(x=>x.id!==d.id);await st().delete("p-"+String(d.id).replace(/[^\w-]/g,""));break;
    case"hero":if(!okImg(d.img))return J({error:"Invalid image"},400);await st().set("p-hero",d.img);s.settings.heroV=Date.now();break;
    case"player":s.players=d.del?s.players.filter(x=>x.id!==d.id):s.players.map(x=>x.id===d.id?{...x,st:d.st}:x);break;
    case"confirm":s.pays=s.pays.map(x=>x.ref===d.ref?{...x,st:"Confirmed"}:x);break;
    case"code":if(String(d.code).length<6)return J({error:"Use at least 6 characters"},400);s.code=String(d.code);break;
    case"addProduct":{const id="pr"+Date.now().toString(36);if(d.img){if(!okImg(d.img))return J({error:"Invalid image"},400);await st().set("p-"+id,d.img)}s.products.push({id,name:String(d.name||"").slice(0,80),price:Number(d.price)||0,oldPrice:Number(d.old)||0,sizes:String(d.sizes||"").slice(0,80),img:!!d.img});break}
    case"seedKit":DEF().products.forEach(p=>{if(!s.products.some(x=>x.name===p.name))s.products.push(p)});break;
    case"productPhoto":{if(!okImg(d.img))return J({error:"Invalid image"},400);const pid=String(d.id).replace(/[^\w-]/g,"");await st().set("p-"+pid,d.img);s.products=s.products.map(x=>x.id===d.id?{...x,img:true}:x);break}
    case"staff":{const sc=String(d.code||"");if(sc){if(sc.length<6||sc===MC)return J({error:"Staff code must be at least 6 characters and different from the admin code"},400);s.staffCode=sc}if(d.clear)delete s.staffCode;if(d.perms)s.perms={players:!!d.perms.players,payments:!!d.perms.payments,orders:!!d.perms.orders,news:!!d.perms.news,gallery:!!d.perms.gallery};break}
    case"setPrice":s.products=s.products.map(x=>x.id===d.id?{...x,price:Number(d.price)||0,oldPrice:Number(d.old)||0}:x);break;
    case"delProduct":s.products=s.products.filter(x=>x.id!==d.id);await st().delete("p-"+String(d.id).replace(/[^\w-]/g,""));break;
    case"order":s.orders=s.orders.map(x=>x.ref===d.ref&&["Pending","Confirmed","Delivered"].includes(d.st)?{...x,st:d.st}:x);break;
    default:return J({error:"Unknown action"},400);
   }
   if(b.action!=="load")await st().setJSON("state",s);
   const{code:_c,staffCode:_k,...out}=s;out.role=master?"master":"staff";out.perms=perms;out.hasStaff=!!s.staffCode;
   if(staff){if(!perms.players)out.players=[];if(!perms.payments)out.pays=[];if(!perms.orders)out.orders=[];out.settings={}}
   return J(out);
  }
 }catch(e){return J({error:"Server error"},500)}
 return J({error:"Not found"},404);
};
export const config={path:"/api/*"};
