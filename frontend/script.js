/* =========================================================
   MindMetric — Prediction frontend logic
   ========================================================= */

// Configure the FastAPI backend base URL here.
const API_BASE_URL = "https://mindmetric-r2fo.onrender.com";

// Set to true to demo the UI without a running backend.
const USE_MOCK_API = false;

const VALIDATION_RULES = {
  age: { min: 10, max: 100, label: "Age" },
  daily_unlocks: { min: 0, max: Infinity, label: "Daily unlocks" },
};

const PLATFORM_LABELS = {
  Facebook: "Facebook", LinkedIn: "LinkedIn", Instagram: "Instagram", Snapchat: "Snapchat",
  Twitter: "Twitter", YouTube: "YouTube", TikTok: "TikTok", LINE: "LINE",
  KakaoTalk: "KakaoTalk", VKontakte: "VKontakte", WhatsApp: "WhatsApp", WeChat: "WeChat",
};

let elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  initializeForm();
});

function cacheElements() {
  elements = {
    form: document.getElementById("predictionForm"),
    navToggle: document.getElementById("navToggle"),
    mobileNav: document.getElementById("mobileNav"),
    predictBtn: document.getElementById("predictBtn"),
    predictBtnLabel: document.getElementById("predictBtnLabel"),
    apiError: document.getElementById("apiError"),
    resultSection: document.getElementById("result-section"),
    gaugeArc: document.getElementById("gaugeArc"),
    gaugeScore: document.getElementById("gaugeScore"),
    scoreMarker: document.getElementById("scoreMarker"),
    profileGrid: document.getElementById("profileGrid"),
    insightsGrid: document.getElementById("insightsGrid"),
    resetBtn: document.getElementById("resetBtn"),
    editInputsBtn: document.getElementById("editInputsBtn"),
  };
}

function initializeForm() {
  // Mobile nav toggle
  elements.navToggle.addEventListener("click", () => {
    const isOpen = elements.mobileNav.classList.toggle("is-open");
    elements.navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  document.querySelectorAll(".mobile-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      elements.mobileNav.classList.remove("is-open");
      elements.navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Segmented / card / stress selectors
  setupChoiceGroup("gender-group", "gender");
  setupChoiceGroup("academic-group", "academic_level");
  setupChoiceGroup("purpose-group", "purpose_of_use");
  setupChoiceGroup("stress-group", "stress_level");

  // Range sliders with live value display
  setupSlider("avg_daily_usage_hours", "usageValue", (v) => `${v.toFixed(1)} hrs/day`);
  setupSlider("study_hours", "studyValue", (v) => `${v.toFixed(1)} hrs/day`);
  setupSlider("sleep_hours_per_night", "sleepValue", (v) => `${v.toFixed(1)} hrs/night`);
  setupSlider("physical_activity_hours", "activityValue", (v) => `${v.toFixed(1)} hr/day`);

  // Number input validation on the fly
  ["age", "daily_unlocks"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => validateField(id));
  });

  elements.form.addEventListener("submit", handleSubmit);
  elements.resetBtn.addEventListener("click", resetForm);
  elements.editInputsBtn.addEventListener("click", () => {
    elements.resultSection.hidden = true;
    document.getElementById("predict-form").scrollIntoView({ behavior: "smooth" });
  });
}

function setupChoiceGroup(groupId, hiddenInputId) {
  const group = document.getElementById(groupId);
  const hiddenInput = document.getElementById(hiddenInputId);
  const options = group.querySelectorAll("[role='radio']");
  options.forEach((option) => {
    option.addEventListener("click", () => {
      options.forEach((o) => {
        o.classList.remove("is-active");
        o.setAttribute("aria-checked", "false");
      });
      option.classList.add("is-active");
      option.setAttribute("aria-checked", "true");
      hiddenInput.value = option.dataset.value;
    });
  });
}

function setupSlider(inputId, labelId, formatFn) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  input.addEventListener("input", () => {
    label.textContent = formatFn(parseFloat(input.value));
  });
}

/* ---------- Validation ---------- */

function validateField(id) {
  const input = document.getElementById(id);
  const errorEl = document.getElementById(`err-${id}`);
  const rule = VALIDATION_RULES[id];
  const value = parseFloat(input.value);
  let message = "";

  if (input.value.trim() === "" || Number.isNaN(value)) {
    message = `${rule.label} is required.`;
  } else if (value < rule.min || value > rule.max) {
    message = rule.max === Infinity
      ? `${rule.label} must be ${rule.min} or greater.`
      : `${rule.label} must be between ${rule.min} and ${rule.max}.`;
  }

  if (errorEl) errorEl.textContent = message;
  input.classList.toggle("is-invalid", Boolean(message));
  return message === "";
}

