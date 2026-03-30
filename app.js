const STORAGE_KEY = "cardesk_state_v1";
const DEFAULT_OIL_CYCLE_KM = 10000;
const DEFAULT_OIL_CYCLE_MONTHS = 6;

const dom = {
  configStatus: document.getElementById("config-status"),
  carNamePill: document.getElementById("car-name-pill"),
  openSettingsBtn: document.getElementById("open-settings-btn"),
  settingsModal: document.getElementById("settings-modal"),
  settingsForm: document.getElementById("settings-form"),
  cancelSettingsBtn: document.getElementById("cancel-settings-btn"),

  carMakerInput: document.getElementById("car-maker"),
  carModelInput: document.getElementById("car-model"),
  carYearInput: document.getElementById("car-year"),
  carFuelTypeInput: document.getElementById("car-fuel-type"),
  carTrimSelect: document.getElementById("car-powertrain-option"),
  carPowertrainInput: document.getElementById("car-powertrain-manual"),
  carProductionYearsInput: document.getElementById("car-production-years"),
  makerHelp: document.getElementById("maker-help"),
  modelHelp: document.getElementById("model-help"),
  powertrainHelp: document.getElementById("powertrain-help"),

  metricTotalKm: document.getElementById("metric-total-km"),
  metricTodayKm: document.getElementById("metric-today-km"),
  metricEngineHours: document.getElementById("metric-engine-hours"),
  metricMonthlyCost: document.getElementById("metric-monthly-cost"),
  metricNextMaintenance: document.getElementById("metric-next-maintenance"),
  metricLowestFuel: document.getElementById("metric-lowest-fuel"),

  cards: [
    document.getElementById("card-driving"),
    document.getElementById("card-maintenance"),
    document.getElementById("card-expense"),
    document.getElementById("card-fuel"),
  ],

  driveLogForm: document.getElementById("drive-log-form"),
  driveDistanceInput: document.getElementById("drive-distance"),
  driveEngineMinutesInput: document.getElementById("drive-engine-minutes"),
  driveLogList: document.getElementById("drive-log-list"),

  maintenanceForm: document.getElementById("maintenance-form"),
  maintenanceNameInput: document.getElementById("maintenance-name"),
  maintenanceDueKmInput: document.getElementById("maintenance-due-km"),
  maintenanceDueDateInput: document.getElementById("maintenance-due-date"),
  maintenanceList: document.getElementById("maintenance-list"),

  expenseForm: document.getElementById("expense-form"),
  expenseCategoryInput: document.getElementById("expense-category"),
  expenseAmountInput: document.getElementById("expense-amount"),
  expenseNoteInput: document.getElementById("expense-note"),
  expenseList: document.getElementById("expense-list"),

  fuelForm: document.getElementById("fuel-form"),
  fuelStationNameInput: document.getElementById("fuel-station-name"),
  fuelPriceInput: document.getElementById("fuel-price"),
  fuelLocationInput: document.getElementById("fuel-location"),
  fuelList: document.getElementById("fuel-list"),
};

const catalog = window.VEHICLE_CATALOG || { makes: {} };
let state = loadState();
let currentTrimCandidates = [];

bindEvents();
initializeVehicleSelectors();
renderAll();

