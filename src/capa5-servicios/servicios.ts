// CAPA 5 — SERVICIOS: conversiones físicas, exportación y utilidades transversales

export function convertirADbm(val: number): number {
  if (val <= 0.05) return -70;
  const dbm = -70 + (val / 100.0) * 60;
  return Math.min(-10, Math.round(dbm));
}

export function clasificarCalidadSenal(dbm: number): { text: string; color: string; bg: string } {
  if (dbm >= -50) {
    return { text: "Excelente (-30 a -50 dBm)", color: "text-emerald-500", bg: "bg-emerald-500" };
  } else if (dbm >= -65) {
    return { text: "Buena (-51 a -65 dBm)", color: "text-teal-500", bg: "bg-teal-500" };
  } else if (dbm >= -75) {
    return { text: "Regular (-66 a -75 dBm)", color: "text-amber-500", bg: "bg-amber-500" };
  } else if (dbm >= -85) {
    return { text: "Mala (-76 a -85 dBm)", color: "text-orange-500", bg: "bg-orange-500" };
  }
  return { text: "Sin Cobertura (<-85 dBm)", color: "text-rose-500", bg: "bg-rose-500" };
}

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