function validateForm() {
  const ageValid = validateField("age");
  const unlocksValid = validateField("daily_unlocks");
  return ageValid && unlocksValid;
}

/* ---------- Data collection ---------- */

function collectFormData() {
  return {
    age: parseInt(document.getElementById("age").value, 10),
    gender: document.getElementById("gender").value,
    country: document.getElementById("country").value,
    academic_level: document.getElementById("academic_level").value,
    most_used_platform: document.getElementById("most_used_platform").value,
    purpose_of_use: document.getElementById("purpose_of_use").value,
    avg_daily_usage_hours: parseFloat(document.getElementById("avg_daily_usage_hours").value),
    daily_unlocks: parseInt(document.getElementById("daily_unlocks").value, 10),
    study_hours: parseFloat(document.getElementById("study_hours").value),
    physical_activity_hours: parseFloat(document.getElementById("physical_activity_hours").value),
    sleep_hours_per_night: parseFloat(document.getElementById("sleep_hours_per_night").value),
    stress_level: document.getElementById("stress_level").value,
  };
}

/* ---------- Submit flow ---------- */

async function handleSubmit(event) {
  event.preventDefault();
  hideApiError();

  if (!validateForm()) {
    const firstInvalid = elements.form.querySelector(".is-invalid");
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const payload = collectFormData();
  setLoadingState(true);

  try {
    const prediction = await predictMentalHealth(payload);
    displayPrediction(prediction, payload);
  } catch (err) {
    console.error("Prediction request failed:", err);
    showApiError("We couldn't generate your prediction right now. Please check your inputs and try again.");
  } finally {
    setLoadingState(false);
  }
}

function setLoadingState(isLoading) {
  elements.predictBtn.disabled = isLoading;
  elements.predictBtn.classList.toggle("is-loading", isLoading);
  elements.predictBtnLabel.textContent = isLoading
    ? "Analyzing your lifestyle patterns..."
    : "Predict Mental Health Score";
}

function showApiError(message) {
  elements.apiError.textContent = message;
  elements.apiError.hidden = false;
}

function hideApiError() {
  elements.apiError.hidden = true;
  elements.apiError.textContent = "";
}

/* ---------- API ---------- */

async function predictMentalHealth(data) {
  if (USE_MOCK_API) {
    return mockPredict(data);
  }

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errorBody = await response.json();
      detail = JSON.stringify(errorBody);
    } catch (_) {
      /* ignore parse failure */
    }
    console.error(`API error ${response.status}:`, detail);
    throw new Error(`Request failed with status ${response.status}`);
  }

  const json = await response.json();
  if (typeof json.predicted_mental_health_score !== "number") {
    throw new Error("Invalid API response shape.");
  }
  return json.predicted_mental_health_score;
}

function mockPredict(data) {
  // Simple illustrative mock — NOT a real model result.
  return new Promise((resolve) => {
    setTimeout(() => {
      let score = 7;
      score -= Math.max(0, data.avg_daily_usage_hours - 4) * 0.15;
      score += Math.max(0, data.sleep_hours_per_night - 6) * 0.2;
      score += Math.max(0, data.physical_activity_hours) * 0.1;
      const stressPenalty = { Low: 0, Medium: 0.3, High: 0.8, "Very High": 1.4 };
      score -= stressPenalty[data.stress_level] ?? 0;
      score = Math.max(3, Math.min(10, score));
      resolve(Math.round(score * 100) / 100);
    }, 900);
  });
}

/* ---------- Result rendering ---------- */

function displayPrediction(score, inputs) {
  elements.resultSection.hidden = false;
  elements.resultSection.classList.add("is-visible");
  animateScore(score);
  displayInputSummary(inputs);
  generateLifestyleInsights(inputs);
  elements.resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function animateScore(score) {
  const clamped = Math.max(0, Math.min(10, score));
  const circumference = 2 * Math.PI * 100; // r = 100
  const fraction = clamped / 10;
  const offset = circumference * (1 - fraction);

  elements.gaugeArc.style.strokeDasharray = `${circumference}`;
  // Force reflow so the transition reliably triggers
  elements.gaugeArc.getBoundingClientRect();
  elements.gaugeArc.style.strokeDashoffset = `${offset}`;

  // Marker along the 3–10 scale
  const scalePct = Math.max(0, Math.min(100, ((clamped - 3) / (10 - 3)) * 100));
  elements.scoreMarker.style.left = `${scalePct}%`;

  animateNumber(elements.gaugeScore, score);
}

function animateNumber(el, target) {
  const duration = 900;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = (target * eased).toFixed(2);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target.toFixed(2);
    }
  }
  requestAnimationFrame(tick);
}

