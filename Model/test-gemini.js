const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const IMAGE_URL =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
const PROMPT =
  'Sei un nutrizionista esperto. Analizza la foto del pasto, stima gli ingredienti visibili, il nome del piatto e calcola i macronutrienti totali. Restituisci l\'output ESCLUSIVAMENTE in formato JSON valido con questa struttura esatta: {"dish_name": "string", "calories": number, "protein": number, "carbs": number, "fat": number}';
let stage = "avvio";

async function main() {
  const startedAt = Date.now();
  const log = (message) =>
    console.log(`[${new Date().toISOString()}] [${Date.now() - startedAt}ms] ${message}`);

  log("Avvio analisi immagine");
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY non configurata nel file Model/.env");
  }
  log("Chiave API Gemini configurata");

  stage = "download immagine";
  log(`Download immagine in corso: ${IMAGE_URL}`);
  const imageResponse = await fetch(IMAGE_URL);
  log(`Risposta download immagine: HTTP ${imageResponse.status}`);
  if (!imageResponse.ok) {
    throw new Error(`Download immagine fallito: HTTP ${imageResponse.status}`);
  }

  const mimeType = imageResponse.headers
    .get("content-type")
    ?.split(";")[0]
    .trim();
  if (!mimeType?.startsWith("image/")) {
    throw new Error(`Tipo di contenuto immagine non valido: ${mimeType}`);
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  log(`Immagine ricevuta: ${mimeType}, ${imageBuffer.length} byte`);
  const imageData = imageBuffer.toString("base64");

  stage = "inizializzazione Gemini";
  log("Caricamento SDK Gemini");
  const { GoogleGenAI, Type } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  stage = "richiesta Gemini";
  log("Invio richiesta di analisi a Gemini");
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType, data: imageData } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dish_name: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
        },
        required: ["dish_name", "calories", "protein", "carbs", "fat"],
      },
    },
  });

  log(`Risposta Gemini ricevuta (${response.text?.length ?? 0} caratteri)`);
  stage = "validazione risposta";
  log("Parsing e validazione del JSON restituito da Gemini");
  const result = JSON.parse(response.text);
  const expectedKeys = ["dish_name", "calories", "protein", "carbs", "fat"];
  if (
    !result ||
    typeof result.dish_name !== "string" ||
    expectedKeys
      .filter((key) => key !== "dish_name")
      .some((key) => typeof result[key] !== "number" || !Number.isFinite(result[key]))
  ) {
    throw new Error("Gemini ha restituito un JSON con una struttura non valida");
  }

  log("Analisi completata");
  console.log(
    JSON.stringify(
      Object.fromEntries(expectedKeys.map((key) => [key, result[key]])),
    ),
  );
}

main().catch((error) => {
  console.error(`Errore durante la fase "${stage}":`, error);
  process.exitCode = 1;
});
