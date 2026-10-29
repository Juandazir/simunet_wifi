// Importa la biblioteca principal de React para la definición de componentes funcionales JSX
import React from "react";
// Importa el componente principal de la Capa 1 (Interfaz Gráfica y Orquestador de Simulación)
import Interfaz from "./interfaz";

/**
 * PUNTO DE ENTRADA PRINCIPAL DE LA APLICACIÓN (React/Vite)
 * Direcciona el montaje del árbol de componentes hacia la Capa 1 (Capa de Interfaz Gráfica).
 */
export default function App() {
  // Renderiza la interfaz interactiva completa del simulador electromagnético SimuNet
  return <Interfaz />;
}
