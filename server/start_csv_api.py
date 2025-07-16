#!/usr/bin/env python3
"""
Standalone script to start the CSV webhook API server
"""
import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    try:
        print("📦 Installing required packages...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'updated_requirements.txt'])
        print("✅ Packages installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install packages: {e}")
        return False

def check_csv_file():
    """Check if CSV file exists"""
    csv_file = 'restructured_dataset.csv'
    if os.path.exists(csv_file):
        print(f"✅ Found CSV file: {csv_file}")
        return True
    else:
        print(f"⚠️  CSV file not found: {csv_file}")
        print("You can generate it by running: python attacktrafficgeneration.py")
        return False

def start_server():
    """Start the CSV webhook API server"""
    try:
        print("🚀 Starting CSV Webhook API server...")
        subprocess.run([sys.executable, 'updated_demo_api.py'])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")

if __name__ == "__main__":
    print("🔧 CyberShield CSV Webhook API Setup")
    print("=" * 50)
    
    # Change to server directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Install requirements
    if install_requirements():
        # Check CSV file
        check_csv_file()
        
        # Start server
        start_server()
    else:
        print("❌ Setup failed. Please check the error messages above.")
        sys.exit(1)