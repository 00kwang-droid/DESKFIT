/* ============================================================
   데스크핏 · 자리운동일지
   - 로컬 저장(localStorage) 기반 오프라인 PWA
   - 매일 아침 부위 선택 → 스케줄 생성 → 알림 → 타이머 → 리포트
   ============================================================ */

const STORAGE_KEY = 'deskfit_v2';
const DIAL_R = 108;
const DIAL_CIRC = 2 * Math.PI * DIAL_R;

/* ---------- 부위 분류 ---------- */
const BODY_GROUPS = [
  { key: 'upper', label: '상체', parts: [
    { key: 'shoulder', label: '어깨' },
    { key: 'chest', label: '가슴' },
    { key: 'back', label: '등' },
    { key: 'arm', label: '팔' },
    { key: 'neck', label: '목' },
  ]},
  { key: 'core', label: '코어', parts: [
    { key: 'abs', label: '복부' },
    { key: 'oblique', label: '옆구리' },
    { key: 'lowerback', label: '허리' },
    { key: 'pelvic', label: '골반저' },
  ]},
  { key: 'lower', label: '하체', parts: [
    { key: 'thigh', label: '허벅지' },
    { key: 'glute', label: '엉덩이' },
    { key: 'calf', label: '종아리' },
    { key: 'ankle', label: '발목' },
  ]},
];
const PART_LABEL = {}, PART_GROUP = {}, GROUP_LABEL = {};
BODY_GROUPS.forEach(g => {
  GROUP_LABEL[g.key] = g.label;
  g.parts.forEach(p => { PART_LABEL[p.key] = p.label; PART_GROUP[p.key] = g.key; });
});
const ALL_PART_KEYS = Object.keys(PART_LABEL);

/* ---------- 운동 라이브러리 ----------
   visibility: 'invisible'(티 안 남) | 'slight'(약간 움직임)
   met: 대사당량(칼로리 계산용) / duration: 초 */
