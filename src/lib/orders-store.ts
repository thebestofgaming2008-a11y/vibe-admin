import { useSyncExternalStore } from "react";

export type OrderStatus = "unshipped" | "shipped_no_tracking" | "in_transit" | "delivered";

export interface Order {
  id: string;
  customer: string;
  email: string;
  product: string;
  amount: number;
  date: string; // ISO
  status: OrderStatus;
  tracking?: string;
}

export const statusMeta: Record<OrderStatus, { label: string; dot: string }> = {
  unshipped: { label: "Unshipped", dot: "bg-warning" },
  shipped_no_tracking: { label: "No tracking", dot: "bg-info" },
  in_transit: { label: "In transit", dot: "bg-foreground" },
  delivered: { label: "Delivered", dot: "bg-success" },
};

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const seed: Order[] = [
  { id: "#3421", customer: "Sarah Chen", email: "sarah@chen.co", product: "Wireless Headphones", amount: 129.99, date: daysAgo(0), status: "unshipped" },
  { id: "#3420", customer: "James Wilson", email: "j.wilson@mail.com", product: "Laptop Stand Pro", amount: 79.5, date: daysAgo(0), status: "unshipped" },
  { id: "#3419", customer: "Emily Park", email: "emily.p@mail.com", product: "USB-C Hub", amount: 45, date: daysAgo(1), status: "shipped_no_tracking" },
  { id: "#3418", customer: "Michael Brown", email: "mbrown@mail.com", product: "Mechanical Keyboard", amount: 159, date: daysAgo(1), status: "in_transit", tracking: "1Z999AA10123456784" },
  { id: "#3417", customer: "Lisa Rodriguez", email: "lisa.r@mail.com", product: "Monitor Light Bar", amount: 54.99, date: daysAgo(2), status: "shipped_no_tracking" },
  { id: "#3416", customer: "David Kim", email: "d.kim@mail.com", product: "Wireless Mouse", amount: 39, date: daysAgo(2), status: "delivered", tracking: "1Z999AA10123456785" },
  { id: "#3415", customer: "Anna Müller", email: "anna.m@mail.com", product: "Desk Mat XL", amount: 28.5, date: daysAgo(3), status: "unshipped" },
  { id: "#3414", customer: "Tom Hayes", email: "tom@hayes.io", product: "Webcam HD", amount: 89, date: daysAgo(3), status: "in_transit", tracking: "1Z999AA10123456786" },
  { id: "#3413", customer: "Priya Patel", email: "priya@patel.dev", product: "Wireless Headphones", amount: 129.99, date: daysAgo(4), status: "delivered", tracking: "1Z999AA10123456787" },
  { id: "#3412", customer: "Marco Rossi", email: "marco@rossi.it", product: "USB-C Hub", amount: 45, date: daysAgo(4), status: "delivered", tracking: "1Z999AA10123456788" },
  { id: "#3411", customer: "Yuki Tanaka", email: "yuki.t@mail.jp", product: "Laptop Stand Pro", amount: 79.5, date: daysAgo(5), status: "delivered", tracking: "1Z999AA10123456789" },
  { id: "#3410", customer: "Olivia Reed", email: "o.reed@mail.com", product: "Mechanical Keyboard", amount: 159, date: daysAgo(5), status: "shipped_no_tracking" },
];

// ---- store ----
let state: Order[] = [...seed];
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const emit = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useOrders = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const ordersActions = {
  markShipped(id: string) {
    state = state.map((o) => (o.id === id ? { ...o, status: "shipped_no_tracking" as OrderStatus } : o));
    emit();
  },
  addTracking(id: string, tracking: string) {
    state = state.map((o) =>
      o.id === id ? { ...o, tracking, status: "in_transit" as OrderStatus } : o,
    );
    emit();
  },
  markDelivered(id: string) {
    state = state.map((o) => (o.id === id ? { ...o, status: "delivered" as OrderStatus } : o));
    emit();
  },
};

// ---- analytics: deterministic time-series for last 90 days ----
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export interface DayPoint {
  date: string; // YYYY-MM-DD
  label: string; // short label
  revenue: number;
  orders: number;
  visitors: number;
}

export const analytics90d: DayPoint[] = (() => {
  const rand = seededRand(42);
  const out: DayPoint[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const weekday = d.getDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.75 : 1;
    const trend = 1 + (89 - i) * 0.006; // slight upward
    const noise = 0.7 + rand() * 0.6;
    const revenue = Math.round(1100 * trend * weekend * noise);
    const orders = Math.max(3, Math.round(revenue / (60 + rand() * 40)));
    const visitors = Math.round(orders * (28 + rand() * 18));
    out.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue,
      orders,
      visitors,
    });
  }
  return out;
})();

export type RangeKey = "7d" | "30d" | "90d";
export const rangeDays: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90 };

export function getRangeData(range: RangeKey) {
  return analytics90d.slice(-rangeDays[range]);
}

export function summarizeRange(range: RangeKey) {
  const cur = getRangeData(range);
  const days = rangeDays[range];
  const prev = analytics90d.slice(-days * 2, -days);
  const sum = (arr: DayPoint[], k: keyof DayPoint) =>
    arr.reduce((a, b) => a + (b[k] as number), 0);

  const curRev = sum(cur, "revenue");
  const prevRev = sum(prev, "revenue") || 1;
  const curOrders = sum(cur, "orders");
  const prevOrders = sum(prev, "orders") || 1;
  const curVisitors = sum(cur, "visitors");
  const prevVisitors = sum(prev, "visitors") || 1;
  const aov = curRev / Math.max(1, curOrders);
  const prevAov = prevRev / Math.max(1, prevOrders);
  const conv = (curOrders / Math.max(1, curVisitors)) * 100;
  const prevConv = (prevOrders / Math.max(1, prevVisitors)) * 100;

  const pct = (a: number, b: number) => ((a - b) / b) * 100;

  return {
    revenue: { value: curRev, change: pct(curRev, prevRev) },
    orders: { value: curOrders, change: pct(curOrders, prevOrders) },
    visitors: { value: curVisitors, change: pct(curVisitors, prevVisitors) },
    aov: { value: aov, change: pct(aov, prevAov) },
    conversion: { value: conv, change: pct(conv, prevConv) },
  };
}

export const topProductsData = [
  { name: "Wireless Headphones", sales: 284, revenue: 36876 },
  { name: "Mechanical Keyboard", sales: 142, revenue: 22578 },
  { name: "Laptop Stand Pro", sales: 196, revenue: 15582 },
  { name: "USB-C Hub", sales: 165, revenue: 7425 },
  { name: "Monitor Light Bar", sales: 98, revenue: 5390 },
];

export const trafficSources = [
  { name: "Direct", value: 42 },
  { name: "Organic search", value: 28 },
  { name: "Email", value: 16 },
  { name: "Social", value: 9 },
  { name: "Referral", value: 5 },
];
