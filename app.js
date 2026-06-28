import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkqiJvINU1lUKlyzVkcTTAYyZm2rIB3tU",
  authDomain: "ainalym-qarzhy.firebaseapp.com",
  projectId: "ainalym-qarzhy",
  storageBucket: "ainalym-qarzhy.appspot.com",
  messagingSenderId: "575286319270",
  appId: "1:575286319270:web:b1565b7622ee028043bc67"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.clientsDatabase = [];
let activeProfileClientId = null;
const allowedUsers = { "saule": "12345", "sadvakask": "050910", "user3": "7777", "user4": "8888", "user5": "9999" };

// --- ФУНКЦИИ FIREBASE ---
async function loadData() {
    try {
        const docSnap = await getDoc(doc(db, "users", "admin"));
        if (docSnap.exists()) {
            window.clientsDatabase = docSnap.data().clients || [];
            renderTables();
        }
    } catch (e) { console.error("Ошибка Firebase:", e); }
}

async function saveToFirebase() {
    try { await setDoc(doc(db, "users", "admin"), { clients: window.clientsDatabase }); }
    catch (e) { console.error("Ошибка сохранения:", e); }
}

// --- ФУНКЦИИ CRM ---
function checkCurrentSession() {
    let loggedUser = localStorage.getItem("ainalym_qarzhy_user");
    if (loggedUser && allowedUsers[loggedUser]) {
        document.getElementById("auth-block").style.display = "none";
        document.getElementById("crm-main-interface").style.display = "block";
        document.getElementById("current-user-display").innerText = "Пользователь: " + loggedUser;
        handleRouting();
    }
}

function checkLogin() {
    let loginInp = document.getElementById("auth-login").value.trim();
    let passInp = document.getElementById("auth-password").value.trim();
    if (allowedUsers[loginInp] && allowedUsers[loginInp] === passInp) {
        localStorage.setItem("ainalym_qarzhy_user", loginInp);
        location.reload();
    } else { document.getElementById("auth-error-msg").style.display = "block"; }
}

function handleLogout() { localStorage.removeItem("ainalym_qarzhy_user"); location.reload(); }

function navigateToPage(pageId, clientId = null) {
    if (pageId === 'client-profile' && clientId) window.location.hash = `profile?id=${clientId}`;
    else window.location.hash = pageId;
}

function handleRouting() {
    if (!localStorage.getItem("ainalym_qarzhy_user")) return;
    let hash = window.location.hash.replace('#', '');
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    if (hash.startsWith('profile?id=')) {
        let clientId = parseInt(hash.split('=')[1]);
        if (clientId) showClientProfilePage(clientId);
    } else {
        let pageId = hash || 'client-list';
        let el = document.getElementById('page-' + pageId);
        if (el) el.classList.add('active');
        if (pageId === 'daily-report') renderDailyReport();
        else renderTables();
    }
}

function registerClient() {
    let iin = document.getElementById('regIin').value.trim();
    let name = document.getElementById('regName').value.trim();
    let phone = document.getElementById('regPhone').value.trim();
    let amount = parseInt(document.getElementById('regAmount').value);
    if (!iin || !name || !phone || isNaN(amount)) { alert("Заполните поля!"); return; }
    
    let newClient = { id: Date.now(), iin, name, phone, amount, totalReturn: amount * 1.15, date: new Date().toLocaleDateString('ru-RU'), status: "Активный", payments: [] };
    clientsDatabase.push(newClient);
    saveToFirebase();
    alert("Клиент добавлен!");
    navigateToPage('client-list');
}

function renderTables() {
    const body = document.getElementById('clients-table-body');
    if (!body) return;
    body.innerHTML = clientsDatabase.map((c, i) => `<tr><td>${i+1}</td><td>${c.name}</td><td>₸ ${c.amount}</td><td><button onclick="navigateToPage('client-profile', ${c.id})">Открыть</button></td></tr>`).join('');
}

function calculateSchedule() {
    let amount = parseInt(document.getElementById('loanAmount').value);
    document.getElementById('scheduleResult').innerHTML = `Расчет для ${amount}₸ выполнен.`;
}

// --- ПРИВЯЗКА КНОПОК ---
window.checkLogin = checkLogin;
window.handleLogout = handleLogout;
window.navigateToPage = navigateToPage;
window.registerClient = registerClient;
window.calculateSchedule = calculateSchedule;
window.renderTables = renderTables;

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    checkCurrentSession();
});
window.addEventListener('hashchange', handleRouting);
