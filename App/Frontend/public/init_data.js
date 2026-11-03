const allenamenti = [
    ["Riposo", "", "Facile", "0 Kcal"],
    ["13 km", "corsa", "Alta", "780 Kcal"],
    ["Petto", "palestra", "Media", "380 Kcal"],
    ["5 km", "ripetute", "Media", "420 Kcal"],
    ["Gambe", "palestra", "Media", "450 Kcal"],
    ["Upper", "palestra", "Media", "350 Kcal"],
    ["5 km", "corsa", "Facile", "310 Kcal"]
];

function get_Weekly_Vector(referenceDate = new Date()) {
    const now = new Date(referenceDate);

    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);

    const currentDayOfWeek = now.getDay();
    const distanceToMonday = (currentDayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    const days = [
        ['L', 0],
        ['M', 1],
        ['Me', 2],
        ['G', 3],
        ['V', 4],
        ['S', 5],
        ['D', 6]
    ];
    const weekVector = [];

    for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);

        const dayZero = new Date(day);
        dayZero.setHours(0, 0, 0, 0);

        const isToday = dayZero.getTime() === todayZero.getTime();

        weekVector.push([days[i][0], day.getDate(), isToday]);
    }

    return weekVector;
}

function getFormattedMonthYear(date = new Date()) {
    const formatted = date.toLocaleDateString('it-IT', {
        month: 'long',
        year: 'numeric'
    });

    return formatted.toUpperCase();
}


document.addEventListener('DOMContentLoaded', async () => {
    let displayedWeek = new Date();
    displayedWeek.setHours(0, 0, 0, 0);

    const oggi = new Date();

    const giorno = oggi.getDay();

    document.getElementById("title-max").innerText = allenamenti[giorno][0];
    document.getElementById("title-min").innerText = allenamenti[giorno][1];

    document.getElementById("intensity").innerText = allenamenti[giorno][2];

    document.getElementById("kcal-number").innerText = allenamenti[giorno][3];

    const oggi_d = new Date('2026-10-21');
    const dataRiferimento = new Date('2026-09-10');

    const differenzaMs = oggi_d - dataRiferimento;
    const giorniPassati = Math.floor(differenzaMs / (1000 * 60 * 60 * 24));

    document.getElementById("days-number").innerText = giorniPassati;

    const renderCalendarWeek = () => {
        const weekDays = get_Weekly_Vector(displayedWeek);
        for (const [dayId, dayNumber, isToday] of weekDays) {
            document.getElementById(`${dayId}-val`).innerText = dayNumber;
            document.getElementById(dayId).classList.toggle("active-column", isToday);
        }

        document.getElementById("calendar-title").innerText = getFormattedMonthYear(displayedWeek);
    };

    renderCalendarWeek();

    document.getElementById("calendar-today-btn").addEventListener('click', () => {
        displayedWeek = new Date();
        displayedWeek.setHours(0, 0, 0, 0);
        renderCalendarWeek();
    });

    const [previousWeekButton, nextWeekButton] = document.querySelectorAll('.calendar-nav .nav-btn');
    previousWeekButton.addEventListener('click', () => {
        displayedWeek.setDate(displayedWeek.getDate() - 7);
        renderCalendarWeek();
    });
    nextWeekButton.addEventListener('click', () => {
        displayedWeek.setDate(displayedWeek.getDate() + 7);
        renderCalendarWeek();
    });

    popola_Menu_Settimana();
    popola_Recap_Settimanale();

});


function getMealIfInWeek(timestampStr, targetWeek = 0) {
    const mealDate = new Date(timestampStr);
    if (Number.isNaN(mealDate.getTime())) return false;

    const now = new Date();

    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const currentMonday = new Date(now);
    currentMonday.setHours(0, 0, 0, 0);
    currentMonday.setDate(now.getDate() - currentDayOfWeek + 1);

    const targetMonday = new Date(currentMonday);
    targetMonday.setDate(currentMonday.getDate() - (targetWeek * 7));

    const mealDay = new Date(mealDate);
    if (mealDate.getHours() < 4) {
        mealDay.setDate(mealDay.getDate() - 1);
    }

    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);
    targetSunday.setHours(23, 59, 59, 999);

    if (mealDay < targetMonday || mealDay > targetSunday) {
        return false;
    }

    const days = ["domenica", "lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato"];
    const dayName = days[mealDay.getDay()];

    const hour = mealDate.getHours();
    let mealType = "";

    if (hour < 4 || hour >= 19) {
        mealType = "cena";
    } else if (hour < 11) {
        mealType = "colazione";
    } else if (hour >= 11 && hour < 15) {
        mealType = "pranzo";
    } else {
        mealType = "postAllenamento";
    }

    return {
        day: dayName,
        meal: mealType
    };
}


