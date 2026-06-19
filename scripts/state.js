import { storage } from './storage.js';

const STORAGE_KEY_TXNS = 'finance_tracker_transactions';
const STORAGE_KEY_SETTINGS = 'finance_tracker_settings';

const DEFAULT_SETTINGS = {
  budgetCap: 300.00,
  baseCurrency: "USD",
  currencies: {
    USD: 1.00,
    EUR: 0.87,
    RWF: 1460.00
  },
  activeCurrency: "RWF",
  categories: ["Food", "Books", "Transport", "Entertainment", "Fees", "Other"]
};

export const state = {
  transactions: [],
  settings: {
    budgetCap: 300.00,
    baseCurrency: "USD",
    currencies: {
      USD: 1.00,
      EUR: 0.87,
      RWF: 1460.00
    },
    activeCurrency: "RWF",
    categories: ["Food", "Books", "Transport", "Entertainment", "Fees", "Other"]
  },
  
  filters: {
    searchPattern: "",
    caseInsensitive: true,
    sortBy: "date-desc",
    category: "all"
  },

  init() {
    this.settings = storage.load(STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS);
    this.transactions = storage.load(STORAGE_KEY_TXNS, []);
    
    // Fallbacks if data structures are missing
    if (!this.settings.currencies) {
      this.settings.currencies = { USD: 1.00, EUR: 0.87, RWF: 1460.00 };
    }
    if (!this.settings.categories) {
      this.settings.categories = ["Food", "Books", "Transport", "Entertainment", "Fees", "Other"];
    }
    if (!this.settings.budgetCap) {
      this.settings.budgetCap = 300.00;
    }
    if (!this.settings.activeCurrency) {
      this.settings.activeCurrency = "RWF";
    }
  },

  saveTransactions() {
    storage.save(STORAGE_KEY_TXNS, this.transactions);
  },

  saveSettings() {
    storage.save(STORAGE_KEY_SETTINGS, this.settings);
  },

  addTransaction(txn) {
    const id = "rec_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const now = new Date().toISOString();
    
    const newTxn = {
      id: id,
      description: txn.description.trim(),
      amount: parseFloat(txn.amount),
      category: txn.category,
      date: txn.date,
      createdAt: now,
      updatedAt: now
    };
    
    this.transactions.push(newTxn);
    this.saveTransactions();
    return newTxn;
  },

  updateTransaction(id, updatedFields) {
    const transaction = this.transactions.find(t => t.id === id);
    if (transaction) {
      if (updatedFields.description !== undefined) {
        transaction.description = updatedFields.description.trim();
      }
      if (updatedFields.amount !== undefined) {
        transaction.amount = parseFloat(updatedFields.amount);
      }
      if (updatedFields.category !== undefined) {
        transaction.category = updatedFields.category;
      }
      if (updatedFields.date !== undefined) {
        transaction.date = updatedFields.date;
      }
      transaction.updatedAt = new Date().toISOString();
      this.saveTransactions();
      return transaction;
    }
    return null;
  },

  deleteTransaction(id) {
    const initialLength = this.transactions.length;
    this.transactions = this.transactions.filter(t => t.id !== id);
    if (this.transactions.length !== initialLength) {
      this.saveTransactions();
      return true;
    }
    return false;
  },

  setBudgetCap(amount) {
    this.settings.budgetCap = Math.max(0, parseFloat(amount) || 0);
    this.saveSettings();
  },

  setActiveCurrency(currencyCode) {
    if (this.settings.currencies[currencyCode] !== undefined) {
      this.settings.activeCurrency = currencyCode;
      this.saveSettings();
    }
  },

  updateCurrencyRate(code, rate) {
    if (code !== this.settings.baseCurrency) {
      this.settings.currencies[code] = Math.max(0.0001, parseFloat(rate) || 1.0);
      this.saveSettings();
    }
  },

  addCategory(name) {
    const formatted = name.trim();
    if (formatted && !this.settings.categories.includes(formatted)) {
      this.settings.categories.push(formatted);
      this.saveSettings();
      return true;
    }
    return false;
  },

  deleteCategory(name) {
    const index = this.settings.categories.indexOf(name);
    if (index !== -1) {
      this.settings.categories.splice(index, 1);
      this.saveSettings();
      return true;
    }
    return false;
  },

  importTransactions(jsonData) {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (!Array.isArray(parsed)) {
        return { success: false, error: "Seed data must be a JSON array." };
      }
      
      const validated = [];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item.description || typeof item.description !== 'string' || item.description.trim() === '') {
          return { success: false, error: "Record at index " + i + " is missing a description." };
        }
        if (item.amount === undefined || isNaN(parseFloat(item.amount)) || parseFloat(item.amount) <= 0) {
          return { success: false, error: "Record at index " + i + " is missing a valid amount." };
        }
        if (!item.category || typeof item.category !== 'string') {
          return { success: false, error: "Record at index " + i + " is missing a category." };
        }
        if (!item.date || typeof item.date !== 'string') {
          return { success: false, error: "Record at index " + i + " is missing a date (YYYY-MM-DD)." };
        }

        validated.push({
          id: item.id || ("rec_" + Date.now() + "_" + i),
          description: item.description.trim(),
          amount: parseFloat(item.amount),
          category: item.category.trim(),
          date: item.date,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString()
        });
      }

      this.transactions = validated;
      this.saveTransactions();
      return { success: true, count: validated.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  convertFromBase(amount, currencyCode = this.settings.activeCurrency) {
    const rate = this.settings.currencies[currencyCode] || 1.0;
    return amount * rate;
  },

  convertToBase(amount, currencyCode = this.settings.activeCurrency) {
    const rate = this.settings.currencies[currencyCode] || 1.0;
    return amount / rate;
  },

  formatCurrency(amount, currencyCode = this.settings.activeCurrency) {
    const converted = this.convertFromBase(amount, currencyCode);
    const symbols = {
      USD: '$',
      EUR: '€',
      RWF: 'RWF '
    };
    const symbol = symbols[currencyCode] || '';
    
    if (currencyCode === 'RWF') {
      return symbol + Math.round(converted).toLocaleString();
    }
    return symbol + converted.toFixed(2);
  }
};
