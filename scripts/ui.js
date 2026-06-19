import { state } from './state.js';
import { compileRegex, highlight } from './search.js';
import { validateTransaction } from './validators.js';

// Elements Variables
const tabs = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.tab-content');
const ariaAlerts = document.getElementById('aria-alerts');

const statCount = document.getElementById('stat-count');
const statSpent = document.getElementById('stat-spent');
const statTopCat = document.getElementById('stat-top-cat');
const statTopCatAmt = document.getElementById('stat-top-cat-amt');
const statBudgetRemaining = document.getElementById('stat-budget-remaining');
const budgetProgressBar = document.getElementById('budget-progress-bar');
const budgetCard = document.getElementById('budget-cap-card');
const statBudgetStatus = document.getElementById('stat-budget-status');
const chartBarsContainer = document.getElementById('chart-bars-container');

const addForm = document.getElementById('add-transaction-form');
const formCurrencySymbol = document.getElementById('form-currency-symbol');
const txnCategory = document.getElementById('txn-category');
const transactionsContainer = document.getElementById('transactions-container');

const searchInput = document.getElementById('search-input');
const searchCaseSensitive = document.getElementById('search-case-sensitive');
const searchFeedback = document.getElementById('search-feedback');
const filterCategory = document.getElementById('filter-category');
const sortBy = document.getElementById('sort-by');

const activeCurrencySelect = document.getElementById('active-currency-select');
const rateEur = document.getElementById('rate-eur');
const rateRwf = document.getElementById('rate-rwf');
const budgetCapInput = document.getElementById('budget-cap-input');
const addCategoryForm = document.getElementById('add-category-form');
const newCategoryInput = document.getElementById('new-category-input');
const categoryAddError = document.getElementById('category-add-error');
const categoriesList = document.getElementById('categories-list');
const portabilityStatus = document.getElementById('portability-status');
const fileImport = document.getElementById('file-import');

let editingTransactionId = null;

// Announces text to screen readers
export function announceToScreenReader(text, assertive = false) {
  if (!ariaAlerts) return;
  ariaAlerts.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  ariaAlerts.textContent = text;
  
  setTimeout(() => {
    if (ariaAlerts.textContent === text) {
      ariaAlerts.textContent = '';
    }
  }, 3000);
}

// Switches tab views
export function switchTab(tabControlId) {
  tabs.forEach(btn => {
    const isTarget = btn.getAttribute('aria-controls') === tabControlId;
    btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    btn.classList.toggle('active', isTarget);
  });
  
  sections.forEach(sec => {
    const isTarget = sec.id === tabControlId;
    sec.classList.toggle('hidden', !isTarget);
    if (isTarget) {
      sec.focus();
    }
  });

  window.location.hash = tabControlId;
}

// Fills fields in settings tab
export function populateSettings() {
  activeCurrencySelect.value = state.settings.activeCurrency;
  rateEur.value = state.settings.currencies.EUR;
  rateRwf.value = state.settings.currencies.RWF;
  budgetCapInput.value = state.settings.budgetCap;
  
  const activeSymbol = state.settings.activeCurrency === 'RWF' ? 'RWF ' : (state.settings.activeCurrency === 'EUR' ? '€' : '$');
  formCurrencySymbol.textContent = activeSymbol;
}

// Updates categories list dropdowns and manager lists
export function renderCategories() {
  const currentCategories = state.settings.categories;
  
  // Render options in creation form
  let formOptionsHtml = '';
  for (let i = 0; i < currentCategories.length; i++) {
    formOptionsHtml += `<option value="${currentCategories[i]}">${currentCategories[i]}</option>`;
  }
  txnCategory.innerHTML = formOptionsHtml;
  
  // Render options in filter dropdown
  const prevFilterVal = filterCategory.value;
  let filterOptionsHtml = '<option value="all">All Categories</option>';
  for (let i = 0; i < currentCategories.length; i++) {
    filterOptionsHtml += `<option value="${currentCategories[i]}">${currentCategories[i]}</option>`;
  }
  filterCategory.innerHTML = filterOptionsHtml;
  
  if (currentCategories.includes(prevFilterVal) || prevFilterVal === 'all') {
    filterCategory.value = prevFilterVal;
  } else {
    filterCategory.value = 'all';
    state.filters.category = 'all';
  }

  // Render items in settings category list
  let listHtml = '';
  for (let i = 0; i < currentCategories.length; i++) {
    const cat = currentCategories[i];
    listHtml += `
      <li>
        <span>${cat}</span>
        <button type="button" class="btn-list-delete" data-category="${cat}" aria-label="Delete category ${cat}">
          <i class="hgi hgi-stroke hgi-rounded hgi-cancel-01"></i>
        </button>
      </li>
    `;
  }
  categoriesList.innerHTML = listHtml;
}

