# Encrypted Telemetry Dashboard

This workspace contains:

- `backend`: Node.js + Express API to decrypt AES-256-GCM telemetry and return daily aggregates.
- `frontend`: React + Recharts dashboard to visualize average heart rate and total steps.

## Features Added

- Date range filtering with query params: `startDate`, `endDate`
- Patient filter with query param: `patientId`
- Dashboard filter controls for date range and patient
- Docker Compose setup for MongoDB + backend + frontend
- Automatic encrypted synthetic telemetry generation for `patient-001` when no matching data exists

## 1) Backend Setup

1. Go to `backend`.
2. Copy `.env.example` to `.env`.
3. Fill in your values:
   - `MONGODB_URI`
   - `MONGODB_DB_NAME` (use `healthTelemetry`)
   - `MONGODB_COLLECTION_NAME` (use `telemetry`)
   - `TELEMETRY_AES_KEY_BASE64` (must decode to exactly 32 bytes)
4. Install dependencies:

```powershell
cd backend
npm install
```

5. Start server on port 8080:

```powershell
npm run dev
```

API endpoint:

- `GET http://localhost:8080/api/telemetry/daily`

Optional query params:

- `patientId=P-1024`
- `startDate=2026-03-01`
- `endDate=2026-03-10`

Example:

```text
http://localhost:8080/api/telemetry/daily?patientId=P-1024&startDate=2026-03-01&endDate=2026-03-10
```

Recommended first test (default synthetic patient):

```text
http://localhost:8080/api/telemetry/daily?patientId=patient-001
```

Expected response:

```json
{
  "data": [
    {
      "date": "2026-03-10",
      "avgHeartRate": 72,
      "totalSteps": 4500
    }
  ]
}
```

## 2) Frontend Setup

1. Open a second terminal and go to `frontend`.
2. Install dependencies:

```powershell
cd frontend
npm install
```

3. Start development server:

```powershell
npm run dev
```

4. Open the URL shown by Vite (usually `http://localhost:5173`).

The app fetches data from:

- `http://localhost:8080/api/telemetry/daily`

Dashboard filters:

- Patient ID input
- Start Date picker
- End Date picker
- Apply and Reset actions
- Default patient filter is `patient-001`

## 3) Security Notes

- Encrypted data is read from MongoDB and decrypted only in backend memory.
- Logs include only counts/durations/errors, never decrypted payload contents.
- API response returns only processed fields needed for visualization.

## 4) Debugging Notes

- Browser console logs API payload from dashboard fetch.
- UI shows an error card when API calls fail.
- Empty state is shown only when aggregated result is truly empty.

## 5) Build Check Performed

- Frontend build completed successfully with Vite.
- Backend dependencies installed successfully.

## 5) Docker Compose Run

1. Copy `.env.docker.example` to `.env` at workspace root.
2. Set `TELEMETRY_AES_KEY_BASE64` in that `.env`.
3. Run:

```powershell
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080/api/telemetry/daily`
- MongoDB: `mongodb://localhost:27017`

To stop:

```powershell
docker compose down
```

## 6) Quick Local Verification

From `backend`:

```powershell
npm run dev
```

From `frontend`:

```powershell
npm run dev
```

Then open `http://localhost:5173` and click Apply (patient defaults to `patient-001`).

If port 8080 is occupied on your machine, test backend behavior temporarily with:

```powershell
$env:PORT=8090; npm run start
```
