// Initialize Lucide icons
lucide.createIcons();

// State management
let currentView = 'years';
let selectedYear = null;
let selectedMonth = null;
let selectedDay = null;
let expenses = JSON.parse(localStorage.getItem('expenses')) || {};
let monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
let yearCharts = {};
let dayCharts = {};

// DOM Elements
const backButton = document.getElementById('backButton');
const homeButton = document.getElementById('homeButton');
const dateNavigation = document.getElementById('dateNavigation');
const budgetView = document.getElementById('budgetView');
const selectedDateEl = document.getElementById('selectedDate');
const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const totalAmount = document.getElementById('totalAmount');
const setBudgetButton = document.getElementById('setBudgetButton');
const resetBudgetButton = document.getElementById('resetBudgetButton');
const budgetDisplay = document.getElementById('budgetDisplay');
let expenseChart = null;

// Constants
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const chartColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#84cc16'
];

// Helper Functions
function getMonthTotal(year = selectedYear, month = selectedMonth) {
  if (year === null || month === null) return 0;
  
  return Object.entries(expenses)
    .filter(([dateKey]) => {
      const [expYear, expMonth] = dateKey.split('-').map(Number);
      return expYear === year && expMonth === month;
    })
    .reduce((total, [, dayExpenses]) => {
      return total + dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }, 0);
}

function getYearlyExpenses(year) {
  const monthlyTotals = Array(12).fill(0);
  
  Object.entries(expenses).forEach(([dateKey, dayExpenses]) => {
    const [expYear, month] = dateKey.split('-').map(Number);
    if (expYear === year) {
      monthlyTotals[month] += dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }
  });
  
  return monthlyTotals;
}

