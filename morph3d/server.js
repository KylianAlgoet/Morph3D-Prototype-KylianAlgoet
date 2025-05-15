import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const TRIPO_API_KEY = process.env.TRIPO_API_KEY;
const TRIPO_START_URL = "https://api.tripo3d.ai/v2/openapi/task";
const TRIPO_STATUS_URL = "https://api.tripo3d.ai/v2/openapi/task/";

// ✅ Optionele mapping van frontend styles naar Tripo style strings
const styleMap = {
  realistic: undefined, // geen style meegeven voor standaard
  low_poly: "object:steampunk",
  stylized: "object:clay",
};

// ✅ Stap 1: Taak aanmaken (text_to_model)
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
      res.status(500).json({
        error: "❌ Geen taskId ontvangen van Tripo API",
        details: data,
      });
    }
  } catch (err) {
    console.error("❌ Tripo API error:", err.message);
    res.status(500).json({ error: "API error", message: err.message });
  }
});

// ✅ Stap 2: Poll status van taak
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

// ✅ Start server
app.listen(3001, () =>
  console.log("✅ Tripo proxy draait op http://localhost:3001")
);