// Calculates statistics and updates dashboard metrics
export function renderDashboard() {
  const txns = state.transactions;
  const activeCurrency = state.settings.activeCurrency;
  const budgetCapUsd = state.settings.budgetCap;
  
  statCount.textContent = txns.length;
  
  // Sum expenses using a simple loop
  let totalSpentUsd = 0;
  for (let i = 0; i < txns.length; i++) {
    totalSpentUsd += txns[i].amount;
  }
  statSpent.textContent = state.formatCurrency(totalSpentUsd, activeCurrency);
  
  // Compute top category
  const categorySumsUsd = {};
  for (let i = 0; i < txns.length; i++) {
    const cat = txns[i].category;
    if (categorySumsUsd[cat] === undefined) {
      categorySumsUsd[cat] = 0;
    }
    categorySumsUsd[cat] += txns[i].amount;
  }
  
  let topCat = '—';
  let topCatAmtUsd = 0;
  
  const categories = Object.keys(categorySumsUsd);
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    if (categorySumsUsd[cat] > topCatAmtUsd) {
      topCatAmtUsd = categorySumsUsd[cat];
      topCat = cat;
    }
  }
  
  statTopCat.textContent = topCat;
  statTopCatAmt.textContent = topCat !== '—' ? 
    state.formatCurrency(topCatAmtUsd, activeCurrency) + " spent" : state.formatCurrency(0, activeCurrency) + " spent";
    
  // Calculate budget limit cap values
  const remainingUsd = budgetCapUsd - totalSpentUsd;
  const budgetCapConverted = state.formatCurrency(budgetCapUsd, activeCurrency);
  const remainingConverted = state.formatCurrency(Math.abs(remainingUsd), activeCurrency);
  
  const percentSpent = budgetCapUsd > 0 ? (totalSpentUsd / budgetCapUsd) * 100 : 0;
  budgetProgressBar.style.width = Math.min(100, percentSpent) + "%";
  
  budgetCard.className = 'card stat-card';
  budgetProgressBar.className = 'progress-bar';
  
  let screenReaderAnnouncement = "";
  
  if (totalSpentUsd > budgetCapUsd) {
    budgetCard.classList.add('danger-state');
    budgetProgressBar.classList.add('danger');
    statBudgetRemaining.textContent = "-" + remainingConverted;
    statBudgetStatus.textContent = "Over limit by " + remainingConverted + " of " + budgetCapConverted;
    screenReaderAnnouncement = "Budget warning! You have exceeded your budget cap by " + remainingConverted;
    announceToScreenReader(screenReaderAnnouncement, true);
  } else if (percentSpent >= 80) {
    budgetCard.classList.add('warning-state');
    budgetProgressBar.classList.add('warning');
    statBudgetRemaining.textContent = remainingConverted;
    statBudgetStatus.textContent = "Remaining of " + budgetCapConverted + " limit";
    screenReaderAnnouncement = "Budget warning: You have spent 80% or more of your budget. " + remainingConverted + " remaining.";
    announceToScreenReader(screenReaderAnnouncement, false);
  } else {
    statBudgetRemaining.textContent = remainingConverted;
    statBudgetStatus.textContent = "Remaining of " + budgetCapConverted + " limit";
  }
  
  renderTrendChart();
}