function createYearChart(year, container) {
  const monthlyData = getYearlyExpenses(year);
  const ctx = document.createElement('canvas');
  ctx.height = 150;
  container.appendChild(ctx);
  
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m => m.substring(0, 3)),
      datasets: [{
        data: monthlyData,
        backgroundColor: chartColors[0],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#9ca3af',
            callback: function(value) {
              return '₹' + value;
            }
          },
          grid: {
            color: '#374151'
          }
        },
        x: {
          ticks: {
            color: '#9ca3af'
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function createDayChart(dateKey, container) {
  const dayExpenses = expenses[dateKey] || [];
  const categoryTotals = dayExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});
  
  const ctx = document.createElement('canvas');
  ctx.height = 100;
  container.appendChild(ctx);
  
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categoryTotals).map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: chartColors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ₹${context.raw}`;
            }
          }
        }
      }
    }
  });
}

// Event Listeners
backButton.addEventListener('click', handleBack);
homeButton.addEventListener('click', goHome);
expenseForm.addEventListener('submit', handleExpenseSubmit);
setBudgetButton.addEventListener('click', handleSetBudget);
resetBudgetButton.addEventListener('click', handleResetBudget);

// Navigation Functions
function goHome() {
  currentView = 'years';
  selectedYear = null;
  selectedMonth = null;
  selectedDay = null;
  updateUI();
}

function handleBack() {
  if (currentView === 'budget') {
    currentView = 'days';
    selectedDay = null;
  } else if (currentView === 'days') {
    currentView = 'months';
    selectedMonth = null;
  } else if (currentView === 'months') {
    currentView = 'years';
    selectedYear = null;
  }
  updateUI();
}

// Budget Functions
function handleSetBudget() {
  const newBudget = prompt('Enter your monthly budget:', monthlyBudget);
  if (newBudget !== null && !isNaN(newBudget) && newBudget >= 0) {
    monthlyBudget = parseFloat(newBudget);
    localStorage.setItem('monthlyBudget', monthlyBudget);
    updateBudgetDisplay();
  }
}

function handleResetBudget() {
  if (confirm('Are you sure you want to reset your monthly budget to ₹0?')) {
    monthlyBudget = 0;
    localStorage.setItem('monthlyBudget', '0');
    updateBudgetDisplay();
  }
}

function updateBudgetDisplay() {
  if (monthlyBudget > 0) {
    const monthTotal = getMonthTotal();
    const remaining = monthlyBudget - monthTotal;
    const percentUsed = (monthTotal / monthlyBudget) * 100;
    
    budgetDisplay.innerHTML = `
      <div class="budget-info">
        <p>Monthly Budget: <span class="budget-amount">₹${monthlyBudget.toFixed(2)}</span></p>
        <p>Remaining: <span class="budget-amount ${remaining < 0 ? 'over-budget' : ''}"
          >₹${remaining.toFixed(2)}</span></p>
        <div class="budget-progress">
          <div class="progress-bar" style="width: ${Math.min(percentUsed, 100)}%"></div>
        </div>
      </div>
    `;
  } else {
    budgetDisplay.innerHTML = '<p>No monthly budget set</p>';
  }
}

function handleYearSelect(year) {
  selectedYear = year;
  currentView = 'months';
  updateUI();
}

function handleMonthSelect(month) {
  selectedMonth = month;
  currentView = 'days';
  updateUI();
}

function handleDaySelect(day) {
  selectedDay = day;
  currentView = 'budget';
  updateUI();
}

function goToToday() {
  const today = new Date();
  selectedYear = today.getFullYear();
  selectedMonth = today.getMonth();
  selectedDay = today.getDate();
  currentView = 'budget';
  updateUI();
}

function goToPreviousDay() {
  const currentDate = new Date(selectedYear, selectedMonth, selectedDay);
  currentDate.setDate(currentDate.getDate() - 1);
  
  selectedYear = currentDate.getFullYear();
  selectedMonth = currentDate.getMonth();
  selectedDay = currentDate.getDate();
  updateUI();
}

function goToNextDay() {
  const currentDate = new Date(selectedYear, selectedMonth, selectedDay);
  currentDate.setDate(currentDate.getDate() + 1);
  
  selectedYear = currentDate.getFullYear();
  selectedMonth = currentDate.getMonth();
  selectedDay = currentDate.getDate();
  updateUI();
}

// UI Update Functions
function updateUI() {
  backButton.classList.toggle('hidden', currentView === 'years');
  homeButton.classList.toggle('hidden', currentView === 'years');
  budgetView.classList.toggle('hidden', currentView !== 'budget');
  resetBudgetButton.classList.toggle('hidden', currentView !== 'budget');
  
  if (currentView === 'budget') {
    selectedDateEl.textContent = `${months[selectedMonth]} ${selectedDay}, ${selectedYear}`;
    updateExpenseList();
    updateExpenseStats();
  }
  
  // Cleanup existing charts
  Object.values(yearCharts).forEach(chart => chart.destroy());
  Object.values(dayCharts).forEach(chart => chart.destroy());
  yearCharts = {};
  dayCharts = {};
  
  updateDateNavigation();
  updateBudgetDisplay();
}

function updateDateNavigation() {
  dateNavigation.innerHTML = '';
  
  if (currentView === 'years') {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];
    const yearsHtml = `
      <div class="years-container">
        <button class="today-button" onclick="goToToday()">
          <i data-lucide="calendar-clock"></i>
          Go to Today
        </button>
        <div class="years-grid">
          ${years.map(year => {
            const yearlyTotal = getYearlyExpenses(year).reduce((a, b) => a + b, 0);
            
            return `
              <div class="year-card">
                <button class="date-button" onclick="handleYearSelect(${year})">
                  <span class="year">${year}</span>
                  <span class="year-total">₹${yearlyTotal.toFixed(2)}</span>
                </button>
                <div class="year-chart" id="yearChart${year}"></div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    dateNavigation.innerHTML = yearsHtml;
    lucide.createIcons();
    
    // Create year charts
    years.forEach(year => {
      const container = document.getElementById(`yearChart${year}`);
      if (container) {
        yearCharts[year] = createYearChart(year, container);
      }
    });
  }
  
  else if (currentView === 'months') {
    dateNavigation.innerHTML = `
      <div class="months-grid">
        ${months.map((month, index) => `
          <button class="month-box" onclick="handleMonthSelect(${index})">
            <span class="month-name">${month}</span>
            <span class="month-year">${selectedYear}</span>
          </button>
        `).join('')}
      </div>
    `;
  }
  
  else if (currentView === 'days') {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    
    let calendarHtml = '<div class="calendar-grid">';
    
    weekdays.forEach(day => {
      calendarHtml += `<div class="calendar-header">${day}</div>`;
    });
    
    for (let i = 0; i < firstDay; i++) {
      calendarHtml += '<div></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${selectedYear}-${selectedMonth}-${day}`;
      const dayExpenses = expenses[dateKey] || [];
      const dayTotal = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      calendarHtml += `
        <div class="calendar-day-container">
          <button class="calendar-day" onclick="handleDaySelect(${day})">
            <span class="day-number">${day}</span>
            ${dayTotal > 0 ? `<span class="day-total">₹${dayTotal.toFixed(2)}</span>` : ''}
          </button>
          ${dayTotal > 0 ? `<div class="day-chart" id="dayChart${dateKey}"></div>` : ''}
        </div>
      `;
    }
    
    calendarHtml += '</div>';
    dateNavigation.innerHTML = calendarHtml;
    
    // Create day charts
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${selectedYear}-${selectedMonth}-${day}`;
      const container = document.getElementById(`dayChart${dateKey}`);
      if (container && expenses[dateKey]?.length > 0) {
        dayCharts[dateKey] = createDayChart(dateKey, container);
      }
    }
  }
  
  else if (currentView === 'budget') {
    const today = new Date();
    const currentDate = new Date(selectedYear, selectedMonth, selectedDay);
    const isToday = currentDate.toDateString() === today.toDateString();
    const isFuture = currentDate > today;
    
    dateNavigation.innerHTML = `
      <div class="day-navigation">
        <button class="nav-button" onclick="goToPreviousDay()">
          <i data-lucide="chevron-left"></i>
          Previous Day
        </button>
        <button class="nav-button" onclick="goToNextDay()" ${isFuture ? 'disabled' : ''}>
          <i data-lucide="chevron-right"></i>
          Next Day
        </button>
      </div>
    `;
    lucide.createIcons();
  }
}

// Expense Management Functions
function handleExpenseSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('expenseName').value;
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const category = document.getElementById('expenseCategory').value;
  
  const monthTotal = getMonthTotal();
  if (monthlyBudget > 0 && (monthTotal + amount) > monthlyBudget) {
    const proceed = confirm('This expense will exceed your monthly budget. Do you want to proceed?');
    if (!proceed) {
      return;
    }
  }
  
  const expense = {
    id: Date.now().toString(),
    name,
    amount,
    category,
    date: new Date(selectedYear, selectedMonth, selectedDay).toISOString()
  };
  
  const dateKey = `${selectedYear}-${selectedMonth}-${selectedDay}`;
  if (!expenses[dateKey]) {
    expenses[dateKey] = [];
  }
  expenses[dateKey].push(expense);
  
  localStorage.setItem('expenses', JSON.stringify(expenses));
  
  e.target.reset();
  updateExpenseList();
  updateExpenseStats();
}

function deleteExpense(dateKey, expenseId) {
  expenses[dateKey] = expenses[dateKey].filter(exp => exp.id !== expenseId);
  localStorage.setItem('expenses', JSON.stringify(expenses));
  updateExpenseList();
  updateExpenseStats();
}

function updateExpenseList() {
  const dateKey = `${selectedYear}-${selectedMonth}-${selectedDay}`;
  const dayExpenses = expenses[dateKey] || [];
  
  if (dayExpenses.length === 0) {
    expenseList.innerHTML = '<p class="text-secondary">No expenses recorded yet.</p>';
    return;
  }
  
  expenseList.innerHTML = dayExpenses.map(expense => `
    <div class="expense-item">
      <div class="expense-details">
        <h4>${expense.name}</h4>
        <div class="expense-meta">
          ${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
        </div>
      </div>
      <div class="expense-actions">
        <span class="expense-amount">₹${expense.amount.toFixed(2)}</span>
        <button class="delete-button" onclick="deleteExpense('${dateKey}', '${expense.id}')">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  lucide.createIcons();
}

function updateExpenseStats() {
  const dateKey = `${selectedYear}-${selectedMonth}-${selectedDay}`;
  const dayExpenses = expenses[dateKey] || [];
  
  const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  totalAmount.textContent = `₹${total.toFixed(2)}`;
  
  updateBudgetDisplay();
  
  const categoryTotals = dayExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});
  
  if (expenseChart) {
    expenseChart.destroy();
  }
  
  const ctx = document.getElementById('expenseChart').getContext('2d');
  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categoryTotals).map(
        cat => cat.charAt(0).toUpperCase() + cat.slice(1)
      ),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: chartColors,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#ffffff'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ₹${context.raw.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}

// Initialize the UI
updateUI();