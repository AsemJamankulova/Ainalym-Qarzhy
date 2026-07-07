import {
    db,
    collection,
    getDocs,
    addDoc,
    setDoc,
    doc,
    deleteDoc
} from "./firebase.js";
// ===============================================
// AINALYM QARZHY CRM
// Версия 2.0
// ===============================================

// -------------------------
// Пользователи
// -------------------------

const USERS = {

    admin: {
        login: "admin",
        password: "12345",
        role: "admin"
    },

    manager: {
        login: "manager",
        password: "12345",
        role: "manager"
    },

    cashier: {
        login: "cashier",
        password: "12345",
        role: "cashier"
    }

};

// -------------------------
// Основные переменные
// -------------------------

let currentUser = "";
let currentRole = "";

let clientsDatabase = [];

let activeProfileClientId = null;
let currentClientFilter = "all"; // <--- ОБЯЗАТЕЛЬНО ДОБАВЬ ЭТУ СТРОКУ

// Ежедневная касса
let dailyCash = {};
// -------------------------
// LocalStorage
// -------------------------

// ===============================================
// FIREBASE
// ===============================================

async function saveToLocalStorage() {
    // Пока ничего не делаем.
    // Клиенты теперь сохраняются сразу в Firebase.
}

async function loadFromLocalStorage() {
    // 1. ПРИНУДИТЕЛЬНО очищаем массив перед тем, как что-то загружать.
    // Это гарантирует, что старых данных в памяти не останется.
    clientsDatabase = [];

    try {
        // 2. Импортируем Firebase модули
        const { collection, getDocs } = await import(
            "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
        );

        // 3. Получаем данные из коллекции "clients"
        const snapshot = await getDocs(collection(db, "clients"));

        // 4. Очищаем массив еще раз для надежности (на случай, если был сбой)
        clientsDatabase = [];

        snapshot.forEach(doc => {
            // Добавляем документ в массив
            clientsDatabase.push({
                firebaseId: doc.id,
                ...doc.data()
            });
        });

        console.log("Успешно загружено клиентов:", clientsDatabase.length);

    } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
    }
}

// ===============================================
// АВТОРИЗАЦИЯ
// ===============================================

function checkLogin() {

    const login =
        document.getElementById("auth-login").value.trim();

    const password =
        document.getElementById("auth-password").value.trim();

    const error =
        document.getElementById("auth-error-msg");

    let foundUser = null;

    Object.values(USERS).forEach(user => {

        if (
            user.login === login &&
            user.password === password
        ) {
            foundUser = user;
        }

    });

    if (!foundUser) {

        error.style.display = "block";
        return;

    }

    error.style.display = "none";

    currentUser = foundUser.login;
    currentRole = foundUser.role;

    localStorage.setItem("crmUser", currentUser);
    localStorage.setItem("crmRole", currentRole);

    openCRM();

}

// ===============================================
// ОТКРЫТИЕ CRM
// ===============================================

async function openCRM() {

    // 1. Прячем экран входа и показываем интерфейс
    document.getElementById("auth-block").style.display = "none";
    document.getElementById("crm-main-interface").style.display = "block";
    document.getElementById("current-user-display").innerHTML = "👤 " + currentUser;

    // 2. ОДИН РАЗ загружаем данные из Firebase, когда пользователь вошел
    await loadFromLocalStorage();
    
    // 3. Обновляем интерфейс
    renderClients();
    renderGeneralReport();

    // 4. Переходим на страницу
    navigateToPage("calculator");
}

// ===============================================
// ВЫХОД
// ===============================================

function handleLogout() {

    localStorage.removeItem("crmUser");
    localStorage.removeItem("crmRole");

    currentUser = "";
    currentRole = "";
    
    // Очищаем данные из памяти при выходе, чтобы не было «призраков»
    clientsDatabase = []; 

    document.getElementById("crm-main-interface").style.display = "none";
    document.getElementById("auth-block").style.display = "flex";
    
    // Перезагружаем страницу, чтобы полностью сбросить состояние сайта
    window.location.reload(); 
}

