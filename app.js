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

const allowedUsers = { "saule": "12345", "sadvakask": "050910", "user3": "7777", "user4": "8888", "user5": "9999" };
let clientsDatabase = [];
let activeProfileClientId = null;

// ФУНКЦИЯ ОБЛАЧНОГО СОХРАНЕНИЯ
async function saveToLocalStorage() {
    try {
        await setDoc(doc(db, "users", "admin"), { clients: clientsDatabase });
    } catch (e) { console.error("Ошибка сохранения: ", e); }
}

// ... ОСТАЛЬНАЯ ТВОЯ ЛОГИКА ...
// (Ниже я вставила все твои функции, которые ты присылала раньше)

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
        localStorage.setItem("ainalym_qarzhy_user", loginInp); 
        checkCurrentSession(); 
    } else {
        errorMsg.style.display = "block"; 
    }
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

// Добавь сюда остальные свои функции (registerClient, deleteCurrentClient, generateClientSchedule и т.д.)
// Важно: в функциях, где у тебя было saveToLocalStorage(), напиши: await saveToLocalStorage();

function setCurrentDate() {
    let today = new Date().toISOString().split('T')[0];
    if(document.getElementById('regDate')) document.getElementById('regDate').value = today;
    if(document.getElementById('dailyReportDate')) document.getElementById('dailyReportDate').value = today;
}

// ФИНАЛЬНАЯ ЗАГРУЗКА
window.addEventListener('hashchange', handleRouting);
document.addEventListener("DOMContentLoaded", async function() {
    setCurrentDate();
    
    try {
        const docSnap = await getDoc(doc(db, "users", "admin"));
        if (docSnap.exists()) {
            clientsDatabase = docSnap.data().clients;
        }
    } catch (e) { console.error("Ошибка загрузки:", e); }
    
    checkCurrentSession();
});
