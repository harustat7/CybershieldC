# pybackend/app.py - Final Version


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import sys
import os


app = FastAPI()


# --- CORS Configuration ---
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173", # Your Vite/React port
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Process Management ---
running_processes = {}


# --- API Endpoints ---


@app.get("/")
async def health_check():
    """A simple endpoint for the frontend to check if the API is running."""
    return {"status": "ok", "message": "Live Monitoring API is running."}


@app.post("/start-monitoring")
async def start_monitoring():
    """Starts the capture and aggregator scripts."""
    # (Your existing code for this endpoint is perfect, no changes needed)
    python_executable = sys.executable
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    script1_path = os.path.join(backend_dir, 'capture_traffic.py')
    script2_path = os.path.join(backend_dir, 'aggregator.py')
   
    try:
        print("Starting script: capture_traffic.py")
        proc1 = subprocess.Popen([python_executable, script1_path])
        running_processes['capture'] = proc1


        print("Starting script: aggregator.py")
        proc2 = subprocess.Popen([python_executable, script2_path])
        running_processes['aggregator'] = proc2


        return {"status": "success", "message": "Monitoring scripts started."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stop-monitoring")
async def stop_monitoring():
    """Stops all running monitoring scripts gracefully."""
    print("Received request to stop monitoring scripts...")
    stopped_count = 0
    for name, proc in running_processes.items():
        try:
            print(f"Terminating process '{name}' (PID: {proc.pid})...")
            proc.terminate() # Sends SIGTERM, which our scripts will catch
            proc.wait(timeout=5) # Wait up to 5 seconds for it to close
            stopped_count += 1
        except subprocess.TimeoutExpired:
            print(f"Process '{name}' did not terminate in time, killing it.")
            proc.kill()
        except Exception as e:
            print(f"Error stopping process '{name}': {e}")
           
    running_processes.clear()
    if stopped_count > 0:
        return {"status": "success", "message": "Monitoring scripts stopped."}
    else:
        return {"status": "success", "message": "No active scripts to stop."}



