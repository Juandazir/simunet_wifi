// CAPA 1 — Presets de entorno y utilidades de dominio

import { MaterialType, RouterConfig, UserProfile } from "./types";
import { ROUTER_MODELS } from "./modelos/routers";

export const PRESET_PROFILES: UserProfile[] = [
  {
    username: "admin_pamplona",
    role: "admin",
    savedNetworks: [
      {
        id: "net_default_office",
        name: "Oficina Central de Telecomunicaciones - U Pamplona",
        timestamp: "03/06/2026, 12:00:00",
        walls: [
          { x: 5, y: 5, material: "concrete" },
          { x: 5, y: 6, material: "concrete" },
          { x: 5, y: 7, material: "concrete" },
          { x: 12, y: 5, material: "concrete" },
          { x: 12, y: 6, material: "concrete" },
          { x: 12, y: 7, material: "concrete" },
        ],
        routers: [
          { x: 10, y: 10, power: 100, ssid: "U_Pamplona_5G", frequency: "5 GHz" },
        ],
        gridSize: { rows: 16, cols: 16 },
      },
    ],
  },
  {
    username: "estudiante_pamplona",
    role: "standard",
    savedNetworks: [],
  },
];

export const METHOD_LABELS: Record<string, string> = {
  jacobi: "Jacobi",
  "gauss-seidel": "Gauss-Seidel",
  sor: "SOR",
};

export function buildRouterFromModel(
  modelId: string,
  x: number,
  y: number,
  suffix?: string
): RouterConfig {
  const model = ROUTER_MODELS[modelId];
  const ssidBase = model
    ? `${model.brand}_${model.model}`.replace(/[\s\-\.]+/g, "_")
    : "WiFi_Simunet";
  return {
    x,
    y,
    power: model ? Math.round(model.eirpDbm * (100 / 38)) : 100,
    ssid: suffix ? `${ssidBase}_${suffix}` : ssidBase,
    frequency: model?.frequency ?? "2.4 GHz",
    modelId,
  };
}

export function loadEnvironmentPreset(
  presetName: string,
  modelId: string
): { walls: { x: number; y: number; material: MaterialType }[]; routers: RouterConfig[] } {
  const initialRouter = buildRouterFromModel(modelId, 12, 12);

  if (presetName === "empty") {
    return { walls: [], routers: [initialRouter] };
  }

  if (presetName === "office") {
    const officeWalls: { x: number; y: number; material: MaterialType }[] = [];
    for (let i = 2; i < 22; i++) {
      if (i !== 7 && i !== 8 && i !== 15 && i !== 16) {
        officeWalls.push({ x: i, y: 11, material: "concrete" });
      }
    }
    for (let j = 2; j < 11; j++) {
      if (j !== 5) {
        officeWalls.push({ x: 8, y: j, material: "concrete" });
        officeWalls.push({ x: 15, y: j, material: "concrete" });
      }
    }
    for (let j = 12; j < 22; j++) {
      if (j !== 17) {
        officeWalls.push({ x: 10, y: j, material: "concrete" });
        officeWalls.push({ x: 18, y: j, material: "concrete" });
      }
    }
    return { walls: officeWalls, routers: [buildRouterFromModel(modelId, 4, 4)] };
  }

  const cageWalls: { x: number; y: number; material: MaterialType }[] = [];
  for (let i = 6; i <= 17; i++) {
    cageWalls.push({ x: i, y: 6, material: "metal" });
    cageWalls.push({ x: i, y: 17, material: "metal" });
  }
  for (let j = 7; j <= 16; j++) {
    cageWalls.push({ x: 6, y: j, material: "metal" });
    cageWalls.push({ x: 17, y: j, material: "metal" });
  }
  return { walls: cageWalls, routers: [initialRouter] };
}