const EXERCISES = [
  // 어깨
  { id: 'sh1', name: '어깨 으쓱 홀드', part: 'shoulder', visibility: 'invisible', duration: 90, met: 2.3,
    method: '양 어깨를 귀 쪽으로 최대한 끌어올린 뒤, 그 상태로 힘을 유지하며 천천히 호흡해요.', benefit: '오래 앉아 뭉친 승모근과 목 주변 긴장을 풀어줘요.' },
  { id: 'sh2', name: '어깨날개 모으기', part: 'shoulder', visibility: 'slight', duration: 90, met: 2.5,
    method: '양쪽 날개뼈를 등 뒤 가운데로 모으듯 조이고, 가슴을 살짝 펴서 버텨요.', benefit: '라운드 숄더와 굽은 등 자세를 바로잡는 데 도움돼요.' },
  { id: 'sh3', name: '손바닥 책상 누르기', part: 'shoulder', visibility: 'invisible', duration: 60, met: 2.4,
    method: '손바닥을 책상 위에 대고 아래로 지그시 밀며 어깨 안정근에 힘을 줘요.', benefit: '어깨 관절 안정성과 바른 상체 자세를 만들어줘요.' },
  // 가슴
  { id: 'ch1', name: '합장 밀기', part: 'chest', visibility: 'invisible', duration: 60, met: 2.6,
    method: '가슴 앞에서 양손바닥을 마주 대고, 서로 힘껏 밀어내며 버텨요.', benefit: '큰가슴근(대흉근)을 자극해 상체 라인을 잡아줘요.' },
  { id: 'ch2', name: '책상 아래 밀어올리기', part: 'chest', visibility: 'slight', duration: 60, met: 2.8,
    method: '책상 아랫면에 손바닥을 대고 위로 밀어올리듯 힘을 유지해요.', benefit: '가슴과 팔 뒤쪽(삼두)을 동시에 자극해요.' },
  // 등
  { id: 'bk1', name: '의자 밑 당기기', part: 'back', visibility: 'invisible', duration: 90, met: 2.6,
    method: '앉은 채 의자 좌판 양옆을 잡고, 몸을 위로 끌어올리듯 당기며 버텨요.', benefit: '넓은등근을 활성화해 등의 힘과 자세를 살려줘요.' },
  { id: 'bk2', name: '팔꿈치 뒤로 조이기', part: 'back', visibility: 'slight', duration: 75, met: 2.4,
    method: '팔꿈치를 몸통 뒤쪽으로 최대한 당겨 등 근육을 조인 채 유지해요.', benefit: '굽은 등을 펴고 등 상부 긴장을 풀어줘요.' },
  { id: 'bk3', name: '깍지 등 뒤로 펴기', part: 'back', visibility: 'slight', duration: 60, met: 2.2,
    method: '등 뒤로 손깍지를 끼고 팔을 아래로 펴 가슴을 여는 느낌으로 버텨요.', benefit: '흉추 가동성을 높이고 어깨·등을 시원하게 펴줘요.' },
  // 팔
  { id: 'ar1', name: '손목 셀프 저항', part: 'arm', visibility: 'invisible', duration: 60, met: 2.1,
    method: '한 손으로 반대쪽 손등을 눌러 저항을 주고, 손목은 그 힘에 버텨요. 좌우 번갈아 해요.', benefit: '전완근과 손목을 강화해 마우스·타이핑 피로를 덜어줘요.' },
  { id: 'ar2', name: '이두 셀프 컬', part: 'arm', visibility: 'invisible', duration: 60, met: 2.3,
    method: '한 손을 다른 손 위에 얹고, 아래 팔은 올리려 하고 위 손은 눌러 서로 버텨요.', benefit: '팔 앞뒤(이두·삼두)를 조용히 자극해요.' },
  // 목
  { id: 'nk1', name: '목 앞 저항', part: 'neck', visibility: 'invisible', duration: 60, met: 2.0,
    method: '손바닥을 이마에 대고 앞으로 밀고, 목은 밀리지 않게 버텨요. 반동 없이 부드럽게.', benefit: '목 근력을 키워 거북목과 목 통증을 예방해요.' },
  { id: 'nk2', name: '목 옆 저항', part: 'neck', visibility: 'invisible', duration: 60, met: 2.0,
    method: '손을 관자놀이에 대고 옆으로 밀며, 목은 중앙을 유지하도록 버텨요. 좌우 번갈아요.', benefit: '목 측면 근육을 안정시켜 자세 균형을 잡아줘요.' },
  // 복부
  { id: 'ab1', name: '복부 드로인', part: 'abs', visibility: 'invisible', duration: 120, met: 2.0,
    method: '배꼽을 등 쪽으로 깊게 끌어당긴 채, 숨은 편하게 쉬며 그 긴장을 유지해요.', benefit: '코어 안정성을 높이고 아랫배를 정돈해줘요.' },
  { id: 'ab2', name: '앉아서 상체 뒤로', part: 'abs', visibility: 'slight', duration: 90, met: 2.4,
    method: '등받이에서 살짝 떨어져 상체를 조금 뒤로 기울인 채 복부에 힘을 주고 버텨요.', benefit: '복직근을 자극해 배 앞쪽을 단단하게 해줘요.' },
  { id: 'ab3', name: '복부 진공', part: 'abs', visibility: 'invisible', duration: 75, met: 1.9,
    method: '숨을 끝까지 내쉬며 배를 등 쪽으로 최대한 납작하게 넣고 잠시 멈춰요.', benefit: '속근육(복횡근)을 자극해 허리 라인과 코어를 잡아줘요.' },
  // 옆구리
  { id: 'ob1', name: '앉아서 옆으로 버티기', part: 'oblique', visibility: 'slight', duration: 75, met: 2.3,
    method: '상체를 한쪽으로 살짝 기울여 옆구리 근육을 조인 채 버티고, 반대쪽도 해요.', benefit: '복사근을 자극해 옆구리 라인을 정리해줘요.' },
  { id: 'ob2', name: '무릎-반대 팔꿈치 모으기', part: 'oblique', visibility: 'slight', duration: 60, met: 2.5,
    method: '앉은 채 한쪽 무릎과 반대쪽 팔꿈치를 가볍게 모으듯 힘을 줬다 풀어요.', benefit: '허리 회전근과 옆구리를 함께 자극해요.' },
  // 허리
  { id: 'lb1', name: '골반 기울이기', part: 'lowerback', visibility: 'invisible', duration: 90, met: 2.0,
    method: '골반을 앞뒤로 부드럽게 굴리며 허리 중립 자세를 찾아 유지해요.', benefit: '허리 뻐근함을 풀고 요통을 예방해요.' },
  { id: 'lb2', name: '척추 곧게 세워 버티기', part: 'lowerback', visibility: 'invisible', duration: 90, met: 2.1,
    method: '정수리를 위로 당기듯 척추를 곧게 세우고, 기립근에 힘을 준 채 유지해요.', benefit: '허리를 지지하는 기립근을 키워 바른 자세를 만들어요.' },
  // 골반저
  { id: 'pl1', name: '괄약근 조이기', part: 'pelvic', visibility: 'invisible', duration: 90, met: 1.9,
    method: '골반 바닥 근육을 5초 조였다가 5초 풀기를 천천히 반복해요.', benefit: '골반저 근육을 강화해 코어 하부를 안정시켜요.' },
  { id: 'pl2', name: '복부+골반저 동시 조이기', part: 'pelvic', visibility: 'invisible', duration: 75, met: 2.1,
    method: '아랫배와 골반 바닥을 함께 안으로 조여 단단히 버틴 채 호흡해요.', benefit: '코어 전체를 하나로 묶어 몸통 안정성을 높여줘요.' },
  // 허벅지
  { id: 'th1', name: '다리 들어 버티기', part: 'thigh', visibility: 'slight', duration: 90, met: 3.0,
    method: '무릎을 펴 한쪽 다리를 바닥과 수평으로 들어 버텨요. 발끝을 몸쪽으로 당기면 강도가 커져요.', benefit: '허벅지 앞(대퇴사두)을 강하게 자극해요.' },
  { id: 'th2', name: '무릎 사이 조이기', part: 'thigh', visibility: 'invisible', duration: 120, met: 2.5,
    method: '무릎 사이를 안쪽으로 힘껏 조이듯 버텨요. 주먹이나 가방을 끼우면 더 좋아요.', benefit: '허벅지 안쪽(내전근)을 조용히 단련해요.' },
  { id: 'th3', name: '발로 바닥 밀기', part: 'thigh', visibility: 'invisible', duration: 90, met: 2.6,
    method: '발바닥 전체로 바닥을 강하게 밀어내며 허벅지·엉덩이에 힘을 유지해요.', benefit: '허벅지와 둔근을 함께 자극해 하체 순환을 도와요.' },
  // 엉덩이
  { id: 'gl1', name: '둔근 조이기', part: 'glute', visibility: 'invisible', duration: 90, met: 2.2,
    method: '앉은 채 양쪽 엉덩이를 힘껏 조였다가 천천히 풀기를 반복해요.', benefit: '둔근을 활성화해 힙업과 골반 안정에 도움돼요.' },
  { id: 'gl2', name: '한쪽 엉덩이 들기', part: 'glute', visibility: 'slight', duration: 75, met: 2.5,
    method: '한쪽 엉덩이를 의자에서 살짝 들어올린 채 버티고, 좌우 번갈아 해요.', benefit: '중둔근을 자극해 골반 좌우 균형을 잡아줘요.' },
  // 종아리
  { id: 'ca1', name: '발뒤꿈치 들기', part: 'calf', visibility: 'slight', duration: 90, met: 2.8,
    method: '발끝은 바닥에 두고 양 발뒤꿈치를 천천히 최대한 들었다 내려요.', benefit: '종아리를 펌프질해 다리 혈액순환과 붓기를 도와요.' },
  { id: 'ca2', name: '발끝 들기', part: 'calf', visibility: 'slight', duration: 75, met: 2.5,
    method: '뒤꿈치는 바닥에 두고 발끝을 위로 들었다 내리기를 반복해요.', benefit: '정강이 근육을 써서 하지 부종과 저림을 완화해요.' },
  // 발목
  { id: 'an1', name: '발목 돌리기', part: 'ankle', visibility: 'slight', duration: 60, met: 2.3,
    method: '발을 살짝 든 채 발목으로 크게 원을 그리며 양방향으로 돌려요.', benefit: '발목 가동성을 높이고 다리 붓기를 풀어줘요.' },
  { id: 'an2', name: '발끝 당기기 저항', part: 'ankle', visibility: 'invisible', duration: 60, met: 2.0,
    method: '발끝을 몸쪽으로 당겨 정강이가 팽팽해지는 지점에서 버텨요.', benefit: '발목 안정성과 종아리 순환에 도움돼요.' },
];

