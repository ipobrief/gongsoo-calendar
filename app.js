const $ = (s) => document.querySelector(s);
const storeKey = 'gongsoo-calendar-v1';
const state = JSON.parse(localStorage.getItem(storeKey)) || { records: {}, settings: { rate: 160000, name: '' } };
let current = new Date(); current = new Date(current.getFullYear(), current.getMonth(), 1);
let selectedKey = '';
const won = (n) => `${Math.round(n || 0).toLocaleString('ko-KR')}원`;
const keyFor = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const save = () => { state.updatedAt = Date.now(); localStorage.setItem(storeKey, JSON.stringify(state)); window.dispatchEvent(new CustomEvent('gongsoo:local-save', { detail: state })); };
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

// 선택한 기록을 같은 달의 여러 날짜에 한 번에 복사하는 옵션입니다.
const baseOpenRecord = openRecord;
openRecord = function(key) {
  baseOpenRecord(key);
  const date = new Date(key + 'T00:00:00');
  $('#weekdayLabel').textContent = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  $('#fillWeekly').checked = false;
  $('#fillAfter').checked = false;
};

$('#recordForm').addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel' || (!$('#fillWeekly').checked && !$('#fillAfter').checked)) return;
  const record = {
    manDays: +$('#manDays').value,
    rate: +$('#rate').value,
    allowance: +$('#allowance').value,
    memo: $('#memo').value.trim()
  };
  const selected = new Date(selectedKey + 'T00:00:00');
  const lastDate = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    const date = new Date(current.getFullYear(), current.getMonth(), day);
    const sameWeekday = $('#fillWeekly').checked && date.getDay() === selected.getDay();
    const afterSelected = $('#fillAfter').checked && date >= selected;
    if (sameWeekday || afterSelected) state.records[keyFor(date)] = { ...record };
  }
  save();
  render();
});

// 2026년 대한민국 관공서 공휴일 및 대체공휴일입니다.
// 일요일은 '휴일'로 별도 표기합니다.
const koreanHolidays = {
  '2026-01-01': '신정', '2026-02-16': '설날 연휴', '2026-02-17': '설날', '2026-02-18': '설날 연휴',
  '2026-03-01': '삼일절', '2026-03-02': '대체공휴일', '2026-05-01': '노동절', '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날', '2026-05-25': '대체공휴일', '2026-06-03': '지방선거', '2026-06-06': '현충일',
  '2026-07-17': '제헌절', '2026-08-15': '광복절', '2026-08-17': '대체공휴일',
  '2026-09-24': '추석 연휴', '2026-09-25': '추석', '2026-09-26': '추석 연휴',
  '2026-10-03': '개천절', '2026-10-05': '대체공휴일', '2026-10-09': '한글날', '2026-12-25': '성탄절'
};
const baseRenderWithHolidays = render;
render = function() {
  baseRenderWithHolidays();
  document.querySelectorAll('.day[data-date]').forEach((day) => {
    const date = new Date(day.dataset.date + 'T00:00:00');
    const holiday = koreanHolidays[day.dataset.date] || (date.getDay() === 0 ? '휴일' : '');
    if (!holiday) return;
    day.classList.add('holiday-day');
    day.insertAdjacentHTML('beforeend', `<span class="holiday-name">${holiday}</span>`);
  });
};
render();

window.addEventListener('gongsoo:remote-data', (event) => {
  const remote = event.detail;
  if (!remote || !remote.records) return;
  state.records = remote.records;
  state.settings = remote.settings || state.settings;
  state.updatedAt = remote.updatedAt || Date.now();
  localStorage.setItem(storeKey, JSON.stringify(state));
  render();
});

