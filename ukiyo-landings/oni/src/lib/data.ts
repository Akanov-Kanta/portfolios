export type Dish = {
  id: string;
  name: string;
  jp: string;
  desc: string;
  price: string;
  note?: string;
};

export type MenuCategory = {
  id: string;
  label: string;
  jp: string;
  blurb: string;
  items: Dish[];
};

export const MENU: MenuCategory[] = [
  {
    id: "ramen",
    label: "Ramen sets",
    jp: "拉麺",
    blurb: "Every bowl comes as a set: ramen, a side of pickles and a small cup of sake or barley tea.",
    items: [
      {
        id: "tonkotsu",
        name: "Oni Tonkotsu",
        jp: "鬼豚骨",
        desc: "Eighteen-hour pork bone broth, black garlic oil, torched chashu, soy egg, wood-ear.",
        price: "$19",
        note: "House bowl",
      },
      {
        id: "tantan",
        name: "Aka-oni Tantan",
        jp: "赤鬼担々",
        desc: "Red chilli sesame broth, minced pork, bok choy, chilli threads. Numbing, then burning.",
        price: "$20",
        note: "Hot ×3",
      },
      {
        id: "shio",
        name: "Shio Moon",
        jp: "塩月",
        desc: "Clear chicken and kombu broth, yuzu peel, menma, and a nori moon on the rim.",
        price: "$17",
      },
      {
        id: "tsukemen",
        name: "Midnight Tsukemen",
        jp: "つけ麺",
        desc: "Thick cold noodles, a hot dip of pork and dried sardine, lime. Ask for soup-wari at the end.",
        price: "$21",
      },
    ],
  },
  {
    id: "plates",
    label: "Small plates",
    jp: "肴",
    blurb: "Off the binchotan and out of the fryer until the last train — and a while after.",
    items: [
      {
        id: "karaage",
        name: "Karaage",
        jp: "唐揚げ",
        desc: "Soy-ginger chicken thigh, fried twice, lemon and kewpie on the side.",
        price: "$11",
      },
      {
        id: "gyoza",
        name: "Lace Gyoza",
        jp: "餃子",
        desc: "Six pork and cabbage dumplings joined by a crisp lace skirt. Chilli vinegar dip.",
        price: "$10",
      },
      {
        id: "yakitori",
        name: "Yakitori Moriawase",
        jp: "焼き鳥",
        desc: "Five skewers off the charcoal: thigh, tsukune, skin, negima, heart. Tare or salt.",
        price: "$16",
        note: "Chef's pick",
      },
      {
        id: "agedashi",
        name: "Agedashi Tofu",
        jp: "揚げ出し",
        desc: "Silken tofu fried in potato starch, warm dashi, grated daikon, bonito flakes.",
        price: "$9",
        note: "Veg on request",
      },
    ],
  },
  {
    id: "sake",
    label: "Sake & drinks",
    jp: "酒",
    blurb: "Forty-odd bottles behind the counter. These four are what the regulars drink.",
    items: [
      {
        id: "kurozuki",
        name: "Kurozuki Daiginjo",
        jp: "黒月",
        desc: "Junmai daiginjo, polished to 45%. Pear, steamed rice, a clean dry finish. Served cold.",
        price: "$16 / $58",
        note: "Glass / bottle",
      },
      {
        id: "nigori",
        name: "Akatsuki Nigori",
        jp: "暁",
        desc: "Cloudy, unfiltered, lightly sweet. Made for the tantan and the karaage.",
        price: "$13",
      },
      {
        id: "atsukan",
        name: "Atsukan",
        jp: "熱燗",
        desc: "House honjozo warmed in a tin pot to 50°C. Best at 2 a.m. in January.",
        price: "$10",
      },
      {
        id: "highball",
        name: "Oni Highball",
        jp: "ハイボール",
        desc: "Japanese whisky, very cold soda, a coin of yuzu. Tall, hard, fast.",
        price: "$12",
      },
    ],
  },
];

/** 0 = Sunday … 6 = Saturday. Times in minutes after midnight; close may pass 24:00. */
export type DayHours = { day: number; short: string; jp: string; open?: number; close?: number };

export const HOURS: DayHours[] = [
  { day: 1, short: "Mon", jp: "月" },
  { day: 2, short: "Tue", jp: "火", open: 18 * 60, close: 26 * 60 },
  { day: 3, short: "Wed", jp: "水", open: 18 * 60, close: 26 * 60 },
  { day: 4, short: "Thu", jp: "木", open: 18 * 60, close: 26 * 60 },
  { day: 5, short: "Fri", jp: "金", open: 18 * 60, close: 28 * 60 },
  { day: 6, short: "Sat", jp: "土", open: 18 * 60, close: 28 * 60 },
  { day: 0, short: "Sun", jp: "日", open: 17 * 60, close: 24 * 60 },
];

export const fmt = (mins: number) => {
  const m = mins % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** Bookable table slots for a weekday: from opening until 90 minutes before close, every 30 min. */
export function slotsFor(day: number): string[] {
  const h = HOURS.find((d) => d.day === day);
  if (!h || h.open === undefined || h.close === undefined) return [];
  const out: string[] = [];
  for (let t = h.open; t <= h.close - 90; t += 30) out.push(fmt(t));
  return out;
}
