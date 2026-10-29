// Importa StrictMode de React para activar comprobaciones y advertencias adicionales en desarrollo
import { StrictMode } from "react";
// Importa createRoot de react-dom/client para inicializar el árbol de renderizado concurrente de React 18+
import { createRoot } from "react-dom/client";
// Importa el componente raíz de la aplicación que encapsula toda la arquitectura de SimuNet
import App from "./App.tsx";
// Importa la hoja de estilos global con las directivas de Tailwind CSS y animaciones personalizadas
import "./index.css";

// Busca el contenedor DOM con id 'root' en index.html y monta dentro de él la aplicación React envuelta en StrictMode
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
