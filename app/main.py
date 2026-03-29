# from fastapi import FastAPI

# app = FastAPI()

# @app.get("/")
# def health_check():
#     return {"status": "ok"}



from fastapi import FastAPI
from app.core.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
from app.core.scheduler import start_scheduler, stop_scheduler

# from app.models import user, batch, request, payment, tanker

from app.api.routes import requests, batches, tankers, payments, auth, users, batches, batch_members, refunds

app = FastAPI()

@app.on_event("startup")
def on_startup():
    start_scheduler()


@app.on_event("shutdown")
def on_shutdown():
    stop_scheduler()

Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:5173",  # my frontend
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://172.27.163.209:8080",
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
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(batches.router)
app.include_router(batch_members.router)
app.include_router(refunds.router)


