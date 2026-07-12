const $ = (s) => document.querySelector(s);
const storeKey = 'gongsoo-calendar-v1';
const state = JSON.parse(localStorage.getItem(storeKey)) || { records: {}, settings: { rate: 160000, name: '' } };
let current = new Date(); current = new Date(current.getFullYear(), current.getMonth(), 1);
let selectedKey = '';
const won = (n) => `${Math.round(n || 0).toLocaleString('ko-KR')}원`;
const keyFor = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const save = () => localStorage.setItem(storeKey, JSON.stringify(state));
const colorFor = (v) => v >= 1.4 ? 'orange' : v >= 1 ? 'blue' : 'green';
function render(){
  const year=current.getFullYear(), month=current.getMonth();
  $('#monthTitle').textContent=`${year}년 ${String(month+1).padStart(2,'0')}월`;
  const now=new Date(); $('#todayText').textContent=`오늘은 ${['일','월','화','수','목','금','토'][now.getDay()]}요일 · ${now.getMonth()+1}월 ${now.getDate()}일`;
  const first=new Date(year,month,1).getDay(), days=new Date(year,month+1,0).getDate();
  const grid=$('#calendarGrid'); grid.innerHTML='';
  for(let i=0;i<first;i++) grid.insertAdjacentHTML('beforeend','<div class="day empty"></div>');
  for(let d=1;d<=days;d++){const date=new Date(year,month,d), key=keyFor(date), r=state.records[key], cls=['day',date.getDay()===0?'sunday':'',date.getDay()===6?'saturday':'',key===keyFor(now)?'today':''].join(' '); const entry=r&&r.manDays>0?`<span class="entry ${colorFor(r.manDays)}"><b>${Number(r.manDays).toFixed(2)}</b><small>${Math.round(r.manDays*r.rate+(+r.allowance||0)).toLocaleString('ko-KR')}</small></span>`:''; grid.insertAdjacentHTML('beforeend',`<button class="${cls}" data-date="${key}"><span class="day-num">${d}</span>${entry}</button>`)}
  grid.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>openRecord(b.dataset.date));
  const rows=Object.entries(state.records).filter(([k])=>k.startsWith(`${year}-${String(month+1).padStart(2,'0')}`));
  const mans=rows.reduce((s,[,r])=>s+(+r.manDays||0),0), income=rows.reduce((s,[,r])=>s+(+r.manDays||0)*(+r.rate||0)+(+r.allowance||0),0);
  $('#monthlyManDays').textContent=`${mans.toFixed(2)} 공수`; $('#monthlyIncome').textContent=won(income); $('#streakCount').textContent=mans?`${rows.length}일째 기록 중`:'이번 달';
}
function openRecord(key){selectedKey=key; const r=state.records[key]||{manDays:1,rate:state.settings.rate,allowance:0,memo:''}; const d=new Date(key+'T00:00:00'); $('#dialogDate').textContent=`${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${['일','월','화','수','목','금','토'][d.getDay()]})`; $('#manDays').value=r.manDays; $('#rate').value=r.rate; $('#allowance').value=r.allowance; $('#memo').value=r.memo; $('#memoLength').textContent=r.memo.length; $('#quickOptions').innerHTML=[0,0.5,0.9,1,1.4,1.5,1.9,2].map(n=>`<button type="button" data-value="${n}" class="${+r.manDays===n?'active':''}">${n===0?'휴무':n.toFixed(2)}</button>`).join(''); $('#quickOptions').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('#manDays').value=b.dataset.value; $('#quickOptions').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b)); updateDayTotal()}); updateDayTotal(); $('#recordDialog').showModal();}
function updateDayTotal(){const total=(+$('#manDays').value||0)*(+$('#rate').value||0)+(+$('#allowance').value||0);$('#dayTotal').textContent=won(total)}
$('#recordForm').addEventListener('submit',(e)=>{if(e.submitter?.value==='cancel')return; state.records[selectedKey]={manDays:+$('#manDays').value,rate:+$('#rate').value,allowance:+$('#allowance').value,memo:$('#memo').value.trim()};save();render()});
['manDays','rate','allowance'].forEach(id=>$('#'+id).addEventListener('input',updateDayTotal));$('#memo').addEventListener('input',e=>$('#memoLength').textContent=e.target.value.length);
$('#deleteRecord').onclick=()=>{delete state.records[selectedKey];save();$('#recordDialog').close();render()};
$('#prevMonth').onclick=()=>{current=new Date(current.getFullYear(),current.getMonth()-1,1);render()}; $('#nextMonth').onclick=()=>{current=new Date(current.getFullYear(),current.getMonth()+1,1);render()}; $('#monthTitle').onclick=()=>{const n=new Date();current=new Date(n.getFullYear(),n.getMonth(),1);render()};
const openSettings=()=>{$('#defaultRate').value=state.settings.rate;$('#workerName').value=state.settings.name;$('#settingsPanel').classList.add('open');$('#scrim').classList.add('show');};const closeSettings=()=>{$('#settingsPanel').classList.remove('open');$('#scrim').classList.remove('show')};$('#settingsButton').onclick=openSettings;$('.close-panel').onclick=closeSettings;$('#scrim').onclick=closeSettings;$('#saveSettings').onclick=()=>{state.settings.rate=+$('#defaultRate').value||0;state.settings.name=$('#workerName').value.trim();save();closeSettings();render()};
$('#detailButton').onclick=()=>{const prefix=`${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`, rows=Object.entries(state.records).filter(([k])=>k.startsWith(prefix)).sort();const mans=rows.reduce((s,[,r])=>s+r.manDays,0),income=rows.reduce((s,[,r])=>s+r.manDays*r.rate+(+r.allowance||0),0);$('#detailTitle').textContent=$('#monthTitle').textContent;$('#workDays').textContent=`${rows.length}일`;$('#averageDays').textContent=rows.length?(mans/rows.length).toFixed(2):'0.00';$('#reportIncome').textContent=won(income);$('#recordList').innerHTML=rows.length?rows.map(([k,r])=>`<div class="record-row"><div><b>${+k.slice(8)}일</b><span>${r.memo||'메모 없음'}</span></div><div><strong>${r.manDays.toFixed(2)} 공수</strong><span>${won(r.manDays*r.rate+(+r.allowance||0))}</span></div></div>`).join(''):'<p style="color:#718092;text-align:center;padding:20px">이번 달 기록이 없습니다.</p>';$('#detailDialog').showModal()};
render();
