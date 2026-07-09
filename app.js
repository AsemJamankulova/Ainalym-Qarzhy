import {
    db,
    collection,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
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
        login: "saule",
        password: "100110",
        role: "admin",
        fullName: "Садвакас Сауле Турлыбековна"
    },

    manager1: {
        login: "janibek",
        password: "291295",
        role: "manager",
        fullName: "Аманжолов Жанибек "
    },

    manager2: {
        login: "manager2",
        password: "12345",
        role: "manager",
        fullName: "Менеджер 2"
    },

    cashier1: {
        login: "cashier1",
        password: "12345",
        role: "cashier",
        fullName: "Кассир 1"
    },

    cashier2: {
        login: "cashier2",
        password: "12345",
        role: "cashier",
        fullName: "Кассир 2"
    },

    cashier3: {
        login: "cashier3",
        password: "12345",
        role: "cashier",
        fullName: "Кассир 3"
    },

    cashier4: {
        login: "cashier4",
        password: "12345",
        role: "cashier",
        fullName: "Кассир 4"
    },

    cashier5: {
        login: "cashier5",
        password: "12345",
        role: "cashier",
        fullName: "Кассир 5"
    }

};

// -------------------------
// Основные переменные
// -------------------------

let currentUser = "";
let currentRole = "";

let clientsDatabase = [];

let activeProfileClientId = null;

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

    clientsDatabase = [];

    const { collection, getDocs } = await import(
        "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
    );

    const snapshot = await getDocs(
        collection(db, "clients")
    );

    snapshot.forEach(doc => {

    const client = {

        firebaseId: doc.id,

        ...doc.data()

    };

    // Если долг закрыт — автоматически меняем статус
    if ((client.remaining || 0) <= 0) {

        client.remaining = 0;
        client.status = "closed";

    }

    clientsDatabase.push(client);

});
async function fixClientStatuses() {

    const snapshot = await window.getDocs(
        window.collection(window.db, "clients")
    );

    for (const document of snapshot.docs) {

        const data = document.data();

        await window.updateDoc(
            window.doc(window.db, "clients", document.id),
            {
                status: data.remaining <= 0 ? "closed" : "active"
            }
        );

    }

    alert("✅ Статусы всех клиентов обновлены!");

    await loadFromLocalStorage();

    renderClients();

}
    // ==========================
    // Открыть клиента по ссылке
    // ==========================

    const params = new URLSearchParams(window.location.search);
    const clientId = params.get("client");

    if (clientId) {

        const client = clientsDatabase.find(c => c.id == clientId);

        if (client) {
            openClient(client.id);
        }

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

    // Сохраняем пользователя
    localStorage.setItem(
        "ainalym_qarzhy_user",
        JSON.stringify({
            login: foundUser.login,
            role: foundUser.role,
            fullName: foundUser.fullName
        })
    );

    localStorage.setItem("crmUser", currentUser);
    localStorage.setItem("crmRole", currentRole);

    openCRM();

}

// ===============================================
// ОТКРЫТИЕ CRM
// ===============================================

