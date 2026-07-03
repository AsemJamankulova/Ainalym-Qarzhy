// ==========================================
// 1. БАЗА ДАННЫХ ПОЛЬЗОВАТЕЛЕЙ CRM
// ==========================================
const allowedUsers = {
    "saule": {
        password: "12345",
        role: "admin"
    },

    "sadvakask": {
        password: "050910",
        role: "manager"
    },

    "user3": {
        password: "7777",
        role: "cashier"
    },

    "user4": {
        password: "8888",
        role: "cashier"
    },

    "user5": {
        password: "9999",
        role: "cashier"
    }
};

// ==========================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ==========================================
let currentUser = null;
let currentRole = null;

// ==========================================
// 2. БЛОК АВТОРИЗАЦИИ И СЕССИЙ
// ==========================================
function checkCurrentSession() {

    let loggedUser = localStorage.getItem("ainalym_qarzhy_user");

    if (loggedUser && allowedUsers[loggedUser]) {

        // Загружаем пользователя и роль
        currentUser = loggedUser;
        currentRole = allowedUsers[loggedUser].role;

        // Обновляем localStorage
        localStorage.setItem("ainalym_qarzhy_user", currentUser);
        localStorage.setItem("ainalym_qarzhy_role", currentRole);

        document.getElementById("auth-block").style.display = "none";
        document.getElementById("crm-main-interface").style.display = "block";
        document.getElementById("current-user-display").innerText =
            "Пользователь: " + currentUser;

        handleRouting();

    } else {

        currentUser = null;
        currentRole = null;

        document.getElementById("auth-block").style.display = "flex";
        document.getElementById("crm-main-interface").style.display = "none";

    }
}

function checkLogin() {

    const loginInp = document.getElementById("auth-login").value.trim();
    const passInp = document.getElementById("auth-password").value.trim();
    const errorMsg = document.getElementById("auth-error-msg");

    const user = allowedUsers[loginInp];

    if (user && user.password === passInp) {

        errorMsg.style.display = "none";

        localStorage.setItem("ainalym_qarzhy_user", loginInp);
        localStorage.setItem("ainalym_qarzhy_role", user.role);

        currentUser = loginInp;
        currentRole = user.role;

        document.getElementById("auth-login").value = "";
        document.getElementById("auth-password").value = "";

        checkCurrentSession();

    } else {

        errorMsg.style.display = "block";

    }
}
function handleLogout() {

    localStorage.removeItem("ainalym_qarzhy_user");
    localStorage.removeItem("ainalym_qarzhy_role");

    currentUser = null;
    currentRole = null;

    window.location.hash = "";

    checkCurrentSession();
}

// ==========================================
// 3. БАЗА ДАННЫХ КЛИЕНТОВ
// ==========================================
let clientsDatabase = JSON.parse(
    localStorage.getItem("ainalym_clients_list")
) || [];

let activeProfileClientId = null;

function saveToLocalStorage() {
    localStorage.setItem(
        "ainalym_clients_list",
        JSON.stringify(clientsDatabase)
    );
}

// ==========================================
// 4. НАВИГАЦИЯ И ИНТЕРФЕЙС
// ==========================================
function navigateToPage(pageId, clientId = null) {

    if (pageId === "client-profile" && clientId) {
        window.location.hash = `profile?id=${clientId}`;
    } else {
        window.location.hash = pageId;
    }

}

