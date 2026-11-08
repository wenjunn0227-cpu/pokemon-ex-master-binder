'use strict';
const groups=window.CYNDAQUIL_GROUPS;
const cards=groups.flatMap(g=>g.rows.map(r=>({...r,art:g,title:g.title})));
const byId=new Map(cards.map(c=>[c.id,c]));
const aliasToId=new Map(cards.flatMap(c=>(c.aliases||[c.id]).map(id=>[id,c.id])));
const TARGETS=cards.filter(c=>c.status!=='pending');
const TOTAL_PAGES=Math.ceil(cards.length/4);
// Each entry is tied to a stable card version ID and a photographed specimen.
const VERIFIED_IMAGES=window.CYNDAQUIL_IMAGES;
const STORAGE='cyndaquil-masterset-owned-v1';
const pos=['左上','右上','左下','右下'];
const langs={'EN':'英文','JA':'日文','ZH-T':'繁中','ZH-S':'簡中'};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let owned={},jumbo=false,storageIssue=false;
try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved)){owned=saved.owned||{};jumbo=saved.jumbo===true;}}catch(e){storageIssue=true;}
if(!owned||typeof owned!=='object'||Array.isArray(owned))owned={};
// Migrate previous code-specific checks to their merged target; retain original backup entries.
for(const [id,value] of Object.entries(owned)){if(value===true&&aliasToId.has(id))owned[aliasToId.get(id)]=true;}
let state={page:0,mode:'binder',query:'',language:'',group:'',status:''};
let toastTimer;
function toast(message){$('toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',4500);}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify({version:1,owned,jumbo}));return true;}catch(e){storageIssue=true;toast('目前無法儲存到瀏覽器，請匯出備份保留進度。');return false;}}
function isOwned(c){return c.status!=='pending'&&owned[c.id]===true;}
function physical(){return state.mode==='binder'&&!state.query&&!state.language&&!state.group&&!state.status;}
function filtered(){return cards.filter(c=>(state.mode!=='collection'||isOwned(c))&&(!state.language||c.lang===state.language)&&(!state.group||c.group===state.group)&&(!state.status||(state.status==='pending'?c.status==='pending':c.status==='owned'?isOwned(c):c.status!=='pending'&&!isOwned(c)))&&(!state.query||[c.title,c.set,c.number,c.variant,c.lang,langs[c.lang],c.note].join(' ').toLowerCase().includes(state.query.toLowerCase())));}
function pageCount(){return physical()?TOTAL_PAGES:Math.max(1,Math.ceil(filtered().length/4));}
function locationLabel(c){return '第 '+c.page+' 頁 · 第 '+c.pocket+' 格（'+pos[c.pocket-1]+'）';}
function sources(c){const match=VERIFIED_IMAGES[c.id];return match?[match.displayUrl||match.url]:[];}
function imageInfo(c){return VERIFIED_IMAGES[c.id];}

