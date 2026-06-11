// CAPA 1 — Modelos de hardware WiFi (catálogo de enrutadores)

export interface RouterModel {
  id: string;
  name: string;
  brand: string;
  model: string;
  txPowerDbm: number;
  gainDbi: number;
  eirpDbm: number;
  frequency: "2.4 GHz" | "5 GHz";
  standard: string;
  reachMeters: number;
  description: string;
}

export const ROUTER_MODELS: Record<string, RouterModel> = {
  tplink: {
    id: "tplink",
    name: "TP-Link Archer C60",
    brand: "TP-Link",
    model: "Hogareño Estándar",
    txPowerDbm: 24,
    gainDbi: 8,
    eirpDbm: 32,
    frequency: "2.4 GHz",
    standard: "Wi-Fi 5 (802.11ac)",
    reachMeters: 45,
    description: "Router doméstico MIMO 2.4 GHz con excelente penetración.",
  },
  ubiquiti: {
    id: "ubiquiti",
    name: "Ubiquiti UniFi U6 Pro",
    brand: "Ubiquiti",
    model: "Punto de Acceso Empresarial",
    txPowerDbm: 31,
    gainDbi: 9,
    eirpDbm: 40,
    frequency: "5 GHz",
    standard: "Wi-Fi 6 (802.11ax)",
    reachMeters: 75,
    description: "Access point empresarial Wi-Fi 6 de alta potencia.",
  },
  asus: {
    id: "asus",
    name: "ASUS ROG GT-AX11000",
    brand: "ASUS ROG",
    model: "Gaming Ultra-Rendimiento",
    txPowerDbm: 38,
    gainDbi: 12,
    eirpDbm: 50,
    frequency: "5 GHz",
    standard: "Wi-Fi 6 (802.11ax)",
    reachMeters: 100,
    description: "Router gaming de máxima potencia y alcance.",
  },
  google: {
    id: "google",
    name: "Google Nest Wifi (Mesh)",
    brand: "Google",
    model: "Nodo Inteligente de Malla",
    txPowerDbm: 26,
    gainDbi: 7,
    eirpDbm: 33,
    frequency: "5 GHz",
    standard: "Wi-Fi 5 (802.11ac)",
    reachMeters: 60,
    description: "Nodo mesh optimizado para cobertura distribuida.",
  },
};
