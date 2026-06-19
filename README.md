# Student Finance Tracker

A vanilla JavaScript student finance tracker for recording expenses, managing a budget, and reviewing spending patterns in a responsive browser UI. The app uses ES modules, browser storage, and a small validation layer to keep the data flow simple and easy to follow.

## Deployment & Live Demo

- GitHub Pages: [https://kennyrwigamba.github.io/student-finance-tracker/](https://kennyrwigamba.github.io/student-finance-tracker/)
- Video Demo: [https://youtu.be/oR0ZCQXED-Q](https://youtu.be/oR0ZCQXED-Q)


## Overview

This project is built for coursework and demonstrates a complete client-side expense tracker without a framework. It loads saved data from browser storage, seeds starter transactions when needed, and renders the interface from modular JavaScript files.

The app stores transactions internally in USD, then converts values for display in the active currency. The default active currency is RWF.

## Features

- Dashboard with total spending, transaction count, top category, budget remaining, and a 7-day spending chart.
- Add, edit, and delete transactions.
- Inline editing directly inside the transactions table.
- Regex-based search with safe handling for invalid patterns.
- Category filtering, sorting, and category management.
- Currency switching between USD, EUR, and RWF with editable exchange rates.
- Budget cap tracking with warning and alert states.
- JSON import and export for local backups.
- Screen-reader announcements for important UI updates.
- Hash-based tab navigation for Dashboard, Transactions, Settings, and About sections.

## How It Works

When the app starts, it initializes settings and transactions from browser storage. If no transactions exist yet, it loads default records from [seed.json](seed.json).

The main application logic lives in [scripts/main.js](scripts/main.js). Rendering and DOM updates are handled in [scripts/ui.js](scripts/ui.js). Shared state, persistence, and currency conversion live in [scripts/state.js](scripts/state.js).

Transactions are validated before they are saved. Search queries are compiled as regular expressions, and invalid patterns are rejected without breaking the UI.

## Project Structure

```text
├── index.html
├── tests.html
├── seed.json
├── styles/
│   └── style.css
└── scripts/
    ├── main.js
    ├── ui.js
    ├── state.js
    ├── validators.js
    ├── search.js
    └── storage.js
```

## Key Modules

- [scripts/main.js](scripts/main.js) wires up the app, loads seed data, and binds events.
- [scripts/ui.js](scripts/ui.js) renders the dashboard, transaction table, charts, and settings views.
- [scripts/state.js](scripts/state.js) stores transactions, settings, filters, and conversion helpers.
- [scripts/validators.js](scripts/validators.js) validates descriptions, amounts, dates, and categories.
- [scripts/search.js](scripts/search.js) compiles regex search patterns and highlights matches.
- [scripts/storage.js](scripts/storage.js) handles browser storage persistence.

## Validation Rules

Transaction inputs are checked before saving:

- Description must not be empty and cannot contain leading, trailing, or double spaces.
- Amount must be a positive number with up to two decimal places.
- Date must be a valid calendar date in `YYYY-MM-DD` format.
- Category must contain only letters, spaces, or hyphens.
- Duplicate consecutive words are rejected in descriptions.

## Data Management

The app supports:

- adding new categories
- deleting categories, while keeping at least one category available
- changing the active currency
- updating EUR and RWF exchange rates
- setting a budget cap
- exporting all transactions to a JSON file
- importing transactions from a JSON file with validation

## Persistence

Saved data includes:

- transactions
- budget cap
- active currency
- exchange rates
- category list

This data is stored in browser storage, so it remains available after refreshes and browser restarts.

## Running Locally

1. Install [Node.js](https://nodejs.org/).
2. Open a terminal in the project folder.
3. Run:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:8080/` in your browser.

## Testing

Open [tests.html](tests.html) in the browser to run the validation suite.

## Notes

- The app uses USD as the internal base currency.
- The default active display currency is RWF.
- Seed data is loaded only when no saved transactions exist.
- Search supports regular expressions and highlights matches in the transaction list.
