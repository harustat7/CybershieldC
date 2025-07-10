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


@app.get("/status")
def status():
    """Return whether live capture is running."""
    is_running = 'capture' in running_processes and running_processes['capture'].poll() is None
    print(f"[STATUS CHECK] /status called. live_running={is_running}")
    return {"live_running": is_running}


@app.post("/start-monitoring")
async def start_monitoring():
    """Starts the capture and aggregator scripts."""
    python_executable = sys.executable
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    script1_path = os.path.join(backend_dir, 'capture_traffic.py')
    script2_path = os.path.join(backend_dir, 'aggregator.py')
   
    try:
        print("[START] Starting script: capture_traffic.py")
        proc1 = subprocess.Popen([python_executable, script1_path])
        running_processes['capture'] = proc1
        print(f"[START] capture_traffic.py started with PID {proc1.pid}")

        print("[START] Starting script: aggregator.py")
        proc2 = subprocess.Popen([python_executable, script2_path])
        running_processes['aggregator'] = proc2
        print(f"[START] aggregator.py started with PID {proc2.pid}")

        return {"status": "success", "message": "Monitoring scripts started."}
    except Exception as e:
        print(f"[ERROR] Failed to start monitoring scripts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stop-monitoring")
async def stop_monitoring():
    """Stops all running monitoring scripts gracefully."""
    print("[STOP] Received request to stop monitoring scripts...")
    stopped_count = 0
    for name, proc in running_processes.items():
        try:
            print(f"[STOP] Terminating process '{name}' (PID: {proc.pid})...")
            proc.terminate() # Sends SIGTERM, which our scripts will catch
            proc.wait(timeout=5) # Wait up to 5 seconds for it to close
            print(f"[STOP] Process '{name}' terminated normally.")
            stopped_count += 1
        except subprocess.TimeoutExpired:
            print(f"[STOP][TIMEOUT] Process '{name}' did not terminate in time, killing it.")
            proc.kill()
        except Exception as e:
            print(f"[STOP][ERROR] Error stopping process '{name}': {e}")
           
    running_processes.clear()
    if stopped_count > 0:
        print(f"[STOP] {stopped_count} monitoring scripts stopped.")
        return {"status": "success", "message": "Monitoring scripts stopped."}
    else:
        print("[STOP] No active scripts to stop.")
        return {"status": "success", "message": "No active scripts to stop."}