function bindEvents() {
  dom.openSettingsBtn.addEventListener("click", () => openSettingsModal());
  dom.cancelSettingsBtn.addEventListener("click", () => closeSettingsModal());

  dom.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCarSettings();
  });

  dom.carMakerInput.addEventListener("change", () => {
    const make = dom.carMakerInput.value;
    renderModelOptions(make, "");
    clearTrimSelection("모델을 선택해 주세요.");
  });

  dom.carModelInput.addEventListener("change", () => {
    refreshTrimOptions();
  });

  dom.carYearInput.addEventListener("input", () => {
    refreshTrimOptions();
  });

  dom.carTrimSelect.addEventListener("change", () => {
    applySelectedTrimToForm();
  });

  dom.driveLogForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.car) return;

    const distance = Number(dom.driveDistanceInput.value);
    const engineMinutes = Number(dom.driveEngineMinutesInput.value);
    if (distance < 0 || engineMinutes < 0) return;

    state.driveLogs.unshift({
      id: crypto.randomUUID(),
      distanceKm: distance,
      engineMinutes,
      createdAt: new Date().toISOString(),
    });
    persistAndRender();
    dom.driveLogForm.reset();
  });

  dom.maintenanceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.car) return;

    const name = dom.maintenanceNameInput.value.trim();
    const dueKm = dom.maintenanceDueKmInput.value ? Number(dom.maintenanceDueKmInput.value) : null;
    const dueDate = dom.maintenanceDueDateInput.value || null;
    if (!name) return;

    state.maintenanceTasks.push({
      id: crypto.randomUUID(),
      name,
      dueKm,
      dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    persistAndRender();
    dom.maintenanceForm.reset();
  });

  dom.expenseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.car) return;

    const category = dom.expenseCategoryInput.value;
    const amount = Number(dom.expenseAmountInput.value);
    const note = dom.expenseNoteInput.value.trim();
    if (amount <= 0) return;

    state.expenses.unshift({
      id: crypto.randomUUID(),
      category,
      amount,
      note,
      createdAt: new Date().toISOString(),
    });
    persistAndRender();
    dom.expenseForm.reset();
  });

  dom.fuelForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.car) return;

    const stationName = dom.fuelStationNameInput.value.trim();
    const price = Number(dom.fuelPriceInput.value);
    const location = dom.fuelLocationInput.value.trim();
    if (!stationName || price <= 0) return;

    const existingIndex = state.fuelStations.findIndex(
      (item) => item.stationName.toLowerCase() === stationName.toLowerCase(),
    );
    const entry = {
      id: existingIndex >= 0 ? state.fuelStations[existingIndex].id : crypto.randomUUID(),
      stationName,
      price,
      location,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      state.fuelStations[existingIndex] = entry;
    } else {
      state.fuelStations.push(entry);
    }

    persistAndRender();
    dom.fuelForm.reset();
  });

  dom.maintenanceList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const id = target.dataset.completeId;
    if (!id) return;
    const task = state.maintenanceTasks.find((item) => item.id === id);
    if (!task) return;
    task.completed = true;
    task.completedAt = new Date().toISOString();
    persistAndRender();
  });
}

function initializeVehicleSelectors() {
  renderMakerOptions(state.car?.maker || "");

  if (state.car) {
    renderModelOptions(state.car.maker, state.car.model);
    refreshTrimOptions({ selectedTrim: state.car.trim || "" });
    setFuelType(state.car.fuelType || inferFuelFromTrim(state.car.trim || ""));
    dom.carPowertrainInput.value = state.car.powertrain || "";
    dom.carProductionYearsInput.value = state.car.productionYears || "";
  } else {
    renderModelOptions("", "");
    clearTrimSelection("브랜드와 모델을 먼저 선택해 주세요.");
  }
}

function saveCarSettings() {
  const maker = dom.carMakerInput.value.trim();
  const model = dom.carModelInput.value.trim();
  const year = Number(dom.carYearInput.value);
  const selectedTrim = getSelectedTrimCandidate();

  if (!maker || !model || !year) {
    alert("차량 정보를 정확히 입력해 주세요.");
    return;
  }

  if (!selectedTrim) {
    alert("세부 트림을 선택해 주세요.");
    return;
  }

  const fuelType = selectedTrim.fuelType || inferFuelFromTrim(selectedTrim.trim);
  setFuelType(fuelType);

  const wasNotConfigured = !state.car;
  state.car = {
    maker,
    model,
    year,
    trim: selectedTrim.trim,
    powertrain: selectedTrim.powertrain || dom.carPowertrainInput.value.trim(),
    productionYears: formatTrimYearRange(selectedTrim),
    fuelType,
    configuredAt: state.car?.configuredAt || new Date().toISOString(),
  };

  if (wasNotConfigured) {
    addDefaultMaintenanceTask();
  } else {
    refreshAutoOilTask();
  }

  persistAndRender();
  closeSettingsModal();
}

function getCatalogMakes() {
  return Object.keys(catalog.makes || {}).sort((a, b) => a.localeCompare(b, "ko"));
}

function getModelsForMake(make) {
  if (!make || !catalog.makes[make]) return [];
  return Object.keys(catalog.makes[make].models || {}).sort((a, b) => a.localeCompare(b, "ko"));
}

function getTrimsForModel(make, model) {
  if (!make || !model) return [];
  return catalog.makes?.[make]?.models?.[model] || [];
}

function renderMakerOptions(selectedMaker = "") {
  const makes = getCatalogMakes();
  dom.carMakerInput.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "브랜드 선택";
  dom.carMakerInput.appendChild(placeholder);

  makes.forEach((make) => {
    const option = document.createElement("option");
    option.value = make;
    option.textContent = make;
    dom.carMakerInput.appendChild(option);
  });

  if (selectedMaker && makes.includes(selectedMaker)) {
    dom.carMakerInput.value = selectedMaker;
  }

  dom.makerHelp.textContent = `브랜드 ${makes.length.toLocaleString()}개 내장 카탈로그 사용 중`;
}

