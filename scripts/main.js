import { state } from './state.js';
import { validateTransaction } from './validators.js';
import { 
  switchTab, 
  populateSettings, 
  renderCategories, 
  renderDashboard, 
  renderTransactionsList,
  announceToScreenReader
} from './ui.js';

// Elements Variables
const tabs = document.querySelectorAll('.nav-btn');
const addForm = document.getElementById('add-transaction-form');
const txnDesc = document.getElementById('txn-description');
const txnAmt = document.getElementById('txn-amount');
const txnCat = document.getElementById('txn-category');
const txnDate = document.getElementById('txn-date');

const descErr = document.getElementById('desc-error');
const amtErr = document.getElementById('amount-error');
const catErr = document.getElementById('category-error');
const dateErr = document.getElementById('date-error');

const searchInput = document.getElementById('search-input');
const searchCaseSensitive = document.getElementById('search-case-sensitive');
const filterCategory = document.getElementById('filter-category');
const sortBy = document.getElementById('sort-by');

const currencyForm = document.getElementById('settings-currency-form');
const activeCurrencySelect = document.getElementById('active-currency-select');
const rateEur = document.getElementById('rate-eur');
const rateRwf = document.getElementById('rate-rwf');

const budgetForm = document.getElementById('settings-budget-form');
const budgetCapInput = document.getElementById('budget-cap-input');

const addCategoryForm = document.getElementById('add-category-form');
const newCategoryInput = document.getElementById('new-category-input');
const categoryAddError = document.getElementById('category-add-error');
const categoriesList = document.getElementById('categories-list');

const btnExport = document.getElementById('btn-export');
const fileImport = document.getElementById('file-import');
const portabilityStatus = document.getElementById('portability-status');

// Start application on window load
window.addEventListener('DOMContentLoaded', async () => {
  state.init();

  // Seed default data if storage is empty
  if (state.transactions.length === 0) {
    try {
      const response = await fetch('seed.json');
      if (response.ok) {
        const seedData = await response.json();
        state.importTransactions(seedData);
        announceToScreenReader("Loaded default seed transactions.", false);
      }
    } catch (error) {
      // Start with empty state if fetch fails
    }
  }

  // Render UI
  populateSettings();
  renderCategories();
  renderDashboard();
  renderTransactionsList();

  // Router check
  handleHashRouting();
  bindEventListeners();
});

// Sync tab display with page hash bookmark
function handleHashRouting() {
  const hash = window.location.hash.substring(1);
  const validSections = ['dashboard', 'transactions', 'settings', 'about'];
  if (hash && validSections.includes(hash)) {
    switchTab(hash);
  }
}