function handleRouting() {

    // Если пользователь не вошёл — ничего не открываем
    if (!currentUser) return;

    const hash = window.location.hash.replace("#", "");

    // Скрываем все страницы
    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.remove("active");
        section.style.display = "none";
    });

    // Профиль клиента
    if (hash.startsWith("profile?id=")) {

        const clientId = parseInt(hash.split("=")[1]);

        if (!isNaN(clientId)) {
            showClientProfilePage(clientId);
        }

        return;
    }

    const pageId = hash || "client-list";

    // Кассир не может открывать отчёты
    if (
        currentRole === "cashier" &&
        (pageId === "daily-report" || pageId === "total-report")
    ) {
        alert("❌ У вас нет доступа к отчетам.");
        navigateToPage("client-list");
        return;
    }

    const element = document.getElementById("page-" + pageId);

    if (!element) {
        console.error("Не найдена страница:", pageId);
        navigateToPage("client-list");
        return;
    }

    element.classList.add("active");
    element.style.display = "block";

    if (pageId === "daily-report") {
        renderDailyReport();
    } else {
        renderTables();
    }

}// ==========================================
/// 5. УПРАВЛЕНИЕ КЛИЕНТАМИ И ЗАЙМАМИ
// ==========================================
function deleteCurrentClient() {

    if (currentRole !== "admin") {
        alert("❌ Только администратор может удалить займ!");
        return;
    }

    if (!activeProfileClientId) {
        alert("❌ Ошибка: ID клиента не определён!");
        return;
    }

    const client = clientsDatabase.find(
        c => c.id === activeProfileClientId
    );

    if (!client) {
        alert("❌ Клиент не найден!");
        return;
    }

    if (!confirm("Вы уверены, что хотите полностью удалить этот займ?")) {
        return;
    }

    // если истории нет
    if (!client.history) {
        client.history = [];
    }

    client.history.push({
        action: "delete_loan",
        admin: currentUser,
        date: new Date().toISOString()
    });

    // удаляем клиента
    clientsDatabase = clientsDatabase.filter(
        c => c.id !== activeProfileClientId
    );

    saveToLocalStorage();

    activeProfileClientId = null;

    alert("✅ Займ успешно удалён.");

    navigateToPage("client-list");
}


