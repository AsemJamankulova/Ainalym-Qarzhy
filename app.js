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

// Функция загрузки данных
async function loadData() {
    try {
        const docSnap = await getDoc(doc(db, "users", "admin"));
        if (docSnap.exists()) {
            window.clientsDatabase = docSnap.data().clients || [];
            console.log("Данные загружены:", window.clientsDatabase);
            // Если на странице есть таблица, обновляем её
            if(typeof renderTables === 'function') renderTables();
        }
    } catch (e) {
        console.error("Ошибка Firebase:", e);
    }
}

// Привязываем функции к глобальному объекту window, чтобы кнопки в HTML видели их
window.loadData = loadData;

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    console.log("Система запущена");
});

// --- В САМЫЙ КОНЕЦ ФАЙЛА app.js ---
window.checkLogin = checkLogin;
window.handleLogout = handleLogout;
window.navigateToPage = navigateToPage;
window.toggleSidebar = toggleSidebar; // Если она у тебя есть
window.toggleSubmenu = toggleSubmenu; // Если она у тебя есть
window.registerClient = registerClient;
window.deleteCurrentClient = deleteCurrentClient;
window.issueRepeatLoan = issueRepeatLoan;
window.makeMultiPayment = makeMultiPayment;
window.recalculateMultiPayment = recalculateMultiPayment;
window.makePayment = makePayment;
window.cancelPayment = cancelPayment;
window.calculateSchedule = calculateSchedule;
window.renderDailyReport = renderDailyReport;
window.renderTables = renderTables;
window.uploadDatabase = uploadDatabase;
window.downloadDatabase = downloadDatabase;
