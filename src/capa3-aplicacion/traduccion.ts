/**
 * CAPA 3 — APLICACIÓN: Localización y traducción
 * Contiene el mapa estático de diccionarios multilingües y el resolvedor de claves de traducción.
 * Esto separa la lógica de renderizado del componente visual de las etiquetas textuales literales,
 * asegurando flexibilidad internacionalizada tanto en español como en inglés.
 */

export type LanguageCode = "es" | "en";

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

