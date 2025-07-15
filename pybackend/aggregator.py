# # File: 2_aggregate_and_send.py
# # Purpose: Watches the 'raw_captures' folder, aggregates data from multiple
# #          files, creates new CSVs in multiples of 10 rows, and sends them
# #          to a remote webhook.


# import os
# import sys
# import time
# import shutil
# import threading
# import requests
# import pandas as pd


# # --- Configuration ---
# RAW_CAPTURE_DIR = "raw_captures"
# PROCESSED_BATCH_DIR = "processed_batches"
# ROWS_PER_BATCH_UNIT = 10  # Batches will have 10, 20, 30, etc. rows


# N8N_WEBHOOK_URL = "https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9"
# POLLING_INTERVAL_SECONDS = 0.5  # How often to check for new files
# FILE_COMPLETION_CHECK_TIME = 0.25 # Wait time to ensure a file is fully written


# stop_event = threading.Event()
# LAST_TIMESTAMP_FILE = 'last_live_timestamp.txt'


# # --- Helper Functions ---
# def send_file_webhook(file_path, webhook_url):
#     """Sends a file to the specified webhook URL."""
#     if not webhook_url:
#         print("[ERROR] Webhook URL is not configured.", file=sys.stderr)
#         return False
#     if not os.path.exists(file_path):
#         print(f"[WARN] File not found for sending: {file_path}", file=sys.stderr)
#         return False
#     try:
#         with open(file_path, 'rb') as f:
#             files = {'data0': (os.path.basename(file_path), f, 'text/csv')}
#             response = requests.post(webhook_url, files=files, timeout=60)
#             if 200 <= response.status_code < 300:
#                 print(f"[{time.strftime('%H:%M:%S')}] ✅  Sent batch '{os.path.basename(file_path)}'")
#                 return True
#             else:
#                 print(f"[{time.strftime('%H:%M:%S')}] ❌  Failed to send '{os.path.basename(file_path)}'. Status: {response.status_code}", file=sys.stderr)
#     except Exception as e:
#         print(f"[{time.strftime('%H:%M:%S')}] ❌  An unexpected error occurred during webhook send: {e}", file=sys.stderr)
#     return False


# def is_file_finished_writing(file_path):
#     """Checks if a file has stopped growing to prevent reading partial files."""
#     try:
#         initial_size = os.path.getsize(file_path)
#         if initial_size == 0: return False
#         time.sleep(FILE_COMPLETION_CHECK_TIME)
#         if not os.path.exists(file_path): return False # File might be deleted between checks
#         final_size = os.path.getsize(file_path)
#         return initial_size == final_size
#     except FileNotFoundError:
#         return False # File was deleted, so it's "finished" in a way
#     except Exception:
#         return False


# def read_last_timestamp(filename):
#     try:
#         with open(filename, 'r') as f:
#             return f.read().strip()
#     except FileNotFoundError:
#         return None

# def write_last_timestamp(filename, timestamp):
#     with open(filename, 'w') as f:
#         f.write(str(timestamp))


# # --- The Core Aggregator Logic ---
# def aggregate_and_send_task():
#     print(f"[{time.strftime('%H:%M:%S')}] 📡  Aggregator process started. Watching '{RAW_CAPTURE_DIR}'.")
   
#     data_buffer = pd.DataFrame()  # In-memory buffer to hold rows across files
#     processed_raw_files = set()  # Keeps track of files we've already ingested
#     batch_counter = 0
#     header = None
#     last_sent_timestamp = read_last_timestamp(LAST_TIMESTAMP_FILE)


#     while not stop_event.is_set():
#         # --- Stage 1: Ingest new raw files ---
#         try:
#             if os.path.exists(RAW_CAPTURE_DIR):
#                 raw_files = sorted([f for f in os.listdir(RAW_CAPTURE_DIR) if f.endswith('.csv') and f not in processed_raw_files])


#                 for raw_file in raw_files:
#                     path = os.path.join(RAW_CAPTURE_DIR, raw_file)
#                     if is_file_finished_writing(path):
#                         print(f"[{time.strftime('%H:%M:%S')}] 📥  Ingesting raw file: {raw_file}")
#                         try:
#                             new_data = pd.read_csv(path)
#                             if header is None and not new_data.empty:
#                                 header = new_data.columns.tolist() # Save header from the first non-empty file
                           
