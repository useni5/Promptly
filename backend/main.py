from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from typing import List, Optional, AsyncGenerator
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI(title="Promptly API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    async def serve_frontend():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NVIDIA_MODEL = os.getenv(
    "NVIDIA_MODEL",
    "nvidia/nemotron-3-ultra-550b-a55b"
)

NVIDIA_BASE_URL = os.getenv(
    "NVIDIA_BASE_URL",
    "https://integrate.api.nvidia.com/v1"
)

NEMOTRON_SYSTEM_PROMPT = """You are Nemotron 3 Ultra, a language model created by NVIDIA. You are helpful, harmless, and honest. Provide clear, accurate, and concise responses. When coding, write clean, efficient, and well-documented code. When explaining concepts, use simple language and practical examples."""

# Lazy init client to avoid startup issues if API key not set
client = None

def get_client():
    global client
    if client is None:
        client = OpenAI(
            base_url=NVIDIA_BASE_URL,
            api_key=NVIDIA_API_KEY
        )
    return client

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.95
    max_tokens: Optional[int] = 4096
    stream: Optional[bool] = False

class ChatResponse(BaseModel):
    message: Message
    usage: Optional[dict] = None

def build_messages(request: ChatRequest) -> List[dict]:
    messages = [{"role": "system", "content": NEMOTRON_SYSTEM_PROMPT}]
    messages.extend([
        {"role": msg.role, "content": msg.content}
        for msg in request.messages
    ])
    return messages

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": NVIDIA_MODEL}

@app.post("/api/chat")
async def chat(request: ChatRequest):

    if not NVIDIA_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="NVIDIA API key not configured"
        )

    try:
        messages = build_messages(request)

        if request.stream:
            return StreamingResponse(
                stream_chat(messages, request),
                media_type="text/event-stream"
            )

        response = get_client().chat.completions.create(
            model=request.model or NVIDIA_MODEL,
            messages=messages,
            temperature=request.temperature,
            top_p=request.top_p,
            max_tokens=request.max_tokens,
        )

        assistant_message = response.choices[0].message

        usage = (
            response.usage.model_dump()
            if response.usage
            else None
        )

        return ChatResponse(
            message=Message(
                role=assistant_message.role,
                content=assistant_message.content
            ),
            usage=usage
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"NVIDIA API error: {str(e)}"
        )

async def stream_chat(messages: List[dict], request: ChatRequest) -> AsyncGenerator[str, None]:
    try:
        stream = get_client().chat.completions.create(
            model=request.model or NVIDIA_MODEL,
            messages=messages,
            temperature=request.temperature,
            top_p=request.top_p,
            max_tokens=request.max_tokens,
            stream=True
        )

        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                data = json.dumps({"content": content})
                yield f"data: {data}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as e:
        error_data = json.dumps({"error": str(e)})
        yield f"data: {error_data}\n\n"

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=port
    )