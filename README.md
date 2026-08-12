# Promptly - Nemotron 3 Ultra Chat Application

A modern, responsive AI chat application built with vanilla JavaScript (frontend) and FastAPI (backend), optimized for **NVIDIA Nemotron 3 Ultra**.

## Features

- **Nemotron 3 Ultra Optimized**: Custom system prompt, optimal temperature (0.7), top_p (0.95), and 4096 max tokens
- **Streaming Responses**: Real-time token streaming for faster perceived latency
- **Clean, ChatGPT-style Interface**: Modern UI with smooth animations
- **Conversation History**: Multiple chats with persistent localStorage storage
- **New Chat, Delete Chat, Clear All**: Full chat management
- **Copy & Regenerate**: Copy responses or regenerate with one click
- **Dark/Light Theme**: System-aware theme with manual toggle
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Markdown Rendering**: Code blocks, inline code, bold, italic
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for new line

## Project Structure

```
Promptly/
├── backend/
│   ├── main.py           # FastAPI application with streaming support
│   ├── requirements.txt  # Python dependencies
│   └── .env             # Environment variables (create from .env.example)
├── frontend/
│   ├── index.html       # Main HTML file
│   ├── css/
│   │   └── styles.css   # All styles
│   └── js/
│       └── app.js       # Vanilla JavaScript application
└── README.md
```

## Prerequisites

- Python 3.9+
- NVIDIA API Key (get one at https://integrate.api.nvidia.com)
- Node.js (optional, for serving frontend)

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create `.env` file with your NVIDIA API key:
   ```bash
   cp .env.example .env
   # Edit .env and add your NVIDIA_API_KEY
   ```

6. Start the backend server:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend

The frontend is pure HTML/CSS/JS and can be served any way you prefer:

**Option 1: Python's built-in server**
```bash
cd frontend
python -m http.server 3000
```

**Option 2: VS Code Live Server extension**
- Right-click `index.html` → "Open with Live Server"

**Option 3: Any static file server**
```bash
npx serve frontend
```

The frontend will be available at `http://localhost:3000` (or whatever port you choose).

## Usage

1. Open the frontend in your browser
2. Click "New Chat" or start typing in the input box
3. Send messages to chat with Nemotron 3 Ultra
4. Use the sidebar to manage conversation history
5. Toggle theme with the sun/moon icon
6. Copy or regenerate AI responses using the action buttons
7. Watch responses stream in real-time!

## API Endpoints

- `GET /health` - Health check (returns model info)
- `POST /api/chat` - Send chat messages to Nemotron 3 Ultra

### Chat Request

```json
{
  "messages": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"},
    {"role": "user", "content": "How are you?"}
  ],
  "model": "nvidia/nemotron-3-ultra-550b-a55b",
  "temperature": 0.7,
  "top_p": 0.95,
  "max_tokens": 4096,
  "stream": true
}
```

### Chat Response (Non-streaming)

```json
{
  "message": {"role": "assistant", "content": "I'm doing well, thank you!"},
  "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30}
}
```

### Streaming Response (Server-Sent Events)

```
data: {"content": "I'm doing"}
data: {"content": " well, thank"}
data: {"content": " you!"}
data: [DONE]
```

## Nemotron 3 Ultra Optimizations

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Model** | `nvidia/nemotron-3-ultra-550b-a55b` | 53B parameter model |
| **Temperature** | 0.7 | Balanced creativity/accuracy |
| **Top-p** | 0.95 | Nucleus sampling for quality |
| **Max Tokens** | 4096 | Full context window utilization |
| **System Prompt** | Custom | Optimized for Nemotron behavior |
| **Streaming** | Enabled | Real-time token delivery |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NVIDIA_API_KEY` | Your NVIDIA API key | **Required** |
| `NVIDIA_MODEL` | Nemotron model to use | `nvidia/nemotron-3-ultra-550b-a55b` |
| `NVIDIA_BASE_URL` | NVIDIA API endpoint | `https://integrate.api.nvidia.com/v1` |
| `PORT` | Backend server port | `8000` |

## Keyboard Shortcuts

- `Enter` - Send message
- `Shift + Enter` - New line in input

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Getting NVIDIA API Key

1. Visit https://integrate.api.nvidia.com
2. Sign in or create an account
3. Navigate to API Keys
4. Create a new key with Nemotron 3 Ultra access
5. Copy the key to your `.env` file

## License

MIT