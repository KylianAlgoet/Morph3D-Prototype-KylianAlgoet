import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/api/chat", async (req, res) => {
  const userPrompt = req.body.prompt;
  console.log("🔍 Ontvangen prompt:", userPrompt); // ✅ Debug

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: `
Je bent een AI die prompts in Nederlands of Engels ontvangt en exact één van onderstaande 3D-modelnamen moet teruggeven (enkel de naam, in lowercase):

- sword
- robot
- tree
- gun
- car
- default

Voorbeelden:
"een futuristische robot" → robot  
"een magische boom" → tree  
"een oude auto met roest" → car  
"blaster gun uit de ruimte" → gun  
"een mes" → sword  
"iets onbekends" → default

⚠️ Geef enkel de modelnaam terug, zonder uitleg of leestekens.
`
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("🧠 GPT Response:", JSON.stringify(data, null, 2)); // ✅ Extra debug

    const reply = data.choices?.[0]?.message?.content?.trim().toLowerCase() || "default";
    res.json({ model: reply });
  } catch (err) {
    console.error("❌ OpenAI API error:", err);
    res.status(500).json({ model: "default", error: "API error" });
  }
});

app.listen(3001, () => console.log("✅ GPT proxy draait op http://localhost:3001"));
