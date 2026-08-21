/**
 * Motivational Quotes & Contextual Messages for Students
 * AI Library Management System
 */

export const MOTIVATIONAL_QUOTES = [
  {
    quote: "A book today can change your tomorrow.",
    author: "Library Inspiration",
    icon: "📖",
    color: "from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  {
    quote: "Keep learning. Keep growing.",
    author: "Daily Growth",
    icon: "🌟",
    color: "from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/30",
  },
  {
    quote: "Every page you read brings you one step closer to your goals.",
    author: "Academic Wisdom",
    icon: "🎓",
    color: "from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30",
  },
  {
    quote: "Knowledge is your superpower!",
    author: "Student Fuel",
    icon: "💡",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
  },
  {
    quote: "Read more. Learn more. Achieve more.",
    author: "Success Mindset",
    icon: "🚀",
    color: "from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30",
  },
  {
    quote: "Your next chapter starts with one page.",
    author: "Fresh Start",
    icon: "✨",
    color: "from-violet-500/20 to-fuchsia-500/20 text-violet-300 border-violet-500/30",
  },
  {
    quote: "Great readers become great thinkers.",
    author: "Thought Leadership",
    icon: "📚",
    color: "from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-500/30",
  },
  {
    quote: "Small learning every day creates big success.",
    author: "Habit Builder",
    icon: "🌱",
    color: "from-lime-500/20 to-emerald-500/20 text-lime-300 border-lime-500/30",
  },
  {
    quote: "Your future is built one lesson at a time.",
    author: "Future Architect",
    icon: "🏆",
    color: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30",
  },
  {
    quote: "Don't stop learning. Your goals are waiting for you!",
    author: "Daily Drive",
    icon: "💪",
    color: "from-red-500/20 to-rose-500/20 text-red-300 border-red-500/30",
  },
  {
    quote: "Every page you read is an investment in your future.",
    author: "Lifelong Reader",
    icon: "🌟",
    color: "from-brand-500/20 to-ai-500/20 text-brand-300 border-brand-500/30",
  },
];

/**
 * Action-specific contextual motivational messages
 */
export const ACTION_MESSAGES = {
  borrow: {
    title: "Awesome! A new book, a new opportunity to learn!",
    subtitle: "Every page turns into new ideas and superpowers.",
    icon: "📚",
    emojis: ["📚", "📖", "✨", "🌟", "🎓", "💡", "🚀", "❤️"],
    badge: "New Journey",
    gradient: "from-emerald-500/20 via-teal-500/10 to-sky-500/20 border-emerald-500/40 text-emerald-300",
  },
  return: {
    title: "Well done! Thank you for returning the book responsibly!",
    subtitle: "Sharing knowledge keeps the library community thriving.",
    icon: "🔄",
    emojis: ["🎉", "📚", "🔄", "✅", "🌱", "⭐", "🙌"],
    badge: "Responsible Reader",
    gradient: "from-indigo-500/20 via-violet-500/10 to-brand-500/20 border-indigo-500/40 text-indigo-300",
  },
  search: {
    title: "Happy searching! Your next favorite book might be waiting here.",
    subtitle: "Explore by topic, author, genre, ISBN, or natural language questions.",
    icon: "🔍",
    emojis: ["🔍", "✨", "📖", "💡", "🎯"],
    badge: "Discovery Mode",
    gradient: "from-sky-500/20 via-blue-500/10 to-indigo-500/20 border-sky-500/40 text-sky-300",
  },
  scan: {
    title: "Scan it, discover it, learn it!",
    subtitle: "Aim your camera at any book QR code or barcode for instant details.",
    icon: "📷",
    emojis: ["📷", "⚡", "📚", "🏷️", "✨"],
    badge: "Smart QR Desk",
    gradient: "from-amber-500/20 via-orange-500/10 to-yellow-500/20 border-amber-500/40 text-amber-300",
  },
  recommendation: {
    title: "We found something you might love to read!",
    subtitle: "Curated with Machine Learning matching your personal reading taste.",
    icon: "🤖",
    emojis: ["🤖", "✨", "🧠", "🔮", "🌟"],
    badge: "AI Match",
    gradient: "from-ai-500/20 via-purple-500/10 to-pink-500/20 border-ai-500/40 text-ai-300",
  },
  overdue: {
    title: "Don't worry! Please return your book as soon as possible.",
    subtitle: "Return your book to the library desk or clear any pending fines easily.",
    icon: "⏰",
    emojis: ["⏰", "⚠️", "🔔", "📖", "🛡️"],
    badge: "Due Alert",
    gradient: "from-rose-500/20 via-red-500/10 to-orange-500/20 border-rose-500/40 text-rose-300",
  },
};

/**
 * Get daily motivational quote based on date hash
 */
export function getDailyQuote() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const index = dayOfYear % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[index];
}

/**
 * Get a random quote from the collection
 */
export function getRandomQuote(excludeIndex = -1) {
  let idx;
  do {
    idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  } while (idx === excludeIndex && MOTIVATIONAL_QUOTES.length > 1);
  return { ...MOTIVATIONAL_QUOTES[idx], index: idx };
}

/**
 * Get contextual action motivation
 */
export function getActionMessage(action) {
  return ACTION_MESSAGES[action] || ACTION_MESSAGES.search;
}