function getExercise(id) { return EXERCISES.find(e => e.id === id); }

const INTENSITY_LEVELS = [
  { value: 'invisible', title: '완전히 안 보임', desc: '복부·코어·호흡 위주 — 옆자리에서 전혀 티가 안 나요' },
  { value: 'slight', title: '약간의 움직임 허용', desc: '다리 들기, 어깨 스트레칭 등 살짝 움직임이 있어요' },
];
const INTERVAL_OPTIONS = [45, 60, 75, 90];
const SKIP_LABELS = { '회의중': '회의 중', '외근': '외근/자리비움', '깜빡함': '깜빡함', '컨디션': '컨디션 난조', '기타': '기타' };

/* ---------- 저장소 ---------- */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { onboarded: false, settings: null, days: {}, installDate: todayKey() };
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
let state = loadState();

/* ---------- 날짜 유틸 ---------- */
function todayKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function minutesToHHMM(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function hhmmToMinutes(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토'];
function formatDateLine(d = new Date()) { return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY_KR[d.getDay()]}요일`; }
function formatShort(d) { return `${d.getMonth() + 1}.${d.getDate()}`; }

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

/* ---------- 칼로리 ---------- */
function slotKcal(slot) {
  const ex = getExercise(slot.exerciseId);
  if (!ex) return 0;
  const weight = (state.settings && state.settings.weightKg) || 65;
  const minutes = ex.duration / 60;
  return ex.met * 3.5 * weight / 200 * minutes; // MET 공식 kcal
}
function dayKcal(day) {
  if (!day) return 0;
  return day.slots.filter(s => s.status === 'done').reduce((sum, s) => sum + slotKcal(s), 0);
}

/* ---------- 스케줄 생성 ---------- */
function generateSchedule(settings, selectedParts) {
  const start = hhmmToMinutes(settings.workStart) + 30;   // 출근 30분 여유
  const end = hhmmToMinutes(settings.workEnd) - 20;        // 퇴근 20분 전 마감
  const lunchStart = hhmmToMinutes(settings.lunchStart);
  const lunchEnd = hhmmToMinutes(settings.lunchEnd);
  const step = Number(settings.interval) || 60;
  const allowVisible = settings.intensity === 'slight';

  const activeParts = (selectedParts && selectedParts.length) ? selectedParts.slice() : ALL_PART_KEYS.slice();

  // 부위별 사용 가능한 운동(강도 반영) — 매일 다르게 셔플
  const byPart = {};
  activeParts.forEach(p => {
    const list = EXERCISES.filter(e => e.part === p && (allowVisible || e.visibility === 'invisible'));
    if (list.length) byPart[p] = shuffle(list.slice());
  });
  let usableParts = Object.keys(byPart);

  // 완전히 안 보임 강도에서 고른 부위에 종목이 없으면 전체로 완화
  if (usableParts.length === 0) {
    EXERCISES.filter(e => allowVisible || e.visibility === 'invisible').forEach(e => {
      (byPart[e.part] = byPart[e.part] || []).push(e);
    });
    Object.keys(byPart).forEach(k => shuffle(byPart[k]));
    usableParts = Object.keys(byPart);
  }
  shuffle(usableParts);

  const ptr = {}; usableParts.forEach(p => ptr[p] = 0);
  const slots = [];
  let cursor = start, partIdx = 0, lastExId = null;

  while (cursor < end && usableParts.length) {
    if (cursor >= lunchStart && cursor < lunchEnd) { cursor = lunchEnd + 15; continue; }
    const part = usableParts[partIdx % usableParts.length];
    partIdx++;
    const list = byPart[part];
    let ex = list[ptr[part] % list.length];
    ptr[part]++;
    if (ex.id === lastExId && list.length > 1) { ex = list[ptr[part] % list.length]; ptr[part]++; }
    lastExId = ex.id;
    slots.push({ id: `slot_${cursor}`, time: minutesToHHMM(cursor), minutes: cursor, exerciseId: ex.id, status: 'pending', skipReason: null });
    cursor += step;
  }
  return slots;
}

/* ---------- 알림 스케줄링 ---------- */
let swRegistration = null;
function armNotificationsForToday() {
  if (!state.settings || !state.settings.notifyEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const day = state.days[todayKey()];
  if (!day) return;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  day.slots.forEach(slot => {
    if (slot.status !== 'pending') return;
    const ex = getExercise(slot.exerciseId);
    const prepMin = slot.minutes - 2;
    if (prepMin > nowMin && navigator.serviceWorker && navigator.serviceWorker.controller) {
      const delay = (prepMin - nowMin) * 60 * 1000 - now.getSeconds() * 1000;
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        payload: { title: '2분 후 운동 시작', body: `${slot.time} · ${ex.name} (${ex.duration}초) 준비해주세요`, delay, slotId: slot.id, tag: `prep_${slot.id}` },
      });
    }
    if (slot.minutes > nowMin && navigator.serviceWorker && navigator.serviceWorker.controller) {
      const delay = (slot.minutes - nowMin) * 60 * 1000 - now.getSeconds() * 1000;
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        payload: { title: `지금 시작 · ${ex.name}`, body: `${ex.duration}초 동안 진행해요. 탭하면 타이머가 열려요.`, delay, slotId: slot.id, tag: `start_${slot.id}` },
      });
    }
  });
}
async function requestNotificationPermission() {
  try {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (e) { return false; }
}

/* ---------- 오늘 화면 ---------- */
function nowMinutes() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }

function renderToday() {
  document.getElementById('date-line').textContent = formatDateLine();
  const day = state.days[todayKey()];
  const list = document.getElementById('schedule-list');

  if (!day || day.slots.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="em-title">오늘은 일정이 없어요</div>설정 → 오늘 일정 다시 만들기에서 부위를 골라보세요.</div>`;
    document.getElementById('progress-count').innerHTML = `0<span>/0 완료</span>`;
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('streak-count').textContent = `${computeStreak()}일째`;
    return;
  }

  const nm = nowMinutes();
  list.innerHTML = day.slots.map(slot => {
    const ex = getExercise(slot.exerciseId);
    const isActive = slot.status === 'pending' && nm >= slot.minutes && nm < slot.minutes + Math.ceil(ex.duration / 60) + 10;
    let statusClass = 'pending', icon = '';
    if (slot.status === 'done') { statusClass = 'done'; icon = '✓'; }
    else if (slot.status === 'skip') { statusClass = 'skip'; icon = '–'; }
    else if (isActive) { statusClass = 'active'; icon = '●'; }
    const cardStateClass = slot.status === 'done' ? 'is-done' : slot.status === 'skip' ? 'is-skip' : '';
    const kcal = Math.round(slotKcal(slot));
    return `
      <div class="slot-card ${cardStateClass}" data-slot="${slot.id}">
        <div class="slot-time">${slot.time}${isActive ? '<span class="now-dot"></span>' : ''}</div>
        <div class="slot-main">
          <div class="slot-name">${ex.name}</div>
          <div class="slot-meta">${GROUP_LABEL[PART_GROUP[ex.part]]}·${PART_LABEL[ex.part]} · ${Math.round(ex.duration / 60 * 10) / 10}분 · 약 ${kcal}kcal${slot.status === 'skip' && slot.skipReason ? ' · ' + SKIP_LABELS[slot.skipReason] : ''}</div>
        </div>
        <div class="slot-status ${statusClass}">${icon}</div>
      </div>`;
  }).join('');

  list.querySelectorAll('.slot-card').forEach(card => {
    card.addEventListener('click', () => openTimer(card.dataset.slot));
  });

  const doneCount = day.slots.filter(s => s.status === 'done').length;
  const total = day.slots.length;
  document.getElementById('progress-count').innerHTML = `${doneCount}<span>/${total} 완료</span>`;
  document.getElementById('progress-fill').style.width = total ? `${(doneCount / total) * 100}%` : '0%';
  document.getElementById('streak-count').textContent = `${computeStreak()}일째`;
}

