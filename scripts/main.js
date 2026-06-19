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

// DOM Elements Cache
const dom = {
  tabs: document.querySelectorAll('.nav-btn'),
  addForm: document.getElementById('add-transaction-form'),
  txnDesc: document.getElementById('txn-description'),
  txnAmt: document.getElementById('txn-amount'),
  txnCat: document.getElementById('txn-category'),
  txnDate: document.getElementById('txn-date'),
  
  descErr: document.getElementById('desc-error'),
  amtErr: document.getElementById('amount-error'),
  catErr: document.getElementById('category-error'),
  dateErr: document.getElementById('date-error'),
  
  searchInput: document.getElementById('search-input'),
  searchCaseSensitive: document.getElementById('search-case-sensitive'),
  filterCategory: document.getElementById('filter-category'),
  sortBy: document.getElementById('sort-by'),
  
  currencyForm: document.getElementById('settings-currency-form'),
  activeCurrencySelect: document.getElementById('active-currency-select'),
  rateEur: document.getElementById('rate-eur'),
  rateRwf: document.getElementById('rate-rwf'),
  
  budgetForm: document.getElementById('settings-budget-form'),
  budgetCapInput: document.getElementById('budget-cap-input'),
  
  addCategoryForm: document.getElementById('add-category-form'),
  newCategoryInput: document.getElementById('new-category-input'),
  categoryAddError: document.getElementById('category-add-error'),
  categoriesList: document.getElementById('categories-list'),
  
  btnExport: document.getElementById('btn-export'),
  fileImport: document.getElementById('file-import'),
  portabilityStatus: document.getElementById('portability-status')
};

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
  dom.tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSection = btn.getAttribute('aria-controls');
      switchTab(targetSection);
    });
  });

  window.addEventListener('hashchange', handleHashRouting);

  // Clear inputs errors when typing
  dom.txnDesc.addEventListener('input', () => dom.descErr.textContent = '');
  dom.txnAmt.addEventListener('input', () => dom.amtErr.textContent = '');
  dom.txnCat.addEventListener('change', () => dom.catErr.textContent = '');
  dom.txnDate.addEventListener('input', () => dom.dateErr.textContent = '');

  // Add Transaction Form
  dom.addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    dom.descErr.textContent = '';
    dom.amtErr.textContent = '';
    dom.catErr.textContent = '';
    dom.dateErr.textContent = '';

    const desc = dom.txnDesc.value.trim();
    const amountRawStr = dom.txnAmt.value.trim();
    const amountVal = parseFloat(amountRawStr) || 0;
    const cat = dom.txnCat.value;
    const date = dom.txnDate.value;
    
    // Validate values in the active view currency
    const validationResult = validateTransaction({
      description: desc,
      amount: amountRawStr,
      category: cat,
      date: date
    });

    if (!validationResult.isValid) {
      const errors = validationResult.errors;
      if (errors.description) dom.descErr.textContent = errors.description;
      if (errors.amount) dom.amtErr.textContent = errors.amount;
      if (errors.category) dom.catErr.textContent = errors.category;
      if (errors.date) dom.dateErr.textContent = errors.date;
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
    dom.addForm.reset();
    renderTransactionsList();
    renderDashboard();
  });

  // Filters and search controls
  dom.searchInput.addEventListener('input', () => {
    state.filters.searchPattern = dom.searchInput.value;
    renderTransactionsList();
  });

  dom.searchCaseSensitive.addEventListener('change', () => {
    renderTransactionsList();
  });

  dom.filterCategory.addEventListener('change', () => {
    state.filters.category = dom.filterCategory.value;
    renderTransactionsList();
  });

  dom.sortBy.addEventListener('change', () => {
    renderTransactionsList();
  });

  // Settings: Currencies update
  dom.currencyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const selectedCurr = dom.activeCurrencySelect.value;
    const rateEur = parseFloat(dom.rateEur.value) || 0.87;
    const rateRwf = parseFloat(dom.rateRwf.value) || 1460;

    state.updateCurrencyRate('EUR', rateEur);
    state.updateCurrencyRate('RWF', rateRwf);
    state.setActiveCurrency(selectedCurr);

    announceToScreenReader(`Currency view updated to ${selectedCurr}`);
    
    populateSettings();
    renderCategories();
    renderDashboard();
    renderTransactionsList();
    
    alert("Currency preferences saved.");
  });

  // Settings: Budget cap limit
  dom.budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const capUsd = parseFloat(dom.budgetCapInput.value) || 0;
    state.setBudgetCap(capUsd);
    
    announceToScreenReader(`Budget cap updated to ${state.formatCurrency(capUsd, state.settings.activeCurrency)}`);
    renderDashboard();
    alert("Budget limit cap updated.");
  });

  // Settings: Add Category
  dom.addCategoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    dom.categoryAddError.textContent = '';
    
    const catName = dom.newCategoryInput.value.trim();
    const regexCategory = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
    
    if (!catName) {
      dom.categoryAddError.textContent = "Category name cannot be empty.";
      return;
    }
    if (!regexCategory.test(catName)) {
      dom.categoryAddError.textContent = "Category must contain only letters, single spaces, or hyphens.";
      return;
    }
    
    const added = state.addCategory(catName);
    if (added) {
      announceToScreenReader(`Category "${catName}" added.`);
      dom.newCategoryInput.value = '';
      renderCategories();
    } else {
      dom.categoryAddError.textContent = "Category already exists.";
    }
  });

  // Settings: Remove Category
  dom.categoriesList.addEventListener('click', (e) => {
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
  dom.btnExport.addEventListener('click', () => {
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
  dom.fileImport.addEventListener('change', (e) => {
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
      dom.fileImport.value = '';
    };
    reader.onerror = () => {
      showPortabilityStatus("Error reading JSON file.", "error");
      dom.fileImport.value = '';
    };
    reader.readAsText(file);
  });
}

// Renders status label in portability card
function showPortabilityStatus(text, type) {
  dom.portabilityStatus.textContent = text;
  dom.portabilityStatus.className = "status-msg " + type;
  
  setTimeout(() => {
    if (dom.portabilityStatus.textContent === text) {
      dom.portabilityStatus.textContent = '';
      dom.portabilityStatus.className = 'status-msg';
    }
  }, 5000);
}
