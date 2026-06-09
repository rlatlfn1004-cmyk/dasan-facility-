import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  updateDoc, deleteDoc, doc, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ── Firebase 설정 ──────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAtINzRtBdHquXnYN-mEdhgSgk0txwIFq0",
  authDomain: "dasan-facility-7592a.firebaseapp.com",
  projectId: "dasan-facility-7592a",
  storageBucket: "dasan-facility-7592a.firebasestorage.app",
  messagingSenderId: "509516185174",
  appId: "1:509516185174:web:7f058f6b64d3b3b84d45f7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const inspectionsRef = collection(db, "inspections");

// ── 상태 ──────────────────────────────────────────────────
let allData = [];
let repFilter = 'all';
let currentId = null;

const BLDGS = ['본사', '물류센터1', '물류센터2', '서교동'];
const PAGE_INFO = {
  dashboard: ['대시보드', '시설 점검 현황을 한눈에 확인하세요.'],
  register:  ['점검 등록', '시설 점검 내용을 기록합니다.'],
  history:   ['점검 이력', '등록된 점검 내역을 확인합니다.'],
  repairs:   ['처리 및 수정', '수리 요청 및 처리 현황을 관리합니다.'],
};

// ── 실시간 데이터 구독 ─────────────────────────────────────
onSnapshot(query(inspectionsRef, orderBy("createdAt", "desc")), (snap) => {
  allData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderAll();
  updateNoti();
});

function renderAll() {
  const page = document.querySelector('.page.on')?.id?.replace('p-', '');
  if (page === 'dashboard') renderDashboard();
  if (page === 'history')   renderHistory();
  if (page === 'repairs')   renderRepairs();
  renderDashboard(); // 대시보드 항상 최신화
}

// ── 페이지 이동 ────────────────────────────────────────────
window.go = function(page, el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('on'));
  if (el) el.classList.add('on');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  document.getElementById('p-' + page).classList.add('on');
  document.getElementById('page-title').textContent = PAGE_INFO[page][0];
  document.getElementById('page-sub').textContent   = PAGE_INFO[page][1];
  if (page === 'history') renderHistory();
  if (page === 'repairs') renderRepairs();
  if (page === 'dashboard') renderDashboard();
}

// ── 대시보드 ───────────────────────────────────────────────
function renderDashboard() {
  // 건물 카드
  document.getElementById('bldg-grid').innerHTML = BLDGS.map(b => {
    const bi   = allData.filter(i => i.building === b);
    const pend = bi.filter(i => i.status === '수리필요' || i.status === '긴급');
    const last = bi[0];
    return `
    <div class="bcard">
      <div class="bcard-icon">🏢</div>
      <div class="bcard-name">${b}</div>
      <div class="bcard-stat">등록 점검 수</div>
      <div class="bcard-num">${bi.length}</div>
      <div class="bcard-stat" style="margin-top:10px">미처리 수리</div>
      <div class="bcard-num" style="font-size:20px;color:${pend.length?'#C8001E':'#22c55e'}">${pend.length}</div>
      <div class="bcard-sub">최근: <span>${last ? last.date : '-'}</span></div>
    </div>`;
  }).join('');

  // 최근 목록
  const recent = allData.slice(0, 10);
  document.getElementById('dash-tbody').innerHTML = recent.length
    ? recent.map(i => `
      <tr onclick="showDetail('${i.id}')">
        <td>${i.building}</td>
        <td>${i.date}</td>
        <td>${i.author}</td>
        <td>${i.zone || '-'}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.content}</td>
        <td>${badgeHtml(i.status)}</td>
        <td><button class="btn-sm" onclick="event.stopPropagation();showDetail('${i.id}')">상세</button></td>
      </tr>`).join('')
    : `<tr class="empty-row"><td colspan="7">등록된 점검 내역이 없습니다</td></tr>`;
}

// ── 점검 이력 ──────────────────────────────────────────────
window.renderHistory = function() {
  const fb = document.getElementById('f-building').value;
  const fs = document.getElementById('f-status').value;
  let d = [...allData];
  if (fb) d = d.filter(i => i.building === fb);
  if (fs) d = d.filter(i => i.status === fs);
  document.getElementById('hist-cnt').textContent = d.length + '건';
  document.getElementById('hist-tbody').innerHTML = d.length
    ? d.map(i => `
      <tr onclick="showDetail('${i.id}')">
        <td>${i.building}</td>
        <td>${i.date}</td>
        <td>${i.author}</td>
        <td>${i.zone || '-'}</td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.content}</td>
        <td>${i.memo || '-'}</td>
        <td>${badgeHtml(i.status)}</td>
        <td><button class="btn-sm" onclick="event.stopPropagation();showDetail('${i.id}')">상세</button></td>
      </tr>`).join('')
    : `<tr class="empty-row"><td colspan="8">내역이 없습니다</td></tr>`;
}

