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

// Твоя база данных
let clientsDatabase = [];
let activeProfileClientId = null;
const allowedUsers = { "saule": "12345", "sadvakask": "050910", "user3": "7777", "user4": "8888", "user5": "9999" };

// ФУНКЦИЯ СОХРАНЕНИЯ В ОБЛАКО
async function saveToFirebase() {
    try {
        await setDoc(doc(db, "users", "admin"), { clients: clientsDatabase });
    } catch (e) { console.error("Ошибка сохранения: ", e); }
}

// ПЕРЕНЕСИ СЮДА ВСЕ СВОИ ФУНКЦИИ (registerClient, renderTables, deleteCurrentClient, и т.д.)
// ВАЖНО: Везде, где в них написано saveToLocalStorage(), замени на await saveToFirebase();

// ФУНКЦИИ АВТОРИЗАЦИИ
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

function handleLogout() {
    localStorage.removeItem("ainalym_qarzhy_user");
    checkCurrentSession();
}

// ФИНАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ (добавь в самый конец файла)
document.addEventListener("DOMContentLoaded", async function() {
    try {
        const docSnap = await getDoc(doc(db, "users", "admin"));
        if (docSnap.exists()) {
            clientsDatabase = docSnap.data().clients;
            if(typeof renderTables === 'function') renderTables();
        }
    } catch (e) { console.error("Ошибка загрузки:", e); }
    checkCurrentSession();
});

// "ОКНА" ДЛЯ КНОПОК
window.checkLogin = checkLogin;
window.handleLogout = handleLogout;
window.registerClient = typeof registerClient !== 'undefined' ? registerClient : null;
window.deleteCurrentClient = typeof deleteCurrentClient !== 'undefined' ? deleteCurrentClient : null;

// ==========================================
// 1. БАЗА ДАННЫХ ПОЛЬЗОВАТЕЛЕЙ CRM
// ==========================================
const allowedUsers = {
    "saule": "12345",
    "sadvakask": "050910",
    "user3": "7777",
    "user4": "8888",
    "user5": "9999"
};

// ==========================================
// 2. БЛОК АВТОРИЗАЦИИ И СЕССИЙ
// ==========================================
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
        errorMsg.style.display = "none";
        localStorage.setItem("ainalym_qarzhy_user", loginInp); 
        document.getElementById("auth-login").value = "";
        document.getElementById("auth-password").value = "";
        checkCurrentSession(); 
    } else {
        errorMsg.style.display = "block"; 
    }
}

function handleLogout() {
    localStorage.removeItem("ainalym_qarzhy_user");
    checkCurrentSession();
}

// ==========================================
// 3. БАЗА ДАННЫХ КЛИЕНТОВ
// ==========================================
let clientsDatabase = JSON.parse(localStorage.getItem("ainalym_clients_list")) || [];
let activeProfileClientId = null;

function saveToLocalStorage() {
    localStorage.setItem("ainalym_clients_list", JSON.stringify(clientsDatabase));
}

// ==========================================
// 4. НАВИГАЦИЯ И ИНТЕРФЕЙС
// ==========================================
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

// ==========================================
// 5. УПРАВЛЕНИЕ КЛИЕНТАМИ И ЗАЙМАМИ
// ==========================================

function deleteCurrentClient() {
    if (confirm("Вы уверены, что хотите полностью удалить этот займ?")) {
        clientsDatabase = clientsDatabase.filter(c => c.id !== activeProfileClientId);
        saveToLocalStorage();
        alert("Займ успешно удален!");
        navigateToPage('client-list');
    }
}