#                             if not new_data.empty:
#                                 data_buffer = pd.concat([data_buffer, new_data], ignore_index=True)
                           
#                             processed_raw_files.add(raw_file)
#                             os.remove(path) # Clean up the ingested raw file
#                         except Exception as e:
#                             print(f"[{time.strftime('%H:%M:%S')}] ❌  Error processing '{raw_file}': {e}. Skipping.", file=sys.stderr)
#                             processed_raw_files.add(raw_file) # Skip this file in the future


#         except Exception as e:
#             print(f"[{time.strftime('%H:%M:%S')}] Aggregator error during file scan: {e}", file=sys.stderr)


#         # --- Stage 2: Create and send batches from the buffer ---
#         if len(data_buffer) >= ROWS_PER_BATCH_UNIT:
#             rows_to_batch = (len(data_buffer) // ROWS_PER_BATCH_UNIT) * ROWS_PER_BATCH_UNIT
           
#             print(f"[{time.strftime('%H:%M:%S')}] ✨  Buffer has {len(data_buffer)} rows. Creating a batch of {rows_to_batch} rows.")
           
#             batch_to_send_df = data_buffer.iloc[:rows_to_batch]
#             # Filter by timestamp
#             if 'time' in batch_to_send_df.columns:
#                 if last_sent_timestamp:
#                     batch_to_send_df = batch_to_send_df[batch_to_send_df['time'] > last_sent_timestamp]
#             if batch_to_send_df.empty:
#                 time.sleep(POLLING_INTERVAL_SECONDS)
#                 continue
#             data_buffer = data_buffer.iloc[rows_to_batch:].reset_index(drop=True)
           
#             batch_counter += 1
#             batch_filepath = os.path.join(PROCESSED_BATCH_DIR, f"send_batch_{batch_counter}.csv")
#             batch_to_send_df.to_csv(batch_filepath, index=False, header=header)
           
#             if send_file_webhook(batch_filepath, N8N_WEBHOOK_URL):
#                 # Update last sent timestamp
#                 if 'time' in batch_to_send_df.columns:
#                     max_time = batch_to_send_df['time'].max()
#                     write_last_timestamp(LAST_TIMESTAMP_FILE, max_time)
#                 os.remove(batch_filepath)
           
#             print(f"[{time.strftime('%H:%M:%S')}] 📊  Buffer now has {len(data_buffer)} remaining rows.")


#         # This sleep prevents the script from using 100% CPU while waiting for new files
#         time.sleep(POLLING_INTERVAL_SECONDS)
           
#     print(f"[{time.strftime('%H:%M:%S')}] 🛑  Aggregator loop finished. {len(data_buffer)} rows remain in buffer.")


# # --- Main Execution ---
# if __name__ == "__main__":
#     print("======================================================")
#     print("=== SCRIPT 2: Stateful Aggregator and Batch Sender ===")
#     print("======================================================")
#     print(f"Watching:         '{RAW_CAPTURE_DIR}'")
#     print(f"Batch unit size:  {ROWS_PER_BATCH_UNIT} rows")
#     print("\nThis script will run continuously to process captured data.")
#     print("Press Ctrl+C in this terminal to stop the aggregator.")
#     print("------------------------------------------------------")
#     time.sleep(2)


#     # --- Directory Setup ---
#     # This script creates its own directories so it can run anywhere.
#     for directory in [RAW_CAPTURE_DIR, PROCESSED_BATCH_DIR]:
#         if not os.path.exists(directory):
#             print(f"Creating missing directory: '{directory}'")
#             os.makedirs(directory)
# # Do NOT delete or clean up RAW_CAPTURE_DIR here.
#     try:
#         aggregate_and_send_task()
#     except KeyboardInterrupt:
#         print(f"\n[{time.strftime('%H:%M:%S')}] ⏹️  Ctrl+C received. Shutting down aggregator...")
#     finally:
#         stop_event.set()
#         print(f"[{time.strftime('%H:%M:%S')}] ✅  Aggregator script has stopped.")



