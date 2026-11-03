import dotenv from 'dotenv';
dotenv.config();

import { sync_Server, clear_Server } from './module/server-link.js';
import { inizializza_Database, svuota_Meals_Day } from './lib/sql.js';
import { calcola_E_Salva_Macro_Settimanali } from './module/analisi.js';


export async function main(Ai_requet, onProgress) {
    //inizializza_Database();

    onProgress?.('request');
    await sync_Server();
    onProgress?.('database');
    await calcola_E_Salva_Macro_Settimanali(Ai_requet, () => onProgress?.('ai'));
    await clear_Server();
    onProgress?.('done');

    //svuota_Meals_Day();

}
