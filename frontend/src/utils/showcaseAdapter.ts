import type { AxiosAdapter } from 'axios';
const now = new Date().toISOString();
export const demoUser = { id: 'steliant-demo', username: 'Stephanie · Steliant', email: 'demo@steliant.example', createdAt: now };
const seed: Record<string, any[]> = {
 projects: [
  { id:'commerce', name:'Steliant Ecommerce', category:'Ecommerce', description:'Catálogo y gestión comercial', status:'ACTIVE', priority:'HIGH', budget:'45000', monthlyCost:'2500' },
  { id:'reservas', name:'Steliant Reservas', category:'Reservas', description:'Agenda y equipos de trabajo', status:'IN_DEVELOPMENT', priority:'MEDIUM', budget:'38000', monthlyCost:'1800' },
  { id:'firma', name:'Steliant Firma', category:'Servicios', description:'Experiencia digital para una firma legal', status:'COMPLETED', priority:'MEDIUM', budget:'29000', monthlyCost:'1500' }
 ].map(p=>({ tags:[], stackFrontend:['React'], stackBackend:[], stackDatabase:[], stackDevops:[], stackExternal:[], githubRepos:[], screenshots:[], domain:null, hosting:null, clientName:'Cliente de muestra', clientEmail:'demo@steliant.example', clientCompany:'Empresa de muestra', billingType:'MONTHLY', createdAt:now, updatedAt:now, userId:demoUser.id, _count:{tasks:2,credentials:0,notes:1,dbConnections:0}, _access:{role:'OWNER',canViewSecrets:true}, ...p })),
 tasks: [{ id:'task1', projectId:'commerce', title:'Revisar catálogo', description:'Prueba de navegación y productos', status:'IN_PROGRESS', priority:'HIGH', tags:[], order:0, createdAt:now, updatedAt:now, project:{name:'Steliant Ecommerce'} }, {id:'task2',projectId:'reservas',title:'Definir agenda semanal',description:'Configurar disponibilidad',status:'TODO',priority:'MEDIUM',tags:[],order:1,createdAt:now,updatedAt:now,project:{name:'Steliant Reservas'}}],
 notes: [{id:'note1',projectId:'firma',title:'Dirección visual',content:'Una experiencia elegante, clara y con animaciones sutiles.',tags:['diseño'],isPinned:true,createdAt:now,updatedAt:now,project:{name:'Steliant Firma'}}],
 credentials: [], 'db-connections': [], activity: [{ id:'a1',action:'CREATED',entity:'PROJECT',entityName:'Steliant Ecommerce',createdAt:now,user:{username:demoUser.username} }]
};
const key = 'steliant-nexo-showcase-data-v1';
let db: Record<string, any[]>; try { db = JSON.parse(localStorage.getItem(key)||'null') || seed; } catch { db = seed; }
const save = () => localStorage.setItem(key,JSON.stringify(db));
export const showcaseAdapter: AxiosAdapter = async config => {
 const parts = (config.url || '').split('?')[0].split('/').filter(Boolean);
 const [collection,id,action] = parts; const method=(config.method||'get').toLowerCase();
 let body:any = config.data; if(typeof body==='string') {try {body=JSON.parse(body)}catch{body={}}} body ||= {};
 let payload:any;
 if(collection==='auth') payload = {user:demoUser,accessToken:'showcase-local-only',refreshToken:'showcase-local-only'};
 else if(collection==='ai') payload = {data:{message:'Esta es una demostración de la interfaz del asistente. La IA real requiere conectar el servicio correspondiente.',actions:[]}};
 else if(collection==='projects' && id==='stats') payload = {data:{byStatus:Object.fromEntries(['ACTIVE','IN_DEVELOPMENT','PAUSED','COMPLETED','ARCHIVED'].map(s=>[s,db.projects.filter(p=>p.status===s).length])),byPriority:{},byCategory:{},openTasks:db.tasks.filter(t=>t.status!=='DONE').length,totalCredentials:db.credentials.length}};
 else if(action==='members') payload={data:{owner:demoUser,members:[]}};
 else if(collection==='activity') payload={data:db.activity,total:db.activity.length,page:1,totalPages:1};
 else if(db[collection]) {
  const rows=db[collection]; let item=rows.find(x=>x.id===id);
  if(method==='post') {item={...body,id:crypto.randomUUID(),createdAt:now,updatedAt:now,tags:body.tags||[],userId:demoUser.id};rows.unshift(item);save();payload={data:item};}
  else if(method==='delete') {db[collection]=rows.filter(x=>x.id!==id);save();payload={data:null};}
  else if(method==='patch'||method==='put') { if(item){Object.assign(item,body,{updatedAt:new Date().toISOString()});if(action==='pin')item.isPinned=!item.isPinned;save();} payload={data:item}; }
  else if(id) payload={data:action==='reveal'?{username:'demo',password:'solo-datos-de-muestra'}:item};
  else {const params=config.params||{};payload={data:rows.filter(x=>(!params.projectId||x.projectId===params.projectId)&&(!params.status||x.status===params.status)&&(!params.search||JSON.stringify(x).toLowerCase().includes(params.search.toLowerCase()))) };}
 } else throw new Error('Esta operación necesita el servidor del proyecto; no está habilitada en la muestra.');
 return {data:payload,status:200,statusText:'OK',headers:{},config};
};