# # File: 2_aggregate_and_send.py
# # Purpose: Watches the 'raw_captures' folder, aggregates data from multiple
# #          files, creates new CSVs in multiples of 10 rows, and sends them
# #          to a remote webhook.


# # import os
# # import sys
# # import time
# # import shutil
# # import threading
# # import requests
# # import pandas as pd


# # # --- Configuration ---
# # RAW_CAPTURE_DIR = "raw_captures"
# # PROCESSED_BATCH_DIR = "processed_batches"
# # ROWS_PER_BATCH_UNIT = 10  # Batches will have 10, 20, 30, etc. rows


# # N8N_WEBHOOK_URL = "https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9"
# # POLLING_INTERVAL_SECONDS = 0.5  # How often to check for new files
# # FILE_COMPLETION_CHECK_TIME = 0.25 # Wait time to ensure a file is fully written


# # stop_event = threading.Event()
# # LAST_TIMESTAMP_FILE = 'last_live_timestamp.txt'


# # # --- Helper Functions ---
# # def send_file_webhook(file_path, webhook_url):
# #     """Sends a file to the specified webhook URL."""
# #     if not webhook_url:
# #         print("[ERROR] Webhook URL is not configured.", file=sys.stderr)
# #         return False
# #     if not os.path.exists(file_path):
# #         print(f"[WARN] File not found for sending: {file_path}", file=sys.stderr)
# #         return False
# #     try:
# #         with open(file_path, 'rb') as f:
# #             files = {'data0': (os.path.basename(file_path), f, 'text/csv')}
# #             response = requests.post(webhook_url, files=files, timeout=30)
# #             if 200 <= response.status_code < 300:
# #                 print(f"[{time.strftime('%H:%M:%S')}] ✅  Sent batch '{os.path.basename(file_path)}'")
# #                 return True
# #             else:
# #                 print(f"[{time.strftime('%H:%M:%S')}] ❌  Failed to send '{os.path.basename(file_path)}'. Status: {response.status_code}", file=sys.stderr)
# #     except Exception as e:
# #         print(f"[{time.strftime('%H:%M:%S')}] ❌  An unexpected error occurred during webhook send: {e}", file=sys.stderr)
# #     return False


# # def is_file_finished_writing(file_path):
# #     """Checks if a file has stopped growing to prevent reading partial files."""
# #     try:
# #         initial_size = os.path.getsize(file_path)
# #         if initial_size == 0: return False
# #         time.sleep(FILE_COMPLETION_CHECK_TIME)
# #         if not os.path.exists(file_path): return False # File might be deleted between checks
# #         final_size = os.path.getsize(file_path)
# #         return initial_size == final_size
# #     except FileNotFoundError:
# #         return False # File was deleted, so it's "finished" in a way
# #     except Exception:
# #         return False


# # def read_last_timestamp(filename):
# #     try:
# #         with open(filename, 'r') as f:
# #             return f.read().strip()
# #     except FileNotFoundError:
# #         return None

# # def write_last_timestamp(filename, timestamp):
# #     with open(filename, 'w') as f:
# #         f.write(str(timestamp))


# # # --- The Core Aggregator Logic ---
# # def aggregate_and_send_task():
# #     print(f"[{time.strftime('%H:%M:%S')}] 📡  Aggregator process started. Watching '{RAW_CAPTURE_DIR}'.")
   
# #     data_buffer = pd.DataFrame()  # In-memory buffer to hold rows across files
# #     processed_raw_files = set()  # Keeps track of files we've already ingested
# #     batch_counter = 0
# #     header = None
# #     last_sent_timestamp = read_last_timestamp(LAST_TIMESTAMP_FILE)


# #     while not stop_event.is_set():
# #         # --- Stage 1: Ingest new raw files ---
# #         try:
# #             if os.path.exists(RAW_CAPTURE_DIR):
# #                 raw_files = sorted([f for f in os.listdir(RAW_CAPTURE_DIR) if f.endswith('.csv') and f not in processed_raw_files])