// ── 수리 처리 ──────────────────────────────────────────────
function renderRepairs() {
  let d = allData.filter(i => i.status === '수리필요' || i.status === '긴급' || i.status === '완료');
  if (repFilter !== 'all') d = d.filter(i => i.status === repFilter);
  document.getElementById('rep-list').innerHTML = d.length
    ? d.map(i => `
      <div class="rep-card">
        <div class="rep-head">
          <span class="rep-bldg">${i.building}</span>
          ${badgeHtml(i.status)}
        </div>
        <div class="rep-body">${i.content}</div>
        <div class="rep-foot">
          <span class="rep-meta">${i.date} · ${i.author}</span>
          <div style="display:flex;gap:6px">
            ${i.status !== '완료' ? `<button class="btn-sm red" onclick="markDone('${i.id}')">완료 처리</button>` : `<span class="btn-sm done">✓ 처리 완료</span>`}
            <button class="btn-sm" onclick="showDetail('${i.id}')">상세</button>
            <button class="btn-sm" style="color:#C8001E;border-color:#fcc" onclick="deleteItem('${i.id}')">삭제</button>
          </div>
        </div>
      </div>`).join('')
    : `<div class="empty-msg">해당하는 수리 요청이 없습니다</div>`;
}

window.filterRep = function(f, el) {
  repFilter = f;
  document.querySelectorAll('.rtab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  renderRepairs();
}

// ── 점검 등록 ──────────────────────────────────────────────
window.submitReg = async function() {
  const building = document.getElementById('r-building').value;
  const date     = document.getElementById('r-date').value;
  const author   = document.getElementById('r-author').value.trim();
  const content  = document.getElementById('r-content').value.trim();
  const status   = document.getElementById('r-status').value;
  if (!building || !date || !author || !content) {
    alert('건물명, 점검일, 점검자, 점검 내용은 필수입니다.');
    return;
  }
  await addDoc(inspectionsRef, {
    building, date, author, content, status,
    zone:  document.getElementById('r-zone').value.trim(),
    memo:  document.getElementById('r-memo').value.trim(),
    createdAt: serverTimestamp(),
  });
  resetReg();
  const t = document.getElementById('reg-toast');
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 3000);
}

window.resetReg = function() {
  ['r-building','r-date','r-zone','r-author','r-content','r-memo'].forEach(id => {
    const el = document.getElementById(id);
    el.value = id === 'r-date' ? today() : id === 'r-status' ? '이상없음' : '';
  });
  document.getElementById('r-status').value = '이상없음';
}

// ── 상세 모달 ──────────────────────────────────────────────
window.showDetail = function(id) {
  const i = allData.find(x => x.id === id);
  if (!i) return;
  currentId = id;
  document.getElementById('mo-content').innerHTML = `
    <table class="mo-table">
      <tr><td>건물</td><td><strong>${i.building}</strong></td></tr>
      <tr><td>점검일</td><td>${i.date}</td></tr>
      <tr><td>점검자</td><td>${i.author}</td></tr>
      <tr><td>구역</td><td>${i.zone || '-'}</td></tr>
      <tr><td>내용</td><td style="line-height:1.7">${i.content}</td></tr>
      <tr><td>비고</td><td>${i.memo || '-'}</td></tr>
      <tr><td>상태</td><td>${badgeHtml(i.status)}</td></tr>
    </table>`;
  document.getElementById('mo-btns').innerHTML = `
    ${i.status !== '완료' ? `<button class="btn-red" onclick="markDone('${id}');closeMo()">완료 처리</button>` : ''}
    <button class="btn-outline" style="color:#C8001E;border-color:#fcc" onclick="deleteItem('${id}');closeMo()">삭제</button>
    <button class="btn-outline" onclick="closeMo()" style="margin-left:auto">닫기</button>`;
  document.getElementById('modal').classList.add('on');
}

window.closeMo = function() { document.getElementById('modal').classList.remove('on'); }

// ── 완료 처리 / 삭제 ──────────────────────────────────────
window.markDone = async function(id) {
  if (!confirm('완료 처리 하시겠습니까?')) return;
  await updateDoc(doc(db, 'inspections', id), { status: '완료' });
}

window.deleteItem = async function(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  await deleteDoc(doc(db, 'inspections', id));
}

// ── CSV 다운로드 ────────────────────────────────────────────
window.downloadCSV = function() {
  const fb = document.getElementById('f-building').value;
  const fs = document.getElementById('f-status').value;
  let d = [...allData];
  if (fb) d = d.filter(i => i.building === fb);
  if (fs) d = d.filter(i => i.status === fs);
  const rows = [['건물','점검일','점검자','구역','점검내용','비고','상태']];
  d.forEach(i => rows.push([i.building, i.date, i.author, i.zone||'', i.content, i.memo||'', i.status]));
  const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `다산북스_점검이력_${today()}.csv`;
  a.click();
}

// ── 알림 배지 ──────────────────────────────────────────────
function updateNoti() {
  const cnt = allData.filter(i => i.status === '수리필요' || i.status === '긴급').length;
  document.getElementById('noti-count').textContent = cnt;
}

// ── 유틸 ───────────────────────────────────────────────────
function badgeHtml(status) {
  const map = { '이상없음': 'badge-ok', '수리필요': 'badge-fix', '긴급': 'badge-urg', '완료': 'badge-done' };
  return `<span class="badge ${map[status] || 'badge-ok'}">${status}</span>`;
}

function today() { return new Date().toISOString().slice(0, 10); }

// ── 초기화 ─────────────────────────────────────────────────
document.getElementById('r-date').value = today();