// Renders the last 7 days chart using Flexbox
function renderTrendChart() {
  const txns = state.transactions;
  const activeCurrency = state.settings.activeCurrency;
  
  const days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = year + "-" + month + "-" + day;
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    days.push({ key: key, label: label, amountUsd: 0 });
  }
  
  for (let i = 0; i < days.length; i++) {
    for (let j = 0; j < txns.length; j++) {
      if (txns[j].date === days[i].key) {
        days[i].amountUsd += txns[j].amount;
      }
    }
  }
  
  // Find maximum sum using simple loop
  let maxDayAmountUsd = 0;
  for (let i = 0; i < days.length; i++) {
    if (days[i].amountUsd > maxDayAmountUsd) {
      maxDayAmountUsd = days[i].amountUsd;
    }
  }
  
  if (maxDayAmountUsd === 0) {
    chartBarsContainer.innerHTML = '<div class="chart-empty-state">No transaction history in the last 7 days.</div>';
    return;
  }
  
  let chartHtml = '';
  const todayStr = today.toISOString().split('T')[0];
  
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const heightPercent = maxDayAmountUsd > 0 ? (d.amountUsd / maxDayAmountUsd) * 100 : 0;
    const formattedAmt = state.formatCurrency(d.amountUsd, activeCurrency);
    const isToday = d.key === todayStr;
    
    chartHtml += `
      <div class="chart-bar-wrapper">
        <span class="chart-bar-val">${formattedAmt}</span>
        <div class="chart-bar ${isToday ? 'today' : ''}" 
             style="height: ${Math.max(4, heightPercent)}%;" 
             tabindex="0" 
             aria-label="Expenses for ${d.label}: ${formattedAmt}">
        </div>
        <div class="chart-bar-label">${isToday ? 'Today' : d.label}</div>
      </div>
    `;
  }
  chartBarsContainer.innerHTML = chartHtml;
}

// Renders sorting, searching, and filtering on the transactions list
export function renderTransactionsList() {
  const activeCurrency = state.settings.activeCurrency;
  
  const isCaseInsensitive = !searchCaseSensitive.checked;
  const searchPattern = searchInput.value.trim();
  let searchRegex = null;
  
  searchFeedback.textContent = '';
  
  if (searchPattern !== "") {
    searchRegex = compileRegex(searchPattern, isCaseInsensitive ? 'i' : '');
    if (!searchRegex) {
      searchFeedback.textContent = "Invalid regular expression search pattern.";
      searchFeedback.className = "search-feedback-text error-msg";
      transactionsContainer.innerHTML = `<div class="empty-state"><p class="empty-state-title">Invalid Search Query</p><p>Review your regex syntax to resume list rendering.</p></div>`;
      return;
    }
  }

  // Filter records
  const filtered = [];
  for (let i = 0; i < state.transactions.length; i++) {
    const t = state.transactions[i];
    let keep = true;
    
    if (state.filters.category !== 'all' && t.category !== state.filters.category) {
      keep = false;
    }
    if (searchRegex && !searchRegex.test(t.description)) {
      keep = false;
    }
    
    if (keep) {
      filtered.push(t);
    }
  }

  // Sort records
  const sortOption = sortBy.value;
  filtered.sort((a, b) => {
    if (sortOption === 'date-desc') {
      if (a.date !== b.date) {
        return new Date(b.date) - new Date(a.date);
      }
      return b.createdAt.localeCompare(a.createdAt);
    }
    if (sortOption === 'date-asc') {
      if (a.date !== b.date) {
        return new Date(a.date) - new Date(b.date);
      }
      return a.createdAt.localeCompare(b.createdAt);
    }
    if (sortOption === 'amount-desc') {
      return b.amount - a.amount;
    }
    if (sortOption === 'amount-asc') {
      return a.amount - b.amount;
    }
    if (sortOption === 'description-asc') {
      return a.description.localeCompare(b.description);
    }
    if (sortOption === 'description-desc') {
      return b.description.localeCompare(a.description);
    }
    return 0;
  });

  if (filtered.length === 0) {
    transactionsContainer.innerHTML = `
      <div class="empty-state">
        <p class="empty-state-title">No transactions found</p>
        <p>Try clearing filters or adding standard transaction records.</p>
      </div>
    `;
    if (searchRegex) {
      searchFeedback.textContent = "0 matches found.";
      searchFeedback.className = "search-feedback-text";
    }
    return;
  }

  if (searchRegex) {
    searchFeedback.textContent = filtered.length + " matching result(s) found.";
    searchFeedback.className = "search-feedback-text success";
  }

  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th scope="col">Description</th>
          <th scope="col">Category</th>
          <th scope="col">Date</th>
          <th scope="col">Amount</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (let i = 0; i < filtered.length; i++) {
    const t = filtered[i];
    const isEditing = editingTransactionId === t.id;
    
    if (isEditing) {
      let catOptionsHtml = '';
      for (let j = 0; j < state.settings.categories.length; j++) {
        const cat = state.settings.categories[j];
        catOptionsHtml += `<option value="${cat}" ${cat === t.category ? 'selected' : ''}>${cat}</option>`;
      }
      
      html += `
        <tr class="editing-row" data-id="${t.id}">
          <td data-label="Description">
            <input type="text" class="input-control inline-edit-input inline-desc" value="${escapeHtml(t.description)}" aria-label="Edit description" required>
          </td>
          <td data-label="Category">
            <select class="input-control inline-edit-input inline-cat" aria-label="Edit category">
              ${catOptionsHtml}
            </select>
          </td>
          <td data-label="Date">
            <input type="date" class="input-control inline-edit-input inline-date" value="${t.date}" aria-label="Edit date" required>
          </td>
          <td data-label="Amount">
            <input type="number" class="input-control inline-edit-input inline-amount" step="0.01" value="${state.convertFromBase(t.amount, activeCurrency).toFixed(2)}" aria-label="Edit amount" required>
          </td>
          <td data-label="Actions" class="actions-cell">
            <button class="btn-inline-action save" data-id="${t.id}">Save</button>
            <button class="btn-inline-action cancel" data-id="${t.id}">Cancel</button>
          </td>
        </tr>
      `;
    } else {
      const highlightedDescription = searchRegex ? highlight(escapeHtml(t.description), searchRegex) : escapeHtml(t.description);
      const amountStr = state.formatCurrency(t.amount, activeCurrency);
      
      html += `
        <tr data-id="${t.id}">
          <td data-label="Description">${highlightedDescription}</td>
          <td data-label="Category"><span class="badge-cat">${escapeHtml(t.category)}</span></td>
          <td data-label="Date">${t.date}</td>
          <td data-label="Amount" class="amount-val">${amountStr}</td>
          <td data-label="Actions" class="actions-cell">
            <button class="btn-inline-action edit" data-id="${t.id}">Edit</button>
            <button class="btn-inline-action delete" data-id="${t.id}">Delete</button>
          </td>
        </tr>
      `;
    }
  }

  html += `
      </tbody>
    </table>
  `;

  transactionsContainer.innerHTML = html;
  bindTableActionListeners();
}