// ==========================================
// ГРАФИК ПЛАТЕЖЕЙ
// ==========================================
function generateClientSchedule(client) {

    if (client.payments && client.payments.length > 0) {
        return;
    }

    if (!client.date) {
        console.error("Дата выдачи займа отсутствует.");
        return;
    }

    const parts = client.date.split(".");

    if (parts.length !== 3) {
        console.error("Неверный формат даты.");
        return;
    }

    const startDate = new Date(parts[2], parts[1] - 1, parts[0]);

    let totalWorkingDays = 0;

    if (client.duration === 14) {
        totalWorkingDays = 12;
    } else {

        const dayOfWeek = startDate.getDay();

        const isWeekendIssue =
            dayOfWeek === 5 ||
            dayOfWeek === 6 ||
            dayOfWeek === 0;

        totalWorkingDays = isWeekendIssue ? 26 : 27;
    }

    const workingDays = [];
    const currentDate = new Date(startDate);

    while (workingDays.length < totalWorkingDays) {

        currentDate.setDate(currentDate.getDate() + 1);

        if (currentDate.getDay() !== 1) {
            workingDays.push(new Date(currentDate));
        }
    }

    const dailyPayment =
        Math.ceil((client.totalReturn / totalWorkingDays) / 100) * 100;

    const paidSum = dailyPayment * (totalWorkingDays - 1);

    const lastPayment = client.totalReturn - paidSum;

    client.payments = [];

    let remainingPrincipal = client.amount;

    for (let i = 0; i < totalWorkingDays; i++) {

        const paymentAmount =
            i === totalWorkingDays - 1
                ? lastPayment
                : dailyPayment;

        let principalPart = 0;
        let profitPart = 0;

        if (remainingPrincipal > 0) {

            if (paymentAmount <= remainingPrincipal) {
                principalPart = paymentAmount;
                remainingPrincipal -= paymentAmount;
            } else {
                principalPart = remainingPrincipal;
                profitPart = paymentAmount - remainingPrincipal;
                remainingPrincipal = 0;
            }

        } else {
            profitPart = paymentAmount;
        }

        client.payments.push({

            dayNumber: i + 1,

            date: workingDays[i].toLocaleDateString("ru-RU"),

            isoDate: new Date(
                workingDays[i].getTime() -
                workingDays[i].getTimezoneOffset() * 60000
            ).toISOString().split("T")[0],

            amount: paymentAmount,

            principalPortion: principalPart,

            profitPortion: profitPart,

            isPaid: false,

            paidAt: null,

            cashier: null

        });
    }
}
function registerClient() {

    const iin = document.getElementById("regIin").value.trim();
    const name = document.getElementById("regName").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const address = document.getElementById("regAddress").value.trim() || "Не указан";
    const regDateInput = document.getElementById("regDate").value;
    const amount = parseInt(document.getElementById("regAmount").value);
    const duration = parseInt(document.getElementById("regDuration").value);

    if (!iin || !name || !phone || !regDateInput || isNaN(amount) || amount <= 0) {
        alert("❌ Заполните все поля правильно!");
        return;
    }

    // Проверяем, нет ли клиента с таким ИИН
    if (clientsDatabase.some(client => client.iin === iin)) {
        alert("❌ Клиент с таким ИИН уже существует!");
        return;
    }

    const parsedDate = new Date(regDateInput);

    if (isNaN(parsedDate.getTime())) {
        alert("❌ Неверная дата!");
        return;
    }

    const formattedDate = parsedDate.toLocaleDateString("ru-RU");

    const rate = duration === 14 ? 0.075 : 0.15;
    const totalReturn = Math.round(amount + amount * rate);

    const newId =
        clientsDatabase.length > 0
            ? Math.max(...clientsDatabase.map(c => c.id)) + 1
            : 101;

    const newClient = {

        id: newId,

        iin,
        name,
        phone,
        address,

        date: formattedDate,

        duration,

        amount,

        totalReturn,

        status: "Активный",

        issuedBy: currentUser,

        issuedAt: new Date().toISOString(),

        payments: [],

        history: [
            {
                action: "loan_created",
                user: currentUser,
                amount: amount,
                totalReturn: totalReturn,
                date: new Date().toISOString()
            }
        ]

    };

    generateClientSchedule(newClient);

    clientsDatabase.push(newClient);

    saveToLocalStorage();

    document.getElementById("regIin").value = "";
    document.getElementById("regName").value = "";
    document.getElementById("regPhone").value = "";
    document.getElementById("regAddress").value = "";
    document.getElementById("regAmount").value = "";

    setCurrentDate();

    alert("✅ Займ успешно выдан!");

    navigateToPage("client-list");

}

function issueRepeatLoan() {

    if (currentRole === "cashier") {
        alert("❌ Кассир не может выдавать займы!");
        return;
    }

    const currentClient = clientsDatabase.find(
        c => c.id === activeProfileClientId
    );

    if (!currentClient) {
        alert("❌ Клиент не найден!");
        return;
    }

    const reDateInput =
        document.getElementById("reLoanDate").value;

    const amount =
        parseInt(document.getElementById("reLoanAmount").value);

    const duration =
        parseInt(document.getElementById("reLoanDuration").value);

    if (!reDateInput || isNaN(amount) || amount <= 0) {
        alert("❌ Заполните дату и сумму!");
        return;
    }

    const parsedDate = new Date(reDateInput);

    if (isNaN(parsedDate.getTime())) {
        alert("❌ Неверная дата!");
        return;
    }

    const formattedDate =
        parsedDate.toLocaleDateString("ru-RU");

    const rate = duration === 14 ? 0.075 : 0.15;

    const totalReturn =
        Math.round(amount + amount * rate);

    // Получаем следующий свободный ID
    const newId =
        clientsDatabase.length > 0
            ? Math.max(...clientsDatabase.map(c => c.id)) + 1
            : 101;

    const repeatClient = {

        id: newId,

        iin: currentClient.iin,

        name: currentClient.name,

        phone: currentClient.phone,

        address: currentClient.address,

        date: formattedDate,

        duration,

        amount,

        totalReturn,

        status: "Активный",

        issuedBy: currentUser,

        issuedAt: new Date().toISOString(),

        payments: [],

        history: [

            {
                action: "repeat_loan",
                user: currentUser,
                amount: amount,
                totalReturn: totalReturn,
                date: new Date().toISOString()
            }

        ]

    };
generateClientSchedule(repeatClient);

    clientsDatabase.push(repeatClient);

    saveToLocalStorage();

    alert("✅ Повторный займ успешно выдан!");

    navigateToPage("client-list");

}

