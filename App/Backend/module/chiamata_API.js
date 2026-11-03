import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

import { run_Query } from '../lib/sql.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

const MODEL = "openrouter/free";

export async function chiama_API(prompt) {
    console.log("✅ Invio dati per analisi...")
    console.time("⏱️ Tempo di risposta API");
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
                { "role": "user", "content": prompt }
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
    console.timeEnd("⏱️ Tempo di risposta API");

    console.log({
        model: data.model,
        content: data.choices?.[0]?.message?.content
    });

    salva_Risposta(content);
    return content;
}


function salva_Risposta(model_ans) {
    const sql = `
            UPDATE meals_week 
            SET parere_coach = ?
            WHERE year = CAST(strftime('%Y', 'now') AS INTEGER)
              AND week_number = CAST(strftime('%W', 'now') AS INTEGER);
        `;

    const risultato = run_Query(sql, [model_ans]);

    if (risultato.changes > 0) {
        console.log("✅ Ultima settimana aggiornata con successo!");
    } else {
        console.log("❌ Nessuna riga trovata per la settimana corrente.");
    }
}