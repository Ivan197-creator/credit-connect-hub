const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),https=require('https');
const ROOT=__dirname,PUBLIC=path.join(ROOT,'public'),DATA=path.join(ROOT,'data','clicks.json');
const PORT=process.env.PORT||3000,PIXEL_ID=process.env.META_PIXEL_ID||'1629476742086530',TOKEN=process.env.META_CAPI_TOKEN||'';
function readDb(){try{return JSON.parse(fs.readFileSync(DATA,'utf8'))}catch{return {}}}function writeDb(db){fs.writeFileSync(DATA,JSON.stringify(db,null,2))}
function json(res,code,obj){res.writeHead(code,{'content-type':'application/json'});res.end(JSON.stringify(obj))}
function body(req){return new Promise((ok,no)=>{let s='';req.on('data',c=>{s+=c;if(s.length>1e6)req.destroy()});req.on('end',()=>{try{ok(JSON.parse(s||'{}'))}catch(e){no(e)}})})}
function hash(v){return crypto.createHash('sha256').update(String(v)).digest('hex')}
function capi(event){return new Promise((resolve,reject)=>{if(!TOKEN)return reject(new Error('META_CAPI_TOKEN is not configured'));const payload=JSON.stringify({data:[event]});const req=https.request({hostname:'graph.facebook.com',path:`/v24.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(TOKEN)}`,method:'POST',headers:{'content-type':'application/json','content-length':Buffer.byteLength(payload)}},r=>{let s='';r.on('data',c=>s+=c);r.on('end',()=>r.statusCode>=200&&r.statusCode<300?resolve(s):reject(new Error(`Meta ${r.statusCode}: ${s}`)))});req.on('error',reject);req.write(payload);req.end()})}
const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(req.method==='POST'&&u.pathname==='/api/track'){
    try{const p=await body(req);if(!p.click_id)return json(res,400,{ok:false});const db=readDb();db[p.click_id]={...p,client_ip:(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim(),client_user_agent:req.headers['user-agent']||'',stored_at:Date.now()};writeDb(db);return json(res,200,{ok:true})}catch(e){return json(res,400,{ok:false})}
  }
  if(u.pathname==='/api/pdl-postback'){
    const subid=u.searchParams.get('subid')||'',status=u.searchParams.get('lead_status')||'';
    if(status&&status!=='approved')return json(res,200,{ok:true,ignored:'status'});
    const db=readDb(),c=db[subid];if(!c)return json(res,404,{ok:false,error:'unknown subid'});
    const tx=u.searchParams.get('transaction_id')||u.searchParams.get('lead_id')||subid;
    const eventId='pdl_'+tx;
    if(c.sent_events?.includes(eventId))return json(res,200,{ok:true,deduplicated:true});
    const user_data={client_ip_address:c.client_ip,client_user_agent:c.client_user_agent,external_id:[hash(subid)]};
    if(c.fbc)user_data.fbc=c.fbc;if(c.fbp)user_data.fbp=c.fbp;
    const event={event_name:'Lead',event_time:Math.floor(Date.now()/1000),event_id:eventId,event_source_url:c.landing_url,action_source:'website',user_data};
    try{await capi(event);c.sent_events=[...(c.sent_events||[]),eventId];writeDb(db);return json(res,200,{ok:true,event_id:eventId})}catch(e){return json(res,500,{ok:false,error:e.message})}
  }
  let file=u.pathname==='/'?'index.html':u.pathname.replace(/^\//,'');file=path.normalize(file).replace(/^\.\.(\/|\\|$)/,'');const fp=path.join(PUBLIC,file);if(!fp.startsWith(PUBLIC))return json(res,403,{error:'forbidden'});
  fs.readFile(fp,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found')}const ext=path.extname(fp);const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};res.writeHead(200,{'content-type':types[ext]||'application/octet-stream'});res.end(d)})
});
server.listen(PORT,()=>console.log(`Credit Connect Hub: http://localhost:${PORT}`));
