import { ElectromagneticMetrics } from "./types";

/**
 * CAPA 5: SERVICIOS FÍSICOS Y ELECTROMAGNÉTICOS
 * Proporciona conversiones rigurosas entre el potencial adimensional de la malla en Diferencias Finitas
 * y las magnitudes físicas del campo electromagnético en bandas UHF (2.4 GHz) y SHF (5.0 GHz):
 * - Potencia recibida P_rx (dBm y mW)
 * - Magnitud media del Vector de Poynting <S> = |E x H| (µW/m²)
 * - Intensidad de Campo Eléctrico eficaz E_rms (V/m)
 * - Intensidad de Campo Magnético eficaz H_rms (mA/m)
 */

const C_LIGHT = 2.99792458e8; // Velocidad de la luz en el vacío (m/s)
const ETA_0 = 376.730313668;  // Impedancia intrínseca del espacio libre η₀ = √(μ₀/ε₀) (Ω)

/**
 * Convierte un valor de potencial escalar normalizado (0 a 100)
 * a su equivalencia física en dBm (decibelios respecto a 1 mW).
 * Escala calibrada desde el piso de sensibilidad térmica (-85 dBm) hasta la cercanía de la fuente (-25 dBm).
 */
export function convertirADbm(val: number): number {
  if (val <= 0.05) return -85; // Umbral de ruido / sin cobertura útil
  const clamped = Math.min(100, Math.max(0, val));
  const dbm = -85 + (clamped / 100.0) * 60.0;
  return Math.round(dbm);
}

/**
 * Calcula todas las magnitudes físicas del campo electromagnético para un nodo de la malla:
 * - Longitud de onda λ = c / f
 * - Potencia lineal P_rx (W) = 10^((P_dBm - 30)/10)
 * - Apertura efectiva isotrópica A_eff = λ² / (4π)
 * - Densidad de flujo de potencia (Vector de Poynting promedio) <S> = P_rx / A_eff (W/m²)
 * - Campo eléctrico eficaz E_rms = √(η₀ · <S>) (V/m)
 * - Campo magnético eficaz H_rms = E_rms / η₀ (A/m)
 */
export function calcularMagnitudesElectromagneticas(
  val: number,
  frequency: "2.4 GHz" | "5 GHz" = "2.4 GHz"
): ElectromagneticMetrics {
  const dbm = convertirADbm(val);
  const freqHz = frequency === "2.4 GHz" ? 2.4e9 : 5.0e9;
  const wavelengthM = C_LIGHT / freqHz;
  const wavelengthCm = Math.round(wavelengthM * 100 * 100) / 100;

  // Potencia recibida en mW y W
  const powerMw = Math.pow(10, dbm / 10);
  const powerW = powerMw * 1e-3;

  // Área efectiva de antena isotrópica ideal: A_eff = λ² / (4π)
  const aEff = (wavelengthM * wavelengthM) / (4 * Math.PI);

  // Magnitud promedio del Vector de Poynting <S> en W/m² y µW/m²
  const poyntingWm2 = powerW / aEff;
  const poyntingUwM2 = poyntingWm2 * 1e6;

  // Intensidad de campo eléctrico eficaz E_rms = √(η₀ · <S>) en V/m
  const electricFieldVm = Math.sqrt(ETA_0 * poyntingWm2);

  // Intensidad de campo magnético eficaz H_rms = E_rms / η₀ en mA/m
  const magneticFieldMam = (electricFieldVm / ETA_0) * 1e3;

  return {
    dbm,
    powerMw: Number(powerMw.toExponential(3)),
    poyntingUwM2: Number(poyntingUwM2.toFixed(3)),
    electricFieldVm: Number(electricFieldVm.toFixed(4)),
    magneticFieldMam: Number(magneticFieldMam.toFixed(4)),
    wavelengthCm,
  };
}

/**
 * Clasifica la intensidad de señal dBm en categorías cualitativas interpretables,
 * asignando estilos visuales compatibles con el tema de la aplicación.
 */
export function clasificarCalidadSenal(dbm: number): { text: string; color: string; bg: string } {
  if (dbm >= -50) {
    return { text: "Excelente (-25 a -50 dBm)", color: "text-emerald-500", bg: "bg-emerald-500" };
  } else if (dbm >= -65) {
    return { text: "Buena (-51 a -65 dBm)", color: "text-teal-500", bg: "bg-teal-500" };
  } else if (dbm >= -75) {
    return { text: "Regular (-66 a -75 dBm)", color: "text-amber-500", bg: "bg-amber-500" };
  } else if (dbm >= -82) {
    return { text: "Débil (-76 a -82 dBm)", color: "text-orange-500", bg: "bg-orange-500" };
  } else {
    return { text: "Sin Cobertura (<-82 dBm)", color: "text-rose-500", bg: "bg-rose-500" };
  }
}

/**
 * Genera, codifica y gatilla la descarga automática de un reporte en formato CSV conteniendo
 * las métricas de error y velocidad residual calculadas durante el proceso de convergencia.
 */
export function exportarConvergenciaACSV(errorHistory: number[], methodName: string): void {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Iteracion,Error_Residual_Maximo,Metodo\n";
  errorHistory.forEach((err, idx) => {
    csvContent += `${idx + 1},${err.toFixed(8)},${methodName}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `convergencia_${methodName.toLowerCase()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
