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

let clientsDatabase = JSON.parse(localStorage.getItem("ainalym_clients_list")) || [];
let activeProfileClientId = null;

function saveToLocalStorage() {
    localStorage.setItem("ainalym_clients_list", JSON.stringify(clientsDatabase));
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
    alert(`Клиент успешно добавлен!`);
    navigateToPage('client-list');
}

function generateClientSchedule(client) {
    if (client.payments && client.payments.length > 0) return;
    let parts = client.date.split('.');
    let startDate = new Date(parts[2], parts[1] - 1, parts[0]);
    let workingDays = [];
    let currentCheckDate = new Date(startDate);

    while (workingDays.length < client.duration * 2) {
        currentCheckDate.setDate(currentCheckDate.getDate() + 1); 
        if (currentCheckDate.getDay() !== 1) { workingDays.push(new Date(currentCheckDate)); }
    }

    let totalWorkingDays = client.duration === 14 ? 12 : 27;
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
            dayNumber: i + 1, date: workingDays[i].toLocaleDateString('ru-RU'),
            isoDate: workingDays[i].toISOString().split('T')[0],
            amount: currentPayment, principalPortion: principalPortion,
            profitPortion: profitPortion, isPaid: false
        });
    }
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

    let totalExpectedSum = 0;
    let totalCollectedSum = 0;
    let totalIssuedSum = 0;
    let counter = 1;

    clientsDatabase.forEach(client => {
        generateClientSchedule(client);
        
        let parts = client.date.split('.');
        let issuedDate = new Date(parts[2], parts[1] - 1, parts[0]).toISOString().split('T')[0];
        
        if (issuedDate === reportDateInput) {
            totalIssuedSum += client.amount;
            tbody.innerHTML += `<tr style="background-color: #fef3c7;"><td>${counter++}</td><td><b>${client.name} (ВЫДАЧА)</b></td><td>${client.phone}</td><td>-</td><td style="color:#b45309;"><b>- ₸ ${client.amount.toLocaleString()}</b></td><td><span class="badge">Выдача</span></td><td><span class="badge" style="background:#fef3c7; color:#b45309;">Расход</span></td></tr>`;
        }

        client.payments.forEach(payment => {
            if (payment.isoDate === reportDateInput) {
                totalExpectedSum += payment.amount;
                if (payment.isPaid) totalCollectedSum += payment.amount;
                tbody.innerHTML += `<tr style="${payment.isPaid ? 'background-color: #f0fdf4;' : ''}"><td>${counter++}</td><td><b>${client.name}</b></td><td>${client.phone}</td><td>${client.address}</td><td><b>₸ ${payment.amount.toLocaleString()}</b></td><td><span class="badge">День ${payment.dayNumber}</span></td><td>${payment.isPaid ? '<span class="badge" style="background:#dcfce7; color:#15803d;">Внесено</span>' : '<span class="badge" style="background:#fee2e2; color:#991b1b;">Ожидает</span>'}</td></tr>`;
            }
        });
    });

    document.getElementById('daily-expected-sum').innerText = `Приход: ₸ ${totalExpectedSum.toLocaleString()}`;
    document.getElementById('daily-collected-sum').innerText = `Выдано: ₸ ${totalIssuedSum.toLocaleString()}`;
    
    let matchBox = document.getElementById('status-match-box');
    matchBox.innerText = "Отчет сформирован";
    matchBox.style.background = "#e0f2fe";
}

function renderTables() {
    let filterValue = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : "Активный";
    const filterActionsBlock = document.getElementById('statusFilter')?.parentNode;
    let searchInput = document.getElementById('crm-search-input');
    
    if (filterActionsBlock && !searchInput) {
        searchInput = document.createElement('input');
        searchInput.id = 'crm-search-input';
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 Поиск по ФИО...';
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
            <tr><td>${index + 1}</td><td>${c.date}</td><td><b>${c.name}</b></td><td><span class="badge">${c.duration} дн.</span></td><td>₸ ${c.amount.toLocaleString()}</td><td>₸ ${c.totalReturn.toLocaleString()}</td><td><span class="badge">${c.status}</span></td><td><button class="btn-primary" onclick="navigateToPage('client-profile', ${c.id})">Открыть</button></td></tr>
        `).join('');
    }
}

window.addEventListener('hashchange', handleRouting
