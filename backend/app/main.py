import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from dotenv import load_dotenv

from app.database import init_db
from app.websocket_manager import WebSocketManager
from app.routers import auth, alerts, files, network, logs, users, system
from app.services.system_monitor import SystemMonitor
from app.services.file_monitor import FileMonitor
from app.services.network_monitor import NetworkMonitor

# Load environment variables
load_dotenv()

# Initialize managers
websocket_manager = WebSocketManager()
system_monitor = SystemMonitor(websocket_manager)
file_monitor = FileMonitor(websocket_manager)
network_monitor = NetworkMonitor(websocket_manager)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting SecureWatch Backend...")
    
    # Initialize database
    await init_db()
    
    # Create directories
    os.makedirs("files", exist_ok=True)
    os.makedirs("files/quarantine", exist_ok=True)
    os.makedirs("files/logs", exist_ok=True)
    
    # Start monitoring services
    await system_monitor.start()
    await file_monitor.start()
    await network_monitor.start()
    
    print("SecureWatch Backend started successfully!")
    
    yield
    
    # Shutdown
    print("Shutting down SecureWatch Backend...")
    await system_monitor.stop()
    await file_monitor.stop()
    await network_monitor.stop()

# Create FastAPI app
app = FastAPI(
    title="SecureWatch API",
    description="Network Intrusion Detection and Prevention System API",
    version="2.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/files", StaticFiles(directory="files"), name="files")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(network.router, prefix="/api/network", tags=["network"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(system.router, prefix="/api/system", tags=["system"])

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Handle any client messages if needed
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)

@app.get("/")
async def root():
    return {"message": "SecureWatch Backend API", "version": "2.1.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SecureWatch Backend"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "False").lower() == "true"
    )