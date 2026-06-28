import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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

// ОБЩИЕ ПЕРЕМЕННЫЕ
let clientsDatabase = [];
let activeProfileClientId = null;
const allowedUsers = { "saule": "12345", "sadvakask": "050910", "user3": "7777", "user4": "8888", "user5": "9999" };

// ФУНКЦИИ FIREBASE
async function saveToFirebase() {
    try { await setDoc(doc(db, "users", "admin"), { clients: clientsDatabase }); } 
    catch (e) { console.error("Ошибка сохранения: ", e); }
}

async function loadFromFirebase() {
    try {
        const docSnap = await getDoc(doc(db, "users", "admin"));
        if (docSnap.exists()) {
            clientsDatabase = docSnap.data().clients;
            if (typeof renderTables === 'function') renderTables();
        }
    } catch (e) { console.error("Ошибка загрузки:", e); }
}

// АВТОРИЗАЦИЯ
function checkCurrentSession() {
    let loggedUser = localStorage.getItem("ainalym_qarzhy_user");
    if (loggedUser && allowedUsers[loggedUser]) {
        document.getElementById("auth-block").style.display = "none";
        document.getElementById("crm-main-interface").style.display = "block";
        document.getElementById("current-user-display").innerText = "Пользователь: " + loggedUser;
        handleRouting(); 
    } else {
        document.getElementById("auth-block").style.display = "flex";
        document.getElementById("crm-main-interface").style.display = "none";
    }
}

function checkLogin() {
    let loginInp = document.getElementById("auth-login").value.trim();
    let passInp = document.getElementById("auth-password").value.trim();
    if (allowedUsers[loginInp] && allowedUsers[loginInp] === passInp) {
        localStorage.setItem("ainalym_qarzhy_user", loginInp);
        checkCurrentSession();
    } else { alert("Неверный логин или пароль"); }
}

function handleLogout() { localStorage.removeItem("ainalym_qarzhy_user"); checkCurrentSession(); }

// НАВИГАЦИЯ И УПРАВЛЕНИЕ
function navigateToPage(pageId, clientId = null) {
    window.location.hash = (pageId === 'client-profile' && clientId) ? `profile?id=${clientId}` : pageId;
}

function handleRouting() {
    if (!localStorage.getItem("ainalym_qarzhy_user")) return;
    let hash = window.location.hash.replace('#', '');
    document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
    if (hash.startsWith('profile?id=')) showClientProfilePage(parseInt(hash.split('=')[1]));
    else {
        let pageId = hash || 'client-list';
        let element = document.getElementById('page-' + pageId);
        if (element) element.classList.add('active');
        if (pageId === 'daily-report') renderDailyReport();
        else renderTables();
    }
}

function deleteCurrentClient() {
    if (confirm("Удалить займ?")) {
        clientsDatabase = clientsDatabase.filter(c => c.id !== activeProfileClientId);
        saveToFirebase();
        navigateToPage('client-list');
    }
}

function generateClientSchedule(client) {
    if (client.payments && client.payments.length > 0) return;
    let parts = client.date.split('.');
    let startDate = new Date(parts[2], parts[1] - 1, parts[0]);
    let totalWorkingDays = ([5, 6, 0].includes(startDate.getDay())) ? 26 : 27;
    
    let workingDays = [];
    let d = new Date(startDate);
    while (workingDays.length < totalWorkingDays) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 1) workingDays.push(new Date(d));
    }

    let dailyPayment = Math.ceil((client.totalReturn / totalWorkingDays) / 100) * 100;
    let lastPayment = client.totalReturn - (dailyPayment * (totalWorkingDays - 1));
    client.payments = [];
    let rem = client.amount;
    for (let i = 0; i < totalWorkingDays; i++) {
        let p = (i === totalWorkingDays - 1) ? lastPayment : dailyPayment;
        client.payments.push({
            dayNumber: i + 1, date: workingDays[i].toLocaleDateString('ru-RU'),
            isoDate: workingDays[i].toISOString().split('T')[0],
            amount: p, principalPortion: Math.min(p, rem), profitPortion: Math.max(0, p - rem), isPaid: false
        });
        rem -= Math.min(p, rem);
    }
}

function registerClient() {
    let amount = parseInt(document.getElementById('regAmount').value);
    let duration = parseInt(document.getElementById('regDuration').value);
    let newClient = {
        id: Date.now(), iin: document.getElementById('regIin').value, name: document.getElementById('regName').value,
        phone: document.getElementById('regPhone').value, address: document.getElementById('regAddress').value || "Не указан",
        date: new Date(document.getElementById('regDate').value).toLocaleDateString('ru-RU'),
        duration, amount, totalReturn: amount * (duration === 14 ? 1.075 : 1.15), status: "Активный", payments: []
    };
    generateClientSchedule(newClient);
    clientsDatabase.push(newClient);
    saveToFirebase();
    alert("Клиент добавлен!");
    navigateToPage('client-list');
}

function makePayment(idx) {
    let client = clientsDatabase.find(c => c.id === activeProfileClientId);
    client.payments[idx].isPaid = true;
    if (client.payments.every(p => p.isPaid)) client.status = "Закрыт";
    saveToFirebase();
    showClientProfilePage(activeProfileClientId);
}

function renderTables() {
    const tbody = document.getElementById('clients-table-body');
    if (!tbody) return;
    let filtered = clientsDatabase.filter(c => c.status === (document.getElementById('statusFilter')?.value || "Активный"));
    tbody.innerHTML = filtered.map((c, i) => `<tr><td>${i+1}</td><td>${c.name}</td><td><button onclick="navigateToPage('client-profile', ${c.id})">Открыть</button></td></tr>`).join('');
}

function setCurrentDate() {
    let today = new Date().toISOString().split('T')[0];
    if(document.getElementById('regDate')) document.getElementById('regDate').value = today;
    if(document.getElementById('dailyReportDate')) document.getElementById('dailyReportDate').value = today;
}

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener("DOMContentLoaded", async () => {
    setCurrentDate();
    await loadFromFirebase();
    checkCurrentSession();
});

window.checkLogin = checkLogin;
window.handleLogout = handleLogout;
window.registerClient = registerClient;
window.deleteCurrentClient = deleteCurrentClient;
window.makePayment = makePayment;
window.navigateToPage = navigateToPage;
window.addEventListener('hashchange', handleRouting);