function computeStreak() {
  let streak = 0, d = new Date();
  for (let i = 0; i < 90; i++) {
    const key = todayKey(d);
    const day = state.days[key];
    const success = day && day.slots.length > 0 && day.slots.filter(s => s.status === 'done').length / day.slots.length >= 0.6;
    if (i === 0 && !success) { d.setDate(d.getDate() - 1); continue; }
    if (!success) break;
    streak++; d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* ---------- 화면 꺼짐 방지 (Wake Lock) ---------- */
let wakeLock = null;
async function acquireWakeLock() {
  try {
    if ('wakeLock' in navigator && navigator.wakeLock && navigator.wakeLock.request) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch (e) { wakeLock = null; }
}
async function releaseWakeLock() {
  try { if (wakeLock) await wakeLock.release(); } catch (e) {} finally { wakeLock = null; }
}

/* ---------- 타이머 ---------- */
let timerState = { slotId: null, remaining: 0, total: 0, running: false, intervalId: null };

function openTimer(slotId) {
  const day = state.days[todayKey()];
  if (!day) return;
  const slot = day.slots.find(s => s.id === slotId);
  if (!slot) return;
  const ex = getExercise(slot.exerciseId);

  clearInterval(timerState.intervalId);
  timerState = { slotId, remaining: ex.duration, total: ex.duration, running: false, intervalId: null };

  document.getElementById('timer-ex-name').textContent = ex.name;
  document.getElementById('timer-method-text').textContent = ex.method;
  document.getElementById('timer-benefit-text').textContent = ex.benefit;
  document.getElementById('dial-progress').style.strokeDasharray = `${DIAL_CIRC}`;
  document.getElementById('dial-progress').style.strokeDashoffset = `0`;
  document.getElementById('dial-sub').textContent = 'TAP START';
  updateDialTime();
  document.getElementById('timer-toggle').textContent = '시작';
  document.getElementById('timer-screen').classList.remove('hidden');
}
function updateDialTime() {
  const m = Math.floor(timerState.remaining / 60), s = timerState.remaining % 60;
  document.getElementById('dial-time').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const progress = 1 - timerState.remaining / timerState.total;
  document.getElementById('dial-progress').style.strokeDashoffset = `${DIAL_CIRC * (1 - progress)}`;
}
function toggleTimer() {
  if (timerState.remaining <= 0) return;
  timerState.running = !timerState.running;
  document.getElementById('timer-toggle').textContent = timerState.running ? '일시정지' : '계속하기';
  document.getElementById('dial-sub').textContent = timerState.running ? '진행 중' : '일시정지됨';
  if (timerState.running) {
    acquireWakeLock();
    timerState.intervalId = setInterval(() => {
      timerState.remaining -= 1; updateDialTime();
      if (timerState.remaining <= 0) { clearInterval(timerState.intervalId); completeCurrentSlot(); }
    }, 1000);
  } else { clearInterval(timerState.intervalId); releaseWakeLock(); }
}
function completeCurrentSlot() {
  releaseWakeLock();
  const day = state.days[todayKey()];
  const slot = day.slots.find(s => s.id === timerState.slotId);
  if (slot) { slot.status = 'done'; slot.skipReason = null; }
  saveState();
  document.getElementById('dial-sub').textContent = '완료!';
  document.getElementById('timer-toggle').textContent = '완료됨';
  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
  showToast(`완료! 오늘 ${day.slots.filter(s => s.status === 'done').length}/${day.slots.length}`);
  setTimeout(() => { closeTimer(); renderToday(); }, 900);
}
function closeTimer() {
  clearInterval(timerState.intervalId);
  timerState.running = false;
  releaseWakeLock();
  document.getElementById('timer-screen').classList.add('hidden');
  renderToday();
}
function openSkipSheet() { document.getElementById('skip-sheet').classList.remove('hidden'); }
function closeSkipSheet() { document.getElementById('skip-sheet').classList.add('hidden'); }
function applySkip(reason) {
  const day = state.days[todayKey()];
  const slot = day.slots.find(s => s.id === timerState.slotId);
  if (slot) { slot.status = 'skip'; slot.skipReason = reason; }
  saveState(); closeSkipSheet(); closeTimer();
  showToast('다음 운동에서 다시 만나요');
}

/* ---------- 리포트 ---------- */
function localEvaluation(day) {
  if (!day || day.slots.length === 0) return '오늘은 아직 일정이 없어요. 설정에서 부위를 골라 시작해볼까요?';
  const total = day.slots.length;
  const done = day.slots.filter(s => s.status === 'done').length;
  const kcal = Math.round(dayKcal(day));
  const parts = (day.parts || []).map(k => PART_LABEL[k]).filter(Boolean).join('·') || '전신';
  const rate = done / total;
  if (done === 0) return `오늘은 <b>${parts}</b> 위주로 ${total}개가 준비돼 있어요. 알림이 뜨면 딱 한 개만 해보는 걸 목표로 가볍게 시작해봐요.`;
  if (rate >= 0.8) return `오늘 <b>${done}/${total}</b> 완료, 약 <b>${kcal}kcal</b> 소모했어요. ${parts} 위주로 아주 꾸준히 지키셨네요. 이 리듬이면 충분합니다.`;
  if (rate >= 0.5) return `<b>${done}/${total}</b> 완료, 약 <b>${kcal}kcal</b>. 절반 이상 해내셨어요. 남은 ${total - done}개 중 하나만 더 채워도 오늘이 훨씬 단단해져요.`;
  return `<b>${done}/${total}</b> 완료. 바쁜 하루였나 봐요. 무리하지 말고, 다음 알림 때 가장 쉬운 것 하나만 골라 해봐요.`;
}

function buildClaudePrompt(day) {
  const total = day.slots.length;
  const done = day.slots.filter(s => s.status === 'done').length;
  const skipped = day.slots.filter(s => s.status === 'skip');
  const kcal = Math.round(dayKcal(day));
  const parts = (day.parts || []).map(k => PART_LABEL[k]).filter(Boolean).join(', ') || '전신';
  const doneNames = day.slots.filter(s => s.status === 'done').map(s => getExercise(s.exerciseId).name);
  const skipInfo = skipped.map(s => `${getExercise(s.exerciseId).name}(${SKIP_LABELS[s.skipReason] || '건너뜀'})`);

  let p = '나는 사무실 자리에 앉아 티 안 나게 하는 등척성 운동을 실천하는 직장인이야. 오늘 운동 기록을 아래에 정리했어.\n\n';
  p += `- 오늘 목표 부위: ${parts}\n`;
  p += `- 완료: ${done}/${total}개, 소모 칼로리 약 ${kcal}kcal\n`;
  p += `- 완료한 운동: ${doneNames.length ? doneNames.join(', ') : '없음'}\n`;
  p += `- 건너뛴 운동: ${skipInfo.length ? skipInfo.join(', ') : '없음'}\n\n`;
  p += '이 기록을 바탕으로 (1) 오늘 하루 운동에 대한 따뜻하지만 솔직한 짧은 평가와, (2) 내일 더 잘할 수 있는 구체적인 팁 1~2가지를 코치처럼 말해줘. 너무 길지 않게 부탁해.';
  return p;
}

function openClaudeEval() {
  const day = state.days[todayKey()];
  if (!day || day.slots.length === 0) { showToast('먼저 오늘 일정을 만들어주세요'); return; }
  const url = 'https://claude.ai/new?q=' + encodeURIComponent(buildClaudePrompt(day));
  window.open(url, '_blank');
}

function renderReport() {
  const today = new Date();
  const todayD = state.days[todayKey()];

  // 오늘 요약
  const tTotal = todayD ? todayD.slots.length : 0;
  const tDone = todayD ? todayD.slots.filter(s => s.status === 'done').length : 0;
  document.getElementById('today-done').textContent = `${tDone}/${tTotal}`;
  document.getElementById('today-kcal').innerHTML = `${Math.round(dayKcal(todayD))}<small>kcal</small>`;
  document.getElementById('today-eval-text').innerHTML = localEvaluation(todayD);

  // 주간
  const days7 = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(today); d.setDate(today.getDate() - i); days7.push({ key: todayKey(d), date: d }); }
  document.getElementById('report-week-line').textContent = `${formatShort(days7[0].date)} – ${formatShort(days7[6].date)}`;

  let totalDone = 0, totalSlots = 0, weekKcal = 0;
  const timeBucket = {};
  days7.forEach(({ key }) => {
    const d = state.days[key];
    if (!d) return;
    weekKcal += dayKcal(d);
    d.slots.forEach(s => {
      totalSlots++;
      if (s.status === 'done') totalDone++;
      if (!timeBucket[s.time]) timeBucket[s.time] = { done: 0, total: 0 };
      timeBucket[s.time].total++;
      if (s.status === 'done') timeBucket[s.time].done++;
    });
  });

  const rate = totalSlots ? Math.round((totalDone / totalSlots) * 100) : 0;
  document.getElementById('stat-rate').textContent = `${rate}%`;
  document.getElementById('stat-week-kcal').innerHTML = `${Math.round(weekKcal)}<small>kcal</small>`;

  let best = 0, cur = 0;
  for (let i = 89; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const day = state.days[todayKey(d)];
    const success = day && day.slots.length > 0 && day.slots.filter(s => s.status === 'done').length / day.slots.length >= 0.6;
    if (success) { cur++; best = Math.max(best, cur); } else { cur = 0; }
  }
  document.getElementById('stat-streak').textContent = `${best}일`;

  let bestTime = '-', bestRate = -1;
  Object.entries(timeBucket).forEach(([time, v]) => { const r = v.done / v.total; if (r > bestRate) { bestRate = r; bestTime = time; } });
  document.getElementById('stat-best-time').textContent = bestTime;

  const chart = document.getElementById('week-chart');
  chart.innerHTML = days7.map(({ key, date }) => {
    const d = state.days[key];
    const r = d && d.slots.length ? (d.slots.filter(s => s.status === 'done').length / d.slots.length) : 0;
    const isToday = key === todayKey();
    return `<div class="week-bar-wrap"><div class="week-bar ${isToday ? 'today' : ''}" style="height:${Math.max(4, r * 100)}%"></div><div class="week-bar-label">${WEEKDAY_KR[date.getDay()]}</div></div>`;
  }).join('');

  const insight = document.getElementById('insight-card');
  if (totalSlots === 0) insight.innerHTML = '아직 기록이 없어요. 오늘 첫 운동부터 시작해볼까요?';
  else if (rate >= 80) insight.innerHTML = `이번 주 실행률 <b>${rate}%</b> — 정말 꾸준하시네요. 특히 <b>${bestTime}</b> 시간대를 가장 잘 지키고 계세요.`;
  else if (rate >= 40) insight.innerHTML = `이번 주 실행률 <b>${rate}%</b>. <b>${bestTime}</b> 시간대는 잘 지키고 계시니, 그 리듬을 다른 시간대에도 적용해보세요.`;
  else insight.innerHTML = `이번 주는 실행이 뜸했어요. 알림을 켜거나, 설정에서 운동 간격을 넓혀 부담을 줄여보는 건 어떨까요?`;
}

/* ---------- 설정 ---------- */
function renderChipOptions(containerId, options, current, onSelect) {
  const el = document.getElementById(containerId);
  el.innerHTML = options.map(o => `<div class="chip-opt ${current === o.value ? 'selected' : ''}" data-value="${o.value}">${o.label}</div>`).join('');
  el.querySelectorAll('.chip-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      el.querySelectorAll('.chip-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      onSelect(opt.dataset.value);
    });
  });
}
function renderIntensityOptions(containerId, current, onSelect) {
  const el = document.getElementById(containerId);
  el.innerHTML = INTENSITY_LEVELS.map(lv => `
    <div class="intensity-opt ${current === lv.value ? 'selected' : ''}" data-value="${lv.value}">
      <div class="opt-title">${lv.title}</div><div class="opt-desc">${lv.desc}</div>
    </div>`).join('');
  el.querySelectorAll('.intensity-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      el.querySelectorAll('.intensity-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected'); onSelect(opt.dataset.value);
    });
  });
}
function renderSettings() {
  const s = state.settings;
  document.getElementById('setting-work-start').value = s.workStart;
  document.getElementById('setting-work-end').value = s.workEnd;
  document.getElementById('setting-lunch-start').value = s.lunchStart;
  document.getElementById('setting-lunch-end').value = s.lunchEnd;
  document.getElementById('setting-weight').value = s.weightKg || 65;
  document.getElementById('toggle-notify').classList.toggle('on', s.notifyEnabled);
  renderChipOptions('setting-interval-options', INTERVAL_OPTIONS.map(v => ({ value: v, label: `${v}분` })), Number(s.interval), (val) => { s.interval = Number(val); saveState(); });
  renderIntensityOptions('intensity-options', s.intensity, (val) => { s.intensity = val; saveState(); });
}

