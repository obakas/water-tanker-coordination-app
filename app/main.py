# from fastapi import FastAPI

# app = FastAPI()

# @app.get("/")
# def health_check():
#     return {"status": "ok"}



from fastapi import FastAPI
from app.core.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware

from app.models import user, batch, request, payment, tanker

from app.api.routes import requests, batches, tankers, payments

app = FastAPI()

Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:5173",  # my frontend
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(requests.router)
app.include_router(batches.router)
app.include_router(tankers.router)
app.include_router(payments.router)


