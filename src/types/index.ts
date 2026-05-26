export type Origin = "original" | "user";

export type FunctionEntry = {
  description: string;
  origin: Origin;
};

export type CategoryMap = Record<string, FunctionEntry>;

export const VEHICLE_META_KEYS = ["id", "model", "year", "engine"] as const;
export type VehicleMetaKey = (typeof VEHICLE_META_KEYS)[number];

export type Vehicle = {
  id: string;
  model: string;
  year: number;
  engine: string;
} & {
  [category: string]: CategoryMap | string | number;
};

export type MakesData = Record<string, Vehicle[]>;

export type SearchHistoryEntry = {
  make: string;
  model: string;
  year: number;
  engine: string;
  timestamp: number;
};

export const CATEGORY_LABELS: Record<string, string> = {
  actuation_test: "Testes de atuação",
  special_functions: "Funções especiais",
};

export const CATEGORY_COLORS: Record<string, string> = {
  actuation_test: "var(--tag-actuation)",
  special_functions: "var(--tag-special)",
};

export const CATEGORY_PREFIXES: Record<string, string> = {
  actuation_test: "T",
  special_functions: "SP",
};
