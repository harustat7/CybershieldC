# # import requests
# # import time
# # import os
# # import pandas as pd
# # from datetime import datetime
# # import subprocess

# # LAST_TIMESTAMP_FILE = 'last_demo_timestamp.txt'

# # def read_last_timestamp(filename):
# #     try:
# #         with open(filename, 'r') as f:
# #             return f.read().strip()
# #     except FileNotFoundError:
# #         return None

# # def write_last_timestamp(filename, timestamp):
# #     with open(filename, 'w') as f:
# #         f.write(str(timestamp))

# # class CSVWebhookSender:
# #     def __init__(self, webhook_url="https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9"):
# #         self.webhook_url = webhook_url
# #         self.is_running = False
# #         self.csv_file_path = "complete_flow_features.csv"
        
# #     def check_csv_file(self):
# #         """Check if the CSV file exists"""
# #         if not os.path.exists(self.csv_file_path):
# #             print(f"❌ CSV file not found: {self.csv_file_path}")
# #             print("Please run the attack traffic generation script first to create the CSV file.")
# #             return False
# #         return True
    
# #     def get_csv_file_info(self):
# #         """Get CSV file information"""
# #         try:
# #             # Read the CSV file to get row count
# #             df = pd.read_csv(self.csv_file_path)
# #             file_size = os.path.getsize(self.csv_file_path)
            
# #             print(f"📊 CSV file info: {len(df)} rows, {len(df.columns)} columns, {file_size} bytes")
# #             return len(df), len(df.columns), file_size
# #         except Exception as e:
# #             print(f"❌ Error reading CSV file: {str(e)}")
# #             return 0, 0, 0
    
# #     def send_csv_file_to_webhook(self):
# #         """Generate a fresh CSV using attacktrafficgeneration.py, then send only new rows by time"""
# #         try:
# #             # Always generate a fresh CSV
# #             print('Generating fresh CSV using attacktrafficgeneration.py...')
# #             subprocess.run(['python', 'attacktrafficgeneration.py'], check=True)
# #             if not self.check_csv_file():
# #                 return False
# #             last_sent_timestamp = read_last_timestamp(LAST_TIMESTAMP_FILE)
# #             df = pd.read_csv(self.csv_file_path)
# #             if 'time' in df.columns:
# #                 if last_sent_timestamp:
# #                     df = df[df['time'] > last_sent_timestamp]
# #             if df.empty:
# #                 print('No new rows to send.')
# #                 return True
# #             file_size = os.path.getsize(self.csv_file_path)
# #             temp_path = 'temp_to_send.csv'
# #             df.to_csv(temp_path, index=False)
# #             with open(temp_path, 'rb') as csv_file:
# #                 files = {
# #                     'file': (
# #                         'complete_flow_features.csv',
# #                         csv_file,
# #                         'text/csv'
# #                     )
# #                 }
# #                 data = {
# #                     'timestamp': datetime.now().isoformat(),
# #                     'source': 'cybershield_attack_traffic_generator',
# #                     'row_count': str(len(df)),
# #                     'column_count': str(len(df.columns)),
# #                     'file_size': str(file_size),
# #                     'description': 'Complete flow features from attack traffic generation'
# #                 }
# #                 headers = {
# #                     'User-Agent': 'CyberShield-CSV-Sender/1.0'
# #                 }
# #                 print(f"📤 Sending CSV file to webhook: {self.webhook_url}")
# #                 response = requests.post(
# #                     self.webhook_url,
# #                     files=files,
# #                     data=data,
# #                     headers=headers,
# #                     timeout=60
# #                 )
# #                 if response.status_code == 200:
# #                     print(f"✅ CSV file sent successfully to n8n webhook")
# #                     print(f"📊 Uploaded: {self.csv_file_path}")
# #                     if 'time' in df.columns:
# #                         max_time = df['time'].max()
# #                         write_last_timestamp(LAST_TIMESTAMP_FILE, max_time)
# #                     return True
# #                 else:
# #                     print(f"❌ Failed to send CSV file: HTTP {response.status_code}")
# #                     print(f"Response: {response.text}")
# #                     return False
# #             os.remove(temp_path)
# #         except subprocess.CalledProcessError as e:
# #             print(f"❌ Error running attacktrafficgeneration.py: {e}")
# #             return False
# #         except requests.exceptions.RequestException as e:
# #             print(f"❌ Network error sending CSV file: {str(e)}")
# #             return False
# #         except Exception as e:
# #             print(f"❌ Unexpected error sending CSV file: {str(e)}")
# #             return False
    