/* ---------- 토스트 ---------- */
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- 데이터 백업 ---------- */
function exportData() {
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deskfit-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast('백업 파일을 저장했어요');
  } catch (e) { showToast('백업에 실패했어요'); }
}
function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || typeof data.days !== 'object' || !data.settings) {
        showToast('올바른 백업 파일이 아니에요'); return;
      }
      state = { onboarded: !!data.onboarded, settings: data.settings, days: data.days || {}, installDate: data.installDate || todayKey() };
      saveState();
      showToast('백업을 불러왔어요');
      setTimeout(() => location.reload(), 700);
    } catch (e) { showToast('파일을 읽지 못했어요'); }
  };
  reader.onerror = () => showToast('파일을 읽지 못했어요');
  reader.readAsText(file);
}
async function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const already = await navigator.storage.persisted();
      if (!already) await navigator.storage.persist(); // 자동 삭제(eviction) 방지
    }
  } catch (e) { /* 무시 */ }
}

/* ---------- 탭 전환 ---------- */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('view-today').classList.toggle('hidden', tab !== 'today');
  document.getElementById('view-report').classList.toggle('hidden', tab !== 'report');
  document.getElementById('view-settings').classList.toggle('hidden', tab !== 'settings');
  if (tab === 'report') renderReport();
  if (tab === 'settings') renderSettings();
  if (tab === 'today') renderToday();
}

