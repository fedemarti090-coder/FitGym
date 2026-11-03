import csv

allenamenti = {}

with open("workout_data.csv", mode="r", encoding="utf-8") as file:
    lettore = csv.reader(file)
    
    for riga in lettore:

        if riga[0] == 'title':
            continue
            
        nome_allenamento = riga[0]
        nome_esercizio = riga[4]
        
        if nome_allenamento not in allenamenti:
            allenamenti[nome_allenamento] = []
            
        if nome_esercizio not in allenamenti[nome_allenamento]:
            allenamenti[nome_allenamento].append(nome_esercizio)

print(allenamenti)

"""
for allenamento, lista_esercizi in allenamenti.items():
    print(f"\nAllenamento: {allenamento}")
    print("Esercizi:")
    for ex in lista_esercizi:
        print(f" - {ex}")
        
        """