// Importa la interfaz que estructura las magnitudes físicas del campo electromagnético
import { ElectromagneticMetrics } from "./types";

/**
 * CAPA 5: SERVICIOS FÍSICOS Y ELECTROMAGNÉTICOS
 * Proporciona las transformaciones matemáticas rigurosas entre el potencial escalar adimensional u(i,j)
 * obtenido mediante Diferencias Finitas y las variables físicas reales del campo electromagnético
 * en las bandas UHF (2.4 GHz) y SHF (5.0 GHz):
 * - Nivel de potencia recibida P_rx (dBm y mW)
 * - Magnitud media temporal del Vector de Poynting <S> = |E × H| (µW/m²)
 * - Intensidad de Campo Eléctrico eficaz E_rms (V/m)
 * - Intensidad de Campo Magnético eficaz H_rms (mA/m)
 */

// Velocidad de propagación de las ondas electromagnéticas en el vacío c₀ (m/s)
const C_LIGHT = 2.99792458e8;
// Impedancia intrínseca del espacio libre η₀ = √(μ₀ / ε₀) ≈ 120π (Ω)
const ETA_0 = 376.730313668;

/**
 * Convierte un valor de potencial escalar normalizado u ∈ [0, 100] de la malla numérica
 * a su equivalencia física de potencia recibida en dBm (decibelios referidos a 1 milivatio).
 * La escala lineal en decibelios mapea desde el piso de ruido térmico (-85 dBm) hasta la zona cercana (-25 dBm).
 *
 * @param val Valor de potencial escalar adimensional u_{i,j} en el rango [0, 100].
 * @returns Nivel de potencia recibida redondeado al entero más cercano en dBm.
 */
export function convertirADbm(val: number): number {
  // Si el potencial numérico es prácticamente nulo (≤ 0.05), se retorna el piso de ruido térmico (-85 dBm)
  if (val <= 0.05) return -85;
  // Acota el valor de entrada estrictamente al intervalo [0, 100] para evitar extrapolaciones fuera de rango
  const clamped = Math.min(100, Math.max(0, val));
  // Aplica la transformación afín: P_rx(dBm) = -85 + (u / 100) * 60
  const dbm = -85 + (clamped / 100.0) * 60.0;
  // Redondea el resultado a un número entero de decibelios dBm
  return Math.round(dbm);
}

/**
 * Calcula el conjunto completo de magnitudes físicas del campo electromagnético para un nodo (i, j) de la malla:
 * 1. Longitud de onda en el vacío: λ = c₀ / f
 * 2. Potencia lineal recibida: P_rx (W) = 10^((P_dBm - 30) / 10)
 * 3. Apertura efectiva de una antena receptora isotrópica ideal (G_r = 1): A_eff = λ² / (4π)
 * 4. Densidad superficial de potencia (magnitud media del Vector de Poynting): <S> = P_rx / A_eff (W/m²)
 * 5. Intensidad eficaz de campo eléctrico en zona lejana: E_rms = √(η₀ · <S>) (V/m)
 * 6. Intensidad eficaz de campo magnético acoplado: H_rms = E_rms / η₀ (A/m)
 *
 * @param val Potencial escalar normalizado u_{i,j} de la celda evaluada.
 * @param frequency Banda de frecuencia portadora del enlace ('2.4 GHz' o '5 GHz').
 * @returns Objeto ElectromagneticMetrics con todas las magnitudes físicas redondeadas con precisión científica.
 */