/* ---------- 온보딩(최초 1회) ---------- */
function initOnboarding() {
  let intensity = 'invisible', interval = 60;
  renderIntensityOptions('ob-intensity-options', intensity, v => { intensity = v; });
  renderChipOptions('ob-interval-options', INTERVAL_OPTIONS.map(v => ({ value: v, label: `${v}분` })), interval, v => { interval = Number(v); });

  const btn = document.getElementById('ob-start-btn');
  btn.onclick = async () => {
    state.settings = {
      workStart: document.getElementById('ob-work-start').value || '09:00',
      workEnd: document.getElementById('ob-work-end').value || '18:00',
      lunchStart: document.getElementById('ob-lunch-start').value || '12:00',
      lunchEnd: document.getElementById('ob-lunch-end').value || '13:00',
      weightKg: Number(document.getElementById('ob-weight').value) || 65,
      intensity, interval, notifyEnabled: true,
    };
    state.onboarded = true;
    state.days = {};
    saveState();
    document.getElementById('onboard-screen').classList.add('hidden');
    boot();
    try { if (await requestNotificationPermission()) armNotificationsForToday(); } catch (e) {}
  };
}

/* ---------- 매일 아침 부위 선택 ---------- */
let dailySelected = new Set();
function showDailyPicker() {
  dailySelected = new Set();
  const wrap = document.getElementById('daily-parts');
  wrap.innerHTML = BODY_GROUPS.map(g => `
    <div class="part-group">
      <div class="pg-head">
        <div class="pg-title">${g.label}</div>
        <div class="pg-all" data-group="${g.key}">전체 선택</div>
      </div>
      <div class="part-chips">
        ${g.parts.map(p => `<div class="part-chip" data-part="${p.key}">${p.label}</div>`).join('')}
      </div>
    </div>`).join('');

  wrap.querySelectorAll('.part-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const k = chip.dataset.part;
      if (dailySelected.has(k)) { dailySelected.delete(k); chip.classList.remove('selected'); }
      else { dailySelected.add(k); chip.classList.add('selected'); }
    });
  });
  wrap.querySelectorAll('.pg-all').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = BODY_GROUPS.find(x => x.key === btn.dataset.group);
      const allSelected = g.parts.every(p => dailySelected.has(p.key));
      g.parts.forEach(p => {
        const chip = wrap.querySelector(`.part-chip[data-part="${p.key}"]`);
        if (allSelected) { dailySelected.delete(p.key); chip.classList.remove('selected'); }
        else { dailySelected.add(p.key); chip.classList.add('selected'); }
      });
    });
  });

  document.getElementById('daily-start-btn').onclick = () => {
    const parts = Array.from(dailySelected);
    const key = todayKey();
    state.days[key] = { parts, slots: generateSchedule(state.settings, parts) };
    saveState();
    document.getElementById('daily-screen').classList.add('hidden');
    renderToday(); switchTab('today');
    armNotificationsForToday();
    showToast(parts.length ? '오늘 스케줄을 만들었어요' : '전신 밸런스로 짰어요');
  };

  document.getElementById('daily-screen').classList.remove('hidden');
}

