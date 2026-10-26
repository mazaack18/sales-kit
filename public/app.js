const $=s=>document.querySelector(s), key='account-atlas-v1';
const seed=[{id:'sample',name:'サンプル商事（架空）',departments:[{id:'root',parent:'',name:'経営本部',people:['佐藤 花子 / 本部長'],partners:['未来コンサル / 経営支援'],saas:['Notion / ナレッジ管理'],notes:'組織全体の意思決定を担当。'},{id:'sales',parent:'root',name:'営業部',people:['田中 一郎 / 営業部長'],partners:['セールスサポート社 / 営業支援'],saas:['Salesforce / 顧客管理','Zoom / オンライン商談'],notes:'次回の商談で、運用の課題を確認する。'},{id:'it',parent:'root',name:'情報システム部',people:['鈴木 次郎 / マネージャー'],partners:['クラウドパートナーズ / 導入支援'],saas:['Slack / 社内連絡','Google Workspace / グループウェア'],notes:'新しいツールの導入審査を担当。'}]}];
let companies,selected='root';
try{const saved=localStorage.getItem(key);companies=saved?JSON.parse(saved):structuredClone(seed);if(!Array.isArray(companies)||!companies.length||companies.some(c=>!c.id||typeof c.name!=='string'||!Array.isArray(c.departments)||c.departments.some(d=>!d.id||typeof d.name!=='string'||!['people','partners','saas'].every(k=>Array.isArray(d[k])&&d[k].every(v=>typeof v==='string')))))throw Error();}catch{companies=structuredClone(seed);$('#notice').textContent='保存データを読み込めなかったためサンプルを表示しています。保存すると既存データが置き換わります。';}
let current=companies[0].id;
const company=()=>companies.find(c=>c.id===current);
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function save(){try{localStorage.setItem(key,JSON.stringify(companies));$('#notice').textContent='このブラウザーに保存しました。';}catch{$('#notice').textContent='保存できませんでした。データを書き出して保管してください。';}render();}
function render(){const c=company();$('#company').replaceChildren(...companies.map(c=>{const o=el('option',c.name);o.value=c.id;return o;}));$('#company').value=current;$('#title').textContent=c.name;$('#stats').replaceChildren(...[['部署',c.departments.length],['担当者',c.departments.reduce((n,d)=>n+d.people.length,0)],['外部パートナー',new Set(c.departments.flatMap(d=>d.partners)).size],['利用SaaS',new Set(c.departments.flatMap(d=>d.saas)).size]].map(([label,value])=>{const n=el('div',undefined,'stat');n.append(el('span',label),el('strong',value));return n;}));
const query=$('#search').value.trim().toLowerCase();
const tree=$('#tree');tree.replaceChildren();const seen=new Set();
function branch(d){
 if(seen.has(d.id))return null;seen.add(d.id);
 const box=el('section',undefined,'org-box'+(selected===d.id?' active':''));
 const heading=el('div',undefined,'org-heading');const title=el('button',d.name,'org-title');title.onclick=()=>{selected=d.id;render();};
 const edit=el('button','編集','compact');edit.onclick=()=>open(d);
 const add=el('button','＋ 下位部署','compact');add.onclick=()=>{open();$('#form').elements.parent.value=d.id;};
 heading.append(title,edit,add);box.append(heading);
 const cards=el('div',undefined,'cards');
 for(const [kind,items,cls] of [['担当者',d.people,'person'],['外部パートナー',d.partners,'partner'],['利用SaaS',d.saas,'tool']])for(const item of items){const card=el('button',undefined,'map-card '+cls);card.append(el('small',kind),el('span',item));card.onclick=()=>{selected=d.id;open(d);};cards.append(card);}
 if(!cards.childNodes.length){const empty=el('button','＋ 担当者・ツールを登録','empty-card');empty.onclick=()=>open(d);cards.append(empty);}box.append(cards);
 const children=el('div',undefined,'org-children');c.departments.filter(x=>x.parent===d.id).forEach(x=>{const child=branch(x);if(child)children.append(child);});if(children.childNodes.length)box.append(children);
 const matches=[d.name,...d.people,...d.partners,...d.saas,d.notes||''].join(' ').toLowerCase().includes(query);
 if(query&&matches)box.classList.add('search-match');
 if(query&&!matches&&!children.querySelector('.search-match'))box.hidden=true;
 return box;
}
c.departments.filter(d=>!d.parent||!c.departments.some(x=>x.id===d.parent)).forEach(d=>{const box=branch(d);if(box)tree.append(box);});c.departments.forEach(d=>{if(!seen.has(d.id)){const box=branch(d);if(box)tree.append(box);}});
if(!c.departments.length)tree.append(el('p','「部署を追加」で最初の本部・部署の枠を作成してください。'));
if(query&&!tree.querySelector('.search-match'))tree.append(el('p','該当する部署はありません。'));
const detail=$('#detail'),d=c.departments.find(d=>d.id===selected);detail.replaceChildren();if(!d){detail.append(el('h2','部署を選択してください'),el('p','「部署を追加」から組織図を作成できます。'));return;}detail.append(el('div','DEPARTMENT PROFILE','eyebrow'),el('h2',d.name));const parent=c.departments.find(x=>x.id===d.parent);detail.append(el('p',parent?`上位部署：${parent.name}`:'会社直下の部署','hint'));for(const [label,items] of [['担当者',d.people],['外部パートナー',d.partners],['利用SaaS',d.saas]]){const group=el('div',undefined,'group');group.append(el('h3',label));if(!items.length)group.append(el('p','未登録','hint'));items.forEach(v=>group.append(el('div',v,'pill')));detail.append(group);}detail.append(el('h3','営業メモ'),el('p',d.notes||'未登録','memo'));const actions=el('div',undefined,'actions'),edit=el('button','情報を編集'),remove=el('button','部署を削除','danger');edit.onclick=()=>open(d);remove.onclick=()=>{if(c.departments.some(x=>x.parent===d.id)){alert('先に下位部署の上位部署を変更するか、下位部署を削除してください。');return;}if(confirm(`「${d.name}」を削除しますか？`)){c.departments=c.departments.filter(x=>x.id!==d.id);selected=c.departments[0]?.id;save();}};actions.append(edit,remove);detail.append(actions);}
function open(d){const f=$('#form');f.reset();$('#error').textContent='';f.elements.id.value=d?.id||'';const excluded=new Set(d?[d.id]:[]);let changed=true;while(changed){changed=false;company().departments.forEach(x=>{if(excluded.has(x.parent)&&!excluded.has(x.id)){excluded.add(x.id);changed=true;}});}const options=[{id:'',name:'会社直下'},...company().departments.filter(x=>!excluded.has(x.id))];f.elements.parent.replaceChildren(...options.map(x=>{const o=el('option',x.name);o.value=x.id;return o;}));if(d){f.elements.name.value=d.name;f.elements.parent.value=d.parent;for(const k of ['people','partners','saas'])f.elements[k].value=d[k].join('\n');f.elements.notes.value=d.notes||'';}$('#editor').showModal();}
$('#form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,name=f.elements.name.value.trim();if(!name){$('#error').textContent='部署名を入力してください。';return;}const d={id:f.elements.id.value||crypto.randomUUID(),name,parent:f.elements.parent.value,notes:f.elements.notes.value.trim()};for(const k of ['people','partners','saas'])d[k]=[...new Set(f.elements[k].value.split('\n').map(s=>s.trim()).filter(Boolean))];const c=company(),i=c.departments.findIndex(x=>x.id===d.id);if(i<0)c.departments.push(d);else c.departments[i]=d;selected=d.id;$('#editor').close();save();};
$('#cancel').onclick=()=>$('#editor').close();$('#addDept').onclick=()=>open();$('#search').oninput=render;$('#company').onchange=e=>{current=e.target.value;selected=company().departments[0]?.id;$('#search').value='';render();};$('#addCompany').onclick=()=>{const name=prompt('営業先の会社名を入力してください');if(!name?.trim())return;const c={id:crypto.randomUUID(),name:name.trim(),departments:[]};companies.push(c);current=c.id;selected=null;$('#search').value='';save();};$('#export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(companies,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download='account-atlas.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};render();

let zoom=1;
function setZoom(value){zoom=Math.max(.3,Math.min(1.5,value));$('#tree').style.zoom=zoom;$('#zoomLabel').textContent=Math.round(zoom*100)+'%';}
$('#zoomOut').onclick=()=>setZoom(zoom-.1);$('#zoomIn').onclick=()=>setZoom(zoom+.1);$('#zoomReset').onclick=()=>setZoom(1);
