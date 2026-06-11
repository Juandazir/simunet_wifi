// CAPA 1 — Modelos de materiales y coeficientes de atenuación

import { MaterialType } from "../types";

export const MATERIALS = {
  air: {
    id: "air" as MaterialType,
    name: "Espacio Libre",
    color: "bg-transparent",
    attenuation: 0.0,
    dbLoss: 0,
    iconName: "Wind",
  },
  drywall: {
    id: "drywall" as MaterialType,
    name: "Yeso (Drywall)",
    color: "bg-slate-300 border-slate-400",
    attenuation: 0.02,
    dbLoss: 3,
    iconName: "Columns",
  },
  brick: {
    id: "brick" as MaterialType,
    name: "Ladrillo",
    color: "bg-amber-700 border-amber-800",
    attenuation: 0.08,
    dbLoss: 8,
    iconName: "Brick",
  },
  concrete: {
    id: "concrete" as MaterialType,
    name: "Concreto",
    color: "bg-gray-600 border-gray-700",
    attenuation: 0.15,
    dbLoss: 15,
    iconName: "SquareDot",
  },
  metal: {
    id: "metal" as MaterialType,
    name: "Metal",
    color: "bg-zinc-400 border-zinc-500 animate-pulse",
    attenuation: 0.25,
    dbLoss: 35,
    iconName: "ShieldAlert",
  },
};

export const DEFAULT_ROWS = 24;
export const DEFAULT_COLS = 24;
