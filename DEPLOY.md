# Promptly Deployment Guide

## Quick Deploy Options

### Railway (Recommended - Full Stack)
1. Push to GitHub
2. Connect repo to Railway
3. Add `NVIDIA_API_KEY` environment variable
4. Deploy - Railway auto-detects Dockerfile

### Vercel (Frontend + Serverless Backend)
1. Push to GitHub
2. Import to Vercel
3. Add `NVIDIA_API_KEY` and `PROMPTLY_API_BASE` (your backend URL) environment variables
4. Deploy

### Docker (Anywhere)
```bash
docker build -t promptly .
docker run -p 8000:8000 -e NVIDIA_API_KEY=your_key promptly
```

### Docker Compose (Local Dev)
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your NVIDIA_API_KEY
docker-compose up --build
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NVIDIA_API_KEY` | Yes | Your NVIDIA API key |
| `NVIDIA_MODEL` | No | Model name (default: nemotron-3-ultra) |
| `NVIDIA_BASE_URL` | No | API base URL |
| `PORT` | No | Port (default: 8000) |
| `PROMPTLY_API_BASE` | For Vercel frontend | Backend URL (e.g., https://your-app.railway.app) |

## Architecture

- **Single Container** (Railway/Docker): Backend serves API + static frontend
- **Split Deploy** (Vercel): Frontend on Vercel, backend on Railway/Render/Fly.io