import React, { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

interface PhysicsDisclaimerProps {
  isDarkMode: boolean;
}

export default function PhysicsDisclaimer({ isDarkMode }: PhysicsDisclaimerProps) {
  const [expanded, setExpanded] = useState(false);

  const cardClass = isDarkMode
    ? "bg-slate-900/60 border-slate-800 text-slate-300"
    : "bg-indigo-50/50 border-indigo-100 text-slate-600";

  return (
    <div className={`rounded-2xl border p-4 transition-all ${cardClass}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 cursor-pointer"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-500">
          <Info className="w-4 h-4" />
          Modelo físico y limitaciones del simulador
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="mt-3 text-[11px] leading-relaxed space-y-2 text-slate-500 dark:text-slate-400">
          <p>
            Este simulador resuelve la <strong>ecuación de Laplace ∇²u = 0</strong> en una malla 2D
            usando métodos iterativos (Jacobi, Gauss-Seidel, SOR). El campo resultante se mapea
            a intensidad WiFi en dBm con fines <em>educativos</em>.
          </p>
          <p>
            <strong>Incluye:</strong> atenuación por materiales, modelos de routers con EIRP,
            condiciones Dirichlet en bordes y optimización de ubicación.
          </p>
          <p>
            <strong>No incluye:</strong> pérdida por distancia logarítmica, multipath, reflexión
            especular, difracción ni modelos RF profesionales (ray-tracing, Friis). Para despliegues
            reales, complementar con herramientas especializadas.
          </p>
        </div>
      )}
    </div>
  );
}
