import { useSyncExternalStore } from "react";

export type Carrier = "dtdc" | "indiapost";
export type Zone = "local" | "regional" | "metro" | "rest" | "northeast";

export interface RateRow {
  zone: Zone;
  zoneLabel: string;
  upTo500g: number;
  upTo1kg: number;
  upTo2kg: number;
  perAdditional500g: number;
}

export interface CarrierConfig {
  id: Carrier;
  name: string;
  lastUpdated: string; // ISO
  notes: string;
  rates: RateRow[];
}

const today = new Date().toISOString();

// Indicative rates only — manually maintained (no APIs).
const seed: CarrierConfig[] = [
  {
    id: "dtdc",
    name: "DTDC",
    lastUpdated: today,
    notes: "Surface cargo rates. Volumetric weight = (L × W × H) / 5000.",
    rates: [
      { zone: "local", zoneLabel: "Local (within city)", upTo500g: 45, upTo1kg: 70, upTo2kg: 110, perAdditional500g: 18 },
      { zone: "regional", zoneLabel: "Regional (within state)", upTo500g: 60, upTo1kg: 95, upTo2kg: 150, perAdditional500g: 25 },
      { zone: "metro", zoneLabel: "Metro to metro", upTo500g: 75, upTo1kg: 120, upTo2kg: 190, perAdditional500g: 32 },
      { zone: "rest", zoneLabel: "Rest of India", upTo500g: 90, upTo1kg: 145, upTo2kg: 230, perAdditional500g: 42 },
      { zone: "northeast", zoneLabel: "North-East / J&K", upTo500g: 110, upTo1kg: 175, upTo2kg: 280, perAdditional500g: 55 },
    ],
  },
  {
    id: "indiapost",
    name: "India Post (Speed Post)",
    lastUpdated: today,
    notes: "Speed Post indicative tariff. Book Post is cheaper for printed material.",
    rates: [
      { zone: "local", zoneLabel: "Local", upTo500g: 35, upTo1kg: 50, upTo2kg: 80, perAdditional500g: 15 },
      { zone: "regional", zoneLabel: "Up to 200 km", upTo500g: 45, upTo1kg: 70, upTo2kg: 110, perAdditional500g: 20 },
      { zone: "metro", zoneLabel: "200–1000 km", upTo500g: 60, upTo1kg: 90, upTo2kg: 140, perAdditional500g: 30 },
      { zone: "rest", zoneLabel: "1000–2000 km", upTo500g: 80, upTo1kg: 120, upTo2kg: 180, perAdditional500g: 40 },
      { zone: "northeast", zoneLabel: "Above 2000 km", upTo500g: 95, upTo1kg: 140, upTo2kg: 220, perAdditional500g: 50 },
    ],
  },
];

let state: CarrierConfig[] = [...seed];
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const emit = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export const useShipping = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const shippingActions = {
  updateRate(carrier: Carrier, zone: Zone, patch: Partial<RateRow>) {
    state = state.map((c) =>
      c.id === carrier
        ? {
            ...c,
            rates: c.rates.map((r) => (r.zone === zone ? { ...r, ...patch } : r)),
          }
        : c,
    );
    emit();
  },
  markUpdated(carrier: Carrier) {
    state = state.map((c) =>
      c.id === carrier ? { ...c, lastUpdated: new Date().toISOString() } : c,
    );
    emit();
  },
  updateNotes(carrier: Carrier, notes: string) {
    state = state.map((c) => (c.id === carrier ? { ...c, notes } : c));
    emit();
  },
};

// Volumetric weight in grams
export function volumetricGrams(l: number, w: number, h: number) {
  return Math.round(((l * w * h) / 5000) * 1000);
}

// Chargeable weight: max(actual, volumetric)
export function chargeableGrams(actualGrams: number, l: number, w: number, h: number) {
  return Math.max(actualGrams, volumetricGrams(l, w, h));
}

export function calculateRate(carrier: CarrierConfig, zone: Zone, grams: number): number {
  const row = carrier.rates.find((r) => r.zone === zone);
  if (!row) return 0;
  if (grams <= 500) return row.upTo500g;
  if (grams <= 1000) return row.upTo1kg;
  if (grams <= 2000) return row.upTo2kg;
  const extra = Math.ceil((grams - 2000) / 500);
  return row.upTo2kg + extra * row.perAdditional500g;
}

// Reminder logic: every 30 days
export function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
export function isStale(iso: string) {
  return daysSince(iso) >= 30;
}