# #     def send_csv_once(self):
# #         """Send the CSV file once to the webhook"""
# #         return self.send_csv_file_to_webhook()
    
# #     def start_periodic_sending(self, interval_seconds=30):
# #         """Start sending CSV file periodically"""
# #         if not self.check_csv_file():
# #             return False
        
# #         self.is_running = True
# #         print(f"🚀 Starting periodic CSV file sending every {interval_seconds} seconds")
# #         print(f"📡 Webhook URL: {self.webhook_url}")
        
# #         try:
# #             while self.is_running:
# #                 success = self.send_csv_file_to_webhook()
# #                 if success:
# #                     print(f"⏰ Next file upload in {interval_seconds} seconds...")
# #                 else:
# #                     print(f"⚠️  Failed to send file, retrying in {interval_seconds} seconds...")
                
# #                 # Wait for the specified interval
# #                 time.sleep(interval_seconds)
                
# #         except KeyboardInterrupt:
# #             print("\n🛑 Periodic file sending stopped by user")
# #         except Exception as e:
# #             print(f"❌ Error in periodic file sending: {str(e)}")
# #         finally:
# #             self.is_running = False
    
# #     def stop(self):
# #         """Stop periodic sending"""
# #         self.is_running = False
# #         print("🛑 Stopping CSV file sender...")

# # if __name__ == "__main__":
# #     import sys
    
# #     # Default webhook URL
# #     webhook_url = "https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9"
    
# #     # Check if webhook URL is provided as argument
# #     if len(sys.argv) > 1:
# #         webhook_url = sys.argv[1]
    
# #     sender = CSVWebhookSender(webhook_url)
    
# #     print("🔧 CyberShield CSV File Webhook Sender")
# #     print("=" * 50)
# #     print(f"📡 Webhook URL: {webhook_url}")
# #     print(f"📄 CSV File: {sender.csv_file_path}")
# #     print()
    
# #     # Check if user wants to send once or periodically
# #     mode = input("Send CSV file (o)nce or (p)eriodically? [o/p]: ").lower().strip()
    
# #     if mode == 'p':
# #         try:
# #             interval = int(input("Enter interval in seconds (default 30): ") or "30")
# #         except ValueError:
# #             interval = 30
        
# #         print(f"Starting periodic file sending every {interval} seconds...")
# #         sender.start_periodic_sending(interval)
# #     else:
# #         print("Sending CSV file once...")
# #         success = sender.send_csv_once()
# #         if success:
# #             print("✅ CSV file sent successfully!")
# #         else:
# #             print("❌ Failed to send CSV file")




# import requests
# import time
# import os
# import pandas as pd
# from datetime import datetime, timedelta
# import subprocess
# import tempfile

# LAST_TIMESTAMP_FILE = 'last_demo_timestamp.txt'

# def read_last_timestamp(filename):
#     try:
#         with open(filename, 'r') as f:
#             return f.read().strip()
#     except FileNotFoundError:
#         return None

# def write_last_timestamp(filename, timestamp):
#     with open(filename, 'w') as f:
#         f.write(str(timestamp))

# class CSVWebhookSender:
#     def __init__(self, webhook_url="https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9"):
#         self.webhook_url = webhook_url
#         self.is_running = False
#         self.csv_file_path = "complete_flow_features.csv"
#         self.batch_counter = 0
        
#     def check_csv_file(self):
#         """Check if the CSV file exists"""
#         if not os.path.exists(self.csv_file_path):
#             print(f"❌ CSV file not found: {self.csv_file_path}")
#             print("Please run the attack traffic generation script first to create the CSV file.")
#             return False
#         return True
    