// ===============================================
// ПРОВЕРКА СЕССИИ
// ===============================================

function checkSession() {

    const user =
        localStorage.getItem("crmUser");

    const role =
        localStorage.getItem("crmRole");

    if (!user) return;

    currentUser = user;
    currentRole = role;

    openCRM();

}


// ===============================================
// НАВИГАЦИЯ
// ===============================================

function navigateToPage(pageId) {

    // Скрываем все страницы
    document.querySelectorAll(".page-section").forEach(page => {

        page.classList.remove("active");
        page.style.display = "none";

    });

    // Показываем нужную
    const currentPage =
        document.getElementById("page-" + pageId);

    if (currentPage) {

        currentPage.classList.add("active");
        currentPage.style.display = "block";

    }

    // Подсветка меню
    document.querySelectorAll(".menu-item").forEach(item => {

        item.classList.remove("active");

    });

    document.querySelectorAll(".menu-item").forEach(item => {

        const text =
            item.innerText.trim();

        if (
            (pageId === "calculator" && text.includes("Калькулятор")) ||
            (pageId === "client-list" && text.includes("Клиенты")) ||
            (pageId === "client-reg" && text.includes("Регистрация")) ||
            (pageId === "daily-report" && text.includes("Ежедневная")) ||
            (pageId === "monthly-report" && text.includes("Общий"))
        ) {

            item.classList.add("active");

        }

    });

    // Автоматически обновляем страницы
    if (pageId === "daily-report") {

        renderDailyReport();

    }

    if (pageId === "monthly-report") {

        renderGeneralReport();

    }

}

// ===============================================
// МОБИЛЬНОЕ МЕНЮ
// ===============================================

function toggleSidebar() {

    document
        .getElementById("sidebar")
        .classList.toggle("show");

}
// ===============================================
// ФУНКЦИИ КАЛЬКУЛЯТОРА
// ===============================================

// Округление вверх до 100 тенге
function roundUp100(value) {

    return Math.ceil(value / 100) * 100;

}

// Получить процент займа
function getLoanPercent(duration) {

    if (duration == 14) return 7.5;

    if (duration == 31) return 15;

    return 0;

}

// Получить количество рабочих платежей
function getWorkingPayments(issueDate, duration) {

    if (duration == 14) {

        return 12;

    }

    const day = new Date(issueDate).getDay();

    // Вторник, Среда, Четверг
    if (day === 2 || day === 3 || day === 4) {

        return 27;

    }

    // Пятница, Суббота, Воскресенье
    return 26;

}
// ===============================================
// РАСЧЁТ КАЛЬКУЛЯТОРА
// ===============================================

function calculateSchedule() {

    const amount = Number(document.getElementById("loanAmount").value);
    const duration = Number(document.getElementById("durationDays").value);

    if (!amount || amount <= 0) {

        alert("Введите сумму займа");

        return;

    }

    const today = new Date();

    const percent = getLoanPercent(duration);

    const totalReturn = Math.round(amount * (1 + percent / 100));

    const workingPayments = getWorkingPayments(today, duration);

    let payment = roundUp100(totalReturn / workingPayments);

    let remaining = totalReturn;

    let html = `
        <h3>Расчёт займа</h3>

        <p><b>Сумма:</b> ₸ ${amount.toLocaleString()}</p>

        <p><b>Процент:</b> ${percent}%</p>

        <p><b>К возврату:</b> ₸ ${totalReturn.toLocaleString()}</p>

        <hr>

        <table class="crm-table">

        <thead>

        <tr>

        <th>День</th>

        <th>Платёж</th>

        </tr>

        </thead>

        <tbody>
    `;

    for (let i = 1; i <= workingPayments; i++) {

        let currentPayment = payment;

        if (i === workingPayments) {

            currentPayment = remaining;

        }

        remaining -= currentPayment;

        html += `
            <tr>

                <td>${i}</td>

                <td>₸ ${currentPayment.toLocaleString()}</td>

            </tr>
        `;

    }

    html += `
        </tbody>

        </table>
    `;

    document.getElementById("scheduleResult").innerHTML = html;

}
// ===============================================
// РЕГИСТРАЦИЯ КЛИЕНТА
// ===============================================