function showClientProfilePage(clientId) {

    activeProfileClientId = clientId;

    const client = clientsDatabase.find(c => c.id === clientId);

    if (!client) {
        alert("❌ Клиент не найден!");
        navigateToPage("client-list");
        return;
    }

    generateClientSchedule(client);

    document.getElementById("profName").innerText = client.name;
    document.getElementById("profIin").innerText = client.iin;
    document.getElementById("profPhone").innerText = client.phone;
    document.getElementById("profAddress").innerText = client.address;
    document.getElementById("profDate").innerText = client.date;

    document.getElementById("profAmount").innerText =
        "₸ " + client.amount.toLocaleString();

    document.getElementById("profTotalReturn").innerText =
        "₸ " + client.totalReturn.toLocaleString();

    const paidAmount = client.payments
        .filter(p => p.isPaid)
        .reduce((sum, p) => sum + p.amount, 0);

    const remaining = client.totalReturn - paidAmount;

    document.getElementById("profRemaining").innerText =
        "₸ " + remaining.toLocaleString();

    document.getElementById("reLoanDate").value =
        new Date().toISOString().split("T")[0];

    const calcBox = document.getElementById("calc-box");
    const scheduleBody = document.getElementById("profile-schedule-body");

    // Показываем кнопку повторного займа только админу и менеджеру
    const repeatLoanBtn = document.getElementById("repeatLoanBtn");

    if (repeatLoanBtn) {

        repeatLoanBtn.style.display =
            currentRole === "cashier" ? "none" : "block";

    }

    const paidDays =
        client.payments.filter(p => p.isPaid).length;

    if (calcBox) {

        calcBox.innerHTML = `

        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">

            <div>

                <b>Выбрано дней:</b>

                <span id="selected-days-count">0</span>

                <br>

                <b>Сумма:</b>

                ₸ <span id="selected-days-sum">0</span>

                <br>

                <b>Оплачено дней:</b>

                ${paidDays} из ${client.payments.length}

            </div>

            <button
                id="pay-selected-btn"
                class="btn-primary"
                disabled
                onclick="makeMultiPayment()">

                💵 Оплатить выбранные

            </button>

        </div>

        `;

    }

    if (scheduleBody) {

        scheduleBody.innerHTML =

            client.payments.map((p, idx) => `
<tr style="${p.isPaid ? 'background:#f0fdf4;' : ''}">

<td>

${!p.isPaid
? `<input
type="checkbox"
class="payment-checkbox"
data-index="${idx}"
data-amount="${p.amount}"
onchange="recalculateMultiPayment()">`
: ""}

<b>День ${p.dayNumber}</b>

</td>

<td>${p.date}</td>

<td><b>₸ ${p.amount.toLocaleString()}</b></td>

<td>

Тело: ${p.principalPortion.toLocaleString()}<br>

Доход: ${p.profitPortion.toLocaleString()}

</td>

<td>

${p.isPaid
? `<span style="color:green;">
✅ Оплачено<br>
${p.cashier ? "Кассир: " + p.cashier + "<br>" : ""}
${p.paidAt ? new Date(p.paidAt).toLocaleString("ru-RU") : ""}
</span>`
: `<span style="color:red;">Ожидает</span>`}

</td>

<td>

${p.isPaid

? (currentRole === "admin"

? `<button
class="btn-primary"
style="background:#ef4444"
onclick="cancelPayment(${idx})">

Отмена

</button>`

: "")

: `<button
class="btn-primary"
style="background:#16a34a"
onclick="makePayment(${idx})">

💵 Оплатить

</button>`}

</td>

</tr>

`).join("");

    }
const historyBox = document.getElementById("client-history-list");

if (historyBox) {

    if (!client.history || client.history.length === 0) {

        historyBox.innerHTML =
            "<p style='color:#64748b;'>История пока отсутствует.</p>";

    } else {

        historyBox.innerHTML = client.history
            .slice()
            .reverse()
            .map(item => `
                <div style="
                    padding:10px;
                    border-bottom:1px solid #e2e8f0;
                    margin-bottom:8px;">

                    <b>${item.action}</b><br>

                    ${item.amount ? "Сумма: ₸ " + item.amount.toLocaleString() + "<br>" : ""}

                    ${item.paymentDay ? "День платежа: " + item.paymentDay + "<br>" : ""}

                    ${item.cashier ? "Кассир: " + item.cashier + "<br>" : ""}

                    ${item.date ? new Date(item.date).toLocaleString("ru-RU") : ""}

                </div>
            `).join("");

    }

}

// Показываем страницу профиля
const profilePage = document.getElementById("page-client-profile");

if (profilePage) {
    profilePage.classList.add("active");
    profilePage.style.display = "block";
}

}

