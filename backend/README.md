# QuickSplit Backend

Backend API for QuickSplit — an AI-powered, conversation-first bill splitting platform.

## Prerequisites

- Python 3.12+
- pip

## Setup

### 1. Create a virtual environment

```bash
cd backend
python -m venv venv
```

**Windows (PowerShell):**

```powershell
.\venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

**Windows (PowerShell):**

```powershell
copy .env.example .env
```

Edit `.env` if you need to override defaults.

### 4. Run the server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## API Documentation

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Endpoints

| Method | Path      | Description          |
|--------|-----------|----------------------|
| GET    | `/`       | Application metadata |
| GET    | `/health` | Health check         |