#     def get_csv_file_info(self):
#         """Get CSV file information"""
#         try:
#             # Read the CSV file to get row count
#             df = pd.read_csv(self.csv_file_path)
#             file_size = os.path.getsize(self.csv_file_path)
            
#             print(f"📊 CSV file info: {len(df)} rows, {len(df.columns)} columns, {file_size} bytes")
#             return len(df), len(df.columns), file_size
#         except Exception as e:
#             print(f"❌ Error reading CSV file: {str(e)}")
#             return 0, 0, 0
    
#     def generate_live_traffic_batch(self, batch_size=100):
#         """Generate a live traffic batch and return the CSV file path"""
#         try:
#             # Import the function from attacktrafficgeneration
#             import sys
#             sys.path.append(os.path.dirname(os.path.abspath(__file__)))
#             from attacktrafficgeneration import generate_live_batch_csv
            
#             # Generate batch with unique filename
#             self.batch_counter += 1
#             batch_filename = f"live_batch_{self.batch_counter}_{int(time.time())}.csv"
            
#             # Generate live traffic batch
#             success = generate_live_batch_csv(batch_size, batch_filename)
            
#             if success and os.path.exists(batch_filename):
#                 print(f"✅ Generated live traffic batch: {batch_filename}")
#                 return batch_filename
#             else:
#                 print(f"❌ Failed to generate live traffic batch")
#                 return None
                
#         except Exception as e:
#             print(f"❌ Error generating live traffic batch: {str(e)}")
#             return None
    
#     def send_csv_file_to_webhook(self, csv_file_path):
#         """Send a specific CSV file to webhook"""
#         try:
#             if not os.path.exists(csv_file_path):
#                 print(f"❌ CSV file not found: {csv_file_path}")
#                 return False
            
#             # Read CSV to get row count
#             df = pd.read_csv(csv_file_path)
#             file_size = os.path.getsize(csv_file_path)
            
#             with open(csv_file_path, 'rb') as csv_file:
#                 files = {
#                     'file': (
#                         os.path.basename(csv_file_path),
#                         csv_file,
#                         'text/csv'
#                     )
#                 }
#                 data = {
#                     'timestamp': datetime.now().isoformat(),
#                     'source': 'cybershield_live_traffic_generator',
#                     'row_count': str(len(df)),
#                     'column_count': str(len(df.columns)),
#                     'file_size': str(file_size),
#                     'description': f'Live malicious traffic batch - {len(df)} flows',
#                     'batch_number': str(self.batch_counter),
#                     'packet_count': str(len(df) * 2)  # Approximate packet count
#                 }
#                 headers = {
#                     'User-Agent': 'CyberShield-Live-Traffic-Sender/1.0'
#                 }
#                 print(f"📤 Sending CSV file to webhook: {self.webhook_url}")
#                 print(f"📊 File: {os.path.basename(csv_file_path)} ({len(df)} rows)")
                
#                 response = requests.post(
#                     self.webhook_url,
#                     files=files,
#                     data=data,
#                     headers=headers,
#                     timeout=60
#                 )
                
#                 if response.status_code == 200:
#                     print(f"✅ CSV file sent successfully to n8n webhook")
#                     return True
#                 else:
#                     print(f"❌ Failed to send CSV file: HTTP {response.status_code}")
#                     print(f"Response: {response.text}")
#                     return False
                    
#         except requests.exceptions.RequestException as e:
#             print(f"❌ Network error sending CSV file: {str(e)}")
#             return False
#         except Exception as e:
#             print(f"❌ Unexpected error sending CSV file: {str(e)}")
#             return False
    
#     def send_live_traffic_batch(self):
#         """Generate and send a live traffic batch"""
#         try:
#             # Generate live traffic batch
#             batch_file = self.generate_live_traffic_batch(100)  # 100 packets per batch
            
#             if batch_file:
#                 # Send the batch to webhook
#                 success = self.send_csv_file_to_webhook(batch_file)
                
