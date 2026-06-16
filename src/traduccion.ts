/**
 * CAPA 3: LOCALIZACIÓN Y TRADUCCIÓN
 * Contiene el mapa estático de diccionarios multilingües y el resolvedor de claves de traducción.
 * Esto separa la lógica de renderizado del componente visual de las etiquetas textuales literales,
 * asegurando flexibilidad internacionalizada tanto en español como en inglés.
 */

export type LanguageCode = "es" | "en";
import { MaterialType } from "./types";

/**
 * Traduce un mapa de píxeles o matriz de luminancia a una colección discreta de coordenadas de muros (Capa 3).
 * Convierte la entrada geométrica visual del plano cargado por el estudiante en objetos numéricos de la malla.
 * 
 * @param pixelData Arreglo plano de píxeles RGBA (Uint8ClampedArray).
 * @param rows Filas de la malla.
 * @param cols Columnas de la malla.
 * @param thresh Umbral de luminancia (sensibilidad de 0 a 255).
 * @param wallMaterial Tipo de material de muro a asignar a los obstáculos detectados.
 * @returns Lista de coordenadas { x: fila, y: columna, material: tipo } que representan los muros.
 */
export function traducirImagenAMatriz(
  pixelData: Uint8ClampedArray,
  rows: number,
  cols: number,
  thresh: number,
  wallMaterial: MaterialType
): { x: number; y: number; material: MaterialType }[] {
  const walls: { x: number; y: number; material: MaterialType }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Evitar colocar muros en los límites perimetrales (condición Dirichlet fija)
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        continue;
      }

      const idx = (r * cols + c) * 4;
      const red = pixelData[idx];
      const green = pixelData[idx + 1];
      const blue = pixelData[idx + 2];
      const alpha = pixelData[idx + 3];

      // Fórmula estándar de luminancia ITU-R BT.601
      const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;

      // Un punto oscuro (baja luminosidad o canal alfa activo) califica como muro estructural
      if (alpha > 40 && brightness < thresh) {
        walls.push({ x: r, y: c, material: wallMaterial });
      }
    }
  }

  return walls;
}

// Contenedores estáticos de traducción organizados por código de idioma
export const DICCIONARIO_TRADUCCIONES = {
  es: {
    title: "SIMNET: Simulador de Malla WiFi",
    method_select: "Método de resolución:",
    grid_size: "Tamaño de la cuadrícula:",
    run_btn: "Ejecutar Simulación",
    clear_btn: "Limpiar Muro",
    results_label: "Resumen Numérico de Convergencia",
    iterations: "Iteraciones realizadas",
    final_error: "Error de convergencia final",
    exec_time: "Tiempo de ejecución",
    save_btn: "Exportar Resultados",
    helper_draw: "Pinta en la cuadrícula superior: [Mouse Click para colocar elementos]",
    legend_wall: "Muro Obstáculo",
    legend_router: "Enrutador Emisor",
    legend_empty: "Espacio Abierto"
  },
  en: {
    title: "SIMNET: WiFi Mesh Simulator",
    method_select: "Solver Method:",
    grid_size: "Grid Size:",
    run_btn: "Run Simulation",
    clear_btn: "Clear Walls",
    results_label: "Numerical Convergence Summary",
    iterations: "Iterations completed",
    final_error: "Final convergence error",
    exec_time: "Execution time",
    save_btn: "Export Results",
    helper_draw: "Paint on the grid above: [Click mouse to place elements]",
    legend_wall: "Obstacle Wall",
    legend_router: "Transmitter Router",
    legend_empty: "Open Space"
  }
};

/**
 * Función resolvedora que recupera el término correspondiente según el código de idioma activo.
 * Retorna por defecto la traducción en español si la clave buscada no está disponible.
 */
export function traducir(key: keyof typeof DICCIONARIO_TRADUCCIONES["es"], lang: LanguageCode = "es"): string {
  const dictionary = DICCIONARIO_TRADUCCIONES[lang] || DICCIONARIO_TRADUCCIONES["es"];
  return dictionary[key] || key;
}