function generateClientSchedule(client) {
    if (client.payments && client.payments.length > 0) return;

    let parts = client.date.split('.');
    let startDate = new Date(parts[2], parts[1] - 1, parts[0]);
    let dayOfWeek = startDate.getDay(); 

    // Новая логика: 26 или 27 дней
    let isWeekendIssue = (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0);
    let totalWorkingDays = isWeekendIssue ? 26 : 27;

    let workingDays = [];
    let currentCheckDate = new Date(startDate);

    while (workingDays.length < totalWorkingDays) {
        currentCheckDate.setDate(currentCheckDate.getDate() + 1); 
        if (currentCheckDate.getDay() !== 1) { 
            workingDays.push(new Date(currentCheckDate)); 
        }
    }

    let dailyPayment = Math.ceil((client.totalReturn / totalWorkingDays) / 100) * 100;
    let lastPayment = client.totalReturn - (dailyPayment * (totalWorkingDays - 1));

    client.payments = [];
    let remainingPrincipal = client.amount;

    for (let i = 0; i < totalWorkingDays; i++) {
        let currentPayment = (i === totalWorkingDays - 1) ? lastPayment : dailyPayment;
        let principalPortion = 0;
        let profitPortion = 0;

        if (remainingPrincipal > 0) {
            if (currentPayment <= remainingPrincipal) {
                principalPortion = currentPayment;
                remainingPrincipal -= currentPayment;
            } else {
                principalPortion = remainingPrincipal;
                profitPortion = currentPayment - remainingPrincipal;
                remainingPrincipal = 0;
            }
        } else {
            profitPortion = currentPayment;
        }

        client.payments.push({
            dayNumber: i + 1,
            date: workingDays[i].toLocaleDateString('ru-RU'),
            isoDate: new Date(workingDays[i].getTime() - (workingDays[i].getTimezoneOffset() * 60000)).toISOString().split('T')[0],
            amount: currentPayment,
            principalPortion: principalPortion,
            profitPortion: profitPortion,
            isPaid: false
        });
    }
}

function registerClient() {
    let iin = document.getElementById('regIin').value.trim();
    let name = document.getElementById('regName').value.trim();
    let phone = document.getElementById('regPhone').value.trim();
    let address = document.getElementById('regAddress').value.trim() || "Не указан";
    let regDateInput = document.getElementById('regDate').value; 
    let amount = parseInt(document.getElementById('regAmount').value);
    let duration = parseInt(document.getElementById('regDuration').value);

    if (!iin || !name || !phone || !regDateInput || isNaN(amount)) {
        alert("Заполните все поля формы!");
        return;
    }

    let parsedDate = new Date(regDateInput);
    let formattedDate = parsedDate.toLocaleDateString('ru-RU');
    let rate = (duration === 14) ? 0.075 : 0.15;
    let totalReturn = amount + (amount * rate);
    let newId = clientsDatabase.length > 0 ? clientsDatabase[clientsDatabase.length - 1].id + 1 : 101;

    let newClient = {
        id: newId, iin: iin, name: name, phone: phone, address: address, date: formattedDate,
        duration: duration, amount: amount, totalReturn: totalReturn, status: "Активный", payments: []
    };

    generateClientSchedule(newClient);
    clientsDatabase.push(newClient);
    saveToLocalStorage();

    document.getElementById('regIin').value = '';
    document.getElementById('regName').value = '';
    document.getElementById('regPhone').value = '';
    document.getElementById('regAddress').value = '';
    setCurrentDate();

    alert(`Клиент успешно добавлен!`);
    navigateToPage('client-list');
}

function issueRepeatLoan() {
    let currentClient = clientsDatabase.find(c => c.id === activeProfileClientId);
    let reDateInput = document.getElementById('reLoanDate').value;
    let amount = parseInt(document.getElementById('reLoanAmount').value);
    let duration = parseInt(document.getElementById('reLoanDuration').value);

    if (!reDateInput || isNaN(amount) || amount <= 0) {
        alert("Заполните дату и сумму займа!");
        return;
    }

    let parsedDate = new Date(reDateInput);
    let formattedDate = parsedDate.toLocaleDateString('ru-RU');
    let rate = (duration === 14) ? 0.075 : 0.15;
    let totalReturn = amount + (amount * rate);
    let newId = clientsDatabase.length > 0 ? clientsDatabase[clientsDatabase.length - 1].id + 1 : 101;

    let repeatClient = {
        id: newId, iin: currentClient.iin, name: currentClient.name, phone: currentClient.phone,
        address: currentClient.address, date: formattedDate, duration: duration, amount: amount,
        totalReturn: totalReturn, status: "Активный", payments: []
    };

    generateClientSchedule(repeatClient);
    clientsDatabase.push(repeatClient);
    saveToLocalStorage();

    alert(`Новый займ для клиента ${currentClient.name} успешно выдан!`);
    navigateToPage('client-list');
}

