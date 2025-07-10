import requests
import time
import os
import pandas as pd
from datetime import datetime
import subprocess

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
        self.csv_file_path = "complete_flow_features.csv"
        
    def check_csv_file(self):
        """Check if the CSV file exists"""
        if not os.path.exists(self.csv_file_path):
            print(f"❌ CSV file not found: {self.csv_file_path}")
            print("Please run the attack traffic generation script first to create the CSV file.")
            return False
        return True
    
    def get_csv_file_info(self):
        """Get CSV file information"""
        try:
            # Read the CSV file to get row count
            df = pd.read_csv(self.csv_file_path)
            file_size = os.path.getsize(self.csv_file_path)
            
            print(f"📊 CSV file info: {len(df)} rows, {len(df.columns)} columns, {file_size} bytes")
            return len(df), len(df.columns), file_size
        except Exception as e:
            print(f"❌ Error reading CSV file: {str(e)}")
            return 0, 0, 0
    
    def send_csv_file_to_webhook(self):
        """Generate a fresh CSV using attacktrafficgeneration.py, then send only new rows by time"""
        try:
            # Always generate a fresh CSV
            print('Generating fresh CSV using attacktrafficgeneration.py...')
            subprocess.run(['python', 'attacktrafficgeneration.py'], check=True)
            if not self.check_csv_file():
                return False
            last_sent_timestamp = read_last_timestamp(LAST_TIMESTAMP_FILE)
            df = pd.read_csv(self.csv_file_path)
            if 'time' in df.columns:
                if last_sent_timestamp:
                    df = df[df['time'] > last_sent_timestamp]
            if df.empty:
                print('No new rows to send.')
                return True
            file_size = os.path.getsize(self.csv_file_path)
            temp_path = 'temp_to_send.csv'
            df.to_csv(temp_path, index=False)
            with open(temp_path, 'rb') as csv_file:
                files = {
                    'file': (
                        'complete_flow_features.csv',
                        csv_file,
                        'text/csv'
                    )
                }
                data = {
                    'timestamp': datetime.now().isoformat(),
                    'source': 'cybershield_attack_traffic_generator',
                    'row_count': str(len(df)),
                    'column_count': str(len(df.columns)),
                    'file_size': str(file_size),
                    'description': 'Complete flow features from attack traffic generation'
                }
                headers = {
                    'User-Agent': 'CyberShield-CSV-Sender/1.0'
                }
                print(f"📤 Sending CSV file to webhook: {self.webhook_url}")
                response = requests.post(
                    self.webhook_url,
                    files=files,
                    data=data,
                    headers=headers,
                    timeout=60
                )
                if response.status_code == 200:
                    print(f"✅ CSV file sent successfully to n8n webhook")
                    print(f"📊 Uploaded: {self.csv_file_path}")
                    if 'time' in df.columns:
                        max_time = df['time'].max()
                        write_last_timestamp(LAST_TIMESTAMP_FILE, max_time)
                    return True
                else:
                    print(f"❌ Failed to send CSV file: HTTP {response.status_code}")
                    print(f"Response: {response.text}")
                    return False
            os.remove(temp_path)
        except subprocess.CalledProcessError as e:
            print(f"❌ Error running attacktrafficgeneration.py: {e}")
            return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error sending CSV file: {str(e)}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error sending CSV file: {str(e)}")
            return False
    
    def send_csv_once(self):
        """Send the CSV file once to the webhook"""
        return self.send_csv_file_to_webhook()
    
    def start_periodic_sending(self, interval_seconds=30):
        """Start sending CSV file periodically"""
        if not self.check_csv_file():
            return False
        
        self.is_running = True
        print(f"🚀 Starting periodic CSV file sending every {interval_seconds} seconds")
        print(f"📡 Webhook URL: {self.webhook_url}")
        
        try:
            while self.is_running:
                success = self.send_csv_file_to_webhook()
                if success:
                    print(f"⏰ Next file upload in {interval_seconds} seconds...")
                else:
                    print(f"⚠️  Failed to send file, retrying in {interval_seconds} seconds...")
                
                # Wait for the specified interval
                time.sleep(interval_seconds)
                
        except KeyboardInterrupt:
            print("\n🛑 Periodic file sending stopped by user")
        except Exception as e:
            print(f"❌ Error in periodic file sending: {str(e)}")
        finally:
            self.is_running = False
    
    def stop(self):
        """Stop periodic sending"""
        self.is_running = False
        print("🛑 Stopping CSV file sender...")

if __name__ == "__main__":
    import sys
    
    # Default webhook URL
    webhook_url = "https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9"
    
    # Check if webhook URL is provided as argument
    if len(sys.argv) > 1:
        webhook_url = sys.argv[1]
    
    sender = CSVWebhookSender(webhook_url)
    
    print("🔧 CyberShield CSV File Webhook Sender")
    print("=" * 50)
    print(f"📡 Webhook URL: {webhook_url}")
    print(f"📄 CSV File: {sender.csv_file_path}")
    print()
    
    # Check if user wants to send once or periodically
    mode = input("Send CSV file (o)nce or (p)eriodically? [o/p]: ").lower().strip()
    
    if mode == 'p':
        try:
            interval = int(input("Enter interval in seconds (default 30): ") or "30")
        except ValueError:
            interval = 30
        
        print(f"Starting periodic file sending every {interval} seconds...")
        sender.start_periodic_sending(interval)
    else:
        print("Sending CSV file once...")
        success = sender.send_csv_once()
        if success:
            print("✅ CSV file sent successfully!")
        else:
            print("❌ Failed to send CSV file")