// Binds all form actions and inputs
function bindEventListeners() {
  // Navigation tabs
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSection = btn.getAttribute('aria-controls');
      switchTab(targetSection);
    });
  });

  window.addEventListener('hashchange', handleHashRouting);

  // Clear inputs errors when typing
  txnDesc.addEventListener('input', () => descErr.textContent = '');
  txnAmt.addEventListener('input', () => amtErr.textContent = '');
  txnCat.addEventListener('change', () => catErr.textContent = '');
  txnDate.addEventListener('input', () => dateErr.textContent = '');

  // Add Transaction Form
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    descErr.textContent = '';
    amtErr.textContent = '';
    catErr.textContent = '';
    dateErr.textContent = '';

    const desc = txnDesc.value.trim();
    const amountRawStr = txnAmt.value.trim();
    const amountVal = parseFloat(amountRawStr) || 0;
    const cat = txnCat.value;
    const date = txnDate.value;
    
    // Validate values in the active view currency
    const validationResult = validateTransaction({
      description: desc,
      amount: amountRawStr,
      category: cat,
      date: date
    });

    if (!validationResult.isValid) {
      const errors = validationResult.errors;
      if (errors.description) descErr.textContent = errors.description;
      if (errors.amount) amtErr.textContent = errors.amount;
      if (errors.category) catErr.textContent = errors.category;
      if (errors.date) dateErr.textContent = errors.date;
      announceToScreenReader("Validation failed.", true);
      return;
    }

    // Convert value to internal USD base currency
    const activeCurrency = state.settings.activeCurrency;
    const amountInUsd = state.convertToBase(amountVal, activeCurrency);

    state.addTransaction({
      description: desc,
      amount: amountInUsd,
      category: cat,
      date: date
    });

    announceToScreenReader(`Transaction "${desc}" added.`);
    addForm.reset();
    renderTransactionsList();
    renderDashboard();
  });

  // Filters and search controls
  searchInput.addEventListener('input', () => {
    state.filters.searchPattern = searchInput.value;
    renderTransactionsList();
  });

  searchCaseSensitive.addEventListener('change', () => {
    renderTransactionsList();
  });

  filterCategory.addEventListener('change', () => {
    state.filters.category = filterCategory.value;
    renderTransactionsList();
  });

  sortBy.addEventListener('change', () => {
    renderTransactionsList();
  });

  // Settings: Currencies update
  currencyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const selectedCurr = activeCurrencySelect.value;
    const eurVal = parseFloat(rateEur.value) || 0.87;
    const rwfVal = parseFloat(rateRwf.value) || 1460;

    state.updateCurrencyRate('EUR', eurVal);
    state.updateCurrencyRate('RWF', rwfVal);
    state.setActiveCurrency(selectedCurr);

    announceToScreenReader(`Currency view updated to ${selectedCurr}`);
    
    populateSettings();
    renderCategories();
    renderDashboard();
    renderTransactionsList();
    
    alert("Currency preferences saved.");
  });

  // Settings: Budget cap limit
  budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const capUsd = parseFloat(budgetCapInput.value) || 0;
    state.setBudgetCap(capUsd);
    
    announceToScreenReader(`Budget cap updated to ${state.formatCurrency(capUsd, state.settings.activeCurrency)}`);
    renderDashboard();
    alert("Budget limit cap updated.");
  });

  // Settings: Add Category
  addCategoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    categoryAddError.textContent = '';
    
    const catName = newCategoryInput.value.trim();
    const regexCategory = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
    
    if (!catName) {
      categoryAddError.textContent = "Category name cannot be empty.";
      return;
    }
    if (!regexCategory.test(catName)) {
      categoryAddError.textContent = "Category must contain only letters, single spaces, or hyphens.";
      return;
    }
    
    const added = state.addCategory(catName);
    if (added) {
      announceToScreenReader(`Category "${catName}" added.`);
      newCategoryInput.value = '';
      renderCategories();
    } else {
      categoryAddError.textContent = "Category already exists.";
    }
  });

  // Settings: Remove Category
  categoriesList.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-list-delete');
    if (!btn) return;
    
    const catName = btn.getAttribute('data-category');
    
    if (state.settings.categories.length <= 1) {
      alert("You must keep at least one category.");
      return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete category "${catName}"?`);
    if (confirmDelete) {
      state.deleteCategory(catName);
      announceToScreenReader(`Category "${catName}" removed.`);
      renderCategories();
      renderTransactionsList();
      renderDashboard();
    }
  });

  // Portability: Export backup file
  btnExport.addEventListener('click', () => {
    try {
      const dataStr = JSON.stringify(state.transactions, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showPortabilityStatus("Exported successfully.", "success");
    } catch (error) {
      showPortabilityStatus("Export failed.", "error");
    }
  });

  // Portability: Import backup file
  fileImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = state.importTransactions(event.target.result);
      if (result.success) {
        showPortabilityStatus("Imported successfully!", "success");
        announceToScreenReader("Loaded transactions from backup file.");
        
        renderTransactionsList();
        renderDashboard();
      } else {
        showPortabilityStatus("Import failed: " + result.error, "error");
      }
      fileImport.value = '';
    };
    reader.onerror = () => {
      showPortabilityStatus("Error reading JSON file.", "error");
      fileImport.value = '';
    };
    reader.readAsText(file);
  });
}

// Renders status label in portability card
function showPortabilityStatus(text, type) {
  portabilityStatus.textContent = text;
  portabilityStatus.className = "status-msg " + type;
  
  setTimeout(() => {
    if (portabilityStatus.textContent === text) {
      portabilityStatus.textContent = '';
      portabilityStatus.className = 'status-msg';
    }
  }, 5000);
}
