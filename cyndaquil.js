'use strict';
const groups=window.CYNDAQUIL_GROUPS;
const cards=groups.flatMap(g=>g.rows.map(r=>({...r,art:g,title:g.title})));
const byId=new Map(cards.map(c=>[c.id,c]));
const TARGETS=cards.filter(c=>c.status!=='pending');
const TOTAL_PAGES=Math.ceil(cards.length/4);
const STORAGE='cyndaquil-masterset-owned-v1';
const pos=['左上','右上','左下','右下'];
const langs={'EN':'英文','JA':'日文','ZH-T':'繁中','ZH-S':'簡中'};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let owned={},jumbo=false,storageIssue=false;
try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved)){owned=saved.owned||{};jumbo=saved.jumbo===true;}}catch(e){storageIssue=true;}
if(!owned||typeof owned!=='object'||Array.isArray(owned))owned={};
let state={page:0,mode:'binder',query:'',language:'',group:'',status:''};
let toastTimer;
function toast(message){$('toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',4500);}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify({version:1,owned,jumbo}));return true;}catch(e){storageIssue=true;toast('目前無法儲存到瀏覽器，請匯出備份保留進度。');return false;}}
function isOwned(c){return c.status!=='pending'&&owned[c.id]===true;}
function physical(){return state.mode==='binder'&&!state.query&&!state.language&&!state.group&&!state.status;}
function filtered(){return cards.filter(c=>(state.mode!=='collection'||isOwned(c))&&(!state.language||c.lang===state.language)&&(!state.group||c.group===state.group)&&(!state.status||(state.status==='pending'?c.status==='pending':c.status==='owned'?isOwned(c):c.status!=='pending'&&!isOwned(c)))&&(!state.query||[c.title,c.set,c.number,c.variant,c.lang,langs[c.lang],c.note].join(' ').toLowerCase().includes(state.query.toLowerCase())));}
function pageCount(){return physical()?TOTAL_PAGES:Math.max(1,Math.ceil(filtered().length/4));}
function locationLabel(c){return '第 '+c.page+' 頁 · 第 '+c.pocket+' 格（'+pos[c.pocket-1]+'）';}
function sources(c){
  if(!c.art.image)return [];
  const id=c.art.image;
  const split=id.indexOf('-'),set=id.slice(0,split),num=id.slice(split+1);
  return ['https://images.scrydex.com/pokemon/'+id+'/large','https://images.pokemontcg.io/'+set+'/'+num+'_hires.png'];
}
function render(){
  const done=TARGETS.filter(isOwned).length;
  $('progressText').textContent=done+' / '+TARGETS.length;
  $('progressBar').style.width=(100*done/TARGETS.length)+'%';
  $('collectionCount').textContent=done+' 張已收藏';
  $('scopeCount').textContent=TARGETS.length+' 個收錄版本＋'+(cards.length-TARGETS.length)+' 格待核實預留，共 '+TOTAL_PAGES+' 頁';
  $('binder').classList.toggle('on',state.mode==='binder');
  $('collection').classList.toggle('on',state.mode==='collection');
  const isPhysical=physical(),list=filtered(),pages=pageCount();
  state.page=Math.max(0,Math.min(state.page,pages-1));
  const start=state.page*4;
  const visible=isPhysical?cards.slice(start,start+4):list.slice(start,start+4);
  const out=visible.map(c=>{
    const has=isOwned(c),pending=c.status==='pending',srcs=sources(c);
    const image=srcs.length?'<img loading="lazy" src="'+esc(srcs[0])+'" data-fallback="'+esc(srcs[1])+'" alt="'+esc(c.title+' 插畫參考')+'">':'<div class="fallback"><strong>'+esc(c.title)+'</strong>'+esc(c.number)+'<br>此插畫暫無預覽<br>請查看下方卡圖來源</div>';
    return '<article class="pocket '+(pending?'pending':'')+'"><button type="button" class="art '+(has?'owned':'missing')+'" data-id="'+esc(c.id)+'" aria-pressed="'+has+'" aria-label="'+esc(locationLabel(c)+' '+langs[c.lang]+' '+c.number+' '+c.variant+(pending?'，待核實':has?'，已收藏':'，未收藏'))+'" '+(pending?'disabled':'')+'>'+image+'<span class="statusdot"></span><span class="slot">#'+String(c.slot).padStart(3,'0')+'</span></button><div class="caption"><strong>'+esc(locationLabel(c))+'</strong><span class="lang">'+langs[c.lang]+'</span><span>'+esc(c.set)+'</span><span>'+esc(c.number)+'</span><span class="variant">'+(pending?'待核實預留 · ':'')+esc(c.variant)+'</span>'+(c.note?'<small>'+esc(c.note)+'</small>':'')+'<small>插畫參考，請按文字確認語言／版本</small><a target="_blank" rel="noopener" href="'+esc(c.art.source)+'">查看插畫及發行資料 ↗</a></div></article>';
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
    owned[c.id]=!isOwned(c);save();render();
  });
  document.querySelectorAll('.art img').forEach(img=>img.onerror=()=>{
    if(img.dataset.fallback){img.src=img.dataset.fallback;delete img.dataset.fallback;}
    else{img.replaceWith(Object.assign(document.createElement('div'),{className:'fallback',textContent:'卡圖暫時無法載入；卡號及版本資料仍可使用。查看下方卡圖來源。'}));}
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
   let count=0;for(const [id,value] of Object.entries(data.owned)){if(byId.has(id)&&typeof value==='boolean'&&byId.get(id).status!=='pending'){if(value){owned[id]=true;count++;}}}
   // Merge collected cards so importing an older backup cannot erase newer checks.
   jumbo=jumbo||data.jumbo===true;$('jumbo').checked=jumbo;
   const saved=save();render();toast(saved?'已合併 '+count+' 個收藏記錄；現有勾選已保留。':'已合併，但瀏覽器儲存失敗，請立即匯出備份。');
 }catch(error){toast('無法讀取這份備份，請選擇本頁匯出的火球鼠 JSON。');}
 e.target.value='';
};
render();
if(storageIssue)toast('無法讀取瀏覽器收藏記錄；目前使用暫存進度，請保留原備份。');