#                 # Clean up the batch file
#                 try:
#                     os.remove(batch_file)
#                     print(f"🧹 Cleaned up batch file: {batch_file}")
#                 except:
#                     pass
                
#                 return success
#             else:
#                 print("⚠️  Falling back to complete_flow_features.csv")
#                 return self.send_csv_file_to_webhook(self.csv_file_path)
                
#         except Exception as e:
#             print(f"❌ Error in send_live_traffic_batch: {str(e)}")
#             return False
    
#     def send_csv_file_to_webhook_legacy(self):
#         """Legacy method - send complete_flow_features.csv"""
#         try:
#             # Always generate a fresh CSV
#             print('Generating fresh CSV using attacktrafficgeneration.py...')
#             subprocess.run(['python', 'attacktrafficgeneration.py'], check=True)
#             if not self.check_csv_file():
#                 return False
#             last_sent_timestamp = read_last_timestamp(LAST_TIMESTAMP_FILE)
#             df = pd.read_csv(self.csv_file_path)
#             if 'timestamp' in df.columns:
#                 if last_sent_timestamp:
#                     # Convert timestamp column to datetime for comparison
#                     df['timestamp'] = pd.to_datetime(df['timestamp'])
#                     last_sent_dt = pd.to_datetime(last_sent_timestamp)
#                     df = df[df['timestamp'] > last_sent_dt]
#             if df.empty:
#                 print('No new rows to send.')
#                 return True
#             file_size = os.path.getsize(self.csv_file_path)
#             temp_path = 'temp_to_send.csv'
#             df.to_csv(temp_path, index=False)
#             with open(temp_path, 'rb') as csv_file:
#                 files = {
#                     'file': (
#                         'complete_flow_features.csv',
#                         csv_file,
#                         'text/csv'
#                     )
#                 }
#                 data = {
#                     'timestamp': datetime.now().isoformat(),
#                     'source': 'cybershield_attack_traffic_generator',
#                     'row_count': str(len(df)),
#                     'column_count': str(len(df.columns)),
#                     'file_size': str(file_size),
#                     'description': 'Complete flow features from attack traffic generation'
#                 }
#                 headers = {
#                     'User-Agent': 'CyberShield-CSV-Sender/1.0'
#                 }
#                 print(f"📤 Sending CSV file to webhook: {self.webhook_url}")
#                 response = requests.post(
#                     self.webhook_url,
#                     files=files,
#                     data=data,
#                     headers=headers,
#                     timeout=60
#                 )
#                 if response.status_code == 200:
#                     print(f"✅ CSV file sent successfully to n8n webhook")
#                     print(f"📊 Uploaded: {self.csv_file_path}")
#                     if 'timestamp' in df.columns:
#                         max_time = df['timestamp'].max()
#                         write_last_timestamp(LAST_TIMESTAMP_FILE, max_time.isoformat())
#                     return True
#                 else:
#                     print(f"❌ Failed to send CSV file: HTTP {response.status_code}")
#                     print(f"Response: {response.text}")
#                     return False
#             os.remove(temp_path)
#         except subprocess.CalledProcessError as e:
#             print(f"❌ Error running attacktrafficgeneration.py: {e}")
#             return False
#         except requests.exceptions.RequestException as e:
#             print(f"❌ Network error sending CSV file: {str(e)}")
#             return False
#         except Exception as e:
#             print(f"❌ Unexpected error sending CSV file: {str(e)}")
#             return False
    
#     def send_csv_once(self):
#         """Send a live traffic batch once to the webhook"""
#         return self.send_live_traffic_batch()
    
#     def start_periodic_sending(self, interval_seconds=30):
#         """Start sending live traffic batches periodically"""
#         if not self.check_csv_file():
#             return False
        
#         self.is_running = True
#         print(f"🚀 Starting periodic live traffic batch sending every {interval_seconds} seconds")
#         print(f"📡 Webhook URL: {self.webhook_url}")
#         print(f"📦 Batch size: 100 packets per CSV")
        
