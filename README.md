# Student Finance Tracker - Responsive & Accessible Web Application

A lightweight, accessible, and responsive personal budget planner designed specifically for university students. This application is built entirely from scratch using vanilla HTML5, CSS3, and ES6 JavaScript modules, adhering to clean-code standards suitable for educational web projects.

---

## 🔗 Deployment & Live Demo
- **GitHub Pages Link**: [https://kennyrwigamba.github.io/student-finance-tracker/](https://kennyrwigamba.github.io/student-finance-tracker/)
- **Video Demo Link**: [https://youtu.be/ruiscz11_MA](https://youtu.be/ruiscz11_MA)

---

## ✨ Key Features

1. **Seamless SPA Routing**:
   - Tab-switching between the **Dashboard**, **Transactions**, **Settings**, and **About** views.
   - Managed programmatically with bookmarkable URL hashes (`#dashboard`, `#transactions`, etc.) and focus shifts for accessibility.

2. **Default Rwandan Currency (RWF)**:
   - The application launches in **RWF (RF)** by default.
   - Instantly converts base-currency records from internal USD storage to RWF, displaying clean formatted totals and rounded currency numbers without decimals.

3. **Dynamic Financial Dashboard**:
   - Calculated aggregates: Total Spent, transaction count, and the top-spending category.
   - Interactive **Daily Expenses Chart** displaying trends over the last 7 days using pure CSS Flexbox bars.
   - **Monthly Budget Cap Progress Tracker** with real-time ARIA alerts:
     - **Assertive Announcement**: Triggered if spending exceeds the budget threshold.
     - **Polite Announcement**: Triggered when spending crosses 80% of the limit.

4. **Real-World Rwandan Student Seed Data**:
   - Pre-populated with exactly **$200.00 USD** (equivalent to **260,000 RWF** at a 1300 RWF/USD rate) of realistic student expenses in Kigali, such as moto rides, Simba supermarket groceries, copy shop printing, MTN data bundles, and rent shares.

5. **Advanced Settings & Category Manager**:
   - Preferences menu to toggle the active view currency (**RWF**, **USD**, or **EUR**) with custom exchange rates.
   - Category management form to add or delete transaction categories, ensuring at least one category remains.

6. **Interactive Records Table**:
   - Displays transactions in a clean responsive grid that automatically collapses into structured vertical cards on mobile screens (`< 768px`).
   - Supports **inline row editing**, allowing students to update transaction details directly within the table.
   - Safe deletion routines with confirmation alerts.

7. **Live Regex Search & Highlight**:
   - Real-time search matching compiled inside a `try...catch` block to handle query strings safely.
   - Color-coded text highlights using the HTML `<mark>` tag to indicate matching regular expression patterns.

8. **Data Backup & Portability**:
   - Export transactions instantly to a local `.json` file backup.
   - Import JSON back-ups with automated validation checks to prevent database corruption.

---

## 📊 Rwandan Student Seed Dataset ($200.00 USD / 260,000 RWF)

The application initializes with the following seed transactions:

| Description | Category | Base Cost (USD) | Default Cost (RWF) | Date |
| :--- | :--- | :--- | :--- | :--- |
| Moto ride to Kigali Heights | Transport | $1.00 | RF 1,300 | 2026-06-12 |
| Local lunch buffet in Remera | Food | $3.00 | RF 3,900 | 2026-06-13 |
| Groceries at Simba Supermarket | Food | $20.00 | RF 26,000 | 2026-06-13 |
| Notebooks and stationery from Papeterie | Books | $5.00 | RF 6,500 | 2026-06-14 |
| Course handouts printing at copy shop | Books | $3.00 | RF 3,900 | 2026-06-14 |
| MTN monthly internet data pack | Other | $8.00 | RF 10,400 | 2026-06-15 |
| Tap and Go bus card reload | Transport | $10.00 | RF 13,000 | 2026-06-15 |
| Student union registration fee | Fees | $10.00 | RF 13,000 | 2026-06-16 |
| Late library return penalty | Fees | $2.00 | RF 2,600 | 2026-06-16 |
| Movie ticket at Century Cinema | Entertainment | $5.00 | RF 6,500 | 2026-06-17 |
| ALU student hoodie and merch | Other | $15.00 | RF 19,500 | 2026-06-17 |
| Room rent contribution in Kimironko | Other | $75.00 | RF 97,500 | 2026-06-18 |
| Campus cafeteria card meal reload | Food | $20.00 | RF 26,000 | 2026-06-18 |
| Python programming textbook | Books | $15.00 | RF 19,500 | 2026-06-19 |
| Friday evening brochette dinner | Entertainment | $8.00 | RF 10,400 | 2026-06-19 |

---

## 🛠️ Codebase & Architecture

The script files are structured inside the [scripts/](file:///d:/School/alu/courses/frontend-web-development/summative/student-finance-tracker-antigravity/scripts/) directory to teach modular design without dependency overheads:

```
├── index.html           # Main SPA structure
├── tests.html           # Unit test suite runner page
├── seed.json            # Rwandan student transactions data
├── styles/
│   └── style.css        # Responsive CSS layout rules (< 540 lines)
└── scripts/
    ├── main.js          # App orchestrator and event binding (Flat variables)
    ├── ui.js            # View renderers and DOM updater delegates (Flat variables)
    ├── state.js         # Single source of truth (Settings, transactions, conversions)
    ├── validators.js    # Data validation patterns & validation rules
    ├── search.js        # Safe regex compiler and text highlighting
    └── storage.js       # LocalStorage save/load helpers
```

### Clean Code Simplifications
- **Flat DOM Variables**: The codebase defines separate, descriptive variables (e.g. `const tabs = document.querySelectorAll('.nav-btn');`) instead of complex object caches. This removes the `dom.` prefix and matches standard curriculum patterns.
- **Beginner-Friendly Loops**: Replaced advanced array abstractions (like `.reduce()` and complex maps) with readable `for` loops.
- **Explicit Conditionals**: Replaced nested short-circuit logic with clear `if-else` blocks.

---

## 📝 Regular Expressions Catalog

Core validations are defined in [scripts/validators.js]:

| Field | Regex Pattern | Purpose | Match Examples | Reject Examples |
| :--- | :--- | :--- | :--- | :--- |
| **Description** | `/^\S+(?:\s\S+)*$/` | Blocks leading, trailing, and consecutive spaces. | `"Chemistry Textbook"` | `" Food"`, `"Food "`, `"Food  Item"` |
| **Amount** | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | Validates positive numbers with up to two decimals. | `"45"`, `"12.50"`, `"0.99"` | `"-10"`, `"12abc"`, `"1.234"` |
| **Date** | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | Matches calendar dates in YYYY-MM-DD format. | `"2026-06-19"` | `"2026/06/19"`, `"2026-13-19"`, `"2026-06-32"` |
| **Category** | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Validates category tags (letters, single spaces, or hyphens). | `"Food"`, `"Auto-insurance"` | `"Food12"`, `"Food "`, `"Food & Drink"` |
| **Duplicate Words** | `/\b(\w+)\s+\1\b/i` | Detects duplicate consecutive words in descriptions. | `"with with"`, `"bus bus"` | `"with roommates"`, `"bus pass"` |

---

## ♿ Keyboard Navigation Map

| Key | Target | Outcome |
| :--- | :--- | :--- |
| `Tab` | Interactive elements | Focuses the next focusable button, tab, link, or form control. |
| `Shift + Tab` | Interactive elements | Focuses the previous focusable control. |
| `Enter` / `Space` | Buttons & Tabs | Activates a button, switches tabs, or selects inputs. |
| `Escape` | Form Inputs | Exits text entry fields. |
| `Skip link` (Tab first) | Top of Page | Shifts keyboard focus directly to the main landmark, bypassing headers. |

---

## 🚀 Running the Project

### Local Server Setup
Native ES Modules are restricted when loaded directly from the local filesystem (`file://`) due to browser CORS policies. You must run a local web server:

1. Install [Node.js](https://nodejs.org/).
2. Run the development server from the project directory:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:8080/`.

### Run Validation Tests
- Click the **Run Validators Test Suite** link in the footer of the application, or go directly to `http://localhost:8080/tests.html`.
- The test suite executes **29 unit assertions** validating data integrity, pattern validations, calendar date logic (e.g. rejecting February 30th), and backreferences.
