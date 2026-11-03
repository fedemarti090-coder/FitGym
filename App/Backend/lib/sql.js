import Database from 'better-sqlite3';
import path from 'path';

const DB_path = path.join('./', 'Backend', 'FitGym.db');
const db = new Database(DB_path);

db.pragma('journal_mode = WAL');

export function run_Query(sql, params = []) {
    try {
        const stm = db.prepare(sql);
        return stm.run(...params);
    } catch (err) {
        console.error('Errore durante l’esecuzione della query SQLite:', err);
        throw err;
    }
}

export function get_Row(sql, params) {
    try {

        const stm = db.prepare(sql);
        return stm.get(...params);

    } catch (err) {
        console.log(err);
    }
}

export function get_All_Row(sql, params = []) {
    try {

        const stm = db.prepare(sql);
        return stm.all(...params);

    } catch (err) {
        console.log(err);
        return [];
    }
}

export function inizializza_Database() {
    try {
        db.exec(`
            CREATE TABLE IF NOT EXISTS meals_day (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dish_name TEXT, 
                timestamp TEXT,
                telegram_file_id TEXT,
                img_path TEXT,
                calories TEXT, 
                protein TEXT, 
                carbs TEXT, 
                fat TEXT
            )
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS meals_week (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                year INTEGER NOT NULL,
                week_number INTEGER NOT NULL,
                calories TEXT, 
                protein TEXT, 
                carbs TEXT, 
                fat TEXT,
                parere_coach TEXT,
                UNIQUE(year, week_number)
            )
        `);

        console.log("✅ Database inizializzato con successo.");
    } catch (error) {
        console.error("Errore durante l'inizializzazione del database:", error.message);
        throw error;
    }
}


export function svuota_Meals_Day() {
    try {

        const risultato = run_Query(`DELETE FROM meals_day`);

        run_Query(`DELETE FROM sqlite_sequence WHERE name='meals_day'`);

        console.log(`✅ Tabella meals_day svuotata con successo. Righe eliminate: ${risultato.changes || 0}`);
        return true;
    } catch (error) {
        console.error("❌ Errore durante lo svuotamento di meals_day:", error.message);
        throw error;
    }
}

export function get_Ultima_Settimana() {
    try {
        const sql = `
            SELECT * FROM meals_week 
            ORDER BY year DESC, week_number DESC 
            LIMIT 1
        `;
        return get_Row(sql, []);
    } catch (err) {
        console.error("❌ Errore durante il recupero dell'ultima settimana:", err);
        return null;
    }
}
