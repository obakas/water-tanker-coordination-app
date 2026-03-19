# from fastapi import FastAPI

# app = FastAPI()

# @app.get("/")
# def health_check():
#     return {"status": "ok"}



from fastapi import FastAPI
from app.core.database import Base, engine

from app.models import user, batch, request, payment, tanker

from app.api.routes import requests, batches, tankers, payments

app = FastAPI()

Base.metadata.create_all(bind=engine)


app.include_router(requests.router)
app.include_router(batches.router)
app.include_router(tankers.router)
app.include_router(payments.router)