async function popola_Menu_Settimana() {
    const all_data = await window.api.ottiene_db_data();
    const currentTable = document.getElementById('meal-week-table');
    const currentCard = currentTable?.closest('.meal-week-card');
    if (!currentTable || !currentCard) return;

    let previousTable = document.getElementById('meal-week-table-previous');
    if (!previousTable) {
        const previousCard = currentCard.cloneNode(true);
        previousTable = previousCard.querySelector('#meal-week-table');
        previousTable.id = 'meal-week-table-previous';
        previousCard.querySelector('h2').textContent = 'Pasti settimana precedente';
        currentCard.insertAdjacentElement('afterend', previousCard);
    }

    const now = new Date();
    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const currentMonday = new Date(now);
    currentMonday.setHours(0, 0, 0, 0);
    currentMonday.setDate(now.getDate() - currentDayOfWeek + 1);
    const dayIndexes = {
        lunedi: 0,
        martedi: 1,
        mercoledi: 2,
        giovedi: 3,
        venerdi: 4,
        sabato: 5,
        domenica: 6
    };
    const mealDeadlines = {
        colazione: [0, 11],
        pranzo: [0, 15],
        postAllenamento: [0, 19],
        cena: [1, 4]
    };

    for (const { table, targetWeek } of [
        { table: currentTable, targetWeek: 0 },
        { table: previousTable, targetWeek: 1 }
    ]) {
        const registeredMeals = new Set();

        for (const meal of all_data) {
            const data = getMealIfInWeek(meal.timestamp, targetWeek);
            if (!data) continue;

            const cella = table.querySelector(`[data-meal="${data.meal}"][data-day="${data.day}"]`);
            if (!cella) continue;

            const label = document.createElement('span');
            label.className = 'meal-cell-label';
            label.textContent = meal.dish_name;
            cella.replaceChildren(label);
            cella.title = meal.dish_name;
            registeredMeals.add(`${data.meal}:${data.day}`);
        }

        const weekMonday = new Date(currentMonday);
        weekMonday.setDate(currentMonday.getDate() - (targetWeek * 7));

        table.querySelectorAll('.meal-cell').forEach((cella) => {
            const mealType = cella.dataset.meal;
            const dayName = cella.dataset.day;
            const deadline = mealDeadlines[mealType];
            const dayIndex = dayIndexes[dayName];

            if (!deadline || dayIndex === undefined || registeredMeals.has(`${mealType}:${dayName}`)) {
                return;
            }

            const deadlineDate = new Date(weekMonday);
            deadlineDate.setDate(weekMonday.getDate() + dayIndex + deadline[0]);
            deadlineDate.setHours(deadline[1], 0, 0, 0);

            if (deadlineDate <= now) {
                const label = document.createElement('span');
                label.className = 'meal-cell-label';
                label.textContent = 'Pasto mancante';
                cella.replaceChildren(label);
                cella.classList.add('meal-cell--missed');
                cella.title = 'Pasto mancante';
            }
        });
    }
}

function getWeekMondayUtc(year, weekNumber) {
    const januaryFirst = new Date(Date.UTC(year, 0, 1));
    const daysUntilFirstMonday = (8 - januaryFirst.getUTCDay()) % 7;
    const firstMonday = new Date(januaryFirst);
    firstMonday.setUTCDate(januaryFirst.getUTCDate() + daysUntilFirstMonday);
    firstMonday.setUTCDate(firstMonday.getUTCDate() + (weekNumber - 1) * 7);
    return firstMonday;
}

function getCurrentMondayUtc(date = new Date()) {
    const monday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const daysSinceMonday = (monday.getUTCDay() + 6) % 7;
    monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
    return monday;
}

function getEstimatedDailyTargets(profile) {
    const age = Number(profile?.personal_info?.age);
    const sex = profile?.personal_info?.sex?.toLowerCase();
    const weight = Number(profile?.body_metrics?.weight_kg);
    const height = Number(profile?.body_metrics?.height_cm) / 100;
    const activity = profile?.lifestyle?.activity_level?.toLowerCase() || '';

    if (sex !== 'male' || !Number.isFinite(age) || age < 9 || age > 18 ||
        !Number.isFinite(weight) || weight <= 0 || !Number.isFinite(height) || height <= 0) {
        return null;
    }

    const activityFactor = activity.includes('molto') ? 1.42
        : activity.includes('moderatamente') ? 1.26
            : activity.includes('poco') ? 1.13
                : 1;
    const calories = 88.5 - (61.9 * age)
        + activityFactor * ((26.7 * weight) + (903 * height))
        + 25;

    return {
        calories,
        protein: (calories * 0.15) / 4,
        carbs: (calories * 0.55) / 4,
        fat: (calories * 0.30) / 9
    };
}

