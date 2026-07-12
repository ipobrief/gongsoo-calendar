import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyA5hpZmgpr5NptGPpqekMm67rn8pi6UeEA',
  authDomain: 'even-sun-459809-h4.firebaseapp.com',
  projectId: 'even-sun-459809-h4',
  storageBucket: 'even-sun-459809-h4.firebasestorage.app',
  messagingSenderId: '880516507760',
  appId: '1:880516507760:web:6f8703df818f2717db2cb5'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
let hydrating = false;

const $ = (selector) => document.querySelector(selector);
const storeKey = 'gongsoo-calendar-v1';
const calendarRef = (uid) => doc(db, 'users', uid, 'calendar', 'main');
const readLocal = () => JSON.parse(localStorage.getItem(storeKey) || '{"records":{},"settings":{}}');

function showAccount(user) {
  $('#loginButton').textContent = user ? `${user.displayName || '내 계정'}님` : '로그인';
}

async function writeCalendar(payload, force = false) {
  const user = auth.currentUser;
  if (!user || (hydrating && !force)) return;
  await setDoc(calendarRef(user.uid), { payload, updatedAt: payload.updatedAt || Date.now(), savedAt: serverTimestamp() }, { merge: true });
}

async function hydrateCalendar(user) {
  hydrating = true;
  try {
    const snapshot = await getDoc(calendarRef(user.uid));
    const local = readLocal();
    const remote = snapshot.exists() ? snapshot.data().payload : null;
    if (remote && (remote.updatedAt || 0) > (local.updatedAt || 0)) {
      window.dispatchEvent(new CustomEvent('gongsoo:remote-data', { detail: remote }));
    } else {
      await writeCalendar(local, true);
    }
  } catch (error) {
    console.warn('Calendar sync unavailable:', error.code || error.message);
  } finally {
    hydrating = false;
  }
}

async function signIn() {
  try {
    await signInWithPopup(auth, provider);
    $('#loginDialog').close();
  } catch (error) {
    $('#loginMessage').textContent = '로그인에 실패했습니다. Firebase 인증 설정과 허용 도메인을 확인해 주세요.';
  }
}

function openAccountDialog() {
  const dialog = $('#loginDialog');
  const user = auth.currentUser;
  $('#googleLoginBox').innerHTML = '';
  $('#loginUser').hidden = !user;
  if (user) {
    $('#loginUser').innerHTML = `<b>${user.displayName || 'Google 계정'}</b>${user.email || ''}`;
    $('#loginMessage').textContent = '공수 기록이 이 Google 계정에 자동 동기화됩니다.';
    const logout = document.createElement('button');
    logout.type = 'button'; logout.className = 'secondary'; logout.textContent = '로그아웃';
    logout.onclick = async () => { await signOut(auth); dialog.close(); };
    $('#googleLoginBox').append(logout);
  } else {
    $('#loginMessage').textContent = 'Google 계정으로 로그인하면 공수 기록이 자동 동기화됩니다.';
    const login = document.createElement('button');
    login.type = 'button'; login.className = 'primary'; login.textContent = 'Google로 로그인'; login.onclick = signIn;
    $('#googleLoginBox').append(login);
  }
  dialog.showModal();
}

$('#loginButton').onclick = openAccountDialog;
window.addEventListener('gongsoo:local-save', (event) => { writeCalendar(event.detail).catch(() => {}); });
onAuthStateChanged(auth, (user) => { showAccount(user); if (user) hydrateCalendar(user); });
