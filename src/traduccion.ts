// Importa el tipo MaterialType desde la capa de definiciones de tipos para tipar los muros detectados
import { MaterialType } from "./types";

/**
 * CAPA 3: PROCESAMIENTO GEOMÉTRICO DE PLANOS Y DICCIONARIO DE LOCALIZACIÓN
 * Cumple dos funciones de traducción:
 * 1. Traduce imágenes matriciales (planos arquitectónicos rasterizados en RGBA) a condiciones de frontera
 *    internas y coeficientes dieléctricos en la malla discreta mediante luminancia ITU-R BT.601.
 * 2. Proporciona el diccionario bilingüe (Español / Inglés) para etiquetas de interfaz.
 */

// Códigos de idioma soportados por el módulo de traducción textual
export type LanguageCode = "es" | "en";

/**
 * Traduce un mapa de píxeles RGBA (extraído de un plano arquitectónico subido por el usuario)
 * a una colección discreta de coordenadas de muros sobre la malla de diferencias finitas.
 *
 * @param pixelData Arreglo plano de bytes RGBA (Uint8ClampedArray de longitud rows * cols * 4).
 * @param rows Número total de filas de la malla discreta.
 * @param cols Número total de columnas de la malla discreta.
 * @param thresh Umbral de luminancia en escala de grises (0 a 255) bajo el cual un píxel se considera obstáculo.
 * @param wallMaterial Material dieléctrico que se asignará a cada celda detectada como muro.
 * @returns Arreglo de objetos { x: fila, y: columna, material } listos para inyectarse en la rejilla.
 */
export function traducirImagenAMatriz(
  pixelData: Uint8ClampedArray,
  rows: number,
  cols: number,
  thresh: number,
  wallMaterial: MaterialType
): { x: number; y: number; material: MaterialType }[] {
  // Inicializa la lista vacía donde se acumularán las coordenadas de los muros detectados
  const walls: { x: number; y: number; material: MaterialType }[] = [];

  // Recorre secuencialmente cada fila r de la imagen redimensionada al tamaño de la malla
  for (let r = 0; r < rows; r++) {
    // Recorre secuencialmente cada columna c dentro de la fila actual
    for (let c = 0; c < cols; c++) {
      // Omite el borde perimetral exterior (r=0, r=rows-1, c=0, c=cols-1) porque tiene condición Dirichlet fija (u=0)
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        continue;
      }

      // Calcula el índice base en el arreglo plano RGBA donde inicia el píxel (r, c) (4 bytes por píxel)
      const idx = (r * cols + c) * 4;
      // Extrae la componente de color Rojo (R ∈ [0, 255])
      const red = pixelData[idx];
      // Extrae la componente de color Verde (G ∈ [0, 255])
      const green = pixelData[idx + 1];
      // Extrae la componente de color Azul (B ∈ [0, 255])
      const blue = pixelData[idx + 2];
      // Extrae el canal de opacidad Alfa (A ∈ [0, 255], donde 0 es totalmente transparente)
      const alpha = pixelData[idx + 3];

      // Calcula la luminancia perceptual Y según el estándar fotométrico ITU-R BT.601: Y = 0.299R + 0.587G + 0.114B
      const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;

      // Si el píxel no es transparente (alpha > 40) y su luminancia es más oscura que el umbral (brightness < thresh),
      // se clasifica como un trazo estructural del plano y se agrega como celda de muro con el material elegido
      if (alpha > 40 && brightness < thresh) {
        walls.push({ x: r, y: c, material: wallMaterial });
      }
    }
  }

  // Devuelve el conjunto completo de muros extraídos del plano arquitectónico
  return walls;
}

// Diccionario estático de cadenas de texto organizadas por código de idioma ('es' y 'en')
export const DICCIONARIO_TRADUCCIONES = {
  es: {
    title: "SimuNet: Simulador de Propagación Electromagnética UHF/SHF",
    method_select: "Método de resolución numérica:",
    grid_size: "Dimensiones de la malla:",
    run_btn: "Ejecutar Simulación",
    clear_btn: "Limpiar Muros",
    results_label: "Resumen Numérico de Convergencia",
    iterations: "Iteraciones realizadas",
    final_error: "Error residual final",
    exec_time: "Tiempo de cómputo",
    save_btn: "Exportar Resultados",
    helper_draw: "Dibuja en la malla superior: [Clic izquierdo para colocar elementos]",
    legend_wall: "Muro Dieléctrico",
    legend_router: "Transmisor RF",
    legend_empty: "Aire / Espacio Libre"
  },
  en: {
    title: "SimuNet: UHF/SHF Electromagnetic Propagation Simulator",
    method_select: "Numerical Solver Method:",
    grid_size: "Mesh Grid Size:",
    run_btn: "Run Simulation",
    clear_btn: "Clear Walls",
    results_label: "Numerical Convergence Summary",
    iterations: "Iterations completed",
    final_error: "Final residual error",
    exec_time: "Execution time",
    save_btn: "Export Results",
    helper_draw: "Paint on the grid above: [Left click to place elements]",
    legend_wall: "Dielectric Wall",
    legend_router: "RF Transmitter",
    legend_empty: "Air / Free Space"
  }
};

/**
 * Resuelve y devuelve el texto traducido asociado a una clave del diccionario según el idioma indicado.
 *
 * @param key Clave identificadora del texto dentro del diccionario.
 * @param lang Código de idioma ('es' por defecto, o 'en').
 * @returns Cadena de texto traducida correspondiente a la clave solicitada.
 */
export function traducir(key: keyof typeof DICCIONARIO_TRADUCCIONES["es"], lang: LanguageCode = "es"): string {
  // Selecciona el sub-diccionario del idioma pedido o recurre al español como respaldo seguro
  const dictionary = DICCIONARIO_TRADUCCIONES[lang] || DICCIONARIO_TRADUCCIONES["es"];
  // Retorna el texto asociado a la clave o la propia clave si no existiera coincidencia
  return dictionary[key] || key;
}
