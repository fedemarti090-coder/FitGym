import fs from 'fs';
import path from 'path';

import { run_Query, get_Row, get_All_Row, inizializza_Database } from '../lib/sql.js';

import { chiama_API } from './chiamata_API.js'

export async function aggiungi_Pasto(data) {
    const { timestamp, telegram_file_id, img_Tag } = data;
    const { dish_name, calories, protein, carbs, fat } = data.nutrition;

    //console.log(timestamp, telegram_file_id, dish_name, calories, protein, carbs, fat)

    run_Query(
        `INSERT INTO meals_day (dish_name, timestamp, telegram_file_id, img_path, calories, protein, carbs, fat)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [dish_name, timestamp, telegram_file_id, img_Tag, calories, protein, carbs, fat]
    )

}

export function getPastiUltimiSetteGiorni() {
    const allMeals = get_All_Row(`SELECT * FROM meals_day`);

    const adesso = new Date();
    const setteGiorniInMs = 7 * 24 * 60 * 60 * 1000;

    const ultimiSetteGiorni = allMeals.filter(piatto => {
        const dataPassata = new Date(piatto.timestamp);
        return (adesso - dataPassata) <= setteGiorniInMs;
    });

    console.log(`✅ Trovati ${ultimiSetteGiorni.length} pasti negli ultimi 7 giorni.`);
    return ultimiSetteGiorni;
}

export async function calcola_E_Salva_Macro_Settimanali(Ai_requet, onAiStart) {

    const sqlAggrega = `
        INSERT INTO meals_week (year, week_number, calories, protein, carbs, fat)
        SELECT 
            strftime('%Y', timestamp) AS year,
            CAST(strftime('%W', timestamp) AS INTEGER) AS week_number,
            SUM(CAST(calories AS REAL)) AS total_calories,
            SUM(CAST(protein AS REAL)) AS total_protein,
            SUM(CAST(carbs AS REAL)) AS total_carbs,
            SUM(CAST(COALESCE(fat, 0) AS REAL)) AS total_fat
        FROM meals_day
        GROUP BY year, week_number
        ON CONFLICT(year, week_number) DO UPDATE SET
            calories = excluded.calories,
            protein = excluded.protein,
            carbs = excluded.carbs,
            fat = excluded.fat;
    `;

    run_Query(sqlAggrega);


    const sqlPulizia = `
        DELETE FROM meals_day 
        WHERE datetime(timestamp) < datetime('now', '-14 days');
    `;

    const risultatoPulizia = run_Query(sqlPulizia);

    console.log(`✅ Pasti rimossi da meals_day perché più vecchi di 2 settimane: ${risultatoPulizia.changes || 0}`);

    pulisci_Immagini_Vecchie();

    // ANALISI SETTIMANALE

    const personal_Info_Raw = fs.readFileSync(path.join('./', 'Backend', 'info', 'user_data.json'), "utf-8");

    const personal_Info = JSON.parse(personal_Info_Raw);
    const last_pasti = getPastiUltimiSetteGiorni();

    const prompt = `
        Sei un nutrizionista sportivo esperto. Analizza esclusivamente il lato nutrizionale basandoti sul profilo dell'utente e sui pasti registrati negli ultimi 7 giorni.

        Profilo Utente e Obiettivi:
        ${JSON.stringify(personal_Info, null, 2)}

        Alimentazione e Pasti registrati (ultimi 7 giorni):
        ${JSON.stringify(last_pasti, null, 2)}

        Fornisci un piccolo discorso discorsivo e diretto in cui valuti la sua dieta attuale. Focalizzati unicamente su:
        - Eventuali carenze, eccessi o problemi nei macronutrienti rispetto ai suoi obiettivi di ricomposizione corporea e performance ibrida.
        - Consigli pratici e mirati su cosa migliorare concretamente nella dieta di tutti i giorni.
        I macro dei singoli pasti non sono precisi e spesso non rappresentano l intera porzione prova a calcolarmi in base a quante quantita mangia un utente coi dati personali qui sopra
        Non inserire valutazioni sugli allenamenti o su altri aspetti non nutrizionali.
        Se ci sono meno di tre giorni di pasti di che non hai abbastanza dati per fornire una risposta
        Rispondi con una sola lunga frase
        `;

    if (Ai_requet) {
        onAiStart?.();
        await chiama_API(prompt);
    }



}

function pulisci_Immagini_Vecchie(cartellaPath = './Backend/img/') {
    try {
        const directoryPath = path.resolve(cartellaPath);

        if (!fs.existsSync(directoryPath)) {
            console.log(`❌ La cartella ${directoryPath} non esiste.`);
            return;
        }

        const adesso = Date.now();
        const dueSettimaneInMs = 14 * 24 * 60 * 60 * 1000;

        const fileList = fs.readdirSync(directoryPath);

        let fileEliminati = 0;

        for (const fileName of fileList) {
            const filePath = path.join(directoryPath, fileName);
            const stats = fs.statSync(filePath);

            if (stats.isFile()) {

                if (adesso - stats.mtimeMs > dueSettimaneInMs) {
                    fs.unlinkSync(filePath); // Elimina il file
                    console.log(`✅ Eliminata immagine vecchia: ${fileName}`);
                    fileEliminati++;
                }
            }
        }

        console.log(`✅ Pulizia immagini completata. File eliminati: ${fileEliminati}`);
    } catch (error) {
        console.error("Errore durante la pulizia delle immagini:", error.message);
    }
}
/*
export function

*/