#         try:
#             while self.is_running:
#                 success = self.send_live_traffic_batch()
#                 if success:
#                     print(f"⏰ Next live traffic batch in {interval_seconds} seconds...")
#                 else:
#                     print(f"⚠️  Failed to send live traffic batch, retrying in {interval_seconds} seconds...")
                
#                 # Wait for the specified interval
#                 time.sleep(interval_seconds)
                
#         except KeyboardInterrupt:
#             print("\n🛑 Periodic live traffic sending stopped by user")
#         except Exception as e:
#             print(f"❌ Error in periodic live traffic sending: {str(e)}")
#         finally:
#             self.is_running = False
    
#     def stop(self):
#         """Stop periodic sending"""
#         self.is_running = False
#         print("🛑 Stopping live traffic sender...")

# if __name__ == "__main__":
#     import sys
    
#     # Default webhook URL
#     webhook_url = "https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9"
    
#     # Check if webhook URL is provided as argument
#     if len(sys.argv) > 1:
#         webhook_url = sys.argv[1]
    
#     sender = CSVWebhookSender(webhook_url)
    
#     print("🔧 CyberShield Live Traffic Batch Sender")
#     print("=" * 50)
#     print(f"📡 Webhook URL: {webhook_url}")
#     print(f"📄 Base CSV File: {sender.csv_file_path}")
#     print(f"📦 Batch Size: 100 packets per CSV")
#     print()
    
#     # Check if user wants to send once or periodically
#     mode = input("Send live traffic batch (o)nce or (p)eriodically? [o/p]: ").lower().strip()
    
#     if mode == 'p':
#         try:
#             interval = int(input("Enter interval in seconds (default 30): ") or "30")
#         except ValueError:
#             interval = 30
        
#         print(f"Starting periodic live traffic batch sending every {interval} seconds...")
#         sender.start_periodic_sending(interval)
#     else:
#         print("Sending live traffic batch once...")
#         success = sender.send_csv_once()
#         if success:
#             print("✅ Live traffic batch sent successfully!")
#         else:
#             print("❌ Failed to send live traffic batch")


import requests
import time
import os
import pandas as pd
from datetime import datetime, timedelta
import subprocess # Keep for potential other uses, but no longer for generating full CSV
import tempfile

# LAST_TIMESTAMP_FILE is less relevant now as we cycle through the whole file.
# Kept for compatibility but not actively used in the new logic.
LAST_TIMESTAMP_FILE = 'last_demo_timestamp.txt'

