import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FunctionEntry,
  MakesData,
  SearchHistoryEntry,
  Vehicle,
} from "@/types";
import { mockData } from "@/data/mockData";
import { getCategoryKeys, getCategoryMap } from "@/lib/categories";

type State = {
  data: MakesData;
  searchHistory: SearchHistoryEntry[];
};

type Actions = {
  addToHistory: (entry: Omit<SearchHistoryEntry, "timestamp">) => void;
  removeFromHistory: (index: number) => void;
  clearHistory: () => void;
  addVehicle: (make: string, vehicle: Vehicle) => void;
  addFunction: (
    make: string,
    vehicleId: string,
    category: string,
    code: string,
    entry: FunctionEntry,
  ) => void;
  deleteFunction: (
    make: string,
    vehicleId: string,
    category: string,
    code: string,
  ) => void;
  resetToMock: () => void;
};

export const useVehicleStore = create<State & Actions>()(
  persist(
    (set) => ({
      data: mockData,
      searchHistory: [],

      addToHistory: (entry) =>
        set((s) => {
          const key = (e: SearchHistoryEntry) =>
            `${e.make}|${e.model}|${e.year}|${e.engine}`;
          const k = key({ ...entry, timestamp: 0 } as SearchHistoryEntry);
          const filtered = s.searchHistory.filter((e) => key(e) !== k);
          const next: SearchHistoryEntry[] = [
            { ...entry, timestamp: Date.now() },
            ...filtered,
          ].slice(0, 8);
          return { searchHistory: next };
        }),

      removeFromHistory: (index) =>
        set((s) => ({
          searchHistory: s.searchHistory.filter((_, i) => i !== index),
        })),

      clearHistory: () => set({ searchHistory: [] }),

      addVehicle: (make, vehicle) =>
        set((s) => {
          const list = s.data[make] ? [...s.data[make]] : [];
          const exists = list.some((v) => v.id === vehicle.id);
          if (exists) return s;
          list.push(vehicle);
          return { data: { ...s.data, [make]: list } };
        }),

      addFunction: (make, vehicleId, category, code, entry) =>
        set((s) => {
          const list = s.data[make];
          if (!list) return s;
          const idx = list.findIndex((v) => v.id === vehicleId);
          if (idx === -1) return s;
          const v = list[idx];
          const cat = (v[category] as Record<string, FunctionEntry>) ?? {};
          if (cat[code]) return s; // dup guard
          const updatedV: Vehicle = {
            ...v,
            [category]: { ...cat, [code]: entry },
          };
          const newList = [...list];
          newList[idx] = updatedV;
          return { data: { ...s.data, [make]: newList } };
        }),

      deleteFunction: (make, vehicleId, category, code) =>
        set((s) => {
          const list = s.data[make];
          if (!list) return s;
          const idx = list.findIndex((v) => v.id === vehicleId);
          if (idx === -1) return s;
          const v = list[idx];
          const cat = (v[category] as Record<string, FunctionEntry>) ?? {};
          const target = cat[code];
          if (!target || target.origin !== "user") return s; // protect originals
          const { [code]: _omit, ...rest } = cat;
          const updatedV: Vehicle = { ...v, [category]: rest };
          const newList = [...list];
          newList[idx] = updatedV;
          return { data: { ...s.data, [make]: newList } };
        }),

      resetToMock: () => set({ data: mockData, searchHistory: [] }),
    }),
    {
      name: "odin-store-v1",
      // hydrate mocks only if empty
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        const hasData =
          p.data && Object.keys(p.data).length > 0;
        return {
          ...current,
          ...p,
          data: hasData ? (p.data as MakesData) : current.data,
          searchHistory: p.searchHistory ?? [],
        };
      },
    },
  ),
);

/* ---------- Selectors / derived helpers ---------- */

export function getMakes(data: MakesData): string[] {
  return Object.keys(data).sort();
}

export function getModelsFor(data: MakesData, make: string): string[] {
  const list = data[make] ?? [];
  return Array.from(new Set(list.map((v) => v.model))).sort();
}

export function getYearsFor(
  data: MakesData,
  make: string,
  model: string,
): number[] {
  const list = data[make] ?? [];
  return Array.from(
    new Set(list.filter((v) => v.model === model).map((v) => v.year)),
  ).sort((a, b) => b - a);
}

export function getEnginesFor(
  data: MakesData,
  make: string,
  model: string,
  year: number,
): string[] {
  const list = data[make] ?? [];
  return Array.from(
    new Set(
      list
        .filter((v) => v.model === model && v.year === year)
        .map((v) => v.engine),
    ),
  ).sort();
}

export function findVehicle(
  data: MakesData,
  make: string,
  model: string,
  year: number,
  engine: string,
): Vehicle | undefined {
  const list = data[make] ?? [];
  return list.find(
    (v) => v.model === model && v.year === year && v.engine === engine,
  );
}

/** Flat list of all function entries across the dataset for global search. */
export function getAllFunctionEntries(data: MakesData) {
  const out: Array<{
    make: string;
    vehicle: Vehicle;
    category: string;
    code: string;
    entry: FunctionEntry;
  }> = [];
  for (const [make, list] of Object.entries(data)) {
    for (const v of list) {
      for (const cat of getCategoryKeys(v)) {
        const m = getCategoryMap(v, cat);
        for (const [code, entry] of Object.entries(m)) {
          out.push({ make, vehicle: v, category: cat, code, entry });
        }
      }
    }
  }
  return out;
}