function openCRM() {

    document.getElementById("auth-block").style.display = "none";

    document.getElementById("crm-main-interface").style.display = "block";

    document.getElementById("current-user-display").innerHTML =
        "👤 " + currentUser;

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

    document.getElementById("crm-main-interface").style.display = "none";

    document.getElementById("auth-block").style.display = "flex";

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

    // Проверка прав доступа
    const currentUser = JSON.parse(localStorage.getItem("ainalym_qarzhy_user"));

    if (
        pageId === "client-reg" &&
        currentUser &&
        currentUser.role === "cashier"
    ) {
        alert("❌ У вас нет доступа к регистрации клиентов.");
        return;
    }

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
// ИСПРАВЛЕННАЯ РЕГИСТРАЦИЯ КЛИЕНТА
// ===============================================

async function registerClient() {
    console.log("Начинаю регистрацию...");

    const iin = document.getElementById("regIin").value.trim();
    const name = document.getElementById("regName").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const address = document.getElementById("regAddress").value.trim();
    const issueDate = document.getElementById("regDate").value;
    const amount = Number(document.getElementById("regAmount").value);
    const duration = Number(document.getElementById("regDuration").value);

    // 1. Проверка полей
    if (!iin || !name || !phone || !address || !issueDate || amount <= 0) {
        alert("Заполните все поля корректно.");
        return;
    }

    // 2. Расчеты
    const percent = getLoanPercent(duration);
    const totalReturn = Math.round(amount * (1 + percent / 100));
    const workingDays = getWorkingPayments(issueDate, duration);
    const dailyPayment = roundUp100(totalReturn / workingDays);

    const client = {
        id: Date.now(), // Временный ID
        iin, name, phone, address, issueDate,
        amount, duration, percent, totalReturn,
        dailyPayment, workingDays,
        remaining: totalReturn,
        status: "active",
        history: [],
        schedule: generateSchedule(issueDate, duration, dailyPayment)
    };

    try {
        // 3. Сохраняем в Firebase
        // Мы НЕ делаем push в массив вручную, чтобы избежать дублей
        await window.addDoc(window.collection(window.db, "clients"), client);
        
        console.log("Клиент успешно сохранен в Firebase");

        // 4. Очищаем форму СРАЗУ, чтобы пользователь не нажал кнопку дважды
        clearRegistrationForm();

        // 5. Полная перезагрузка данных из базы
        await loadFromLocalStorage();

        // 6. Обновляем интерфейс
        renderClients();
        renderGeneralReport();

        alert("✅ Займ успешно выдан!");

    } catch (error) {
        console.error("Ошибка:", error);
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

    const tbody =
        document.getElementById("clients-table-body");

    tbody.innerHTML = "";

    let index = 1;

    clientsDatabase.forEach(client => {

        // Закрытые
        if (
            currentClientFilter === "closed" &&
            client.status !== "closed"
        ) {
            return;
        }

        // Активные
        if (
            currentClientFilter === "active" &&
            client.status === "closed"
        ) {
            return;
        }

        // Должники
        if (
            currentClientFilter === "overdue" &&
            !client.overdue
        ) {
            return;
        }

        tbody.innerHTML += `

        <tr>

            <td>${index++}</td>

            <td>${client.issueDate || "-"}</td>

            <td>${client.name || "-"}</td>

            <td>${client.duration || 0} дней</td>

            <td>₸ ${Number(client.amount || 0).toLocaleString()}</td>

            <td>₸ ${Number(client.totalReturn || 0).toLocaleString()}</td>

            <td>${client.status === "closed" ? "Закрыт" : "Активный"}</td>

            <td>
                <button onclick="showClientProfile(${client.id})">
                    Открыть
                </button>
            </td>

        </tr>

        `;

    });

}
// ===============================================
// ФИЛЬТР КЛИЕНТОВ
// ===============================================

let currentClientFilter = "all";

function setClientFilter(filter) {

    currentClientFilter = filter;

    renderClients();

}

window.setClientFilter = setClientFilter;

/// ===============================================
// ОТКРЫТЬ ПРОФИЛЬ КЛИЕНТА
// ===============================================

function openClient(clientId) {

    const client = clientsDatabase.find(c => c.id === clientId);

    if (!client) {

        alert("Клиент не найден.");

        return;

    }

    activeProfileClientId = clientId;

    // Обновляем ссылку в браузере
   window.history.replaceState(
    {},
    "",
    `${window.location.origin}${window.location.pathname}?client=${clientId}`
);

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

    window.history.replaceState(
    {},
    "",
    "#client=" + clientId
);

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

    console.log(client);

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

  if (client.remaining <= 0) {

    client.remaining = 0;

    client.status = "closed";

}

    // Записываем оплату в ежедневную кассу
    addToDailyCash(cashDate, total);

    await window.setDoc(
        window.doc(window.db, "clients", client.firebaseId),
        client,
        { merge: true }
    );

    await loadFromLocalStorage();

    renderClients();

    showClientProfile(client.id);

    updateMultiPaymentAmount();

    // Если сейчас открыта ежедневная касса — сразу обновляем ее
    const reportDate = document.getElementById("dailyReportDate");

    if (reportDate) {
        reportDate.value = cashDate;
        renderDailyReport();
    }

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

    const currentUser = JSON.parse(
        localStorage.getItem("ainalym_qarzhy_user")
    );

    const cashierName = currentUser.fullName || currentUser.login;

    if (!dailyCash[date]) {
        dailyCash[date] = {};
    }

    if (!dailyCash[date][cashierName]) {
        dailyCash[date][cashierName] = 0;
    }

    dailyCash[date][cashierName] += amount;

    saveDailyCash();

}

function renderDailyReport() {

    const dateInput = document.getElementById("dailyReportDate");

    // Если дата не выбрана — автоматически ставим сегодняшнюю
    if (!dateInput.value) {

        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        dateInput.value = `${year}-${month}-${day}`;

    }

    const date = dateInput.value;

    const tbody =
        document.getElementById("daily-report-table-body");

    tbody.innerHTML = "";

    let total = 0;

    const cashiers = dailyCash[date] || {};

    for (const cashier in cashiers) {

        const amount = cashiers[cashier];

        total += amount;

        tbody.innerHTML += `

        <tr>

            <td>${date}</td>

            <td>${cashier}</td>

            <td>₸ ${amount.toLocaleString()}</td>

        </tr>

        `;

    }

    document.getElementById("daily-collected-sum").textContent =
        "₸ " + total.toLocaleString();

}
// ===============================================
// ОБЩИЙ ИТОГ
// ===============================================

function renderGeneralReport() {

    let issued = 0;
    let collected = 0;
    let remaining = 0;
    let profit = 0;

    let active = 0;
    let closed = 0;

    clientsDatabase.forEach(client => {

        const amount = Number(client.amount || 0);
        const totalReturn = Number(client.totalReturn || 0);
        const balance = Number(client.remaining || 0);

        issued += amount;

        collected += (totalReturn - balance);

        remaining += balance;

        // Доход = только проценты
        profit += (totalReturn - amount);

        if (balance > 0) {

            active++;

        } else {

            closed++;

        }

    });

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
// ЗАПУСК ПРИЛОЖЕНИЯ
// ===============================================

loadFromLocalStorage();
loadDailyCash();

renderClients();
renderGeneralReport();

document.getElementById("regDate").valueAsDate = new Date();
document.getElementById("cashPaymentDate").valueAsDate = new Date();
function cancelLastPayment() {

    if (activeProfileClientId == null) return;

    const client = clientsDatabase.find(
        c => c.id === activeProfileClientId
    );

    if (!client) return;

    for (let i = client.schedule.length - 1; i >= 0; i--) {

        const payment = client.schedule[i];

        if (payment.paid) {

            payment.paid = false;

            client.remaining += payment.amount;

            saveToLocalStorage();

            refreshClientProfile();

            renderGeneralReport();

            alert("↩ Последняя оплата отменена.");

            return;

        }

    }

    alert("Нет оплаченных дней.");

}

// ===============================================
// УДАЛИТЬ КЛИЕНТА (ИСПРАВЛЕННЫЙ ВАРИАНТ)
// ===============================================

window.deleteCurrentClient = async function() {
    console.log("Попытка удаления. ID клиента:", activeProfileClientId);

    if (activeProfileClientId == null) {
        alert("Клиент не выбран.");
        return;
    }

    const client = clientsDatabase.find(
        c => String(c.id) === String(activeProfileClientId)
    );

    if (!client) {
        alert("Клиент не найден в базе.");
        return;
    }

    if (!confirm("Удалить этот займ?")) return;

    try {
        // Удаляем из Firebase
        if (client.firebaseId) {
            await window.deleteDoc(
                window.doc(window.db, "clients", client.firebaseId)
            );
        }

        // Удаляем из массива
        clientsDatabase = clientsDatabase.filter(
            c => String(c.id) !== String(activeProfileClientId)
        );

        // Обновляем всё на экране
        renderClients();
        renderGeneralReport();
        navigateToPage("client-list");

        alert("✅ Займ удалён.");
    } catch (error) {
        console.error("Ошибка удаления:", error);
        alert("Ошибка при удалении: " + error.message);
    }
};
// ===============================================
// ПРИВЯЗКА ФУНКЦИЙ К КНОПКАМ (ТОЛЬКО ОДИН РАЗ)
// ===============================================

window.checkLogin = checkLogin;
window.navigateToPage = navigateToPage;
window.calculateSchedule = calculateSchedule;
window.registerClient = registerClient;
window.showClientProfile = showClientProfile;
window.paySeveralDays = paySeveralDays;
window.updateMultiPaymentAmount = updateMultiPaymentAmount;
window.cancelLastPayment = cancelLastPayment;
window.renderDailyReport = renderDailyReport;
window.toggleSidebar = toggleSidebar;
window.deleteCurrentClient = deleteCurrentClient;
window.setClientFilter = setClientFilter;
// ===============================================
// КОПИРОВАТЬ ССЫЛКУ НА КЛИЕНТА
// ===============================================

function copyClientLink() {

    if (!activeProfileClientId) {
        alert("Профиль клиента не открыт.");
        return;
    }

    const link = window.location.href;

    navigator.clipboard.writeText(link)
        .then(() => {
            alert("✅ Ссылка на клиента скопирована!");
        })
        .catch(() => {
            alert("Не удалось скопировать ссылку.");
        });

}
window.copyClientLink = copyClientLink;
