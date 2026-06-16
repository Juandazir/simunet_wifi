import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware - Expanded limit for base64 images and large datasets
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Guardar resultado (CSV, PNG, reportes, etc.) en la carpeta "resultados"
  app.post("/api/guardar-resultado", (req, res) => {
    try {
      const { filename, content, type } = req.body;

      if (!filename || content === undefined) {
        return res.status(400).json({
          status: "error",
          message: "Faltan parámetros requeridos: 'filename' o 'content'."
        });
      }

      // Carpeta de destino "resultados" en la raíz del proyecto
      const resultsDir = path.join(process.cwd(), "resultados");

      // Crear la carpeta si no existe
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      // Sanitizar el nombre del archivo para prevenir path traversal
      const safeFilename = path.basename(filename);
      const filePath = path.join(resultsDir, safeFilename);

      if (type === "image" && typeof content === "string" && content.includes(";base64,")) {
        // Es una imagen codificada en base64 (DataURL)
        const base64Data = content.split(";base64,").pop();
        if (base64Data) {
          fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
        } else {
          throw new Error("El contenido de la imagen base64 está mal formado.");
        }
      } else {
        // Guardar como documento de texto normal (CSV o TXT)
        fs.writeFileSync(filePath, content, "utf8");
      }

      console.log(`[INFO] Resultado guardado de forma exitosa en: ${filePath}`);
      res.json({
        status: "ok",
        message: "Resultado almacenado correctamente",
        path: `resultados/${safeFilename}`
      });
    } catch (error: any) {
      console.error("[ERROR] Error al guardar resultado:", error);
      res.status(500).json({
        status: "error",
        message: error.message || "Error al procesar el guardado del archivo."
      });
    }
  });

  // Serve static dist in production or use Vite middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
});

