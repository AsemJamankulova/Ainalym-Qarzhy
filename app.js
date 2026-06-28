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

let clientsDatabase = [];
let activeProfileClientId = null;
const allowedUsers = { "saule": "12345", "sadvakask": "050910", "user3": "7777", "user4": "8888", "user5": "9999" };

async function saveToFirebase() {
    try {
        await setDoc(doc(db, "users", "admin"), { clients: clientsDatabase });
    } catch (e) { console.error("Ошибка сохранения: ", e); }
}

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
    let errorMsg = document.getElementById("auth-error-msg");
    if (allowedUsers[loginInp] && allowedUsers[loginInp] === passInp) {
        if(errorMsg) errorMsg.style.display = "none";
        localStorage.setItem("ainalym_qarzhy_user", loginInp);
        checkCurrentSession();
    } else { if(errorMsg) errorMsg.style.display = "block"; }
}

function handleLogout() {
    localStorage.removeItem("ainalym_qarzhy_user");
    checkCurrentSession();
}

function navigateToPage(pageId, clientId = null) {
    if (pageId === 'client-profile' && clientId) {
        window.location.hash = `profile?id=${clientId}`;
    } else {
        window.location.hash = pageId;
    }
}

function handleRouting() {
    if (!localStorage.getItem("ainalym_qarzhy_user")) return;
    let hash = window.location.hash.replace('#', '');
    document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
    if (hash.startsWith('profile?id=')) {
        let clientId = parseInt(hash.split('=')[1]);
        if (clientId) showClientProfilePage(clientId);
    } else {
        let pageId = hash || 'client-list';
        let element = document.getElementById('page-' + pageId);
        if (element) element.classList.add('active');
        if (pageId === 'daily-report') renderDailyReport();
        else renderTables();
    }
}

function deleteCurrentClient() {
    if (confirm("Вы уверены, что хотите удалить этот займ?")) {
        clientsDatabase = clientsDatabase.filter(c => c.id !== activeProfileClientId);
        saveToFirebase();
        alert("Займ удален!");
        navigateToPage('client-list');
    }
}

function generateClientSchedule(client) {
    if (client.payments && client.payments.length > 0) return;
    let parts = client.date.split('.');
    let startDate = new Date(parts[2], parts[1] - 1, parts[0]);
    let dayOfWeek = startDate.getDay();
    let isWeekendIssue = (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0);
    let totalWorkingDays = isWeekendIssue ? 26 : 27;
    let workingDays = [];
    let currentCheckDate = new Date(startDate);
    while (workingDays.length < totalWorkingDays) {
        currentCheckDate.setDate(currentCheckDate.getDate() + 1);
        if (currentCheckDate.getDay() !== 1) { workingDays.push(new Date(currentCheckDate)); }
    }
    let dailyPayment = Math.ceil((client.totalReturn / totalWorkingDays) / 100) * 100;
    let lastPayment = client.totalReturn - (dailyPayment * (totalWorkingDays - 1));
    client.payments = [];
    let remainingPrincipal = client.amount;
    for (let i = 0; i < totalWorkingDays; i++) {
        let currentPayment = (i === totalWorkingDays - 1) ? lastPayment : dailyPayment;
        client.payments.push({
            dayNumber: i + 1, date: workingDays[i].toLocaleDateString('ru-RU'),
            isoDate: new Date(workingDays[i].getTime() - (workingDays[i].getTimezoneOffset() * 60000)).toISOString().split('T')[0],
            amount: currentPayment, isPaid: false
        });
    }
}

function registerClient() {
    let iin = document.getElementById('regIin').value.trim();
    let name = document.getElementById('regName').value.trim();
    let phone = document.getElementById('regPhone').value.trim();
    let regDateInput = document.getElementById('regDate').value;
    let amount = parseInt(document.getElementById('regAmount').value);
    let duration = parseInt(document.getElementById('regDuration').value);
    if (!iin || !name || !phone || !regDateInput || isNaN(amount)) { alert("Заполните поля!"); return; }
    let newClient = {
        id: Date.now(), iin: iin, name: name, phone: phone, date: new Date(regDateInput).toLocaleDateString('ru-RU'),
        amount: amount, totalReturn: amount * (duration === 14 ? 1.075 : 1.15), status: "Активный", payments: []
    };
    generateClientSchedule(newClient);
    clientsDatabase.push(newClient);
    saveToFirebase();
    alert("Клиент добавлен!");
    navigateToPage('client-list');
}

function makePayment(paymentIndex) {
    let client = clientsDatabase.find(c => c.id === activeProfileClientId);
    client.payments[paymentIndex].isPaid = true;
    saveToFirebase();
    showClientProfilePage(activeProfileClientId);
}

function renderTables() {
    const tbody = document.getElementById('clients-table-body');
    if (!tbody) return;
    tbody.innerHTML = clientsDatabase.map((c, i) => `<tr><td>${i+1}</td><td>${c.name}</td><td><button onclick="navigateToPage('client-profile', ${c.id})">Открыть</button></td></tr>`).join('');
}

function setCurrentDate() {
    let today = new Date().toISOString().split('T')[0];
    if(document.getElementById('regDate')) document.getElementById('regDate').value = today;
}

document.addEventListener("DOMContentLoaded", async function() {
    setCurrentDate();
    try {
        const docSnap = await getDoc(doc(db, "users", "admin"));
        if (docSnap.exists()) { clientsDatabase = docSnap.data().clients; renderTables(); }
    } catch (e) { console.error(e); }
    checkCurrentSession();
});

window.checkLogin = checkLogin;
window.handleLogout = handleLogout;
window.registerClient = registerClient;
window.deleteCurrentClient = deleteCurrentClient;
window.makePayment = makePayment;
window.navigateToPage = navigateToPage;
