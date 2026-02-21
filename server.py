import json
import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
from supabase_get import run_all_predictions

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
    expose_headers=["*"],
)

openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    quiz_context: str

@app.post("/run-predictions")
def run_predictions():
    run_all_predictions()
    return {"status": "done"}

@app.post("/chat")
async def chat(req: ChatRequest):
    async def generate():
        system_message = {
            "role": "system",
            "content": (
                "You are an educational AI assistant helping a teacher understand their students' quiz performance. "
                "Be concise, insightful, and highlight actionable observations.\n\n"
                f"Current quiz data:\n{req.quiz_context}"
            )
        }
        messages = [system_message] + [{"role": m.role, "content": m.content} for m in req.messages]
        stream = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stream=True,
        )
        for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