async function registerClient() {

    console.log("REGISTER CLIENT");

    const iin = document.getElementById("regIin").value.trim();
    const name = document.getElementById("regName").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const address = document.getElementById("regAddress").value.trim();
    const issueDate = document.getElementById("regDate").value;
    const amount = Number(document.getElementById("regAmount").value);
    const duration = Number(document.getElementById("regDuration").value);

    if (
        iin === "" ||
        name === "" ||
        phone === "" ||
        address === "" ||
        issueDate === "" ||
        amount <= 0
    ) {
        alert("Заполните все поля.");
        return;
    }

    const percent = getLoanPercent(duration);

    const totalReturn =
        Math.round(amount * (1 + percent / 100));

    const workingDays =
        getWorkingPayments(issueDate, duration);

    const dailyPayment =
        roundUp100(totalReturn / workingDays);

    const client = {

        id: Date.now(),

        iin,
        name,
        phone,
        address,

        issueDate,

        amount,
        duration,

        percent,

        totalReturn,

        dailyPayment,

        workingDays,

        remaining: totalReturn,

        status: "Активный",

        history: [],

        schedule: generateSchedule(
            issueDate,
            duration,
            dailyPayment
        )

    };

    try {
        // 1. Сохраняем в Firebase
        const docRef = await window.addDoc(
            window.collection(window.db, "clients"),
            client
        );

        console.log("Сохранено!", docRef.id);

        // 2. ВАЖНО: Перезагружаем список из базы данных, чтобы массив clientsDatabase 
        // был актуальным и без дублей
        await loadFromLocalStorage();

        // 3. Обновляем интерфейс
        renderClients();
        renderGeneralReport();
        clearRegistrationForm();

        alert("✅ Займ успешно выдан!");

    } catch (error) {

        console.error(error);

        alert("Ошибка при сохранении: " + error.message);

    }
}
// ===============================================
// ОЧИСТКА ФОРМЫ РЕГИСТРАЦИИ
// ===============================================

function clearRegistrationForm() {

    document.getElementById("regIin").value = "";
    document.getElementById("regName").value = "";
    document.getElementById("regPhone").value = "";
    document.getElementById("regAddress").value = "";
    document.getElementById("regAmount").value = "";

    document.getElementById("regDuration").value = "14";

    document.getElementById("regDate").value =
        new Date().toISOString().split("T")[0];

}
// ===============================================
// СПИСОК КЛИЕНТОВ
// ===============================================