function displayInputSummary(inputs) {
  const rows = [
    ["Age", inputs.age],
    ["Gender", inputs.gender],
    ["Country", inputs.country],
    ["Academic Level", inputs.academic_level],
    ["Daily Usage", `${inputs.avg_daily_usage_hours.toFixed(1)} hrs/day`],
    ["Daily Unlocks", inputs.daily_unlocks],
    ["Platform", PLATFORM_LABELS[inputs.most_used_platform] ?? inputs.most_used_platform],
    ["Purpose", inputs.purpose_of_use],
    ["Study Hours", `${inputs.study_hours.toFixed(1)} hrs/day`],
    ["Sleep", `${inputs.sleep_hours_per_night.toFixed(1)} hrs/night`],
    ["Physical Activity", `${inputs.physical_activity_hours.toFixed(1)} hr/day`],
    ["Stress", inputs.stress_level],
  ];

  elements.profileGrid.innerHTML = rows
    .map(
      ([label, value]) => `
      <div class="profile-item">
        <span class="profile-item-label">${label}</span>
        <span class="profile-item-value">${value}</span>
      </div>`
    )
    .join("");
}

function generateLifestyleInsights(inputs) {
  const insights = [];

  insights.push({
    title: "Digital Usage",
    text:
      inputs.avg_daily_usage_hours >= 6
        ? "Your reported daily social-media usage is relatively high."
        : inputs.avg_daily_usage_hours <= 2
        ? "Your reported daily social-media usage is relatively low."
        : "Your reported daily social-media usage is moderate. Social-media usage is one of the variables considered by the prediction system.",
  });

  insights.push({
    title: "Sleep",
    text: `You reported approximately ${inputs.sleep_hours_per_night.toFixed(1)} hours of sleep per night.`,
  });

  insights.push({
    title: "Physical Activity",
    text:
      inputs.physical_activity_hours >= 1
        ? "You reported regular physical activity."
        : "You reported limited physical activity.",
  });

  insights.push({
    title: "Study",
    text: `You reported approximately ${inputs.study_hours.toFixed(1)} hours of study per day.`,
  });

  elements.insightsGrid.innerHTML = insights
    .map(
      (insight) => `
      <div class="insight-card">
        <h4>${insight.title}</h4>
        <p>${insight.text}</p>
      </div>`
    )
    .join("");
}

/* ---------- Reset ---------- */

function resetForm() {
  elements.form.reset();

  // Reset custom choice groups to defaults
  setChoice("gender-group", "gender", "Male");
  setChoice("academic-group", "academic_level", "Undergraduate");
  setChoice("purpose-group", "purpose_of_use", "Entertainment");
  setChoice("stress-group", "stress_level", "Medium");

  // Reset sliders + labels
  setSliderValue("avg_daily_usage_hours", "usageValue", 5.2, (v) => `${v.toFixed(1)} hrs/day`);
  setSliderValue("study_hours", "studyValue", 4.5, (v) => `${v.toFixed(1)} hrs/day`);
  setSliderValue("sleep_hours_per_night", "sleepValue", 7.2, (v) => `${v.toFixed(1)} hrs/night`);
  setSliderValue("physical_activity_hours", "activityValue", 1.0, (v) => `${v.toFixed(1)} hr/day`);

  document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
  document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

  elements.resultSection.hidden = true;
  elements.resultSection.classList.remove("is-visible");
  hideApiError();

  document.getElementById("predict-form").scrollIntoView({ behavior: "smooth" });
}

function setChoice(groupId, hiddenInputId, value) {
  const group = document.getElementById(groupId);
  const hiddenInput = document.getElementById(hiddenInputId);
  hiddenInput.value = value;
  group.querySelectorAll("[role='radio']").forEach((option) => {
    const isMatch = option.dataset.value === value;
    option.classList.toggle("is-active", isMatch);
    option.setAttribute("aria-checked", String(isMatch));
  });
}

function setSliderValue(inputId, labelId, value, formatFn) {
  document.getElementById(inputId).value = value;
  document.getElementById(labelId).textContent = formatFn(value);
}
