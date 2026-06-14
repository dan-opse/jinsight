from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import entries, dashboard

app = FastAPI(title="Jinsight API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://jinsight.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(entries.router)
app.include_router(dashboard.router)


@app.get("/health")
def health():
    return {"status": "ok"}
