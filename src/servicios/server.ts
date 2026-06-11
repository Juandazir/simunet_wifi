import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";

dotenv.config();

// Lazy-initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada. Por favor, agregue su clave API de Gemini en la pestaña Configuración > Secretos.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // AI Chat Endpoint with LangChain
  app.post("/api/chat", async (req, res): Promise<any> => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "El mensaje es requerido." });
      }

      // Format previous messages into text context for the prompt
      let chatHistoryText = "";
      if (history && Array.isArray(history)) {
        chatHistoryText = history.map((msg: any) => {
          const roleLabel = msg.role === "user" ? "Estudiante" : "Dr. SimuNet";
          return `${roleLabel}: ${msg.text || msg.content}`;
        }).join("\n");
      }
      if (!chatHistoryText) {
        chatHistoryText = "Ninguna (esta es la primera conversación).";
      }

      // Design LangChain Prompt Template
      const therapyPrompt = PromptTemplate.fromTemplate(
        `Eres el Dr. SimuNet, un compasivo consejero virtual, psicoterapeuta y tutor empático de la Universidad de Pamplona.
Tu propósito es dar consejos de apoyo emocional para calmar la ansiedad, dar ánimo frente al estrés académico y explicar con amabilidad conceptos científicos o personales.

Historial de la conversación:
{chat_history}

Pregunta del Estudiante:
{student_message}

Por favor, canaliza tu inteligencia terapéutica. Responde siempre en español, dando consejos reconfortantes, planes para lidiar con el agobio de los exámenes, y una analogía científica/electrodinámica si tiene sentido:`
      );

      // Wrapper Lambda for Gemini model execution
      const modelRunnable = new RunnableLambda({
        func: async (templatedPrompt: string) => {
          const ai = getGeminiClient();
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [{ role: "user", parts: [{ text: templatedPrompt }] }],
            config: {
              temperature: 0.7,
            },
          });
          return response.text || "Disculpa, no pude procesar la respuesta en este momento.";
        },
      });

      // Assemble LangChain Sequence Pipeline!
      const therapyChain = RunnableSequence.from([
        therapyPrompt,
        modelRunnable,
      ]);

      // Run and stream string output
      const replyText = await therapyChain.invoke({
        chat_history: chatHistoryText,
        student_message: message,
      });

      return res.json({ reply: replyText });
    } catch (error: any) {
      console.error("Error en /api/chat con LangChain:", error);
      return res.status(500).json({ 
        error: error.message || "Error al comunicarse con la Inteligencia Artificial mediante LangChain." 
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