/* ---------- 이벤트 바인딩 ---------- */
function bindEvents() {
  document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  document.getElementById('timer-close').addEventListener('click', closeTimer);
  document.getElementById('timer-toggle').addEventListener('click', toggleTimer);
  document.getElementById('timer-skip').addEventListener('click', openSkipSheet);
  document.querySelectorAll('.sheet-opt').forEach(o => o.addEventListener('click', () => applySkip(o.dataset.reason)));
  document.getElementById('skip-sheet').addEventListener('click', (e) => { if (e.target.id === 'skip-sheet') closeSkipSheet(); });
  document.getElementById('btn-claude-eval').addEventListener('click', openClaudeEval);

  document.getElementById('setting-work-start').addEventListener('change', (e) => { state.settings.workStart = e.target.value; saveState(); });
  document.getElementById('setting-work-end').addEventListener('change', (e) => { state.settings.workEnd = e.target.value; saveState(); });
  document.getElementById('setting-lunch-start').addEventListener('change', (e) => { state.settings.lunchStart = e.target.value; saveState(); });
  document.getElementById('setting-lunch-end').addEventListener('change', (e) => { state.settings.lunchEnd = e.target.value; saveState(); });
  document.getElementById('setting-weight').addEventListener('change', (e) => { state.settings.weightKg = Number(e.target.value) || 65; saveState(); });
  document.getElementById('toggle-notify').addEventListener('click', async (e) => {
    const willEnable = !state.settings.notifyEnabled;
    if (willEnable) { const ok = await requestNotificationPermission(); if (!ok) { showToast('알림 권한이 필요해요'); return; } }
    state.settings.notifyEnabled = willEnable; saveState();
    e.currentTarget.classList.toggle('on', willEnable);
    if (willEnable) armNotificationsForToday();
  });
  document.getElementById('regenerate-btn').addEventListener('click', () => { showDailyPicker(); });

  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    importData(f);
    e.target.value = '';
  });

  // 화면 복귀 시 타이머가 진행 중이면 화면 꺼짐 방지 잠금 재획득 (잠금은 화면이 숨으면 자동 해제됨)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && timerState.running && !wakeLock) acquireWakeLock();
  });
}