function render(){
  const done=TARGETS.filter(isOwned).length;
  $('progressText').textContent=done+' / '+TARGETS.length;
  $('progressBar').style.width=(100*done/TARGETS.length)+'%';
  $('collectionCount').textContent=done+' 張已收藏';
  $('scopeCount').textContent=TARGETS.length+' 個英日收錄版本均有實圖 · 共 '+TOTAL_PAGES+' 頁';
  $('binder').classList.toggle('on',state.mode==='binder');
  $('collection').classList.toggle('on',state.mode==='collection');
  const isPhysical=physical(),list=filtered(),pages=pageCount();
  state.page=Math.max(0,Math.min(state.page,pages-1));
  const start=state.page*4;
  const visible=isPhysical?cards.slice(start,start+4):list.slice(start,start+4);
  const out=visible.map(c=>{
    const has=isOwned(c),pending=c.status==='pending',srcs=sources(c);
    const info=imageInfo(c);
    if(pending)return '<article class="pocket pending"><div class="research-slot"><strong>查證預留格</strong><span>'+esc(locationLabel(c))+'</span><p>'+esc(langs[c.lang]+' '+c.number+' '+c.variant)+'</p><p>尚未確認有此版本，未列入 Masterset 收藏目標。</p><small>保留此位置供查證；並非缺少一張已確認發行的卡。</small></div></article>';
    const image=srcs.length?'<img loading="lazy" src="'+esc(srcs[0])+'" alt="'+esc(langs[c.lang]+' '+c.number+' '+c.variant+' 版本實圖')+'">':'<div class="fallback">圖片載入中</div>';
    return '<article class="pocket '+(pending?'pending':'')+'"><button type="button" class="art '+(has?'owned':'missing')+'" data-id="'+esc(c.id)+'" aria-pressed="'+has+'" aria-label="'+esc(locationLabel(c)+' '+langs[c.lang]+' '+c.number+' '+c.variant+(pending?'，待核實':has?'，已收藏':'，未收藏'))+'" '+(pending?'disabled':'')+'>'+image+'<span class="statusdot"></span><span class="slot">#'+String(c.slot).padStart(3,'0')+'</span></button><div class="caption"><strong>'+esc(locationLabel(c))+'</strong><span class="lang">'+langs[c.lang]+'</span><span>'+esc(c.set)+'</span><span>'+esc(c.number)+'</span><span class="variant">'+(pending?'待核實預留 · ':'')+esc(c.variant)+'</span>'+(c.note?'<small>'+esc(c.note)+'</small>':'')+'<small>此版本實拍／掃描 · 保留原始印章及印刷碼</small><button type="button" class="inspect-btn" data-inspect="'+esc(c.id)+'">放大核對 ↗</button><a target="_blank" rel="noopener" href="'+esc(c.art.source)+'">查看發行資料 ↗</a></div></article>';
  });
  if(isPhysical&&visible.length<4)for(let i=visible.length;i<4;i++)out.push('<div class="pocket"><div class="last-empty">尚未分配<br>第 '+(state.page+1)+' 頁 · 第 '+(i+1)+' 格</div></div>');
  $('grid').innerHTML=out.length?out.join(''):'<div class="empty">'+(state.mode==='collection'?'還未勾選任何火球鼠卡片。':'找不到符合的卡片。')+'</div>';
  $('viewTitle').textContent=isPhysical?'實體 Binder · 第 '+(state.page+1)+' 頁':state.mode==='collection'?'My Collection':'篩選結果';
  $('viewMeta').textContent=isPhysical?'2×2 · 1 左上 / 2 右上 / 3 左下 / 4 右下':list.length+' 個結果 · 下方仍顯示原本實體格位';
  $('pageLabel').textContent=(isPhysical?'實體頁 ':'畫面頁 ')+(state.page+1)+' / '+pages;
  $('jump').max=pages;$('jump').value=state.page+1;
  $('prev').disabled=state.page===0;$('next').disabled=state.page===pages-1;
  document.querySelectorAll('.art[data-id]').forEach(b=>b.onclick=()=>{
    const c=byId.get(b.dataset.id);if(!c||c.status==='pending')return;
    const next=!isOwned(c);for(const id of c.aliases||[c.id])owned[id]=next;owned[c.id]=next;save();render();
  });
  document.querySelectorAll('[data-inspect]').forEach(b=>b.onclick=()=>openImage(b.dataset.inspect));
  document.querySelectorAll('.art img').forEach(img=>img.onerror=()=>{
    if(!img.dataset.retried){const c=byId.get(img.closest('[data-id]').dataset.id),m=imageInfo(c);if(m.url&&m.url!==img.src){img.dataset.retried='1';img.src=m.url;return;}}
    {img.replaceWith(Object.assign(document.createElement('div'),{className:'fallback',textContent:'此版本圖片暫時載入失敗。卡號與格位仍保留；不以其他版本替代。'}));}
  });
}
function clear(){state.query='';state.language='';state.group='';state.status='';$('search').value='';$('language').value='';$('group').value='';$('status').value='';state.page=0;}
groups.forEach(g=>{const option=document.createElement('option');option.value=g.id;option.textContent=g.title;$('group').append(option);});
$('binder').onclick=()=>{clear();state.mode='binder';render();};
$('collection').onclick=()=>{clear();state.mode='collection';render();};
$('search').oninput=e=>{state.query=e.target.value.trim();state.page=0;render();};
for(const name of ['language','group','status'])$(name).onchange=e=>{state[name]=e.target.value;state.page=0;render();};
$('prev').onclick=()=>{state.page=Math.max(0,state.page-1);render();};
$('next').onclick=()=>{state.page=Math.min(pageCount()-1,state.page+1);render();};
$('jumpForm').onsubmit=e=>{e.preventDefault();const p=Number($('jump').value);if(Number.isInteger(p)&&p>=1&&p<=pageCount()){state.page=p-1;render();}};
$('jumbo').checked=jumbo;$('jumbo').onchange=e=>{jumbo=e.target.checked;save();};
$('export').onclick=()=>{
 const blob=new Blob([JSON.stringify({collection:'cyndaquil-masterset',version:1,date:new Date().toISOString(),owned,jumbo},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cyndaquil-progress-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('import').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
   const data=JSON.parse(await file.text());
   if(data.collection!=='cyndaquil-masterset'||data.version!==1||!data.owned||typeof data.owned!=='object'||Array.isArray(data.owned))throw Error('invalid');
   let count=0;for(const [id,value] of Object.entries(data.owned)){const target=aliasToId.get(id);if(target&&typeof value==='boolean'&&byId.get(target).status!=='pending'){if(value){owned[target]=true;count++;}}}
   // Merge collected cards so importing an older backup cannot erase newer checks.
   jumbo=jumbo||data.jumbo===true;$('jumbo').checked=jumbo;
   const saved=save();render();toast(saved?'已合併 '+count+' 個收藏記錄；現有勾選已保留。':'已合併，但瀏覽器儲存失敗，請立即匯出備份。');
 }catch(error){toast('無法讀取這份備份，請選擇本頁匯出的火球鼠 JSON。');}
 e.target.value='';
};
render();
if(storageIssue)toast('無法讀取瀏覽器收藏記錄；目前使用暫存進度，請保留原備份。');


let activeImage=null,zoom=100,lastImageFocus=null;
function setZoom(value){zoom=Math.max(100,Math.min(400,value));$('photoZoom').value=zoom;$('zoomLabel').textContent=zoom+'%';$('photoInner').style.width=(Math.min($('photoViewport').clientWidth-24,($('photoViewport').clientHeight-24)*.72)*zoom/100)+'px';}
function openImage(id){
 const c=byId.get(id),m=VERIFIED_IMAGES[id];if(!c||!m)return;activeImage=c;lastImageFocus=document.activeElement;
 $('photoTitle').textContent=langs[c.lang]+' · '+c.number+' · '+c.variant;
 $('photoPosition').textContent=locationLabel(c)+' · '+c.set;
 $('photoImg').src=m.fullUrl||m.displayUrl||m.url;$('photoImg').alt=langs[c.lang]+' '+c.number+' '+c.variant+' 實圖';
 const code=c.variant.match(/[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}/)?.[0];
 $('photoEvidence').textContent=code?'辨認重點：卡底印刷碼 '+code+'；再對照版次標誌。':c.variant.includes('Unlimited')?'辨認重點：此版本沒有 1st Edition 印章。':c.variant.includes('1st Edition')?'辨認重點：確認卡面上的 1st Edition 印章。':'辨認重點：'+langs[c.lang]+'、'+c.number+'、'+c.variant+'。請對照卡面印章及閃膜圖樣。';
 $('photoSource').href=m.url||m.source;$('photoDialog').showModal();setZoom(100);
}
$('photoClose').onclick=()=>$('photoDialog').close();
$('zoomIn').onclick=()=>setZoom(zoom+50);$('zoomOut').onclick=()=>setZoom(zoom-50);
$('photoZoom').oninput=e=>setZoom(Number(e.target.value));
$('photoDialog').addEventListener('close',()=>{if(lastImageFocus?.isConnected)lastImageFocus.focus();});
$('photoDialog').addEventListener('click',e=>{if(e.target===$('photoDialog'))$('photoDialog').close();});