function recalculateMultiPayment() {

    const checkboxes =
        document.querySelectorAll(".payment-checkbox:checked");

    let totalSum = 0;

    const count = checkboxes.length;

    checkboxes.forEach(cb => {
        totalSum += parseInt(cb.dataset.amount);
    });

    document.getElementById("selected-days-count").innerText = count;

    document.getElementById("selected-days-sum").innerText =
        totalSum.toLocaleString();

    const payBtn =
        document.getElementById("pay-selected-btn");

    if (payBtn) {
        payBtn.disabled = count === 0;
        payBtn.style.opacity = count === 0 ? "0.5" : "1";
    }

}

function makeMultiPayment() {

    const checkboxes =
        document.querySelectorAll(".payment-checkbox:checked");

    if (checkboxes.length === 0) return;

    const client =
        clientsDatabase.find(c => c.id === activeProfileClientId);

    if (!client) {
        alert("❌ Клиент не найден.");
        return;
    }

    if (!confirm(`Вы действительно хотите принять оплату за ${checkboxes.length} дней?`)) {
        return;
    }

    checkboxes.forEach(cb => {

        const idx = parseInt(cb.dataset.index);

        const payment = client.payments[idx];

        payment.isPaid = true;
        payment.paidAt = new Date().toISOString();
        payment.cashier = currentUser;

        if (!client.history) {
            client.history = [];
        }

        client.history.push({

            action: "payment",

            cashier: currentUser,

            paymentDay: payment.dayNumber,

            amount: payment.amount,

            date: new Date().toISOString()

        });

    });

   if (client.payments.every(p => p.isPaid)) {
        client.status = "Закрыт";
    }

    saveToLocalStorage();

    showClientProfilePage(activeProfileClientId);

}

function makePayment(paymentIndex) {

    const client = clientsDatabase.find(
        c => c.id === activeProfileClientId
    );

    if (!client) {
        alert("❌ Клиент не найден!");
        return;
    }

    const payment = client.payments[paymentIndex];

    if (!payment) {
        alert("❌ Платёж не найден!");
        return;
    }

    payment.isPaid = true;
    payment.paidAt = new Date().toISOString();
    payment.cashier = currentUser;

    if (!client.history) {
        client.history = [];
    }

    client.history.push({
        action: "payment",
        cashier: currentUser,
        paymentDay: payment.dayNumber,
        amount: payment.amount,
        date: new Date().toISOString()
    });

    if (client.payments.every(p => p.isPaid)) {
        client.status = "Закрыт";
    }

    saveToLocalStorage();

    showClientProfilePage(activeProfileClientId);

}
