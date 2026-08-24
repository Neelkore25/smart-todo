/* ============================================================
   SMART PARSER MODULE — Natural Language Quick-Add Parsing &
   Category Auto-Suggestion Keyword Engine.
   ============================================================ */

const CATEGORY_KEYWORDS = {
  Work: ['report', 'meeting', 'client', 'code', 'bug', 'deploy', 'presentation', 'email', 'project', 'slack', 'jira', 'review', 'design', 'doc'],
  Health: ['gym', 'workout', 'run', 'walk', 'exercise', 'water', 'doctor', 'meds', 'yoga', 'sleep', 'diet', 'health'],
  Study: ['read', 'book', 'course', 'study', 'exam', 'quiz', 'homework', 'assignment', 'learn', 'math', 'notes', 'lecture'],
  Personal: ['groceries', 'buy', 'clean', 'laundry', 'pay', 'bills', 'rent', 'dinner', 'cook', 'repair', 'call', 'gift', 'family']
};

export function autoSuggestCategory(text) {
  if (!text) return 'Other';
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      return cat;
    }
  }
  return 'Other';
}

export function parseNaturalLanguage(inputStr) {
  let text = inputStr;
  let priority = null;
  let category = null;
  let due = null;

  const lower = inputStr.toLowerCase();

  // Priority detection
  if (/\b(high priority|urgent|p1|high)\b/i.test(lower)) {
    priority = 'high';
    text = text.replace(/\b(high priority|urgent|p1|high)\b/gi, '');
  } else if (/\b(medium priority|med priority|p2|med)\b/i.test(lower)) {
    priority = 'med';
    text = text.replace(/\b(medium priority|med priority|p2|med)\b/gi, '');
  } else if (/\b(low priority|p3|low)\b/i.test(lower)) {
    priority = 'low';
    text = text.replace(/\b(low priority|p3|low)\b/gi, '');
  }

  // Date detection (today, tomorrow, next week, day names)
  const today = new Date();
  if (/\b(today)\b/i.test(lower)) {
    due = formatDate(today);
    text = text.replace(/\b(today)\b/gi, '');
  } else if (/\b(tomorrow)\b/i.test(lower)) {
    const tom = new Date(today);
    tom.setDate(tom.getDate() + 1);
    due = formatDate(tom);
    text = text.replace(/\b(tomorrow)\b/gi, '');
  } else if (/\b(next week)\b/i.test(lower)) {
    const nw = new Date(today);
    nw.setDate(nw.getDate() + 7);
    due = formatDate(nw);
    text = text.replace(/\b(next week)\b/gi, '');
  }

  // Auto-suggest category if not set
  category = autoSuggestCategory(text);

  return {
    cleanText: text.trim().replace(/\s+/g, ' '),
    priority,
    category,
    due
  };
}

function formatDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