/* ---------- 부팅 ---------- */
function boot() {
  if (!state.onboarded || !state.settings) {
    document.getElementById('onboard-screen').classList.remove('hidden');
    initOnboarding();
    return;
  }
  if (!state.days[todayKey()]) { showDailyPicker(); return; }
  renderToday(); switchTab('today'); armNotificationsForToday();
}

let swRefreshing = false;
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    // 이미 제어 중인 상태에서 새 SW가 활성화되면 한 번만 새로고침 (첫 로드 땐 컨트롤러가 없어 재로딩 안 함)
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || swRefreshing) return;
      swRefreshing = true;
      window.location.reload();
    });

    swRegistration = await navigator.serviceWorker.register('sw.js');
    // 새 버전 확인 강제 (탭이 열려 있는 동안 배포된 업데이트도 잡도록)
    swRegistration.update().catch(() => {});

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'OPEN_TIMER' && event.data.slotId) openTimer(event.data.slotId);
    });
  } catch (e) { console.warn('SW 등록 실패', e); }
}

window.addEventListener('DOMContentLoaded', async () => {
  bindEvents();
  requestPersistentStorage();
  await registerSW();
  boot();
  setInterval(() => { if (!document.getElementById('view-today').classList.contains('hidden')) renderToday(); }, 60000);
});
