(()=>{
 const next='https://wenjun-pokemon-binder.gloveddog4.chatgpt.site';
 const bar=document.createElement('div');bar.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 18px;background:#122a20;color:#a5ebc3;font:13px system-ui;border-bottom:1px solid #38644b';
 bar.innerHTML='<span>新版支援手機／電腦同步。先匯出這台裝置的紀錄，再到同步版匯入。</span><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="transferProgress" style="padding:8px 12px;border-radius:8px;background:#1c3f2d;border:1px solid #548d69;color:white;cursor:pointer">匯出至同步版</button><a href="'+next+'" style="padding:8px 12px;color:#a5ebc3">開啟同步版 ↗</a></div>';
 document.body.insertBefore(bar,document.body.firstChild);
 document.getElementById('transferProgress').onclick=()=>{
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}};
  const data={format:'pokemon-binder-transfer',version:1,date:new Date().toISOString(),ex:read('owned',{}),cyndaquil:read('cyndaquil-masterset-owned-v1',{})};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='pokemon-binder-progress-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
})();
