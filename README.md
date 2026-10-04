# MindMetric

**A machine-learning web app that estimates a student's mental health score from their daily digital and lifestyle habits.**

MindMetric takes a student's social-media usage, study routine, sleep, physical activity, and stress level, and returns an ML-generated wellness estimate — presented through a premium, from-scratch frontend with zero UI frameworks.

🔗 **Live demo:** [https://mindmetric-frontend-henna.vercel.app/]
🔗 **API:** [https://mindmetric-r2fo.onrender.com/]

---

## Overview

Social media and academic pressure shape a lot of a student's day, often in ways that are hard to self-assess. MindMetric turns a short lifestyle questionnaire into a single estimated score (out of 10), trained on patterns across roughly 5,000 student records covering demographics, platform usage, study hours, sleep, activity, and stress.

It's built as two independent, deployable services:

| Layer | Stack | Responsibility |
|---|---|---|
| **Frontend** | HTML5, CSS3, vanilla JavaScript | Guided intake form, client-side validation, animated result UI |
| **Backend** | FastAPI, scikit-learn, pandas | Preprocessing, inference, JSON API |

---

## Features

- **Guided 4-step intake form** — demographics, digital habits, lifestyle, and stress, each with its own context instead of one long form
- **Real-time input feedback** — sliders show live values (`5.2 hrs/day`), segmented and card selectors replace plain dropdowns where it helps
- **Inline validation** — no browser `alert()` popups; errors surface next to the field that caused them
- **Animated result reveal** — a circular SVG gauge and score counter animate in once the prediction returns
- **Lifestyle insights** — plain-language observations generated from the submitted inputs (not causal claims)
- **Mock mode** — a `USE_MOCK_API` flag in `script.js` lets you demo the full UI flow without a running backend
- **Fully responsive** — built mobile-first, tested from 390px phone widths up to desktop
- **Accessible by default** — semantic HTML, labeled fields, visible focus states, keyboard-navigable selectors, error messages tied to inputs
- **No ML internals exposed** — the UI never surfaces the algorithm, accuracy, R², or confidence; it presents the result as what it is, an estimate

---

## Tech stack

**Frontend**
- HTML5 / CSS3 (custom design system via CSS variables — no Bootstrap, Tailwind, or component framework)
- Vanilla JavaScript (Fetch API, no build step, no bundler)

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — API framework
- [scikit-learn](https://scikit-learn.org/) — trained regression pipeline (preprocessing + model, bundled as one `.pkl`)
- [pandas](https://pandas.pydata.org/) — structuring request payloads for the model
- [joblib](https://joblib.readthedocs.io/) — model serialization/loading
- [Pydantic](https://docs.pydantic.dev/) — request/response schema validation

**Deployment**
- Backend → [Render](https://render.com) (Web Service)
- Frontend → [Vercel](https://vercel.com) (Static)

---

## Project structure

```text
mindmetric/
├── backend/
│   ├── main.py                     # FastAPI app and /predict endpoint
│   ├── mental_health_model.pkl     # Trained scikit-learn pipeline
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

---

## How it works

```text
┌─────────────┐     ┌──────────────────┐     ┌────────────────────┐     ┌───────────────┐
│   Student   │ --> │  Intake form      │ --> │   FastAPI backend   │ --> │ Predicted      │
│   habits    │     │  (frontend)       │     │   (preprocessing +  │     │ score (0–10)   │
│             │     │  POST /predict    │     │   trained model)    │     │                │
└─────────────┘     └──────────────────┘     └────────────────────┘     └───────────────┘
```

1. The form collects 12 raw, human-readable fields — no encoding or scaling happens client-side.
2. The frontend sends a POST request to `/predict` with that exact payload shape.
3. The backend groups any country outside a fixed list into `"Other"`, builds a single-row DataFrame, and runs it through the trained pipeline.
4. The pipeline's own preprocessing (encoding, scaling) runs server-side; the response is just `{ "predicted_mental_health_score": 7.82 }`.
5. The frontend animates that number into the gauge — never a hardcoded value.

---

## API reference

### `POST /predict`

**Request body**

```json
{
  "age": 20,
  "gender": "Male",
  "country": "India",
  "academic_level": "Undergraduate",
  "most_used_platform": "Instagram",
  "purpose_of_use": "Entertainment",
  "avg_daily_usage_hours": 5.2,
  "daily_unlocks": 82,
  "study_hours": 4.5,
  "physical_activity_hours": 1.0,
  "sleep_hours_per_night": 7.2,
  "stress_level": "Medium"
}
```

| Field | Type | Constraints |
|---|---|---|
| `age` | int | 10–100 |
| `gender` | string | `Male`, `Female` |
| `country` | string | any (grouped to `"Other"` if outside the recognized list) |
| `academic_level` | string | `Undergraduate`, `Graduate`, `High School` |
| `most_used_platform` | string | one of 12 supported platforms |
| `purpose_of_use` | string | `Networking`, `Education`, `Entertainment`, `News` |
| `avg_daily_usage_hours` | float | 0–24 |
| `daily_unlocks` | int | ≥ 0 |
| `study_hours` | float | 0–24 |
| `physical_activity_hours` | float | 0–24 |
| `sleep_hours_per_night` | float | 0–24 |
| `stress_level` | string | `Low`, `Medium`, `High`, `Very High` |

**Response**

```json
{ "predicted_mental_health_score": 7.82 }
```

---

## Running locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# → http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
python3 -m http.server 8080
# → http://127.0.0.1:8080
```

By default `script.js` points `API_BASE_URL` at `http://127.0.0.1:8000`. Set `USE_MOCK_API = true` in `script.js` to explore the UI without the backend running.

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Backend | Render (Web Service) | Root: `backend` · Build: `pip install -r requirements.txt` · Start: `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Frontend | Vercel | Root: `frontend` · Preset: Other · No build command |

After the backend is live, update `API_BASE_URL` in `script.js` to the deployed Render URL before deploying the frontend. CORS is open (`allow_origins=["*"]`) so the two services can live on different domains.

> Render's free tier spins down after 15 minutes idle — the first request after a quiet period can take 30–60 seconds to wake up.

---

## Disclaimer

MindMetric provides a machine-learning-based estimate for educational and demonstration purposes only. It is **not** a medical diagnosis and should not replace professional mental-health advice.

---

## Author

**Ansh Tayal**