function showClientProfilePage(clientId) {
    activeProfileClientId = clientId;
    let client = clientsDatabase.find(c => c.id === clientId);
    if (!client) {
        alert("Клиент не найден!");
        navigateToPage('client-list');
        return;
    }
    generateClientSchedule(client);

    document.getElementById('profName').innerText = client.name;
    document.getElementById('profIin').innerText = client.iin;
    document.getElementById('profPhone').innerText = client.phone;
    document.getElementById('profAddress').innerText = client.address;
    document.getElementById('profDate').innerText = client.date;
    document.getElementById('profAmount').innerText = `₸ ${client.amount.toLocaleString()}`;
    document.getElementById('profTotalReturn').innerText = `₸ ${client.totalReturn.toLocaleString()}`;

    let paidAmount = client.payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0);
    let remaining = client.totalReturn - paidAmount;
    document.getElementById('profRemaining').innerText = `₸ ${remaining.toLocaleString()}`;

    let today = new Date().toISOString().split('T')[0];
    document.getElementById('reLoanDate').value = today;

    const scheduleBody = document.getElementById('profile-schedule-body');
    let calcBox = document.getElementById('multi-day-calc-box');
    if (!calcBox) {
        calcBox = document.createElement('div');
        calcBox.id = 'multi-day-calc-box';
        calcBox.style = "background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 16px; color: #1e40af; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;";
        scheduleBody.parentNode.insertBefore(calcBox, scheduleBody.parentNode.querySelector('table'));
    }
    calcBox.innerHTML = `<div><i class="fas fa-calculator"></i> Выбрано дней для оплаты: <b id="selected-days-count">0</b> | Общая сумма к приёму: <span style="font-size: 20px; font-weight: bold; color: #1d4ed8;">₸ <span id="selected-days-sum">0</span></span></div> <button class="btn-primary" style="background-color: #2563eb; padding: 8px 15px; font-size: 14px;" id="pay-selected-btn" disabled onclick="makeMultiPayment()">💵 Оплатить выбранные дни</button>`;

    scheduleBody.innerHTML = client.payments.map((p, idx) => `
        <tr style="${p.isPaid ? 'background-color: #f0fdf4;' : ''}">
            <td>${p.isPaid ? `<b>День ${p.dayNumber}</b>` : `<input type="checkbox" class="payment-checkbox" data-index="${idx}" data-amount="${p.amount}" onchange="recalculateMultiPayment()" style="width: 18px; height: 18px; cursor: pointer; vertical-align: middle; margin-right: 8px;"> <b>День ${p.dayNumber}</b>`}</td>
            <td>${p.date}</td>
            <td><b>₸ ${p.amount.toLocaleString()}</b></td>
            <td style="font-size:12px; color:#64748b;">Тело: ${p.principalPortion.toLocaleString()} | Доход: ${p.profitPortion.toLocaleString()}</td>
            <td>${p.isPaid ? '<span class="badge" style="background:#dcfce7; color:#15803d;">Оплачено</span>' : '<span class="badge" style="background:#fee2e2; color:#991b1b;">Ожидает</span>'}</td>
            <td>${p.isPaid ? `<button class="btn-primary" style="background-color:#ef4444; padding:4px 8px; font-size:12px;" onclick="cancelPayment(${idx})">Отмена</button>` : `<button class="btn-primary" style="background-color:#16a34a; padding:4px 8px; font-size:12px;" onclick="makePayment(${idx})">💵 Оплатить один день</button>`}</td>
        </tr>
    `).join('');

    document.getElementById('page-client-profile').classList.add('active');
}