// 저장된 기록이 없는 날짜에는 요일별 기본 공수를 화면에만 적용합니다.
// 날짜를 열어 저장하면 그 날짜는 자동값 대신 저장한 값이 사용됩니다.
const scheduledManDays = (key) => {
  const date = new Date(key + 'T00:00:00');
  if (date.getDay() === 0 || koreanHolidays[key]) return 0;
  return date.getDay() === 3 || date.getDay() === 6 ? 1 : 1.5;
};
const scheduledRecord = (key) => ({
  manDays: scheduledManDays(key),
  rate: state.settings.rate,
  allowance: 0,
  memo: ''
});
const effectiveRecord = (key) => {
  const saved = state.records[key];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(key + 'T00:00:00');
  if (saved && (saved.manual || date <= today)) return saved;
  return scheduledRecord(key);
};
const monthKeys = () => {
  const year = current.getFullYear(), month = current.getMonth();
  return Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => keyFor(new Date(year, month, index + 1)));
};

const renderWithHolidays = render;
render = function() {
  renderWithHolidays();
  document.querySelectorAll('.day[data-date]').forEach((day) => {
    const key = day.dataset.date;
    const record = effectiveRecord(key);
    if (!state.records[key]?.manual) day.querySelector('.entry')?.remove();
    if (record.manDays <= 0) return;
    day.insertAdjacentHTML('beforeend', `<span class="entry ${colorFor(record.manDays)}"><b>${record.manDays.toFixed(2)}</b><small>${Math.round(record.manDays * record.rate).toLocaleString('ko-KR')}</small></span>`);
  });
  const records = monthKeys().map((key) => effectiveRecord(key));
  const mans = records.reduce((sum, record) => sum + (+record.manDays || 0), 0);
  const income = records.reduce((sum, record) => sum + (+record.manDays || 0) * (+record.rate || 0) + (+record.allowance || 0), 0);
  $('#monthlyManDays').textContent = `${mans.toFixed(2)} 공수`;
  $('#monthlyIncome').textContent = won(income);
  $('#streakCount').textContent = mans ? `${records.filter((record) => record.manDays > 0).length}일 기본 설정` : '이번 달';
};

const openRecordWithSchedule = openRecord;
openRecord = function(key) {
  openRecordWithSchedule(key);
  if (state.records[key]?.manual) return;
  const record = effectiveRecord(key);
  $('#manDays').value = record.manDays;
  $('#rate').value = record.rate;
  $('#allowance').value = record.allowance;
  $('#quickOptions').querySelectorAll('button').forEach((button) => button.classList.toggle('active', +button.dataset.value === record.manDays));
  updateDayTotal();
};

$('#detailButton').onclick = () => {
  const entries = monthKeys().map((key) => [key, effectiveRecord(key)]).filter(([, record]) => record.manDays > 0);
  const mans = entries.reduce((sum, [, record]) => sum + (+record.manDays || 0), 0);
  const income = entries.reduce((sum, [, record]) => sum + (+record.manDays || 0) * (+record.rate || 0) + (+record.allowance || 0), 0);
  $('#detailTitle').textContent = $('#monthTitle').textContent;
  $('#workDays').textContent = `${entries.length}일`;
  $('#averageDays').textContent = entries.length ? (mans / entries.length).toFixed(2) : '0.00';
  $('#reportIncome').textContent = won(income);
  $('#recordList').innerHTML = entries.map(([key, record]) => `<div class="record-row"><div><b>${+key.slice(8)}일</b><span>${record.memo || '기본 설정'}</span></div><div><strong>${record.manDays.toFixed(2)} 공수</strong><span>${won(record.manDays * record.rate + (+record.allowance || 0))}</span></div></div>`).join('') || '<p style="color:#718092;text-align:center;padding:20px">이번 달 기록이 없습니다.</p>';
  $('#detailDialog').showModal();
};

$('#recordForm').addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  const record = {
    manDays: +$('#manDays').value,
    rate: +$('#rate').value,
    allowance: +$('#allowance').value,
    memo: $('#memo').value.trim(),
    manual: true
  };
  const selected = new Date(selectedKey + 'T00:00:00');
  const lastDate = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    const date = new Date(current.getFullYear(), current.getMonth(), day);
    const sameWeekday = $('#fillWeekly').checked && date.getDay() === selected.getDay();
    const afterSelected = $('#fillAfter').checked && date >= selected;
    if (keyFor(date) === selectedKey || sameWeekday || afterSelected) state.records[keyFor(date)] = { ...record };
  }
  save();
  render();
});

render();
