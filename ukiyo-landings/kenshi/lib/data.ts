export const DAYS = [
  { id: "mon", short: "Mon", long: "Monday", kanji: "月" },
  { id: "tue", short: "Tue", long: "Tuesday", kanji: "火" },
  { id: "wed", short: "Wed", long: "Wednesday", kanji: "水" },
  { id: "thu", short: "Thu", long: "Thursday", kanji: "木" },
  { id: "fri", short: "Fri", long: "Friday", kanji: "金" },
  { id: "sat", short: "Sat", long: "Saturday", kanji: "土" },
  { id: "sun", short: "Sun", long: "Sunday", kanji: "日" },
] as const;

export type DayId = (typeof DAYS)[number]["id"];

export const LEVELS = ["Beginner", "Intermediate", "Advanced", "All levels"] as const;
export type Level = (typeof LEVELS)[number];

export const DISCIPLINES = [
  {
    id: "kendo",
    name: "Kendō",
    kanji: "剣道",
    tagline: "The way of the sword",
    body: "Bamboo shinai, full bōgu armour and a shout that empties the lungs. Footwork, timing and the courage to step in first. Armour is loaned for your first three months.",
    facts: ["Bōgu from month 4", "Grading twice a year", "Ages 12+"],
  },
  {
    id: "iaido",
    name: "Iaidō",
    kanji: "居合道",
    tagline: "The draw is the cut",
    body: "Solo forms with a blunt iaitō: drawing, cutting, cleaning and re-sheathing in a single breath. Slow, exact, unforgiving — the quietest class we teach.",
    facts: ["Seitei & Musō Jikiden", "Iaitō provided", "Ages 16+"],
  },
  {
    id: "mma",
    name: "MMA conditioning",
    kanji: "鍛錬",
    tagline: "Forge the vessel",
    body: "Pad rounds, kettlebells, sprawls and mobility built for people who fight with sticks and swords. Strong hips, long breath, knees that last.",
    facts: ["Rounds-based", "No sparring required", "Ages 16+"],
  },
] as const;

export type DisciplineId = (typeof DISCIPLINES)[number]["id"];

export type ClassSlot = {
  day: DayId;
  start: string;
  end: string;
  title: string;
  discipline: DisciplineId;
  level: Level;
  sensei: string;
};

export const SCHEDULE: ClassSlot[] = [
  { day: "mon", start: "06:30", end: "07:30", title: "Dawn conditioning", discipline: "mma", level: "All levels", sensei: "Reyes" },
  { day: "mon", start: "18:00", end: "19:15", title: "Kendō foundations", discipline: "kendo", level: "Beginner", sensei: "Hayashi" },
  { day: "mon", start: "19:30", end: "21:00", title: "Jigeiko — free sparring", discipline: "kendo", level: "Advanced", sensei: "Hayashi" },
  { day: "tue", start: "07:00", end: "08:00", title: "Seitei iai", discipline: "iaido", level: "Intermediate", sensei: "Ishida" },
  { day: "tue", start: "18:30", end: "19:30", title: "Fight conditioning", discipline: "mma", level: "Intermediate", sensei: "Reyes" },
  { day: "tue", start: "19:45", end: "21:00", title: "Iaidō first forms", discipline: "iaido", level: "Beginner", sensei: "Ishida" },
  { day: "wed", start: "06:30", end: "07:30", title: "Dawn conditioning", discipline: "mma", level: "All levels", sensei: "Reyes" },
  { day: "wed", start: "18:00", end: "19:15", title: "Kendō foundations", discipline: "kendo", level: "Beginner", sensei: "Hayashi" },
  { day: "wed", start: "19:30", end: "21:00", title: "Kakari-geiko drills", discipline: "kendo", level: "Intermediate", sensei: "Hayashi" },
  { day: "thu", start: "07:00", end: "08:00", title: "Koryū — Musō Jikiden", discipline: "iaido", level: "Advanced", sensei: "Ishida" },
  { day: "thu", start: "18:30", end: "19:30", title: "Mobility & breath", discipline: "mma", level: "Beginner", sensei: "Reyes" },
  { day: "thu", start: "19:45", end: "21:00", title: "Iaidō first forms", discipline: "iaido", level: "Beginner", sensei: "Ishida" },
  { day: "fri", start: "18:00", end: "19:00", title: "Pad rounds", discipline: "mma", level: "Advanced", sensei: "Reyes" },
  { day: "fri", start: "19:15", end: "20:45", title: "Shiai prep — match play", discipline: "kendo", level: "Advanced", sensei: "Hayashi" },
  { day: "sat", start: "09:00", end: "10:30", title: "Open keiko", discipline: "kendo", level: "All levels", sensei: "Hayashi" },
  { day: "sat", start: "10:45", end: "12:00", title: "Tameshigiri study (dry)", discipline: "iaido", level: "Intermediate", sensei: "Ishida" },
  { day: "sat", start: "12:15", end: "13:15", title: "Fight conditioning", discipline: "mma", level: "Intermediate", sensei: "Reyes" },
  { day: "sun", start: "08:00", end: "09:00", title: "Zazen & suburi", discipline: "kendo", level: "All levels", sensei: "Hayashi" },
  { day: "sun", start: "09:15", end: "10:30", title: "Iaidō open floor", discipline: "iaido", level: "All levels", sensei: "Ishida" },
];

export const SENSEIS = [
  {
    key: "hayashi",
    name: "Hayashi Ren",
    kanji: "林蓮",
    role: "Head instructor · Kendō",
    rank: "Kyōshi · 7th dan",
    years: "34 years on the floor",
    quote: "Strike the opponent's intention, not his sword.",
    portrait: "topknot" as const,
    field: "crimson" as const,
  },
  {
    key: "ishida",
    name: "Ishida Akane",
    kanji: "石田茜",
    role: "Iaidō",
    rank: "Renshi · 6th dan",
    years: "All-Japan iaidō finalist",
    quote: "The scabbard is the first opponent you defeat.",
    portrait: "ponytail" as const,
    field: "steel" as const,
  },
  {
    key: "reyes",
    name: "Tomás Reyes",
    kanji: "鋼",
    role: "MMA conditioning",
    rank: "Former pro · 14–3",
    years: "Strength coach since 2011",
    quote: "Your legs carry the sword. Train the legs.",
    portrait: "shaved" as const,
    field: "gold" as const,
  },
];

export const PLANS = [
  {
    id: "kohai",
    name: "Kōhai",
    kanji: "後輩",
    price: 79,
    cadence: "/ month",
    pitch: "For the curious. Two classes a week, any discipline.",
    features: ["2 classes per week", "Loaner shinai & iaitō", "Beginner track & grading path", "Open keiko on Saturdays"],
    featured: false,
  },
  {
    id: "deshi",
    name: "Deshi",
    kanji: "弟子",
    price: 129,
    cadence: "/ month",
    pitch: "For the committed student. The whole timetable is yours.",
    features: ["Unlimited classes", "Bōgu armour loan", "Monthly technique review", "Seminar & shiai entry", "Members' open floor"],
    featured: true,
  },
  {
    id: "senpai",
    name: "Senpai",
    kanji: "先輩",
    price: 219,
    cadence: "/ month",
    pitch: "For those preparing to grade or to teach.",
    features: ["Everything in Deshi", "2 private lessons / month", "Grading preparation", "Personal conditioning plan", "Guest pass every month"],
    featured: false,
  },
];
