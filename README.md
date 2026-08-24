# Smart-Todo

A premium, modern task manager designed for daily productivity and execution — featuring high-contrast priority tracking, category tagging, visual monthly calendar view, Pomodoro focus timer, daily goal tracking, and achievements in a clean, local-first web application.

🚀 **Live Website:** [https://neelkore25.github.io/smart-todo/](https://neelkore25.github.io/smart-todo/)

---

## Highlights & Features

- **Local-First & E2E Privacy** — 100% client-side task persistence using `localStorage`. Instant load with zero login friction.
- **Task Management** — Add, edit inline, complete, delete with undo support, and set recurring schedules (daily / weekly).
- **Priorities & Categories** — Color-coded priority hierarchy (High, Medium, Low) and quick category tags (Work, Personal, Study, Health, Other).
- **Pointer Events Drag & Drop** — Smooth 60fps drag-and-drop task reordering across desktop and touch devices.
- **Visual Monthly Calendar** — Full monthly calendar grid with month navigation, today marker, task due indicators, and date presets.
- **Pomodoro Timer** — Integrated 25-minute focus session timer with break notifications.
- **Daily Goals & Progress Ring** — Track completed tasks against a daily target with animated progress ring.
- **Smart AI Suggestions** — Dynamic contextual task suggestions to jumpstart your workflow.
- **Voice Dictation** — Built-in speech-to-text task input via native Web Speech API.
- **Customizable Preferences** — Functional Settings modal for default priorities, default categories, themes, audio/toast toggles, and data reset.
- **Import / Export** — Export and restore complete task data as JSON.
- **Dark & Light Themes** — Inspired by Linear, Vercel, and Raycast dark-first design principles.

---

## Tech Stack

- **Frontend:** Vanilla HTML5, Modern CSS (Custom Properties, Glassmorphic Surfaces, 8px Spacing Grid)
- **Scripting:** Vanilla JavaScript (Native ES Modules, No Build Tools Required)
- **Icons:** Inline SVG Lucide Icon Registry
- **Fonts:** Inter & System Sans-Serif Stack
- **Persistence:** LocalStorage with In-Memory Fallback
- **Hosting:** GitHub Pages Compatible

---

## Running Locally

Because the application uses native JavaScript ES modules (`<script type="module">`), open it using a local HTTP server:

```bash
git clone https://github.com/Neelkore25/smart-todo.git
cd smart-todo

# Start a local static server (Node.js)
npx serve .
```

Open `http://localhost:3000` in your browser.

---

## License

MIT License © [Neel Kore](https://github.com/Neelkore25)