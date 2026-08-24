# Smart-Todo

A premium, modern task manager built purely with **HTML5**, **CSS3**, and **Vanilla JavaScript (ES Modules)**. No frameworks, no build tools, no bundlers, and no backend dependencies — 100% browser-native and GitHub Pages compatible.

🌐 **Live Website:** [https://neelkore25.github.io/smart-todo/](https://neelkore25.github.io/smart-todo/)

---

## ⚡ Highlights & Features

- **Pure Web Standards** — Built using native HTML5, modern CSS Custom Properties, and ES Modules. Zero external dependencies or build tools.
- **Interactive Command Palette (`⌘K` / `Ctrl+K`)** — Instant keyboard search, action triggers, view filtering, and theme toggling.
- **Local-First Task Persistence** — Saves tasks locally in `localStorage` with automatic fallback.
- **Task Management** — Priority hierarchy (High, Med, Low), categories (Work, Personal, Study, Health, Other), due date filter, and inline double-click editing.
- **Pointer Events Drag & Drop** — Smooth 60fps drag-and-drop task reordering across desktop and touch devices.
- **Visual Monthly Calendar Grid** — Month grid date filter with month navigation, today marker, task due indicators, and date presets.
- **Pomodoro Focus Session** — Integrated 25-minute focus session timer with audio/toast feedback.
- **Daily Goals & Progress Ring** — SVG progress ring tracking completed tasks against a customizable daily target.
- **Dark & Light Themes** — Single-source-of-truth CSS design token system (`[data-theme="dark"]`, `[data-theme="light"]`, `[data-theme="auto"]`) with render-blocking FOUC prevention.
- **Import / Export** — Backup and restore complete task data as JSON.

---

## 🛠️ Technical Architecture

- **Markup:** Semantic HTML5 & Accessible ARIA roles
- **Styling:** CSS3 Design Tokens, Glassmorphism, 8px Grid System
- **Scripting:** Pure Vanilla JavaScript (ES Modules)
- **Icons:** Hand-authored Inline SVG Registry
- **Storage:** LocalStorage API with Safe In-Memory Fallback
- **Hosting:** 100% GitHub Pages Compatible

---

## 💻 Running Locally

Because the application uses native JavaScript ES modules (`<script type="module">`), serve the folder using a local HTTP server:

```bash
git clone https://github.com/Neelkore25/smart-todo.git
cd smart-todo

# Start a local static server
npx serve .
```

Open `http://localhost:3000` in your browser.

---

## 📄 License

MIT License © [Neel Kore](https://github.com/Neelkore25)
