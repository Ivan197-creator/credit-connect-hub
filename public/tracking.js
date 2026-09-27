(()=>{
  const OFFER='https://track-pdlp.com/h/1qj66ab81ea7bbb7a';
  const PIXEL_ID='1629476742086530';
  const qs=new URLSearchParams(location.search);
  const keys=['fbclid','utm_source','utm_medium','utm_campaign','utm_content','utm_term','campaign_id','adset_id','ad_id'];
  const getCookie=n=>document.cookie.split('; ').find(x=>x.startsWith(n+'='))?.split('=').slice(1).join('=')||'';
  let clickId=sessionStorage.getItem('cch_click_id');
  if(!clickId){clickId=crypto.randomUUID();sessionStorage.setItem('cch_click_id',clickId)}
  keys.forEach(k=>{const v=qs.get(k);if(v)sessionStorage.setItem('cch_'+k,v)});
  const fbclid=qs.get('fbclid')||sessionStorage.getItem('cch_fbclid')||'';
  let fbc=getCookie('_fbc')||sessionStorage.getItem('cch_fbc')||'';
  if(!fbc&&fbclid){fbc=`fb.1.${Date.now()}.${fbclid}`;sessionStorage.setItem('cch_fbc',fbc)}
  const tracking=()=>({
    click_id:clickId,fbclid,
    fbp:getCookie('_fbp')||'',fbc:getCookie('_fbc')||fbc,
    ...Object.fromEntries(keys.filter(k=>k!=='fbclid').map(k=>[k,sessionStorage.getItem('cch_'+k)||''])),
    landing_url:location.href,timestamp:Date.now()
  });
  function loadPixel(){
    if(window.fbq)return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init',PIXEL_ID);fbq('track','PageView');
  }
  if(localStorage.getItem('cch_consent')==='accepted') loadPixel();
  function offerUrl(){const t=tracking(),u=new URL(OFFER);u.searchParams.set('subid',clickId);['utm_source','utm_medium','utm_campaign','utm_term'].forEach(k=>{if(t[k])u.searchParams.set(k,t[k])});return u.toString()}
  async function handleOfferClick(){
    const url=offerUrl(),payload=tracking();
    if(qs.get('debug_tracking')==='1')console.log('Credit Connect tracking',{click_id:clickId,affiliate_url:url,utm:{source:payload.utm_source,medium:payload.utm_medium,campaign:payload.utm_campaign,term:payload.utm_term}});
    try{await Promise.race([fetch('/api/track',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true}),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),900))])}catch(e){}
    location.href=url;
  }
  document.querySelectorAll('[data-offer]').forEach(b=>b.addEventListener('click',handleOfferClick));
  const cookie=document.getElementById('cookie');
  if(!localStorage.getItem('cch_consent'))cookie.style.display='flex';
  document.getElementById('accept').onclick=()=>{localStorage.setItem('cch_consent','accepted');cookie.style.display='none';loadPixel()};
  document.getElementById('reject').onclick=()=>{localStorage.setItem('cch_consent','rejected');cookie.style.display='none'};
  window.CCH={handleOfferClick,getTracking:tracking,getOfferUrl:offerUrl};
})();