function renderClients() {
    const tbody = document.getElementById("clients-table-body");
    if (!tbody) return; // Чтобы сайт не падал, если таблицы нет на странице

    tbody.innerHTML = ""; // Очищаем таблицу

    // Используем window.clientsDatabase, чтобы точно достать данные
    const data = window.clientsDatabase || [];

    // Фильтруем данные перед отрисовкой
    const filteredClients = data.filter(client => {
        if (currentClientFilter === "active") return client.status === "Активный";
        if (currentClientFilter === "debtor") return client.status === "Должник";
        if (currentClientFilter === "closed") return client.status === "Закрытый";
        return true; // Если "all" или что-то другое - показываем всех
    });

    filteredClients.forEach((client, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${client.issueDate || "-"}</td>
            <td>${client.name || "-"}</td>
            <td>${client.duration || 0} дней</td>
            <td>₸ ${Number(client.amount || 0).toLocaleString()}</td>
            <td>₸ ${Number(client.totalReturn || 0).toLocaleString()}</td>
            <td>${client.status || "Активный"}</td>
            <td>
                <button onclick="showClientProfile('${client.id}')">
                    Открыть
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ===============================================
// ОТКРЫТЬ ПРОФИЛЬ КЛИЕНТА
// ===============================================

function openClient(clientId) {

    const client = clientsDatabase.find(c => c.id === clientId);

    if (!client) {

        alert("Клиент не найден.");

        return;

    }

    activeProfileClientId = clientId;

    document.getElementById("profName").textContent = client.name;
    document.getElementById("profIin").textContent = client.iin;
    document.getElementById("profPhone").textContent = client.phone;
    document.getElementById("profAddress").textContent = client.address;
    document.getElementById("profDate").textContent = client.issueDate;

    document.getElementById("profAmount").textContent =
        "₸ " + client.amount.toLocaleString();

    document.getElementById("profTotalReturn").textContent =
        "₸ " + client.totalReturn.toLocaleString();

    document.getElementById("profRemaining").textContent =
        "₸ " + client.remaining.toLocaleString();

    // ===== ГРАФИК ПЛАТЕЖЕЙ =====

    const tbody = document.getElementById("paymentScheduleBody");

    tbody.innerHTML = "";

    client.schedule.forEach(day => {

        tbody.innerHTML += `

        <tr>

            <td>${day.day}</td>

            <td>${day.date}</td>

            <td>₸ ${day.amount.toLocaleString()}</td>

            <td>${day.paid ? "✅ Оплачено" : "⏳ Не оплачено"}</td>

        </tr>

        `;

    });

    navigateToPage("client-profile");

}
// ===============================================
// СОЗДАНИЕ ГРАФИКА ПЛАТЕЖЕЙ
// ===============================================

function generateSchedule(issueDate, duration, payment) {

    let schedule = [];

    let currentDate = new Date(issueDate);

    // Первый день оплаты — следующий день после выдачи
    currentDate.setDate(currentDate.getDate() + 1);

    const totalDays = getWorkingPayments(issueDate, duration);

    let dayNumber = 1;

    while (schedule.length < totalDays) {

        // Понедельник пропускаем
        if (currentDate.getDay() !== 1) {

            schedule.push({

                day: dayNumber,

                date: currentDate.toISOString().split("T")[0],

                amount: payment,

                paid: false

            });

            dayNumber++;

        }

        currentDate.setDate(currentDate.getDate() + 1);

    }

    return schedule;

}

// ===============================================
// ОБНОВИТЬ ПРОФИЛЬ КЛИЕНТА
// ===============================================

function refreshClientProfile() {

    if (activeProfileClientId == null) return;

    const client = clientsDatabase.find(
        c => c.id === activeProfileClientId
    );

    if (!client) return;

    renderClientSchedule(client);

}
function showClientProfile(clientId) {

    const client = clientsDatabase.find(
        c => String(c.id) === String(clientId)
    );

    if (!client) {
        alert("Клиент не найден.");
        return;
    }

    activeProfileClientId = clientId;

    document.getElementById("profName").textContent =
        client.name || "";

    document.getElementById("profIin").textContent =
        client.iin || "";

    document.getElementById("profPhone").textContent =
        client.phone || "";

    document.getElementById("profAddress").textContent =
        client.address || "";

    document.getElementById("profDate").textContent =
        client.issueDate || "";

    document.getElementById("profAmount").textContent =
        "₸ " + Number(client.amount || 0).toLocaleString();

    document.getElementById("profTotalReturn").textContent =
        "₸ " + Number(client.totalReturn || 0).toLocaleString();

    document.getElementById("profRemaining").textContent =
        "₸ " + Number(client.remaining || 0).toLocaleString();

    renderClientSchedule(client);

    navigateToPage("client-profile");
}
// ===============================================
// ПОЛУЧИТЬ ПЕРВЫЙ НЕОПЛАЧЕННЫЙ ПЛАТЁЖ
// ===============================================

function getNextPayment(client) {

    return client.schedule.find(day => !day.paid);

}
// ===============================================
// ОПЛАТА ЗА ОДИН ДЕНЬ
// ===============================================

async function payOneDay() {

    if (activeProfileClientId == null) {

        alert("Клиент не выбран.");
        return;

    }

    const client = clientsDatabase.find(
        c => c.id === activeProfileClientId
    );

    if (!client) return;

    const payment = getNextPayment(client);

    if (!payment) {

        alert("✅ Займ уже полностью оплачен.");
        return;

    }

    payment.paid = true;

    client.remaining -= payment.amount;

    if (client.remaining < 0) {

        client.remaining = 0;

    }

    // Сохраняем обновлённого клиента в Firebase
    await window.setDoc(
        window.doc(window.db, "clients", client.firebaseId),
        client
    );

    // Загружаем список заново из Firebase
    await loadFromLocalStorage();

    refreshClientProfile();

    renderGeneralReport();

    alert("✅ Оплата принята.");

}
// ===============================================
// КНОПКА ОПЛАТЫ В ГРАФИКЕ
// ===============================================

function renderClientSchedule(client) {

    const tbody = document.getElementById("profile-schedule-body");

    if (!tbody) return;

    tbody.innerHTML = "";

    client.schedule.forEach(day => {

        tbody.innerHTML += `

        <tr>

            <td>${day.day}</td>

            <td>${day.date}</td>

            <td>₸ ${day.amount.toLocaleString()}</td>

            <td>-</td>

            <td>${day.paid ? "✅ Оплачено" : "⏳ Не оплачено"}</td>

            <td>

                ${day.paid
                    ? ""
                    : `<button onclick="payOneDay()">Оплата</button>`}

            </td>

        </tr>

        `;

    });

}
// ===============================================
// СУММА ОПЛАТЫ ЗА НЕСКОЛЬКО ДНЕЙ
// ===============================================

function calculateMultiPayment(client, days) {

    let total = 0;

    let count = 0;

    for (const payment of client.schedule) {

        if (!payment.paid && count < days) {

            total += payment.amount;

            count++;

        }

    }

    return total;

}
// ===============================================
// ОПЛАТА ЗА НЕСКОЛЬКО ДНЕЙ
// ===============================================

function updateMultiPaymentAmount() {

    if (activeProfileClientId == null) return;

    const client = clientsDatabase.find(
        c => c.id === activeProfileClientId
    );

    if (!client) return;

    const days = Number(document.getElementById("payDays").value);

    const total = calculateMultiPayment(client, days);

    document.getElementById("multiPayAmount").textContent =
        "К оплате: ₸ " + total.toLocaleString();

}

async function paySeveralDays() {

    if (activeProfileClientId == null) return;

    const client = clientsDatabase.find(
        c => String(c.id) === String(activeProfileClientId)
    );

    if (!client) {
        alert("Клиент не найден.");
        return;
    }

    const days = Number(document.getElementById("payDays").value);

    let cashDate =
        document.getElementById("cashPaymentDate").value;

    if (!cashDate) {
        alert("Выберите дату для ежедневной кассы.");
        return;
    }

    let paid = 0;
    let total = 0;

    for (const payment of client.schedule) {

        if (!payment.paid && paid < days) {

            payment.paid = true;
            client.remaining -= payment.amount;
            total += payment.amount;
            paid++;

        }

    }

    if (client.remaining < 0) {
        client.remaining = 0;
    }

    addToDailyCash(cashDate, total);

    console.log(client);
    console.log(client.firebaseId);

    await window.setDoc(
        window.doc(window.db, "clients", client.firebaseId),
        client,
        { merge: true }
    );

    await loadFromLocalStorage();

    renderClients();

    showClientProfile(client.id);

    updateMultiPaymentAmount();

    alert(
        "✅ Принята оплата на сумму ₸ " +
        total.toLocaleString()
    );

}
// ===============================================
// ЕЖЕДНЕВНАЯ КАССА
// ===============================================

function saveDailyCash() {

    localStorage.setItem(
        "dailyCash",
        JSON.stringify(dailyCash)
    );

}

function loadDailyCash() {

    const data = localStorage.getItem("dailyCash");

    if (data) {

        dailyCash = JSON.parse(data);

    }

}

function addToDailyCash(date, amount) {

    if (!dailyCash[date]) {

        dailyCash[date] = 0;

    }

    dailyCash[date] += amount;

    saveDailyCash();

}

function renderDailyReport() {

    const date =
        document.getElementById("dailyReportDate").value;

    // Если дата ещё не выбрана — ничего не показываем
    if (!date) return;

    const tbody =
        document.getElementById("daily-report-table-body");

    tbody.innerHTML = "";

    let sum = dailyCash[date] || 0;

    document.getElementById("daily-collected-sum").textContent =
        "₸ " + sum.toLocaleString();

    if (sum > 0) {

        tbody.innerHTML = `

        <tr>

            <td>${date}</td>

            <td>₸ ${sum.toLocaleString()}</td>

        </tr>

        `;

    }

}
// ===============================================
// ОБЩИЙ ИТОГ
// ===============================================

function renderGeneralReport() {

    let issued = 0;
    let collected = 0;
    let remaining = 0;

    let active = 0;
    let closed = 0;

    clientsDatabase.forEach(client => {

        const amount = Number(client.amount || 0);
        const totalReturn = Number(client.totalReturn || 0);
        const balance = Number(client.remaining || 0);

        issued += amount;

        collected += (totalReturn - balance);

        remaining += balance;

        if (balance > 0) {

            active++;

        } else {

            closed++;

        }

    });

    const profit = collected - issued;

    document.getElementById("total-issued").textContent =
        "₸ " + issued.toLocaleString();

    document.getElementById("total-collected").textContent =
        "₸ " + collected.toLocaleString();

    document.getElementById("total-profit").textContent =
        "₸ " + profit.toLocaleString();

    document.getElementById("total-remaining").textContent =
        "₸ " + remaining.toLocaleString();

    document.getElementById("total-active-count").textContent =
        active;

    document.getElementById("total-closed-count").textContent =
        closed;

}
// ===============================================
// ИНИЦИАЛИЗАЦИЯ И ЗАПУСК
// ===============================================

async function init() {
    try {
        // 1. Грузим данные
        await loadFromLocalStorage();
        
        // 2. Инициализируем элементы
        if (document.getElementById("regDate")) document.getElementById("regDate").valueAsDate = new Date();
        if (document.getElementById("cashPaymentDate")) document.getElementById("cashPaymentDate").valueAsDate = new Date();
        
        loadDailyCash();
        renderClients();
        renderGeneralReport();
        
        // 3. Проверка ссылки для открытия профиля
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('clientId');
        if (clientId) {
            showClientProfile(clientId);
        }
        
        console.log("CRM готова к работе");
    } catch (err) {
        console.error("Ошибка при старте:", err);
    }
}

// Запускаем всё один раз
init();

// ===============================================
// УПРАВЛЕНИЕ КЛИЕНТАМИ
// ===============================================

window.showClientProfile = function(clientId) {
    // Ищем клиента и по id, и по firebaseId для надежности
    const client = clientsDatabase.find(c => String(c.id) === String(clientId) || String(c.firebaseId) === String(clientId));
    
    if (!client) {
        alert("Клиент не найден.");
        return;
    }

    activeProfileClientId = clientId;

    document.getElementById("profName").textContent = client.name || "";
    document.getElementById("profIin").textContent = client.iin || "";
    document.getElementById("profPhone").textContent = client.phone || "";
    document.getElementById("profAddress").textContent = client.address || "";
    document.getElementById("profDate").textContent = client.issueDate || "";
    document.getElementById("profAmount").textContent = "₸ " + Number(client.amount || 0).toLocaleString();
    document.getElementById("profTotalReturn").textContent = "₸ " + Number(client.totalReturn || 0).toLocaleString();
    document.getElementById("profRemaining").textContent = "₸ " + Number(client.remaining || 0).toLocaleString();

    if (typeof renderClientSchedule === "function") {
        renderClientSchedule(client);
    }
    window.navigateToPage("client-profile");
};

window.deleteCurrentClient = async function() {
    if (activeProfileClientId == null) return;
    const client = clientsDatabase.find(c => String(c.id) === String(activeProfileClientId) || String(c.firebaseId) === String(activeProfileClientId));

    if (!client || !confirm("Удалить этот займ?")) return;

    if (client.firebaseId && window.deleteDoc && window.doc && window.db) {
        await window.deleteDoc(window.doc(window.db, "clients", client.firebaseId));
    }

    clientsDatabase = clientsDatabase.filter(c => String(c.id) !== String(activeProfileClientId) && String(c.firebaseId) !== String(activeProfileClientId));
    
    if (typeof renderClients === "function") renderClients();
    if (typeof renderGeneralReport === "function") renderGeneralReport();
    
    window.navigateToPage("client-list");
    alert("✅ Займ удалён.");
};

window.cancelLastPayment = function() {
    if (activeProfileClientId == null) return;
    const client = clientsDatabase.find(c => String(c.id) === String(activeProfileClientId) || String(c.firebaseId) === String(activeProfileClientId));
    if (!client) return;

    for (let i = client.schedule.length - 1; i >= 0; i--) {
        if (client.schedule[i].paid) {
            client.schedule[i].paid = false;
            client.remaining += client.schedule[i].amount;
            
            window.showClientProfile(activeProfileClientId);
            if (typeof renderGeneralReport === "function") renderGeneralReport();
            alert("↩ Последняя оплата отменена.");
            return;
        }
    }
    alert("Нет оплаченных дней.");
};

// ===============================================
// ФИЛЬТР КЛИЕНТОВ (ИСПРАВЛЕННЫЙ)
// ===============================================

window.setClientFilter = function(filter) {
    console.log("Установлен фильтр:", filter);
    
    // Присваиваем значение глобальной переменной
    currentClientFilter = filter; 

    // Вызываем функцию отрисовки, если она существует
    if (typeof renderClients === "function") {
        renderClients();
    }
};
// ===============================================
// РАБОТА СО ССЫЛКАМИ (ДЛЯ EXCEL)
// ===============================================

window.copyClientLink = function() {
    if (activeProfileClientId == null) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const link = `${baseUrl}?clientId=${activeProfileClientId}`;
    navigator.clipboard.writeText(link).then(() => {
        alert("✅ Ссылка скопирована!");
    });
};

// ===============================================
// РЕГИСТРАЦИЯ ФУНКЦИЙ ДЛЯ КНОПОК
// ===============================================

window.setClientFilter = function(filter) {
    console.log("Установлен фильтр:", filter);
    
    // Перевод названий кнопок в значения фильтра
    if (filter === "Все") currentClientFilter = "all";
    else if (filter === "Активный") currentClientFilter = "active";
    else if (filter === "Должник") currentClientFilter = "debtor";
    else if (filter === "Неактивный") currentClientFilter = "closed";
    else currentClientFilter = filter;

    if (typeof renderClients === "function") {
        renderClients();
    }
};

// ===============================================
// РЕГИСТРАЦИЯ ФУНКЦИЙ ДЛЯ КНОПОК
// ===============================================

window.setClientFilter = function(filter) {
    console.log("Установлен фильтр:", filter);
    
    // Перевод названий кнопок в значения фильтра
    if (filter === "Все") currentClientFilter = "all";
    else if (filter === "Активный") currentClientFilter = "active";
    else if (filter === "Должник") currentClientFilter = "debtor";
    else if (filter === "Неактивный") currentClientFilter = "closed";
    else currentClientFilter = filter;

    if (typeof renderClients === "function") {
        renderClients();
    }
};

window.showClientProfile = showClientProfile;
window.navigateToPage = navigateToPage;
window.registerClient = registerClient;
window.paySeveralDays = paySeveralDays;
window.cancelLastPayment = cancelLastPayment;
window.deleteCurrentClient = deleteCurrentClient;
window.checkLogin = checkLogin;
window.toggleSidebar = toggleSidebar;
window.renderDailyReport = renderDailyReport;
window.calculateSchedule = calculateSchedule;
window.copyClientLink = copyClientLink;
window.updateMultiPaymentAmount = updateMultiPaymentAmount;
