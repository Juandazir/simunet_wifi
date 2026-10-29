// Importación del framework Express para construir el servidor HTTP y gestionar rutas de la API
import express from "express";
// Importación del módulo nativo 'path' para manipular y resolver rutas de directorios multiplataforma
import path from "path";
// Importación del módulo nativo 'fs' (File System) para verificar y escribir archivos en disco local
import fs from "fs";
// Importación del creador de servidor de Vite para integrar Hot Module Replacement (HMR) en modo desarrollo
import { createServer as createViteServer } from "vite";
// Importación de dotenv para cargar variables de entorno desde el archivo .env si existe
import dotenv from "dotenv";

// Inicializa la lectura de variables de entorno definidas en el archivo .env de la raíz
dotenv.config();

/**
 * Función principal asíncrona que configura e inicia el servidor web híbrido (Express + Vite).
 * Sirve tanto la aplicación React como los archivos estáticos de la presentación y los endpoints de exportación.
 */
async function startServer() {
  // Instancia la aplicación principal de Express
  const app = express();
  // Define el puerto TCP en el que escuchará el servidor local (3000 por defecto)
  const PORT = 3000;

  // Middleware para parsear cuerpos JSON de hasta 50 MB (necesario para capturas PNG en Base64 y mallas grandes)
  app.use(express.json({ limit: "50mb" }));
  // Middleware para parsear datos codificados en URL (formularios) con límite ampliado a 50 MB
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Endpoint de diagnóstico (Health Check) para verificar que el servidor está activo y respondiendo
  app.get("/api/health", (_req, res) => {
    // Devuelve un objeto JSON con estado 'ok' y la marca de tiempo actual en formato ISO 8601
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Construye la ruta absoluta hacia la carpeta 'presentacion' ubicada en la raíz del proyecto
  const presentacionPath = path.join(process.cwd(), "presentacion");
  // Verifica si el directorio 'presentacion' existe físicamente en el sistema de archivos
  if (fs.existsSync(presentacionPath)) {
    // Expone públicamente los archivos de la presentación interactiva y el póster bajo la ruta '/presentacion'
    app.use("/presentacion", express.static(presentacionPath));
  }

  // Endpoint POST para guardar archivos generados por el simulador (CSV, PNG, TXT) en la carpeta local 'resultados'
  app.post("/api/guardar-resultado", (req, res) => {
    try {
      // Extrae del cuerpo de la petición el nombre del archivo, su contenido y el tipo de archivo ('image' o 'text')
      const { filename, content, type } = req.body;

      // Valida que se hayan enviado obligatoriamente el nombre del archivo y su contenido
      if (!filename || content === undefined) {
        // Si falta alguno, responde con código HTTP 400 (Bad Request) detallando el error
        return res.status(400).json({
          status: "error",
          message: "Faltan parámetros requeridos: 'filename' o 'content'."
        });
      }

      // Define la ruta absoluta hacia la carpeta de destino 'resultados' en la raíz del proyecto
      const resultsDir = path.join(process.cwd(), "resultados");

      // Comprueba si la carpeta 'resultados' aún no existe en el disco
      if (!fs.existsSync(resultsDir)) {
        // Crea la carpeta 'resultados' (y cualquier subdirectorio padre necesario) de forma recursiva
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      // Sanitiza el nombre del archivo extrayendo solo el nombre base para prevenir vulnerabilidades de Path Traversal
      const safeFilename = path.basename(filename);
      // Une la ruta del directorio 'resultados' con el nombre de archivo ya sanitizado
      const filePath = path.join(resultsDir, safeFilename);

      // Verifica si el archivo recibido es una imagen codificada como DataURL en formato Base64
      if (type === "image" && typeof content === "string" && content.includes(";base64,")) {
        // Separa el encabezado MIME ('data:image/png;base64,') y extrae únicamente la cadena binaria en Base64
        const base64Data = content.split(";base64,").pop();
        // Si la cadena Base64 es válida, la convierte en un Buffer binario y la escribe en el disco
        if (base64Data) {
          fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
        } else {
          // Lanza un error controlado si el contenido Base64 está vacío o corrupto
          throw new Error("El contenido de la imagen base64 está mal formado.");
        }
      } else {
        // Si es un documento de texto plano (CSV o reporte TXT), lo escribe directamente con codificación UTF-8
        fs.writeFileSync(filePath, String(content), "utf8");
      }

      // Registra en la consola del servidor la ruta exacta donde se almacenó el archivo
      console.log(`[INFO] Resultado guardado de forma exitosa en: ${filePath}`);
      // Devuelve respuesta HTTP 200 al cliente confirmando el almacenamiento exitoso y su ruta relativa
      res.json({
        status: "ok",
        message: "Resultado almacenado correctamente",
        path: `resultados/${safeFilename}`
      });
    } catch (error: any) {
      // Captura cualquier excepción de escritura o permisos y la registra en el log de errores
      console.error("[ERROR] Error al guardar resultado:", error);
      // Responde al cliente con estado HTTP 500 (Internal Server Error) y el mensaje descriptivo
      res.status(500).json({
        status: "error",
        message: error.message || "Error al procesar el guardado del archivo."
      });
    }
  });

  // Comprueba si el servidor se está ejecutando en modo de desarrollo o en modo de producción compilado
  if (process.env.NODE_ENV !== "production") {
    // En desarrollo, crea una instancia del servidor Vite en modo middleware (integrado dentro de Express)
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Registra los middlewares de Vite para compilar TypeScript/React al vuelo con recarga en caliente (HMR)
    app.use(vite.middlewares);
  } else {
    // En producción, resuelve la ruta hacia la carpeta 'dist' que contiene los activos ya empaquetados
    const distPath = path.join(process.cwd(), "dist");
    // Sirve los archivos estáticos compilados (JS, CSS, activos) desde la carpeta 'dist'
    app.use(express.static(distPath));
    // Cualquier otra ruta GET no reconocida devuelve 'index.html' para soportar el enrutamiento SPA
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Inicia la escucha activa del servidor HTTP en todas las interfaces de red (0.0.0.0) en el puerto 3000
  app.listen(PORT, "0.0.0.0", () => {
    // Muestra en consola la URL local donde se encuentra disponible la aplicación
    console.log(`Servidor SimuNet activo en http://0.0.0.0:${PORT}`);
  });
}

// Invoca la función de arranque del servidor y captura posibles errores fatales de inicialización
startServer().catch((err) => {
  // Imprime en la salida estándar de errores cualquier fallo ocurrido al levantar el servidor
  console.error("Error fatal al iniciar el servidor:", err);
});