# #                 for raw_file in raw_files:
# #                     path = os.path.join(RAW_CAPTURE_DIR, raw_file)
# #                     if is_file_finished_writing(path):
# #                         print(f"[{time.strftime('%H:%M:%S')}] 📥  Ingesting raw file: {raw_file}")
# #                         try:
# #                             new_data = pd.read_csv(path)
# #                             if header is None and not new_data.empty:
# #                                 header = new_data.columns.tolist() # Save header from the first non-empty file
                           
# #                             if not new_data.empty:
# #                                 data_buffer = pd.concat([data_buffer, new_data], ignore_index=True)
                           
# #                             processed_raw_files.add(raw_file)
# #                             os.remove(path) # Clean up the ingested raw file
# #                         except Exception as e:
# #                             print(f"[{time.strftime('%H:%M:%S')}] ❌  Error processing '{raw_file}': {e}. Skipping.", file=sys.stderr)
# #                             processed_raw_files.add(raw_file) # Skip this file in the future


# #         except Exception as e:
# #             print(f"[{time.strftime('%H:%M:%S')}] Aggregator error during file scan: {e}", file=sys.stderr)


# #         # --- Stage 2: Create and send batches from the buffer ---
# #         if len(data_buffer) >= ROWS_PER_BATCH_UNIT:
# #             rows_to_batch = (len(data_buffer) // ROWS_PER_BATCH_UNIT) * ROWS_PER_BATCH_UNIT
           
# #             print(f"[{time.strftime('%H:%M:%S')}] ✨  Buffer has {len(data_buffer)} rows. Creating a batch of {rows_to_batch} rows.")
           
# #             batch_to_send_df = data_buffer.iloc[:rows_to_batch]
# #             # Filter by timestamp
# #             if 'time' in batch_to_send_df.columns:
# #                 if last_sent_timestamp:
# #                     batch_to_send_df = batch_to_send_df[batch_to_send_df['time'] > last_sent_timestamp]
# #             if batch_to_send_df.empty:
# #                 time.sleep(POLLING_INTERVAL_SECONDS)
# #                 continue
# #             data_buffer = data_buffer.iloc[rows_to_batch:].reset_index(drop=True)
           
# #             batch_counter += 1
# #             batch_filepath = os.path.join(PROCESSED_BATCH_DIR, f"send_batch_{batch_counter}.csv")
# #             batch_to_send_df.to_csv(batch_filepath, index=False, header=header)
           
# #             if send_file_webhook(batch_filepath, N8N_WEBHOOK_URL):
# #                 # Update last sent timestamp
# #                 if 'time' in batch_to_send_df.columns:
# #                     max_time = batch_to_send_df['time'].max()
# #                     write_last_timestamp(LAST_TIMESTAMP_FILE, max_time)
# #                 os.remove(batch_filepath)
           
# #             print(f"[{time.strftime('%H:%M:%S')}] 📊  Buffer now has {len(data_buffer)} remaining rows.")


# #         # This sleep prevents the script from using 100% CPU while waiting for new files
# #         time.sleep(POLLING_INTERVAL_SECONDS)
           
# #     print(f"[{time.strftime('%H:%M:%S')}] 🛑  Aggregator loop finished. {len(data_buffer)} rows remain in buffer.")


# # # --- Main Execution ---
# # if __name__ == "__main__":
# #     print("======================================================")
# #     print("=== SCRIPT 2: Stateful Aggregator and Batch Sender ===")
# #     print("======================================================")
# #     print(f"Watching:         '{RAW_CAPTURE_DIR}'")
# #     print(f"Batch unit size:  {ROWS_PER_BATCH_UNIT} rows")
# #     print("\nThis script will run continuously to process captured data.")
# #     print("Press Ctrl+C in this terminal to stop the aggregator.")
# #     print("------------------------------------------------------")
# #     time.sleep(2)


