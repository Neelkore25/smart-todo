# Orbit — The Intentional Task & Execution Workspace

**Orbit** is a SaaS-quality productivity workspace engineered for speed, focus, and execution. Inspired by the design standards of Linear, Raycast, Vercel, Apple, and Notion, Orbit combines a fast task engine, interactive command palette, visual monthly calendar, focus session timer, and client-side E2E zero-knowledge encryption into a modern, local-first web app.

🌐 **Live Website:** [https://neelkore25.github.io/smart-todo/](https://neelkore25.github.io/smart-todo/)

---

## ⚡ Key Highlights & Capabilities

- **Interactive Command Palette (`⌘K` / `Ctrl+K`)** — Power-user keyboard launcher to instantly search tasks, trigger actions, filter views, and switch themes.
- **Local-First & E2E Privacy** — 100% client-side task storage using `localStorage` with optional AES-256-GCM zero-knowledge encrypted vault.
- **Precision Task Engine** — Inline double-click task editing, recurring schedules (daily/weekly), priority tagging (High, Med, Low), and category filtering.
- **Pointer Events Drag & Drop** — Smooth 60fps drag-and-drop task reordering across desktop and touch devices.
- **Visual Monthly Calendar Grid** — Complete monthly calendar grid date filter with today marker, date presets, and task due indicators.
- **Pomodoro Focus Timer** — Integrated 25-minute focus session timer with audio/toast feedback.
- **Daily Goals & Progress Ring** — SVG progress ring tracking completed tasks against your daily target.
- **Milestone Achievements** — Unlockable badges celebrating completion milestones.
- **Voice Dictation & AI Suggestions** — Built-in speech-to-text dictation and dynamic task suggestion generator.
- **Dark & Light Design System** — Single-source-of-truth CSS design token system (`[data-theme="dark"]`, `[data-theme="light"]`, `[data-theme="auto"]`) with render-blocking FOUC prevention.
- **Import / Export** — Backup and restore complete task state as JSON.

---

## 🛠️ Technical Architecture

Orbit is built with lightweight, dependency-free vanilla Web standards optimized for GitHub Pages:

- **Markup:** Semantic HTML5 & Accessible ARIA roles
- **Styling:** CSS Design Tokens, Glassmorphism, 8px Spacing Grid, System Font Stack
- **Scripting:** Vanilla JavaScript (Native ES Modules, No Build Tools Required)
- **Icons:** Custom Hand-Authored Lucide Inline SVG Registry
- **Persistence:** LocalStorage Engine with Versioned Schema & Safe In-Memory Fallback
- **Hosting:** 100% GitHub Pages Compatible

---

## 💻 Running Locally

Because Orbit uses native ES modules (`<script type="module">`), serve the directory over HTTP:

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
