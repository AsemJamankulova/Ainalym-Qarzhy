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

window.registerClient = registerClient;
window.calculateSchedule = calculateSchedule;
window.navigateToPage = navigateToPage;
window.checkLogin = checkLogin;
window.handleLogout = handleLogout;
window.makePayment = makePayment;
window.deleteCurrentClient = deleteCurrentClient;
window.recalculateMultiPayment = recalculateMultiPayment;
window.makeMultiPayment = makeMultiPayment;
window.cancelPayment = cancelPayment;
