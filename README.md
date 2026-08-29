# Entrolix Website

Production-ready static React company website.

## Local development

```powershell
cd frontend
npm ci
npm run dev
```

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_FORM_ENDPOINT` to a hosted form endpoint if contact submissions are required.

## Production checklist

- Configure `VITE_FORM_ENDPOINT` in the hosting platform.
- Deploy the `frontend` directory to Vercel, Netlify, Cloudflare Pages, or another static host.
- Add verified company social, legal, and case-study links when those URLs are available.

The contact form is frontend-only and sends directly to the configured hosted form provider.