export function calcularMagnitudesElectromagneticas(
  val: number,
  frequency: "2.4 GHz" | "5 GHz" = "2.4 GHz"
): ElectromagneticMetrics {
  // Obtiene el nivel de potencia recibida en dBm a partir del potencial escalar de la celda
  const dbm = convertirADbm(val);
  // Traduce la etiqueta de banda de frecuencia a su valor numérico exacto en hercios (Hz)
  const freqHz = frequency === "2.4 GHz" ? 2.4e9 : 5.0e9;
  // Calcula la longitud de onda física en metros: λ = c₀ / f
  const wavelengthM = C_LIGHT / freqHz;
  // Convierte la longitud de onda a centímetros con dos decimales de precisión (≈ 12.49 cm o ≈ 6.00 cm)
  const wavelengthCm = Math.round(wavelengthM * 100 * 100) / 100;

  // Convierte la potencia logarítmica en dBm a potencia lineal en milivatios: P(mW) = 10^(dBm / 10)
  const powerMw = Math.pow(10, dbm / 10);
  // Convierte la potencia de milivatios a vatios (Sistema Internacional): P(W) = P(mW) * 10^-3
  const powerW = powerMw * 1e-3;

  // Calcula el área de captura efectiva de un receptor isotrópico ideal: A_eff = λ² / (4π) en m²
  const aEff = (wavelengthM * wavelengthM) / (4 * Math.PI);

  // Determina el flujo medio de energía electromagnética (Vector de Poynting <S>) en W/m²
  const poyntingWm2 = powerW / aEff;
  // Escala la magnitud del Vector de Poynting a microvatios por metro cuadrado (µW/m²) para lectura clara
  const poyntingUwM2 = poyntingWm2 * 1e6;

  // Despeja la amplitud eficaz del campo eléctrico de la relación de onda plana: E_rms = √(η₀ · <S>) en V/m
  const electricFieldVm = Math.sqrt(ETA_0 * poyntingWm2);

  // Calcula la amplitud eficaz del campo magnético ortogonal: H_rms = (E_rms / η₀) * 10³ expresado en mA/m
  const magneticFieldMam = (electricFieldVm / ETA_0) * 1e3;

  // Retorna el diccionario estructurado con todas las magnitudes electromagnéticas listas para visualización
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
 * Clasifica la intensidad de señal en dBm dentro de rangos operativos estándar de telecomunicaciones (IEEE 802.11),
 * devolviendo la etiqueta descriptiva y las clases cromáticas de Tailwind CSS correspondientes.
 *
 * @param dbm Nivel de potencia recibida en decibelios respecto a 1 mW (dBm).
 * @returns Objeto con la descripción cualitativa y las clases CSS de color de texto y fondo.
 */
export function clasificarCalidadSenal(dbm: number): { text: string; color: string; bg: string } {
  // Señal de máxima fidelidad (apta para modulaciones densas 256-QAM / 1024-QAM sin pérdida de paquetes)
  if (dbm >= -50) {
    return { text: "Excelente (-25 a -50 dBm)", color: "text-emerald-500", bg: "bg-emerald-500" };
  // Señal robusta y estable para transmisión multimedia de alta definición y baja latencia
  } else if (dbm >= -65) {
    return { text: "Buena (-51 a -65 dBm)", color: "text-teal-500", bg: "bg-teal-500" };
  // Señal moderada donde comienza a reducirse la tasa de modulación física (MCS) por relación señal/ruido
  } else if (dbm >= -75) {
    return { text: "Regular (-66 a -75 dBm)", color: "text-amber-500", bg: "bg-amber-500" };
  // Señal marginal propensa a retransmisiones frecuentes y caídas de enlace
  } else if (dbm >= -82) {
    return { text: "Débil (-76 a -82 dBm)", color: "text-orange-500", bg: "bg-orange-500" };
  // Zona de sombra electromagnética por debajo del umbral de sensibilidad del receptor
  } else {
    return { text: "Sin Cobertura (<-82 dBm)", color: "text-rose-500", bg: "bg-rose-500" };
  }
}

/**
 * Genera, codifica y descarga en el navegador un archivo CSV con la serie histórica del error residual
 * registrado en cada iteración del solucionador numérico seleccionado.
 *
 * @param errorHistory Arreglo con la norma infinito del error ||u^{(k)} - u^{(k-1)}||_∞ por iteración.
 * @param methodName Nombre del método numérico ejecutado ('jacobi', 'gauss-seidel' o 'sor').
 */
export function exportarConvergenciaACSV(errorHistory: number[], methodName: string): void {
  // Inicializa el encabezado DataURI indicando formato CSV con codificación de caracteres UTF-8
  let csvContent = "data:text/csv;charset=utf-8,";
  // Añade la primera fila correspondiente a los nombres de las columnas de la tabla científica
  csvContent += "Iteracion,Error_Residual_Maximo,Metodo\n";
  // Recorre el historial de errores y concatena una fila por cada iteración con precisión de 8 decimales
  errorHistory.forEach((err, idx) => {
    csvContent += `${idx + 1},${err.toFixed(8)},${methodName}\n`;
  });

  // Codifica los caracteres especiales de la cadena CSV para que sea una URI válida en el navegador
  const encodedUri = encodeURI(csvContent);
  // Crea dinámicamente un elemento HTML de hipervínculo (<a>) temporal en memoria
  const link = document.createElement("a");
  // Asigna la URI de datos generada al atributo 'href' del enlace
  link.setAttribute("href", encodedUri);
  // Define el nombre del archivo que se descargará en el equipo del usuario
  link.setAttribute("download", `convergencia_${methodName.toLowerCase()}.csv`);
  // Inserta temporalmente el nodo <a> en el cuerpo del documento DOM para habilitar el clic programático
  document.body.appendChild(link);
  // Dispara el evento de clic para iniciar la descarga inmediata del archivo CSV
  link.click();
  // Elimina el nodo temporal del DOM para mantener limpia la memoria del documento
  document.body.removeChild(link);
}