function recalculateMultiPayment() {
    let checkboxes = document.querySelectorAll('.payment-checkbox:checked');
    let totalSum = 0;
    let count = checkboxes.length;
    checkboxes.forEach(cb => { totalSum += parseInt(cb.getAttribute('data-amount')); });
    document.getElementById('selected-days-count').innerText = count;
    document.getElementById('selected-days-sum').innerText = totalSum.toLocaleString();
    let payBtn = document.getElementById('pay-selected-btn');
    payBtn.disabled = (count === 0);
    payBtn.style.opacity = (count === 0) ? "0.5" : "1";
}

function makeMultiPayment() {
    let checkboxes = document.querySelectorAll('.payment-checkbox:checked');
    if (checkboxes.length === 0) return;
    let client = clientsDatabase.find(c => c.id === activeProfileClientId);
    if (confirm(`Вы действительно хотите принять оплату за ${checkboxes.length} дней сразу?`)) {
        checkboxes.forEach(cb => {
            let idx = parseInt(cb.getAttribute('data-index'));
            client.payments[idx].isPaid = true;
        });
        if (client.payments.every(p => p.isPaid)) client.status = "Закрыт";
        saveToLocalStorage();
        showClientProfilePage(activeProfileClientId);
    }
}

function makePayment(paymentIndex) {
    let client = clientsDatabase.find(c => c.id === activeProfileClientId);
    client.payments[paymentIndex].isPaid = true;
    if (client.payments.every(p => p.isPaid)) client.status = "Закрыт";
    saveToLocalStorage();
    showClientProfilePage(activeProfileClientId);
}

function cancelPayment(paymentIndex) {
    let client = clientsDatabase.find(c => c.id === activeProfileClientId);
    client.payments[paymentIndex].isPaid = false;
    client.status = "Активный";
    saveToLocalStorage();
    showClientProfilePage(activeProfileClientId);
}

function renderDailyReport() {
    let reportDateInput = document.getElementById('dailyReportDate').value;
    if (!reportDateInput) {
        let today = new Date().toISOString().split('T')[0];
        document.getElementById('dailyReportDate').value = today;
        reportDateInput = today;
    }
    const tbody = document.getElementById('daily-report-table-body');
    tbody.innerHTML = "";
    let totalExpectedSum = 0; let totalCollectedSum = 0; let counter = 1;

    clientsDatabase.forEach(client => {
        generateClientSchedule(client);
        client.payments.forEach(payment => {
            if (payment.isoDate === reportDateInput) {
                totalExpectedSum += payment.amount;
                if (payment.isPaid) totalCollectedSum += payment.amount;
                tbody.innerHTML += `<tr style="${payment.isPaid ? 'background-color: #f0fdf4;' : ''}"><td>${counter++}</td><td><b>${client.name}</b></td><td>${client.phone}</td><td>${client.address}</td><td><b>₸ ${payment.amount.toLocaleString()}</b></td><td><span class="badge">День ${payment.dayNumber}</span></td><td>${payment.isPaid ? '<span class="badge" style="background:#dcfce7; color:#15803d;">Внесено в кассу</span>' : '<span class="badge" style="background:#fee2e2; color:#991b1b;">Еще не платил</span>'}</td></tr>`;
            }
        });
    });

    document.getElementById('daily-expected-sum').innerText = `₸ ${totalExpectedSum.toLocaleString()}`;
    document.getElementById('daily-collected-sum').innerText = `₸ ${totalCollectedSum.toLocaleString()}`;
    let matchBox = document.getElementById('status-match-box');
    if (totalExpectedSum === totalCollectedSum && totalExpectedSum > 0) {
        matchBox.innerText = "🎉 ВСЁ СОШЛОСЬ! КАССА ИДЕАЛЬНА!";
        matchBox.style.background = "#dcfce7"; matchBox.style.color = "#15803d";
    } else {
        matchBox.innerText = totalCollectedSum < totalExpectedSum ? "⚠️ Есть неразнесенные платежи" : "Касса пуста";
        matchBox.style.background = "#fee2e2"; matchBox.style.color = "#991b1b";
    }
}

