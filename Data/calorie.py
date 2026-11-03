from datetime import datetime
import csv

mesi_italiani = {
    "gen": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "mag": 5,
    "giu": 6,
    "lug": 7,
    "ago": 8,
    "set": 9,
    "ott": 10,
    "nov": 11,
    "dic": 12,
}


def parse_data_italiana(data_str):

  try:
    part_data, part_ora = data_str.split(",")
    d_split = part_data.strip().split()
    giorno = int(d_split[0])
    mese_str = d_split[1].lower()
    anno = int(d_split[2])
    mese = mesi_italiani.get(mese_str, 1)

    h_split = part_ora.strip().split(":")
    ora = int(h_split[0])
    minuto = int(h_split[1])
    return datetime(anno, mese, giorno, ora, minuto)
  except Exception:
    return None


def calcola_calorie_vettore(file_path, peso_kg=75):
  giorni_data = {}

  with open(file_path, mode="r", encoding="utf-8") as file:
    lettore = csv.reader(file)

    for riga in lettore:
      if riga[0] == "title":
        continue

      title = riga[0].strip()
      start_time_str = riga[1].strip()
      end_time_str = riga[2].strip()
      distance_km = float(riga[11]) if riga[11] != "" else 0.0

      data_giorno = start_time_str.split(",")[0].strip()

      if data_giorno not in giorni_data:
        giorni_data[data_giorno] = {
            "titoli_allenamento": set(),
            "distanza_totale": 0.0,
            "durata_totale_secondi": 0,
            "sessioni_registrate": set(),
        }

      giorni_data[data_giorno]["titoli_allenamento"].add(title)
      giorni_data[data_giorno]["distanza_totale"] += distance_km

      session_id = (start_time_str, end_time_str, title)
      if session_id not in giorni_data[data_giorno]["sessioni_registrate"]:
        giorni_data[data_giorno]["sessioni_registrate"].add(session_id)

        dt_start = parse_data_italiana(start_time_str)
        dt_end = parse_data_italiana(end_time_str)

        if dt_start and dt_end:
          durata_sec = (dt_end - dt_start).total_seconds()
          giorni_data[data_giorno]["durata_totale_secondi"] += durata_sec

  risultato = []
  for data, info in giorni_data.items():
    calorie_totali = 0.0
    is_corsa = any("corsa" in t.lower() for t in info["titoli_allenamento"])

    if is_corsa and info["distanza_totale"] > 0:
      calorie_totali += peso_kg * info["distanza_totale"] * 0.9
    else:
      minuti_allenamento = info["durata_totale_secondi"] / 60
      calorie_totali += minuti_allenamento * 4.5

    nome_allenamento = ", ".join(info["titoli_allenamento"])
    risultato.append([data, nome_allenamento, round(calorie_totali, 1)])

  return risultato


print(calcola_calorie_vettore("workout_data.csv", peso_kg=75))