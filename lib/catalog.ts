export type Stone = {
  id: string;
  name: string;
  english: string;
  color: string;
  light: string;
  description: string;
  price: number;
  stock: number;
  active: number;
};
export const initialStones: Stone[] = [
  {
    id: "rose",
    name: "Ягаан кварц",
    english: "Rose quartz",
    color: "#d4a8a8",
    light: "#f7e7e4",
    description: "Зөөлөн ягаан туяа, үл ялиг тунгалаг бүтэц. Өдөр тутмын энгийн гоёлд.",
    price: 1800,
    stock: 500,
    active: 1,
  },
  {
    id: "moon",
    name: "Саран чулуу",
    english: "Moonstone",
    color: "#d4d6ce",
    light: "#fffdf1",
    description: "Сүүн цагаан өнгө, гэрлийн өнцгөөс өөрчлөгдөх намуухан гялбаа.",
    price: 2200,
    stock: 500,
    active: 1,
  },
  {
    id: "sage",
    name: "Ногоон авентурин",
    english: "Green aventurine",
    color: "#91a899",
    light: "#dce6d4",
    description: "Навчны ногоон туяатай, байгалийн хээ бүхий тайван өнгө.",
    price: 1600,
    stock: 500,
    active: 1,
  },
  {
    id: "amethyst",
    name: "Аметист",
    english: "Amethyst",
    color: "#a99bb8",
    light: "#e5ddeb",
    description: "Бүдэг нил ягаанаас гүн лаванда хүртэлх байгалийн өнгөний уусалт.",
    price: 2000,
    stock: 500,
    active: 1,
  },
  {
    id: "sand",
    name: "Шар кварц",
    english: "Citrine",
    color: "#c6ab7d",
    light: "#f1e4c5",
    description: "Элсэн шаргал, зөгийн балны дулаан туяатай тунгалаг чулуу.",
    price: 1900,
    stock: 500,
    active: 1,
  },
  {
    id: "blue",
    name: "Цэнхэр агат",
    english: "Blue lace agate",
    color: "#96acbc",
    light: "#deebf1",
    description: "Үүл мэт цайвар хээ, манантаж харагдах цэнхэр саарал өнгө.",
    price: 1800,
    stock: 500,
    active: 1,
  },
];
// Charms share the 8 mm bracelet slot and inventory table in this first release.
export const initialCharms: Stone[] = [
  {
    id: "charm-gold-ring",
    name: "Алтан зайлагч",
    english: "Gold spacer",
    color: "#c3a66b",
    light: "#fff0c5",
    description: "Бүдгэрсэн алтлаг өнгийн цагираг.",
    price: 3500,
    stock: 150,
    active: 1,
  },
  {
    id: "charm-silver-ring",
    name: "Мөнгөн зайлагч",
    english: "Silver spacer",
    color: "#aab2b2",
    light: "#f6f8f3",
    description: "Мөнгөлөг жижиг цагираг.",
    price: 3200,
    stock: 150,
    active: 1,
  },
  {
    id: "charm-moon",
    name: "Сарны унжлага",
    english: "Moon charm",
    color: "#b4b6b0",
    light: "#f5f5ef",
    description: "Саран хэлбэртэй жижиг унжлага.",
    price: 5500,
    stock: 90,
    active: 1,
  },
  {
    id: "charm-heart",
    name: "Ягаан зүрх",
    english: "Heart charm",
    color: "#c79e9d",
    light: "#f5dedc",
    description: "Энгийн зүрхэн дүрстэй чимэглэл.",
    price: 5900,
    stock: 90,
    active: 1,
  },
  {
    id: "charm-star",
    name: "Алтан од",
    english: "Star charm",
    color: "#c0a36b",
    light: "#fff1c5",
    description: "Нарийн таван хошуут одон чимэглэл.",
    price: 4900,
    stock: 90,
    active: 1,
  },
  {
    id: "charm-sun",
    name: "Нарны дүрс",
    english: "Sun charm",
    color: "#c3a66b",
    light: "#fff1c8",
    description: "Дулаахан нарны дүрстэй чимэглэл.",
    price: 5200,
    stock: 90,
    active: 1,
  },
];
export const initialMaterials: Stone[] = [...initialStones, ...initialCharms];
export const isCharm = (material: Pick<Stone, "id">) => material.id.startsWith("charm-");
export const charmGroups = [
  { id: "all", label: "Бүгд", ids: [] },
  { id: "spacer", label: "Зайлагч", ids: ["charm-gold-ring", "charm-silver-ring"] },
  { id: "pendant", label: "Унжлага", ids: ["charm-moon", "charm-heart"] },
  { id: "celestial", label: "Од, нар", ids: ["charm-star", "charm-sun"] },
];
export const presets = [
  {
    id: "morning",
    name: "Өглөөний шүүдэр",
    english: "Morning dew",
    note: "Саран чулуу · Авентурин",
    palette: ["sage", "sage", "moon", "sage", "moon"],
    bg: "sage",
  },
  {
    id: "blush",
    name: "Зөөлөн учрал",
    english: "A little tenderness",
    note: "Ягаан кварц · Саран чулуу",
    palette: ["rose", "rose", "moon", "rose"],
    bg: "rose",
  },
  {
    id: "quiet",
    name: "Аниргүй мөч",
    english: "A quiet moment",
    note: "Аметист · Саран чулуу",
    palette: ["amethyst", "moon", "amethyst", "amethyst"],
    bg: "lavender",
  },
];
export const makePreset = (id = "morning") => {
  const preset = presets.find((p) => p.id === id) ?? presets[0];
  return Array.from({ length: 24 }, (_, i) => preset.palette[i % preset.palette.length]);
};
export const money = (amount: number) => `${new Intl.NumberFormat("mn-MN").format(amount)} ₮`;
export const LABOR_FEE = 12000;
export const DELIVERY_FEE = 6000;
export const statusLabels = {
  pending: "Төлбөр хүлээж байна",
  preparing: "Бэлтгэж байна",
  shipped: "Хүргэлтэд гарсан",
  completed: "Дууссан",
  cancelled: "Цуцлагдсан",
};
export type OrderStatus = keyof typeof statusLabels;