function renderTables() {
    let filterValue = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : "Активный";
    const filterActionsBlock = document.getElementById('statusFilter')?.parentNode;
    let searchInput = document.getElementById('crm-search-input');
    if (filterActionsBlock && !searchInput) {
        searchInput = document.createElement('input');
        searchInput.id = 'crm-search-input';
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 Поиск...';
        searchInput.style = 'padding: 8px 12px; margin-left: 15px; border: 1px solid #cbd5e1; border-radius: 6px; width: 250px;';
        searchInput.addEventListener('input', renderTables);
        filterActionsBlock.appendChild(searchInput);
    }
    let searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";
    let filteredClients = clientsDatabase.filter(c => {
        let matchesStatus = (filterValue === "Все" || c.status === filterValue);
        let matchesSearch = c.name.toLowerCase().includes(searchQuery) || (c.iin && c.iin.includes(searchQuery));
        return matchesStatus && matchesSearch;
    });

    const clientTableBody = document.getElementById('clients-table-body');
    if (clientTableBody) {
        clientTableBody.innerHTML = filteredClients.map((c, index) => `
            <tr><td>${index + 1}</td><td>${c.date}</td><td><b>${c.name}</b></td><td><span class="badge">${c.duration} дн.</span></td><td>₸ ${c.amount.toLocaleString()}</td><td style="color:#1d4ed8; font-weight:bold;">₸ ${c.totalReturn.toLocaleString()}</td><td><span class="badge" style="${c.status === 'Активный' ? 'background:#dcfce7; color:#15803d;' : 'background:#e2e8f0; color:#475569;'}">${c.status}</span></td><td><button class="btn-primary" onclick="navigateToPage('client-profile', ${c.id})">Открыть</button></td></tr>
        `).join('');
    }
}

function calculateSchedule() {
    let loanAmount = parseInt(document.getElementById('loanAmount').value);
    let durationDays = parseInt(document.getElementById('durationDays').value);
    if (isNaN(loanAmount) || loanAmount <= 0) return;
    let percentRate = (durationDays === 14) ? 0.075 : 0.15;
    let totalReturn = loanAmount + (loanAmount * percentRate);
    let startDate = new Date();
    let workingDays = [];
    let currentCheckDate = new Date(startDate);
    
    let dayOfWeek = startDate.getDay();
    let isWeekendIssue = (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0);
    let totalWorkingDays = isWeekendIssue ? 26 : 27;

    while (workingDays.length < totalWorkingDays) {
        currentCheckDate.setDate(currentCheckDate.getDate() + 1);
        if (currentCheckDate.getDay() !== 1) { workingDays.push(new Date(currentCheckDate)); }
    }

    let dailyPayment = Math.ceil((totalReturn / totalWorkingDays) / 100) * 100;
    let lastPayment = totalReturn - (dailyPayment * (totalWorkingDays - 1));
    let scheduleHTML = `<h3>Внутреннее разделение по дням</h3>`;
    let remainingPrincipal = loanAmount;
    for (let dayNumber = 1; dayNumber <= totalWorkingDays; dayNumber++) {
        let currentPayment = (dayNumber === totalWorkingDays) ? lastPayment : dailyPayment;
        let principalPortion = currentPayment <= remainingPrincipal ? currentPayment : remainingPrincipal;
        let profitPortion = currentPayment - principalPortion;
        remainingPrincipal -= principalPortion;
        scheduleHTML += `<div class="day-row"><span><b>День ${dayNumber}</b> (${workingDays[dayNumber-1].toLocaleDateString('ru-RU')})</span><span>Платёж: <b>${currentPayment.toLocaleString()} ₸</b></span></div>`;
    }
    document.getElementById('scheduleResult').innerHTML = scheduleHTML;
}

function setCurrentDate() {
    let today = new Date().toISOString().split('T')[0];
    if(document.getElementById('regDate')) document.getElementById('regDate').value = today;
    if(document.getElementById('dailyReportDate')) document.getElementById('dailyReportDate').value = today;
}

window.addEventListener('hashchange', handleRouting);
document.addEventListener("DOMContentLoaded", function() {
    setCurrentDate();
    checkCurrentSession(); 
});
