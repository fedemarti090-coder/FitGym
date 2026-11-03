import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

const MODEL = "openrouter/free";

async function main() {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY non configurata nel file Model/.env");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "FitGym Desktop App",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: MODEL,
            "messages": [
                { "role": "user", "content": "Ciao come stai" }
            ]
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        let detail = errorBody;
        try {
            detail = JSON.parse(errorBody).error?.message || errorBody;
        } catch { }
        throw new Error(`Richiesta OpenRouter fallita (HTTP ${response.status}): ${detail}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
        throw new Error("OpenRouter ha restituito una risposta senza contenuto");
    }

    console.log(content);
}

main().catch((error) => {
    console.error("Errore durante la chiamata a OpenRouter:", error.message);
    process.exitCode = 1;
});