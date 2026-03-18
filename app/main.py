# from fastapi import FastAPI

# app = FastAPI()

# @app.get("/")
# def health_check():
#     return {"status": "ok"}



from fastapi import FastAPI
from app.api.routes import requests, batches, tankers

app = FastAPI()

app.include_router(requests.router)
app.include_router(batches.router)
app.include_router(tankers.router)