function renderModelOptions(make, selectedModel = "") {
  const models = getModelsForMake(make);
  dom.carModelInput.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = make ? "모델 선택" : "제조사를 먼저 선택";
  dom.carModelInput.appendChild(placeholder);

  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    dom.carModelInput.appendChild(option);
  });

  if (selectedModel && models.includes(selectedModel)) {
    dom.carModelInput.value = selectedModel;
  }

  dom.modelHelp.textContent =
    models.length > 0 ? `${make} 모델 ${models.length.toLocaleString()}개` : "모델 데이터가 없습니다.";
}

function refreshTrimOptions(options = {}) {
  const { selectedTrim = "" } = options;
  const make = dom.carMakerInput.value.trim();
  const model = dom.carModelInput.value.trim();
  const year = Number(dom.carYearInput.value);

  const trims = filterTrimsByYear(getTrimsForModel(make, model), year);
  currentTrimCandidates = trims;

  dom.carTrimSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = trims.length > 0 ? "세부 트림 선택" : "해당 조건의 트림 데이터 없음";
  dom.carTrimSelect.appendChild(placeholder);

  trims.forEach((trim, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${trim.trim} | ${trim.powertrain} | ${formatTrimYearRange(trim)}`;
    dom.carTrimSelect.appendChild(option);
  });

  if (selectedTrim) {
    const idx = trims.findIndex((item) => item.trim === selectedTrim);
    if (idx >= 0) {
      dom.carTrimSelect.value = String(idx);
    }
  }

  if (dom.carTrimSelect.value === "" && trims.length > 0) {
    dom.carTrimSelect.value = "0";
  }

  if (trims.length > 0) {
    dom.powertrainHelp.textContent = `트림 ${trims.length.toLocaleString()}개가 연식 기준으로 정리되었습니다.`;
    applySelectedTrimToForm();
  } else {
    clearTrimSelection("브랜드/모델/연식을 바꿔서 다시 선택해 주세요.");
  }
}

function filterTrimsByYear(trims, year) {
  if (!Array.isArray(trims)) return [];
  if (!Number.isFinite(year) || year < 1900) return trims;

  return trims.filter((item) => {
    const start = Number(item.startYear) || 1900;
    const end = Number(item.endYear) || 2100;
    return year >= start && year <= end;
  });
}

function getSelectedTrimCandidate() {
  const selected = dom.carTrimSelect.value;
  if (selected === "") return null;
  const index = Number(selected);
  if (!Number.isInteger(index)) return null;
  return currentTrimCandidates[index] || null;
}

function applySelectedTrimToForm() {
  const trim = getSelectedTrimCandidate();
  if (!trim) {
    clearTrimSelection("트림을 선택해 주세요.");
    return;
  }

  dom.carPowertrainInput.value = trim.powertrain || "";
  dom.carProductionYearsInput.value = formatTrimYearRange(trim);
  setFuelType(trim.fuelType || inferFuelFromTrim(trim.trim));
}

function clearTrimSelection(helpText) {
  currentTrimCandidates = [];
  dom.carTrimSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "브랜드/모델/연식을 먼저 선택하세요";
  dom.carTrimSelect.appendChild(placeholder);
  dom.carPowertrainInput.value = "";
  dom.carProductionYearsInput.value = "";
  dom.powertrainHelp.textContent = helpText;
  setFuelType("기타");
}

function setFuelType(fuelType) {
  const next = fuelType || "기타";
  const options = [...dom.carFuelTypeInput.options].map((option) => option.value);
  if (!options.includes(next)) {
    const option = document.createElement("option");
    option.value = next;
    option.textContent = next;
    dom.carFuelTypeInput.appendChild(option);
  }
  dom.carFuelTypeInput.value = next;
}

function inferFuelFromTrim(trimText) {
  const text = String(trimText || "").toLowerCase();
  if (text.includes("tdi") || text.endsWith("d") || text.includes("diesel") || text.includes("디젤")) return "경유";
  if (text.includes("tfsi") || text.includes("fsi") || text.endsWith("i") || text.includes("가솔린")) return "휘발유";
  if (text.includes("e-tron") || text.includes("ev") || text.includes("전기")) return "전기";
  if (text.includes("phev") || text.includes("hybrid") || text.includes("하이브리드")) return "하이브리드";
  if (text.includes("lpg")) return "LPG";
  return "기타";
}

function formatTrimYearRange(trim) {
  const start = Number(trim.startYear) || null;
  const end = Number(trim.endYear) || null;
  if (start && end) return start === end ? `${start}년` : `${start}~${end}년`;
  if (start) return `${start}년~`;
  if (end) return `~${end}년`;
  return "연도 정보 없음";
}

function addDefaultMaintenanceTask() {
  if (!state.car) return;
  const dueKm = getTotalKm() + DEFAULT_OIL_CYCLE_KM;
  const dueDate = addMonths(new Date(), DEFAULT_OIL_CYCLE_MONTHS).toISOString().slice(0, 10);
  state.maintenanceTasks.push({
    id: crypto.randomUUID(),
    name: "엔진오일 교환",
    dueKm,
    dueDate,
    completed: false,
    autoGenerated: true,
    createdAt: new Date().toISOString(),
  });
}

function refreshAutoOilTask() {
  if (!state.car) return;
  const nextDueKm = getTotalKm() + DEFAULT_OIL_CYCLE_KM;
  const nextDueDate = addMonths(new Date(), DEFAULT_OIL_CYCLE_MONTHS).toISOString().slice(0, 10);
  const task = state.maintenanceTasks.find((item) => item.autoGenerated && !item.completed);
  if (!task) return;
  task.dueKm = nextDueKm;
  task.dueDate = nextDueDate;
}

function renderAll() {
  const configured = Boolean(state.car);
  toggleLock(configured);
  renderTopStatus(configured);
  renderWidgetMetrics();
  renderDriveLogs();
  renderMaintenance();
  renderExpenses();
  renderFuelStations();
  hydrateSettingsForm();
  dom.cancelSettingsBtn.disabled = !configured;

  if (!configured) {
    openSettingsModal();
  }
}

function toggleLock(configured) {
  dom.cards.forEach((card) => card.classList.toggle("locked", !configured));

  const interactiveElements = document.querySelectorAll("input, select, button");
  interactiveElements.forEach((element) => {
    const id = element.id || "";
    const alwaysAllowed = [
      "open-settings-btn",
      "cancel-settings-btn",
      "car-maker",
      "car-model",
      "car-year",
      "car-fuel-type",
      "car-powertrain-option",
      "car-powertrain-manual",
      "car-production-years",
    ].includes(id) || element.closest("#settings-form");

    if (!configured && !alwaysAllowed) {
      element.setAttribute("disabled", "disabled");
    } else {
      element.removeAttribute("disabled");
    }
  });

  // Fuel type is always controlled by trim selection.
  dom.carFuelTypeInput.setAttribute("disabled", "disabled");
}

function renderTopStatus(configured) {
  if (!configured || !state.car) {
    dom.configStatus.textContent = "설정 필요";
    dom.configStatus.classList.remove("ok");
    dom.carNamePill.textContent = "차량 미설정";
    return;
  }

  dom.configStatus.textContent = "설정 완료";
  dom.configStatus.classList.add("ok");
  const trimLabel = state.car.trim ? ` ${state.car.trim}` : "";
  dom.carNamePill.textContent = `${state.car.maker} ${state.car.model}${trimLabel} (${state.car.year})`;
}

function renderWidgetMetrics() {
  if (!state.car) {
    dom.metricTotalKm.textContent = "-";
    dom.metricTodayKm.textContent = "-";
    dom.metricEngineHours.textContent = "-";
    dom.metricMonthlyCost.textContent = "-";
    dom.metricNextMaintenance.textContent = "-";
    dom.metricLowestFuel.textContent = "-";
    return;
  }

  const totalKm = getTotalKm();
  const todayKm = getTodayKm();
  const engineHours = getTotalEngineHours();
  const monthlyCost = getMonthlyCost();
  const nextTask = getNextMaintenanceTask();
  const lowestFuel = getLowestFuelStation();

  dom.metricTotalKm.textContent = `${formatNumber(totalKm)} km`;
  dom.metricTodayKm.textContent = `${formatNumber(todayKm)} km`;
  dom.metricEngineHours.textContent = `${engineHours.toFixed(1)} h`;
  dom.metricMonthlyCost.textContent = `${formatNumber(monthlyCost)}원`;
  dom.metricNextMaintenance.textContent = nextTask
    ? maintenanceShortText(nextTask, totalKm)
    : "정비 항목 없음";
  dom.metricLowestFuel.textContent = lowestFuel
    ? `${lowestFuel.stationName} ${formatNumber(lowestFuel.price)}원/L`
    : "가격 정보 없음";
}

function renderDriveLogs() {
  dom.driveLogList.innerHTML = "";
  if (!state.car) {
    dom.driveLogList.innerHTML = `<li class="empty">차량 설정 후 사용 가능합니다.</li>`;
    return;
  }

  const logs = state.driveLogs.slice(0, 6);
  if (logs.length === 0) {
    dom.driveLogList.innerHTML = `<li class="empty">아직 주행 기록이 없습니다.</li>`;
    return;
  }

  logs.forEach((item) => {
    const date = formatDateTime(item.createdAt);
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
      <div class="list-main">
        <strong>${formatNumber(item.distanceKm)} km</strong>
        <small>${date} · 엔진 ${formatNumber(item.engineMinutes)}분</small>
      </div>
      <span class="tag">주행</span>
    `;
    dom.driveLogList.appendChild(li);
  });
}