def read_last_timestamp(filename):
    try:
        with open(filename, 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return None

def write_last_timestamp(filename, timestamp):
    with open(filename, 'w') as f:
        f.write(str(timestamp))

class CSVWebhookSender:
    def __init__(self, webhook_url="https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9"):
        self.webhook_url = webhook_url
        self.is_running = False
        # IMPORTANT: Ensure this path is correct for your 'restructured_dataset.csv'
        self.csv_file_path = "D:\\vscode prgrms\\cybershield_14july\\CybershieldC\\server\\restructured_dataset.csv"
        self.batch_counter = 0 # Counter for the batches sent
        self.full_df = None # To store the entire CSV DataFrame
        self.current_row_index = 0 # To track the current position in the DataFrame
        self.load_full_csv() # Load the CSV once during initialization

    def load_full_csv(self):
        """Load the entire CSV into a DataFrame once."""
        if not os.path.exists(self.csv_file_path):
            print(f"❌ Error: CSV file not found at {self.csv_file_path}. Please ensure it exists.")
            return False
        try:
            self.full_df = pd.read_csv(self.csv_file_path)
            print(f"✅ Loaded {len(self.full_df)} rows from {self.csv_file_path}")
            return True
        except Exception as e:
            print(f"❌ Error loading CSV file: {str(e)}")
            return False

    def check_csv_file(self):
        """Check if the CSV file exists and has been loaded successfully."""
        return self.full_df is not None and not self.full_df.empty

    def get_csv_file_info(self):
        """Get CSV file information from the loaded DataFrame"""
        if self.full_df is not None:
            file_size = os.path.getsize(self.csv_file_path) # Still get size from disk for original file
            print(f"📊 CSV file info: {len(self.full_df)} total rows, {len(self.full_df.columns)} columns, {file_size} bytes (original file)")
            return len(self.full_df), len(self.full_df.columns), file_size
        return 0, 0, 0 # No file loaded

    def get_next_batch_df(self, batch_size=100):
        """
        Retrieves the next batch of rows from the loaded DataFrame.
        Cycles back to the beginning if the end is reached.
        """
        if not self.check_csv_file():
            print("❌ Cannot get batch: CSV not loaded or empty.")
            return None

        total_rows = len(self.full_df)
        if total_rows == 0:
            print("⚠️  CSV is empty, no batches to send.")
            return None

        # Calculate end index for the current batch
        end_index = self.current_row_index + batch_size

        # If current_row_index is at the end or beyond, reset to 0
        if self.current_row_index >= total_rows:
            self.current_row_index = 0
            print(f"🔄 Reached end of CSV. Cycling back to the start (row 0).")
            # Recalculate end_index for the new cycle
            end_index = self.current_row_index + batch_size

        # Get the batch
        batch_df = self.full_df.iloc[self.current_row_index:end_index]

        # Update the index for the next call
        # If we went past the end of the file in this batch, the next start will be 0 after reset
        self.current_row_index = end_index

        return batch_df

    def send_df_batch_to_webhook(self, batch_df):
        """Send a DataFrame batch to webhook."""
        if batch_df.empty:
            print("⚠️  Attempted to send an empty batch DataFrame.")
            return False

        # --- START OF MODIFICATION 1: Update 'timestamp' column ---
        current_iso_timestamp = datetime.now().isoformat()
        if 'timestamp' in batch_df.columns:
            batch_df['timestamp'] = current_iso_timestamp
            print(f"🕒 Modified 'timestamp' column in batch rows to: {current_iso_timestamp}")
        else:
            batch_df['timestamp'] = current_iso_timestamp
            print(f"⚠️  'timestamp' column not found, adding it to batch with value: {current_iso_timestamp}")
        # --- END OF MODIFICATION 1 ---

        # Create a temporary file for the batch CSV
        temp_path = f"batch_{self.batch_counter}_{int(time.time())}.csv"
        try:
            batch_df.to_csv(temp_path, index=False)
            file_size = os.path.getsize(temp_path)

            with open(temp_path, 'rb') as csv_file:
                files = {
                    'file': (
                        "data0", # --- MODIFICATION 2: Set filename for webhook to "data0" ---
                        csv_file,
                        'text/csv'
                    )
                }
                data = {
                    'timestamp': datetime.now().isoformat(), # This timestamp is for metadata, not the file content
                    'source': 'cybershield_existing_csv_sender',
                    'row_count': str(len(batch_df)),
                    'column_count': str(len(batch_df.columns)),
                    'file_size': str(file_size),
                    'description': f'Batch from existing CSV - {len(batch_df)} flows, Batch #{self.batch_counter}',
                    'batch_number': str(self.batch_counter),
                    'packet_count': str(len(batch_df) * 2)  # Approximate packet count
                }
                headers = {
                    'User-Agent': 'CyberShield-Existing-CSV-Sender/1.0'
                }
                print(f"📤 Sending batch CSV to webhook: {self.webhook_url}")
                # Clarified print message to show local temp filename and webhook filename
                print(f"📊 File: {os.path.basename(temp_path)} ({len(batch_df)} rows) -- sent as 'data0'")

                response = requests.post(
                    self.webhook_url,
                    files=files,
                    data=data,
                    headers=headers,
                    timeout=60
                )

                if response.status_code == 200:
                    print(f"✅ CSV batch sent successfully to n8n webhook")
                    return True
                else:
                    print(f"❌ Failed to send CSV batch: HTTP {response.status_code}")
                    print(f"Response: {response.text}")
                    return False

        except requests.exceptions.RequestException as e:
            print(f"❌ Network error sending CSV batch: {str(e)}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error sending CSV batch: {str(e)}")
            return False
        finally:
            # Clean up the temporary batch file
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                    print(f"🧹 Cleaned up temporary batch file: {temp_path}")
                except Exception as e:
                    print(f"⚠️  Could not remove temporary file {temp_path}: {e}")

    def send_next_batch(self, batch_size=100):
        """Get the next batch from the loaded CSV and send it."""
        if not self.check_csv_file():
            print("❌ Cannot send batch: CSV not loaded.")
            return False

        self.batch_counter += 1
        batch_df = self.get_next_batch_df(batch_size)

        if batch_df is None or batch_df.empty:
            print("⚠️  No rows to send in this batch (CSV might be empty or internal error).")
            # If the CSV is empty, we should stop sending.
            if len(self.full_df) == 0:
                self.is_running = False # Stop if source is empty
            return True # Consider it successful if there's nothing *to* send in this iteration

        return self.send_df_batch_to_webhook(batch_df)

    def send_csv_once(self):
        """Send one batch from the existing CSV."""
        return self.send_next_batch(batch_size=100) # Send a single batch

    def start_periodic_sending(self, interval_seconds=30, batch_size=100):
        """Start sending existing CSV rows in batches periodically."""
        if not self.check_csv_file():
            print("🛑 Cannot start periodic sending: CSV file not found or could not be loaded.")
            return False

        self.is_running = True
        print(f"🚀 Starting periodic sending of existing CSV data every {interval_seconds} seconds")
        print(f"📡 Webhook URL: {self.webhook_url}")
        print(f"📦 Batch size: {batch_size} rows per CSV batch")
        print(f"🔄 CSV will cycle through {len(self.full_df)} total rows.")

        try:
            while self.is_running:
                success = self.send_next_batch(batch_size)
                if success:
                    print(f"⏰ Next batch in {interval_seconds} seconds...")
                else:
                    print(f"⚠️  Failed to send batch, retrying in {interval_seconds} seconds...")

                # Wait for the specified interval
                time.sleep(interval_seconds)

        except KeyboardInterrupt:
            print("\n🛑 Periodic sending stopped by user (KeyboardInterrupt).")
        except Exception as e:
            print(f"❌ Error in periodic sending: {str(e)}")
        finally:
            self.is_running = False

    def stop(self):
        """Stop periodic sending"""
        self.is_running = False
        print("🛑 Stopping existing CSV sender...")

if __name__ == "__main__":
    import sys

    # Default webhook URL
    webhook_url = "https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9"


    # Check if webhook URL is provided as argument
    if len(sys.argv) > 1:
        webhook_url = sys.argv[1]

    sender = CSVWebhookSender(webhook_url)

    print("🔧 CyberShield Existing CSV Batch Sender")
    print("=" * 50)
    print(f"📡 Webhook URL: {webhook_url}")
    print(f"📄 Source CSV File: {sender.csv_file_path}")
    print(f"📦 Default Batch Size: 100 rows per CSV batch")
    print()

    if not sender.check_csv_file():
        print("🔴 Cannot proceed: Source CSV file not found or empty. Please ensure 'restructured_dataset.csv' exists at the specified path.")
    else:
        # Check if user wants to send once or periodically
        mode = input("Send existing CSV batch (o)nce or (p)eriodically? [o/p]: ").lower().strip()

        if mode == 'p':
            try:
                interval = int(input("Enter interval in seconds (default 30): ") or "30")
                batch_size = int(input("Enter batch size in rows (default 100): ") or "100")
            except ValueError:
                interval = 30
                batch_size = 100

            print(f"Starting periodic existing CSV batch sending every {interval} seconds with batch size {batch_size}...")
            sender.start_periodic_sending(interval, batch_size)
        else:
            print("Sending existing CSV batch once...")
            success = sender.send_csv_once()
            if success:
                print("✅ Existing CSV batch sent successfully!")
            else:
                print("❌ Failed to send existing CSV batch")