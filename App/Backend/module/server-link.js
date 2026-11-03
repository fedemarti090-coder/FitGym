import path from 'path';
import fs from 'fs';

import { aggiungi_Pasto } from './analisi.js';




async function scarica_Img_Telegram(fileId, botToken) {

    const fileInfoRes = await fetch(
        `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
    );
    const fileInfo = await fileInfoRes.json();

    if (!fileInfo.ok) {
        throw new Error(`Impossibile ottenere il file da Telegram: ${fileInfo.description}`);
    }

    const filePathTelegram = fileInfo.result.file_path; // es. photos/file_1.jpg
    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePathTelegram}`;


    const imageRes = await fetch(downloadUrl);
    if (!imageRes.ok) {
        throw new Error(`Download immagine fallito: HTTP ${imageRes.status}`);
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);


    const cartellaDestinazione = path.join('./', 'img');
    if (!fs.existsSync(cartellaDestinazione)) {
        fs.mkdirSync(cartellaDestinazione, { recursive: true });
    }


    const nomeFile = path.basename(filePathTelegram);
    const percorsoFinale = path.join(cartellaDestinazione, `${Date.now()}-${nomeFile}`);


    fs.writeFileSync(percorsoFinale, imageBuffer);

    console.log(`✅ Immagine salvata con successo in: ${percorsoFinale}`);

    return {
        percorsoFile: percorsoFinale,
        buffer: imageBuffer,
        base64: imageBuffer.toString("base64")
    };
}

export async function sync_Server() {
    try {
        const response = await fetch('https://fitgym-server.onrender.com/api/sync/pull');
        if (!response.ok) {
            throw new Error(`Sync server fallita: HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error('Il server ha restituito un esito negativo per la sync.');
        }
        if (!Array.isArray(result.data)) {
            throw new Error('Risposta sync non valida: data non è un array.');
        }

        for (const item of result.data) {
            const data = JSON.parse(item.data);
            //const img_Tag = await scarica_Img_Telegram(data.telegram_file_id, process.env.TELEGRAM_BOT_TOKEN);
            data.img_Tag = "";
            await aggiungi_Pasto(data);
            console.log(`✅ Pasto aggiunto ( ${data.nutrition.dish_name} )`);
        }

        return result;

    } catch (err) {
        console.error('Errore durante il pull o il salvataggio dei pasti:', err);
        throw err;
    }
}

export async function clear_Server() {
    try {
        await fetch('https://fitgym-server.onrender.com/api/sync/ack', {
            method: 'POST'
        })
    } catch (err) {
        console.log(err);
    }
}