# #     # --- Directory Setup ---
# #     # This script creates its own directories so it can run anywhere.
# #     for directory in [RAW_CAPTURE_DIR, PROCESSED_BATCH_DIR]:
# #         if not os.path.exists(directory):
# #             print(f"Creating missing directory: '{directory}'")
# #             os.makedirs(directory)
# # # Do NOT delete or clean up RAW_CAPTURE_DIR here.
# #     try:
# #         aggregate_and_send_task()
# #     except KeyboardInterrupt:
# #         print(f"\n[{time.strftime('%H:%M:%S')}] ⏹️  Ctrl+C received. Shutting down aggregator...")
# #     finally:
# #         stop_event.set()
# #         print(f"[{time.strftime('%H:%M:%S')}] ✅  Aggregator script has stopped.")



# File: 2_aggregate_and_send.py
# Purpose: Watches the 'raw_captures' folder, aggregates data from multiple
#          files, creates new CSVs in multiples of 10 rows, and sends them
#          to a remote webhook.


import os
import sys
import time
import shutil
import threading
import requests
import pandas as pd


# --- Configuration ---
RAW_CAPTURE_DIR = "raw_captures"
PROCESSED_BATCH_DIR = "processed_batches"
ROWS_PER_BATCH_UNIT = 10  # Batches will have 10, 20, 30, etc. rows


N8N_WEBHOOK_URL = "https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9"
POLLING_INTERVAL_SECONDS = 0.5  # How often to check for new files
FILE_COMPLETION_CHECK_TIME = 0.25 # Wait time to ensure a file is fully written


stop_event = threading.Event()
LAST_TIMESTAMP_FILE = 'last_live_timestamp.txt'


# --- Helper Functions ---
def send_file_webhook(file_path, webhook_url):
    """Sends a file to the specified webhook URL."""
    if not webhook_url:
        print("[ERROR] Webhook URL is not configured.", file=sys.stderr)
        return False
    if not os.path.exists(file_path):
        print(f"[WARN] File not found for sending: {file_path}", file=sys.stderr)
        return False
    try:
        with open(file_path, 'rb') as f:
            files = {'data0': (os.path.basename(file_path), f, 'text/csv')}
            response = requests.post(webhook_url, files=files, timeout=30)
            if 200 <= response.status_code < 300:
                print(f"[{time.strftime('%H:%M:%S')}] ✅  Sent batch '{os.path.basename(file_path)}'")
                return True
            else:
                print(f"[{time.strftime('%H:%M:%S')}] ❌  Failed to send '{os.path.basename(file_path)}'. Status: {response.status_code}", file=sys.stderr)
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] ❌  An unexpected error occurred during webhook send: {e}", file=sys.stderr)
    return False


def is_file_finished_writing(file_path):
    """Checks if a file has stopped growing to prevent reading partial files."""
    try:
        initial_size = os.path.getsize(file_path)
        if initial_size == 0: return False
        time.sleep(FILE_COMPLETION_CHECK_TIME)
        if not os.path.exists(file_path): return False # File might be deleted between checks
        final_size = os.path.getsize(file_path)
        return initial_size == final_size
    except FileNotFoundError:
        return False # File was deleted, so it's "finished" in a way
    except Exception:
        return False


