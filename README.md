# 🌍 GlobalPulse — World Bank Data Dashboard

> Full-stack Django + React dashboard visualizing World Bank open data with interactive charts, filters, and authentication.

---

## 🚀 Live Demo

| Service | URL |
|---------|-----|
| Frontend (Vercel) | `https://world-bank-data-visualization-dashb.vercel.app` |
| Backend API (Render) | `https://world-bank-data-visualization-dashboard-cjod.onrender.com` |

**Demo credentials:** `demo` / `demo123`

---

## ✨ Features

- **3 interactive chart types**: Line chart (time series), Bar chart (country comparison), Scatter plot (correlation)
- **Dynamic filters**: Country selector, year range, indicator selector, comparison year
- **Real-time World Bank API**: Data fetched live from `api.worldbank.org/v2`
- **8 indicators**: GDP growth, GDP per capita, Population, CO₂ emissions, Life expectancy, Internet users, Literacy rate, Unemployment
- **15 countries** available for comparison
- **Django authentication**: Login/logout with session cookies, protected dashboard route
- **API caching**: 5-minute in-memory cache to avoid hammering the World Bank API
- **CORS handled**: Django CORS headers configured for cross-origin React frontend

---

## 🏗️ Architecture

```
worldbank-dashboard/
├── backend/                  # Django project
│   ├── manage.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   ├── requirements.txt
│   ├── render.yaml           # Render deploy config
│   ├── seed.py               # Creates demo users
│   └── dashboard/
│       ├── apps.py
│       ├── urls.py
│       ├── views.py          # REST API views
│       └── worldbank.py      # World Bank API service
│
└── frontend/                 # React (Vite) project
    ├── index.html
    ├── vite.config.js        # Proxies /api → Django in dev
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx           # Routes + auth guards
        ├── styles.css
        ├── hooks/
        │   └── useAuth.jsx   # Auth context + hooks
        ├── services/
        │   └── api.js        # Axios API client
        ├── components/
        │   └── CustomTooltip.jsx
        └── pages/
            ├── LoginPage.jsx
            └── DashboardPage.jsx
```

---

## 🛠️ Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate
python seed.py                 # Creates admin/admin123 and demo/demo123

python manage.py runserver     # Runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                    # Runs on http://localhost:5173
```

Vite is configured to proxy `/api/*` → `http://localhost:8000` in development, so no CORS issues locally.

---

## 📡 API Endpoints

All endpoints (except auth) require a logged-in session.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/csrf/` | Get CSRF token cookie |
| POST | `/api/auth/login/` | Login `{ username, password }` |
| POST | `/api/auth/logout/` | Logout |
| GET | `/api/auth/me/` | Current user info |
| GET | `/api/indicators/` | List all indicators + countries |
| GET | `/api/summary/?country=US` | Latest values for all indicators |
| GET | `/api/timeseries/?indicator=gdp_growth&country=US&start=2000&end=2023` | Time series data |
| GET | `/api/comparison/?indicator=gdp_per_capita&countries=US;CN;IN&year=2022` | Multi-country bar data |
| GET | `/api/scatter/?x=gdp_per_capita&y=life_expectancy&year=2021` | Scatter plot data |

### Example Response — `/api/timeseries/`
```json
{
  "indicator": "GDP Growth (% annual)",
  "unit": "%",
  "country": "United States",
  "data": [
    { "year": 2000, "value": 4.098 },
    { "year": 2001, "value": 1.0 }
  ]
}
```

---

## 🌐 Deployment

### Backend → Render (free tier)

1. Push `backend/` folder to a GitHub repo
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set:
   - **Build Command**: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput && python seed.py`
   - **Start Command**: `gunicorn wsgi:application`
4. Add env vars: `SECRET_KEY` (generate random), `DEBUG=False`
5. Note your Render URL, e.g. `https://worldbank-api.onrender.com`

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add env var: `VITE_API_URL=https://worldbank-api.onrender.com/api`
4. In Django `settings.py`, add your Vercel URL to `CORS_ALLOWED_ORIGINS`

---

## ⚠️ Known Issues / Limitations

- **World Bank API latency**: The WB API can be slow (1–3s). The first page load fetches several endpoints; subsequent loads use the 5-min cache.
- **Render cold start**: Free Render instances sleep after 15 mins of inactivity — first request may take 30–60s to wake up.
- **Missing data**: Some indicators (e.g., Literacy Rate) have sparse data for certain countries/years. The chart will show an empty state with a message.
- **SQLite in production**: Fine for this scale; swap for PostgreSQL (Render managed DB) for production use.

---

## 🧪 Available Indicators

| Key | Label | Unit |
|-----|-------|------|
| `gdp_growth` | GDP Growth (% annual) | % |
| `gdp_per_capita` | GDP per Capita | USD |
| `population` | Total Population | people |
| `co2_emissions` | CO₂ Emissions | t/capita |
| `life_expectancy` | Life Expectancy | years |
| `internet_users` | Internet Users | % pop |
| `literacy_rate` | Literacy Rate | % |
| `unemployment` | Unemployment Rate | % |

---

## 👤 Author



**Stack**: Django 5 · Django REST Framework · React 18 · Vite · Recharts · Axios · Framer Motion