function renderMaintenance() {
  dom.maintenanceList.innerHTML = "";
  if (!state.car) {
    dom.maintenanceList.innerHTML = `<li class="empty">차량 설정 후 사용 가능합니다.</li>`;
    return;
  }

  const tasks = [...state.maintenanceTasks]
    .filter((item) => !item.completed)
    .sort((a, b) => {
      const kmA = Number.isFinite(a.dueKm) ? a.dueKm : Number.MAX_SAFE_INTEGER;
      const kmB = Number.isFinite(b.dueKm) ? b.dueKm : Number.MAX_SAFE_INTEGER;
      return kmA - kmB;
    });

  if (tasks.length === 0) {
    dom.maintenanceList.innerHTML = `<li class="empty">등록된 정비 항목이 없습니다.</li>`;
    return;
  }

  const totalKm = getTotalKm();
  tasks.forEach((item) => {
    const li = document.createElement("li");
    li.className = "list-item";
    const statusText = maintenanceShortText(item, totalKm);
    const warnClass = isMaintenanceUrgent(item, totalKm) ? "warn" : "";
    li.innerHTML = `
      <div class="list-main">
        <strong>${item.name}</strong>
        <small>${statusText}</small>
      </div>
      <div>
        <span class="tag ${warnClass}">${warnClass ? "임박" : "예정"}</span>
        <button class="btn ghost" data-complete-id="${item.id}">완료</button>
      </div>
    `;
    dom.maintenanceList.appendChild(li);
  });
}