// Binds actions for inline editing/deletes
function bindTableActionListeners() {
  const container = transactionsContainer;
  
  container.querySelectorAll('.btn-inline-action.edit').forEach(btn => {
    btn.addEventListener('click', () => {
      editingTransactionId = btn.getAttribute('data-id');
      renderTransactionsList();
    });
  });

  container.querySelectorAll('.btn-inline-action.cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      editingTransactionId = null;
      renderTransactionsList();
    });
  });

  container.querySelectorAll('.btn-inline-action.save').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const row = container.querySelector(`tr[data-id="${id}"]`);
      
      const newDesc = row.querySelector('.inline-desc').value.trim();
      const newCat = row.querySelector('.inline-cat').value;
      const newDate = row.querySelector('.inline-date').value;
      const newAmtStr = row.querySelector('.inline-amount').value;
      
      const activeCurrency = state.settings.activeCurrency;
      const amountInActiveVal = parseFloat(newAmtStr) || 0;
      const amountInUsdBase = state.convertToBase(amountInActiveVal, activeCurrency);
      
      const validationPayload = {
        description: newDesc,
        amount: amountInActiveVal,
        category: newCat,
        date: newDate
      };
      
      const { isValid, errors } = validateTransaction(validationPayload);
      if (!isValid) {
        let errorList = '';
        const keys = Object.keys(errors);
        for (let i = 0; i < keys.length; i++) {
          errorList += errors[keys[i]] + '\n';
        }
        alert("Validation errors:\n\n" + errorList);
        return;
      }
      
      state.updateTransaction(id, {
        description: newDesc,
        category: newCat,
        date: newDate,
        amount: amountInUsdBase
      });
      
      announceToScreenReader(`Transaction "${newDesc}" updated.`);
      editingTransactionId = null;
      renderTransactionsList();
      renderDashboard();
    });
  });

  container.querySelectorAll('.btn-inline-action.delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const transaction = state.transactions.find(t => t.id === id);
      if (!transaction) return;
      
      const confirmDelete = confirm(`Are you sure you want to delete transaction "${transaction.description}"?`);
      if (confirmDelete) {
        state.deleteTransaction(id);
        announceToScreenReader(`Transaction "${transaction.description}" deleted.`);
        renderTransactionsList();
        renderDashboard();
      }
    });
  });
}

// Helper to escape HTML characters
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