function formatWeeklyValue(value, unit = '') {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return '—';
    return `${Math.round(numericValue).toLocaleString('it-IT')}${unit}`;
}

async function popola_Recap_Settimanale() {
    const tableBody = document.getElementById('week-history-body');
    if (!tableBody) return;

    try {
        const { weeks, profile } = await window.api.get_week_history();
        const targets = getEstimatedDailyTargets(profile);
        const currentMonday = getCurrentMondayUtc();
        const weekMilliseconds = 7 * 24 * 60 * 60 * 1000;
        const pastWeeks = weeks
            .map((week) => {
                const weekMonday = getWeekMondayUtc(Number(week.year), Number(week.week_number));
                const offset = Math.round((weekMonday - currentMonday) / weekMilliseconds);
                return { ...week, offset };
            })
            .filter((week) => week.offset < 0)
            .sort((a, b) => b.offset - a.offset);

        tableBody.replaceChildren();

        if (pastWeeks.length === 0) {
            const emptyRow = tableBody.insertRow();
            const emptyCell = emptyRow.insertCell();
            emptyCell.colSpan = 7;
            emptyCell.className = 'week-history-empty';
            emptyCell.textContent = 'Nessuna settimana precedente registrata.';
            return;
        }

        for (const week of pastWeeks) {
            const row = tableBody.insertRow();
            const weekCell = row.insertCell();
            weekCell.className = 'week-history-index';
            weekCell.textContent = String(week.offset);

            for (const [value, unit] of [
                [week.calories, ' kcal'],
                [week.protein, ' g'],
                [week.carbs, ' g'],
                [week.fat, ' g']
            ]) {
                const cell = row.insertCell();
                cell.className = 'week-history-number';
                cell.textContent = formatWeeklyValue(value, unit);
            }

            const reviewCell = row.insertCell();
            const review = week.parere_coach || 'Nessun parere disponibile.';
            const reviewText = document.createElement('span');
            reviewText.className = 'week-history-review';
            reviewText.textContent = review;
            reviewText.title = review;
            reviewCell.appendChild(reviewText);

            const scoreCell = row.insertCell();
            const weeklyValues = [
                Number(week.calories) / 7,
                Number(week.protein) / 7,
                Number(week.carbs) / 7,
                Number(week.fat) / 7
            ];

            if (!targets || weeklyValues.some((value) => !Number.isFinite(value)) ||
                weeklyValues.every((value) => value === 0)) {
                scoreCell.textContent = 'Non disponibile';
                continue;
            }

            const targetValues = [targets.calories, targets.protein, targets.carbs, targets.fat];
            const deviations = weeklyValues.map((value, index) =>
                ((value - targetValues[index]) / targetValues[index]) * 100
            );
            const averageDeviation = deviations.reduce((sum, value) => sum + value, 0) / deviations.length;
            const averageAbsoluteDeviation = deviations.reduce((sum, value) => sum + Math.abs(value), 0)
                / deviations.length;
            const hasAboveTarget = deviations.some((value) => value > 0);
            const hasBelowTarget = deviations.some((value) => value < 0);
            const displayedDeviation = Math.ceil(Math.abs(averageDeviation)) * Math.sign(averageDeviation);
            const deviationLabel = hasAboveTarget && hasBelowTarget
                ? `±${Math.ceil(averageAbsoluteDeviation)}% dal riferimento`
                : `${displayedDeviation > 0 ? '+' : ''}${displayedDeviation}% dal riferimento`;
            scoreCell.className = 'week-history-score';
            scoreCell.textContent = deviationLabel;
            scoreCell.title = [
                'Scostamento medio giornaliero rispetto alla stima (non prescrittiva):',
                `calorie ${deviations[0].toFixed(0)}%`,
                `proteine ${deviations[1].toFixed(0)}%`,
                `carboidrati ${deviations[2].toFixed(0)}%`,
                `grassi ${deviations[3].toFixed(0)}%`
            ].join(' · ');

            if (averageAbsoluteDeviation <= 10) {
                scoreCell.classList.add('week-history-score--good');
            } else if (averageAbsoluteDeviation <= 25) {
                scoreCell.classList.add('week-history-score--warning');
            } else {
                scoreCell.classList.add('week-history-score--poor');
            }
        }
    } catch (error) {
        console.error('Errore durante il caricamento del recap settimanale:', error);
        tableBody.replaceChildren();
        const errorRow = tableBody.insertRow();
        const errorCell = errorRow.insertCell();
        errorCell.colSpan = 7;
        errorCell.className = 'week-history-empty';
        errorCell.textContent = 'Impossibile caricare il recap delle settimane.';
    }
}