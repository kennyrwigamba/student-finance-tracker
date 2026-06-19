# Student Finance Tracker - Responsive & Accessible Web Application

An accessible, responsive, vanilla HTML/CSS/JS application that enables students to track personal budgets, record daily transactions, and analyze spending patterns.

This project is built from scratch without external libraries or CSS frameworks. It uses a pure CSS Flexbox layout system and vanilla JS modules.

## Deployment URL
- **GitHub Pages URL**: `https://kennyrwigamba.github.io/student-finance-tracker/`

---

## Key Features

1. **SPA Section Layout**:
   - Seamless tab-switching between the **Dashboard**, **Transactions**, **Settings**, and **About** pages with tab panel focus shifting for screen reader accessibility.
2. **Dynamic Financial Dashboard**:
   - Total spent calculations, item counts, and top spending category computation.
   - Dynamic 7-day trend chart showing daily expenses, styled with vertical CSS flex columns and hover tooltip data.
   - Budget Progress Tracker with live ARIA announcements (assertive alert when budget cap is exceeded, polite warning at 80% usage).
3. **Advanced Settings Control**:
   - Preferences selector to dynamically convert stored transaction values from USD base currency into **EUR** or **RWF** in the UI.
   - Editable manual exchange rates (USD &rarr; EUR, USD &rarr; RWF) and budget cap settings.
   - Dynamic Category Manager allowing users to add or remove custom labels.
4. **Data Portability**:
   - Backup files exported locally as structured JSON data.
   - Backup JSON files imported and validated against schema formats to prevent corrupted data loading.
5. **Interactive Records Management**:
   - Table displaying items. Collapses automatically into structured cards on mobile devices.
   - Inline row editing: clicking "Edit" replaces text fields with inputs directly inside the table row.
   - Deletion validation prompts with state updates.
6. **Real-time Regex Search & Filter**:
   - Live query compiling inside a `try...catch` block.
   - Color-coded text highlights using the HTML `<mark>` element without breaking screen reader compatibility.

---

## Regex Catalog

The application relies on 5 core regular expressions located in [scripts/validators.js] for input validation and search matching:

| Field | Regular Expression Pattern | Purpose | Matching Examples | Non-Matching Examples |
| :--- | :--- | :--- | :--- | :--- |
| **Description** | `/^\S+(?:\s\S+)*$/` | Forbids leading/trailing spaces and consecutive multiple spaces. | `"Chemistry Textbook"`, `"Rent"` | `" Rent"`, `"Rent "`, `"Chemistry  Textbook"` |
| **Amount** | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | Validates positive numbers with up to two decimal places. | `"45"`, `"12.50"`, `"0.99"` | `"-12.50"`, `"12abc"`, `"12.345"` |
| **Date** | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | Matches strictly YYYY-MM-DD calendar date strings. | `"2026-06-19"`, `"2025-12-31"` | `"2026/06/19"`, `"2026-13-19"`, `"2026-06-32"` |
| **Category** | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Validates alphabetic names containing hyphens or single spaces. | `"Food"`, `"Auto-insurance"`, `"Study Fees"` | `"Food123"`, `"Food "`, `"Food & Drink"` |
| **Duplicate Words (Advanced)** | `/\b(\w+)\s+\1\b/i` | Captures consecutive duplicate words in a sentence using case-insensitive back-references. | `"Dinner with with roommates"`, `"at at"` | `"Dinner with roommates"`, `"bus pass"` |

---

## Keyboard Navigation Map

This application is designed to be fully navigable using only a keyboard:

| Key | Target Element | Action / Outcome |
| :--- | :--- | :--- |
| `Tab` | Any interactive element | Shifts focus forward to the next logical link, button, or input. |
| `Shift + Tab` | Any interactive element | Shifts focus backward to the previous logical link, button, or input. |
| `Enter` / `Space` | Buttons / Tabs | Activates a button action, toggles checkboxes, or opens navigation tabs. |
| `Escape` | Form Inputs | Deselects active inputs or cancels text entries. |
| `1` (via Skip link) | Top of Page | Activating the "Skip to Content" link shifts keyboard focus directly onto the `<main>` container, bypassing the header navigation. |

---

## Accessibility (a11y) Implementation Details

- **Semantic HTML5 Architecture**: Implements structured structural landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`) and appropriate heading hierarchies.
- **Skip Link**: A hidden "Skip to Content" link appears at the very top of the page index when pressing `Tab`, letting users skip navigation menus.
- **Explicit Inputs Labels**: Every form field, checkbox, selector, and search element contains associated, explicitly bound `<label>` tags (or `aria-label` attributes where appropriate).
- **ARIA Live Regions**: Screen readers are notified of events (adding/deleting items, validation errors, and budget cap alerts) using a polite/assertive announcement container (`role="status"`, `aria-live="polite"`).

---

## How to Run the Application & Tests

### Running the App Locally
Because the application uses native ES Modules, loading the files directly from the filesystem (`file://`) will trigger browser CORS restrictions. You must run a local web server:

1. Ensure [Node.js](https://nodejs.org/) is installed.
2. In the project root, install packages and start the server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:8080/`.

### Running the Test Suite
To run the automated validation assertions:
1. Open the app server locally.
2. Navigate to `http://localhost:8080/tests.html` or click the link in the footer of the application.
3. The page will run the test runner and print visual reports of the 29 validation checks.
