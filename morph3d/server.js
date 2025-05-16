// ✅ server.js – Tripo 3D API Proxy + AI Prompt Enhancer (OpenAI)

import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const TRIPO_API_KEY = process.env.TRIPO_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TRIPO_START_URL = "https://api.tripo3d.ai/v2/openapi/task";
const TRIPO_STATUS_URL = "https://api.tripo3d.ai/v2/openapi/task/";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const styleMap = {
  realistic: undefined,
  low_poly: "object:steampunk",
  stylized: "object:clay",
};

// ✅ AI-enhance endpoint
app.post("/api/openai/enhance", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Je bent een AI die visuele beschrijvingen verbetert voor een 3D-modelgenerator. Maak prompts levendiger, visueel duidelijk en maximaal 100 woorden lang.",
          },
          {
            role: "user",
            content: `Verbeter deze prompt voor een 3D-model: ${prompt}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    const enhanced = data.choices?.[0]?.message?.content;

    if (!enhanced) throw new Error("No enhanced prompt returned");

    res.json({ enhancedPrompt: enhanced });
  } catch (err) {
    console.error("❌ OpenAI error:", err);
    res.status(500).json({ error: "Prompt enhancement failed", message: err.message });
  }
});

// ✅ Tripo: Taak aanmaken
app.post("/api/tripo", async (req, res) => {
  const { prompt, model_type } = req.body;
  const mappedStyle = styleMap[model_type] || undefined;

  console.log("🧠 Prompt ontvangen:", prompt, "| Style:", model_type, "→", mappedStyle || "standaard");

  try {
    const requestBody = {
      type: "text_to_model",
      prompt,
      model_version: "v2.5-20250123",
    };

    if (mappedStyle) {
      requestBody.style = mappedStyle;
    }

    const response = await fetch(TRIPO_START_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TRIPO_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const raw = await response.text();
    const data = JSON.parse(raw);
    console.log("🧪 Tripo start response:", data);

    if (data?.data?.task_id) {
      res.json({ taskId: data.data.task_id });
    } else {
      res.status(500).json({ error: "❌ Geen taskId ontvangen van Tripo API", details: data });
    }
  } catch (err) {
    console.error("❌ Tripo API error:", err.message);
    res.status(500).json({ error: "API error", message: err.message });
  }
});

// ✅ Tripo: Status pollen
app.get("/api/tripo/status/:taskId", async (req, res) => {
  const taskId = req.params.taskId;
  console.log("🔁 Polling task:", taskId);

  try {
    const response = await fetch(`${TRIPO_STATUS_URL}${taskId}`, {
      headers: {
        Authorization: `Bearer ${TRIPO_API_KEY}`,
      },
    });

    const raw = await response.text();
    const data = JSON.parse(raw);
    console.log("📦 Polling response:", data);

    const status = data?.data?.status;
    const modelUrl = data?.data?.output?.pbr_model;
    const progress = data?.data?.progress ?? 0;

    if (status === "success" && modelUrl) {
      res.json({ status: "success", modelUrl, progress: 100 });
    } else if (status === "failed") {
      res.json({ status: "failed", progress });
    } else {
      res.json({ status: status || "pending", progress });
    }
  } catch (err) {
    console.error("❌ Polling error:", err.message);
    res.status(500).json({ error: "Poll error", message: err.message });
  }
});

// ✅ Start de server
app.listen(3001, () => console.log("✅ Tripo proxy draait op http://localhost:3001"));