def read_last_timestamp(filename):
    try:
        with open(filename, 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return None

def write_last_timestamp(filename, timestamp):
    with open(filename, 'w') as f:
        f.write(str(timestamp))


# --- The Core Aggregator Logic ---
def aggregate_and_send_task():
    print(f"[{time.strftime('%H:%M:%S')}] 📡  Aggregator process started. Watching '{RAW_CAPTURE_DIR}'.")
   
    data_buffer = pd.DataFrame()  # In-memory buffer to hold rows across files
    processed_raw_files = set()  # Keeps track of files we've already ingested
    batch_counter = 0
    header = None
    last_sent_timestamp = read_last_timestamp(LAST_TIMESTAMP_FILE)


    while not stop_event.is_set():
        # --- Stage 1: Ingest new raw files ---
        try:
            if os.path.exists(RAW_CAPTURE_DIR):
                raw_files = sorted([f for f in os.listdir(RAW_CAPTURE_DIR) if f.endswith('.csv') and f not in processed_raw_files])


                for raw_file in raw_files:
                    path = os.path.join(RAW_CAPTURE_DIR, raw_file)
                    if is_file_finished_writing(path):
                        print(f"[{time.strftime('%H:%M:%S')}] 📥  Ingesting raw file: {raw_file}")
                        try:
                            new_data = pd.read_csv(path)
                            if header is None and not new_data.empty:
                                header = new_data.columns.tolist() # Save header from the first non-empty file
                           
                            if not new_data.empty:
                                data_buffer = pd.concat([data_buffer, new_data], ignore_index=True)
                           
                            processed_raw_files.add(raw_file)
                            os.remove(path) # Clean up the ingested raw file
                        except Exception as e:
                            print(f"[{time.strftime('%H:%M:%S')}] ❌  Error processing '{raw_file}': {e}. Skipping.", file=sys.stderr)
                            processed_raw_files.add(raw_file) # Skip this file in the future


        except Exception as e:
            print(f"[{time.strftime('%H:%M:%S')}] Aggregator error during file scan: {e}", file=sys.stderr)


        # --- Stage 2: Create and send batches from the buffer ---
        if len(data_buffer) >= ROWS_PER_BATCH_UNIT:
            rows_to_batch = (len(data_buffer) // ROWS_PER_BATCH_UNIT) * ROWS_PER_BATCH_UNIT
           
            print(f"[{time.strftime('%H:%M:%S')}] ✨  Buffer has {len(data_buffer)} rows. Creating a batch of {rows_to_batch} rows.")
           
            batch_to_send_df = data_buffer.iloc[:rows_to_batch]
            # Filter by timestamp
            if 'time' in batch_to_send_df.columns:
                if last_sent_timestamp:
                    batch_to_send_df = batch_to_send_df[batch_to_send_df['time'] > last_sent_timestamp]
            if batch_to_send_df.empty:
                time.sleep(POLLING_INTERVAL_SECONDS)
                continue
            data_buffer = data_buffer.iloc[rows_to_batch:].reset_index(drop=True)
           
            batch_counter += 1
            batch_filepath = os.path.join(PROCESSED_BATCH_DIR, f"send_batch_{batch_counter}.csv")
            batch_to_send_df.to_csv(batch_filepath, index=False, header=header)
           
            if send_file_webhook(batch_filepath, N8N_WEBHOOK_URL):
                # Update last sent timestamp
                if 'time' in batch_to_send_df.columns:
                    max_time = batch_to_send_df['time'].max()
                    write_last_timestamp(LAST_TIMESTAMP_FILE, max_time)
                os.remove(batch_filepath)
           
            print(f"[{time.strftime('%H:%M:%S')}] 📊  Buffer now has {len(data_buffer)} remaining rows.")


        # This sleep prevents the script from using 100% CPU while waiting for new files
        time.sleep(POLLING_INTERVAL_SECONDS)
           
    print(f"[{time.strftime('%H:%M:%S')}] 🛑  Aggregator loop finished. {len(data_buffer)} rows remain in buffer.")


# --- Main Execution ---
if __name__ == "__main__":
    print("======================================================")
    print("=== SCRIPT 2: Stateful Aggregator and Batch Sender ===")
    print("======================================================")
    print(f"Watching:         '{RAW_CAPTURE_DIR}'")
    print(f"Batch unit size:  {ROWS_PER_BATCH_UNIT} rows")
    print("\nThis script will run continuously to process captured data.")
    print("Press Ctrl+C in this terminal to stop the aggregator.")
    print("------------------------------------------------------")
    time.sleep(2)


    # --- Directory Setup ---
    # This script creates its own directories so it can run anywhere.
    for directory in [RAW_CAPTURE_DIR, PROCESSED_BATCH_DIR]:
        if not os.path.exists(directory):
            print(f"Creating missing directory: '{directory}'")
            os.makedirs(directory)
# Do NOT delete or clean up RAW_CAPTURE_DIR here.
    try:
        aggregate_and_send_task()
    except KeyboardInterrupt:
        print(f"\n[{time.strftime('%H:%M:%S')}] ⏹️  Ctrl+C received. Shutting down aggregator...")
    finally:
        stop_event.set()
        print(f"[{time.strftime('%H:%M:%S')}] ✅  Aggregator script has stopped.")



