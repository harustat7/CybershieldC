# File: 1_capture_traffic.py
# Purpose: Captures network traffic using pyflowmeter and saves raw,
#          variable-row CSV files to the 'raw_captures' directory.


import os
import sys
import time
import shutil


try:
    # This assumes pyflowmeter is installed.
    # If you have a custom version, ensure it's accessible.
    from pyflowmeter.sniffer import create_sniffer
except ImportError:
    print("[FATAL] Could not import 'pyflowmeter'.", file=sys.stderr)
    print("         Please ensure it is installed (`pip install pyflowmeter`)", file=sys.stderr)
    print("         or that your custom module is in Python's path.", file=sys.stderr)
    sys.exit(1)


# --- Configuration ---
INTERFACE_NAME = "Wi-Fi"  # Or "eth0", "Ethernet", etc.
RAW_CAPTURE_DIR = "raw_captures"


# This parameter tells your custom pyflowmeter when to create a NEW file.
# We are assuming it's based on packet count.
PACKET_CHUNK_SIZE = 500


# Set a very long duration to run until manually stopped with Ctrl+C.
CAPTURE_DURATION_SECONDS = 180  # 24 hours


# --- Main Execution ---
if __name__ == "__main__":
    print("==============================================")
    print("=== SCRIPT 1: High-Speed Traffic Capture ===")
    print("==============================================")
    print(f"Interface:         {INTERFACE_NAME}")
    print(f"Output Directory:  '{RAW_CAPTURE_DIR}'")
    print("\nThis script will run continuously to capture data.")
    print("Press Ctrl+C in this terminal to stop the capture.")
    print("----------------------------------------------")
    time.sleep(2)


    # --- Directory Setup ---
    # This ensures a clean start every time the script is run.
    if os.path.exists(RAW_CAPTURE_DIR):
        print(f"Found existing '{RAW_CAPTURE_DIR}' directory. Removing it for a clean start.")
        shutil.rmtree(RAW_CAPTURE_DIR)
    print(f"Creating new, empty directory: '{RAW_CAPTURE_DIR}'")
    os.makedirs(RAW_CAPTURE_DIR)


    # This is the base filename pyflowmeter will use.
    # Your custom version should append numbers, e.g., capture_chunk_1.csv, capture_chunk_2.csv
    output_path_base = os.path.join(RAW_CAPTURE_DIR, "capture_chunk.csv")


    sniffer = None  # Initialize to ensure it exists in the finally block
    try:
        print(f"[{time.strftime('%H:%M:%S')}] 🛠  Initializing sniffer...")


        # IMPORTANT: This needs to match how your custom pyflowmeter is invoked.
        # It should be configured to create new files in the RAW_CAPTURE_DIR.
        sniffer = create_sniffer(
            input_interface=INTERFACE_NAME,
            to_csv=True,
            output_file=output_path_base,
            # This 'max_packets' parameter is an example of what your custom
            # version might use to trigger file rotation.
            packet_chunk_size=PACKET_CHUNK_SIZE
        )


        print(f"[{time.strftime('%H:%M:%S')}] ▶️  Starting traffic capture...")
        sniffer.start()
        print(f"[{time.strftime('%H:%M:%S')}] ✅  Capture is LIVE. Now monitoring traffic.")


        # This loop simply keeps the main thread alive. The actual work
        # is done by the sniffer's background process.
        start_time = time.time()
        while time.time() - start_time < CAPTURE_DURATION_SECONDS:
            time.sleep(1)  # Sleep for 1s is fine; it just checks the timer.


    except KeyboardInterrupt:
        print(f"\n[{time.strftime('%H:%M:%S')}] ⏹️  Ctrl+C received. Stopping capture...")
    except Exception as e:
        print(f"\n[FATAL ERROR] An unexpected error occurred: {e}", file=sys.stderr)
    finally:
        print(f"[{time.strftime('%H:%M:%S')}] 🔧  Shutting down the sniffer...")
        if sniffer and sniffer.running:
            sniffer.stop()
        print(f"[{time.strftime('%H:%M:%S')}] ✅  Capture script has stopped.")



