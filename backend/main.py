from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routes.add_route import router as add_router
from routes.upload_route import router as upload_router
from routes.processing_route import router as processing_router
import asyncio
#from webrtc.server import app as webrtc_app
from aiohttp import web as aiohttp_web
from store import create_store

HOST = "0.0.0.0"
PORT = 8000

app = FastAPI()

# Добавляем CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем всем источникам
    allow_credentials=False,  # Отключаем credentials при allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(add_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(processing_router, prefix="/api")

app.mount("/", StaticFiles(directory="view", html=True), name="view")

async def run_webrtc():
    runner = aiohttp_web.AppRunner(webrtc_app)
    await runner.setup()
    site = aiohttp_web.TCPSite(runner, HOST, PORT)
    await site.start()
    print("WebRTC server started on http://127.0.0.1:8081")

if __name__ == "__main__":
    create_store()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    #loop.create_task(run_webrtc())

    uvicorn.run(app, host=HOST, port=PORT)