function renderExpenses() {
  dom.expenseList.innerHTML = "";
  if (!state.car) {
    dom.expenseList.innerHTML = `<li class="empty">차량 설정 후 사용 가능합니다.</li>`;
    return;
  }

  const monthTotal = getMonthlyCost();
  const summary = document.createElement("li");
  summary.className = "list-item";
  summary.innerHTML = `
    <div class="list-main">
      <strong>이번 달 총 지출</strong>
      <small>${formatNumber(monthTotal)}원</small>
    </div>
    <span class="tag">월간</span>
  `;
  dom.expenseList.appendChild(summary);

  const expenses = state.expenses.slice(0, 6);
  if (expenses.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "아직 지출 기록이 없습니다.";
    dom.expenseList.appendChild(empty);
    return;
  }

  expenses.forEach((item) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
      <div class="list-main">
        <strong>${item.category} · ${formatNumber(item.amount)}원</strong>
        <small>${formatDateTime(item.createdAt)}${item.note ? ` · ${item.note}` : ""}</small>
      </div>
      <span class="tag">${item.category}</span>
    `;
    dom.expenseList.appendChild(li);
  });
}

function renderFuelStations() {
  dom.fuelList.innerHTML = "";
  if (!state.car) {
    dom.fuelList.innerHTML = `<li class="empty">차량 설정 후 사용 가능합니다.</li>`;
    return;
  }

  const stations = [...state.fuelStations].sort((a, b) => a.price - b.price).slice(0, 3);
  if (stations.length === 0) {
    dom.fuelList.innerHTML = `<li class="empty">아직 주유소 가격 정보가 없습니다.</li>`;
    return;
  }

  const averagePrice = stations.reduce((sum, item) => sum + item.price, 0) / stations.length;
  stations.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "list-item";
    const savePer50L = Math.max(0, (averagePrice - item.price) * 50);
    li.innerHTML = `
      <div class="list-main">
        <strong>${index + 1}. ${item.stationName} · ${formatNumber(item.price)}원/L</strong>
        <small>${item.location || "위치 미기입"} · ${formatDateTime(item.updatedAt)}</small>
      </div>
      <span class="tag">50L 절약 ${formatNumber(savePer50L)}원</span>
    `;
    dom.fuelList.appendChild(li);
  });
}

function hydrateSettingsForm() {
  if (!state.car) return;

  renderMakerOptions(state.car.maker || "");
  renderModelOptions(state.car.maker || "", state.car.model || "");
  dom.carYearInput.value = String(state.car.year || "");
  refreshTrimOptions({ selectedTrim: state.car.trim || "" });
  dom.carPowertrainInput.value = state.car.powertrain || "";
  dom.carProductionYearsInput.value = state.car.productionYears || "";
  setFuelType(state.car.fuelType || "기타");
}

function openSettingsModal() {
  dom.settingsModal.classList.remove("hidden");
}

function closeSettingsModal() {
  if (!state.car) return;
  dom.settingsModal.classList.add("hidden");
}

function persistAndRender() {
  saveState(state);
  renderAll();
}

function getTotalKm() {
  return state.driveLogs.reduce((sum, log) => sum + log.distanceKm, 0);
}

function getTodayKm() {
  const today = new Date().toISOString().slice(0, 10);
  return state.driveLogs
    .filter((item) => item.createdAt.slice(0, 10) === today)
    .reduce((sum, item) => sum + item.distanceKm, 0);
}

function getTotalEngineHours() {
  const totalMinutes = state.driveLogs.reduce((sum, item) => sum + item.engineMinutes, 0);
  return totalMinutes / 60;
}

function getMonthlyCost() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return state.expenses
    .filter((item) => {
      const d = new Date(item.createdAt);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, item) => sum + item.amount, 0);
}

function getNextMaintenanceTask() {
  const totalKm = getTotalKm();
  const openTasks = state.maintenanceTasks.filter((item) => !item.completed);
  if (openTasks.length === 0) return null;

  return [...openTasks].sort((a, b) => {
    const scoreA = maintenanceSortScore(a, totalKm);
    const scoreB = maintenanceSortScore(b, totalKm);
    return scoreA - scoreB;
  })[0];
}

function maintenanceSortScore(task, currentKm) {
  const kmScore = Number.isFinite(task.dueKm) ? Math.max(task.dueKm - currentKm, 0) : 999999;
  const dateScore = task.dueDate
    ? Math.max((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24), 0)
    : 999999;
  return Math.min(kmScore, dateScore);
}

function maintenanceShortText(task, currentKm) {
  const parts = [];
  if (Number.isFinite(task.dueKm)) {
    const left = task.dueKm - currentKm;
    if (left <= 0) {
      parts.push(`주행거리 기준 초과 ${formatNumber(Math.abs(left))}km`);
    } else {
      parts.push(`${formatNumber(left)}km 후`);
    }
  }
  if (task.dueDate) {
    const daysLeft = daysBetweenToday(task.dueDate);
    if (daysLeft < 0) {
      parts.push(`날짜 기준 ${Math.abs(daysLeft)}일 지남`);
    } else {
      parts.push(`D-${daysLeft}`);
    }
  }
  return parts.join(" · ") || "기준 미설정";
}

function isMaintenanceUrgent(task, currentKm) {
  if (Number.isFinite(task.dueKm) && task.dueKm - currentKm <= 500) return true;
  if (task.dueDate && daysBetweenToday(task.dueDate) <= 14) return true;
  return false;
}

function getLowestFuelStation() {
  if (state.fuelStations.length === 0) return null;
  return [...state.fuelStations].sort((a, b) => a.price - b.price)[0];
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialState();
  try {
    const parsed = JSON.parse(raw);
    return {
      car: parsed.car || null,
      driveLogs: parsed.driveLogs || [],
      maintenanceTasks: parsed.maintenanceTasks || [],
      expenses: parsed.expenses || [],
      fuelStations: parsed.fuelStations || [],
    };
  } catch {
    return initialState();
  }
}

function saveState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function initialState() {
  return {
    car: null,
    driveLogs: [],
    maintenanceTasks: [],
    expenses: [],
    fuelStations: [],
  };
}

function formatDateTime(isoText) {
  const d = new Date(isoText);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(
    d.getHours(),
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("ko-KR");
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function daysBetweenToday(dateText) {
  const today = new Date();
  const target = new Date(dateText);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.floor((targetStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
}
