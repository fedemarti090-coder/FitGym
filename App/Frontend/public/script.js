document.addEventListener('DOMContentLoaded', () => {
  const syncBtn = document.getElementById('sync-btn');
  const statusPulse = document.getElementById('status-pulse');
  const stepItems = document.querySelectorAll('.step-item');
  const coachEl = document.getElementById('coach-parere');
  const syncError = document.getElementById('sync-error');
  let isSyncing = false;

  const progressSteps = ['request', 'database', 'ai', 'done'];
  window.api.on_sync_progress((step) => {
    const currentIndex = progressSteps.indexOf(step);
    if (currentIndex === -1) return;

    stepItems.forEach((item) => {
      const itemIndex = progressSteps.indexOf(item.dataset.step);
      const completed = step === 'done' || itemIndex < currentIndex;
      item.classList.toggle('completed', completed);
      item.classList.toggle('active', step !== 'done' && itemIndex === currentIndex);
      item.classList.remove('failed');
      const checkIcon = item.querySelector('.check-icon');
      if (checkIcon) checkIcon.textContent = completed ? '✓' : '';
    });
  });

  async function startSyncAnimation() {
    if (isSyncing || !syncBtn) return;
    isSyncing = true;

    syncBtn.classList.add('syncing');
    syncBtn.disabled = true;
    statusPulse?.classList.add('syncing');
    if (syncError) {
      syncError.hidden = true;
      syncError.textContent = '';
    }

    stepItems.forEach(item => {
      item.classList.remove('completed', 'active', 'failed');
      const checkIcon = item.querySelector('.check-icon');
      if (checkIcon) checkIcon.textContent = '';
    });

    try {
      await window.api.sync_server();
      const weekData = await window.api.ottieni_week_data();
      if (coachEl) {
        coachEl.innerText = weekData?.parere_coach || "Nessun parere disponibile per questa settimana.";
      }
    } catch (error) {
      console.error("Errore durante la sincronizzazione con il server:", error);
      const activeStep = document.querySelector('.step-item.active');
      activeStep?.classList.remove('active');
      activeStep?.classList.add('failed');
      if (syncError) {
        syncError.textContent = `Sincronizzazione non riuscita: ${error instanceof Error ? error.message : String(error)}`;
        syncError.hidden = false;
      }
    } finally {
      syncBtn.classList.remove('syncing');
      syncBtn.disabled = false;
      statusPulse?.classList.remove('syncing');
      isSyncing = false;
    }
  }

  if (syncBtn) {
    syncBtn.addEventListener('click', startSyncAnimation);
  }

});


/**
 * Renderizza il grafico a ciambella SVG SOLO con i macronutrienti in grammi
 */
function renderNutritionChart(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Escludiamo le calorie dal grafico a ciambella per evitare scompensi di scala
  const items = [
    { label: 'Proteine', value: data.proteine, color: '#82E000' },    // Verde lime vivace
    { label: 'Carboidrati', value: data.carboidrati, color: '#FF5C53' }, // Corallo/Rosso acceso
    { label: 'Grassi', value: data.grasso, color: '#00A3FF' }         // Blu brillante
  ];

  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  let circlesHTML = '';
  let legendHTML = '';

  items.forEach(item => {
    const percent = total > 0 ? item.value / total : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;

    circlesHTML += `
      <circle
        cx="50" cy="50" r="${radius}"
        fill="transparent"
        stroke="${item.color}"
        stroke-width="13"
        stroke-dasharray="${strokeDasharray}"
        stroke-dashoffset="${strokeDashoffset}"
        stroke-linecap="round"
        style="transition: stroke-dasharray 0.6s ease;"
      ></circle>
    `;

    cumulativePercent += percent;

    legendHTML += `
      <div class="legend-item">
        <span class="legend-color" style="background-color: ${item.color};"></span>
        <span class="label">${item.label}:</span>
        <span class="value"><strong>${item.value.toFixed(1)}</strong>g</span>
      </div>
    `;
  });

  container.innerHTML = `
    <svg class="donut-chart-svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="${radius}" fill="transparent" stroke="var(--bg-inner, #e0e0e0)" stroke-width="13"></circle>
      ${circlesHTML}
    </svg>
    <div class="nutrition-legend">
      ${legendHTML}
    </div>
  `;
}

/**
 * Aggiorna la barra di progresso delle calorie affiancata
 */
function renderCaloriesProgress(calories, targetCalories = 14000) {
  const valCaloriesEl = document.getElementById('val-calories');
  const valTargetEl = document.getElementById('val-target-calories');
  const progressFillEl = document.getElementById('cal-progress-fill');
  const statusBadgeEl = document.getElementById('cal-status-badge');
  const percentageEl = document.getElementById('cal-percentage');
  const diffEl = document.getElementById('cal-diff');

  if (!valCaloriesEl) return;

  const calValue = parseFloat(calories) || 0;
  const percentage = Math.round((calValue / targetCalories) * 100);
  const diff = calValue - targetCalories;

  valCaloriesEl.textContent = calValue.toFixed(0);
  if (valTargetEl) valTargetEl.textContent = targetCalories;

  if (progressFillEl) {
    progressFillEl.style.width = `${Math.min(percentage, 100)}%`;
  }

  if (diff <= 0) {
    if (statusBadgeEl) {
      statusBadgeEl.textContent = "In target";
      statusBadgeEl.className = "cal-badge under";
    }
    if (progressFillEl) progressFillEl.style.backgroundColor = "#5c6bc0";
    if (diffEl) diffEl.textContent = `${Math.abs(diff).toFixed(0)} kcal in meno`;
  } else {
    if (statusBadgeEl) {
      statusBadgeEl.textContent = "Superato";
      statusBadgeEl.className = "cal-badge over";
    }
    if (progressFillEl) progressFillEl.style.backgroundColor = "#ef5350";
    if (diffEl) diffEl.textContent = `+${diff.toFixed(0)} kcal in più`;
  }

  if (percentageEl) {
    percentageEl.textContent = `${percentage}% del target`;
  }
}

// Caricamento dei dati principali all'avvio della dashboard
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const week_data = await window.api.ottieni_week_data();
    if (!week_data) return;

    const { calories, carbs, fat, protein, parere_coach } = week_data;

    renderNutritionChart('macro-chart-container', {
      proteine: parseFloat(protein) || 0,
      carboidrati: parseFloat(carbs) || 0,
      grasso: parseFloat(fat) || 0
    });

    renderCaloriesProgress(calories, 14000);

    const coachEl = document.getElementById("coach-parere");
    if (coachEl) {
      coachEl.innerText = parere_coach || "Nessun parere disponibile per questa settimana.";
    }

    const daysNumberEl = document.getElementById("days-number");
    if (daysNumberEl) {
      daysNumberEl.innerText = "41";
    }

  } catch (err) {
    console.error("Errore nel caricamento dei dati della dashboard:", err);
  }
});