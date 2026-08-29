# Entrolix Website

Production-ready React, Django REST Framework, and PostgreSQL company website.

## Recommended: run the complete stack with Docker

1. Copy `.env.example` to `.env` and replace every placeholder secret.
2. Start the services:

```powershell
docker compose up --build
```

The website is available at `http://localhost`, the API at `http://localhost/api/`, and Django health checks at `http://localhost/health/` from inside the backend network.

Create an administrator after the stack starts:

```powershell
docker compose exec backend python manage.py createsuperuser
```

## Local frontend development

```powershell
cd frontend
npm ci
npm run dev
```

The local frontend uses `VITE_API_URL` from `frontend/.env`; copy `frontend/.env.example` when needed.

## Local backend development

Python 3.13 and PostgreSQL are required:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
py manage.py migrate
py manage.py test
py manage.py runserver
```

## Production checklist

- Use strong unique values for `SECRET_KEY` and `POSTGRES_PASSWORD`.
- Set the real `ALLOWED_HOSTS` and `FRONTEND_URLS` values.
- Terminate TLS at a reverse proxy or hosting platform and enable `SECURE_SSL_REDIRECT=True`.
- Add verified company social, legal, and case-study links when those URLs are available.
- Back up the PostgreSQL volume and monitor `/health/`.

Inquiry submissions are validated, throttled, bot-protected, stored in PostgreSQL, and manageable through Django admin.
