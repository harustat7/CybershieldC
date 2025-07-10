#!/usr/bin/env python3
"""
Standalone script to start the demo traffic API server
"""
import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    try:
        print("📦 Installing required packages...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ Packages installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install packages: {e}")
        return False

def start_server():
    """Start the demo traffic API server"""
    try:
        print("🚀 Starting Demo Traffic API server...")
        subprocess.run([sys.executable, 'demo_traffic_api.py'])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")

if __name__ == "__main__":
    print("🔧 CyberShield Demo Traffic API Setup")
    print("=" * 50)
    
    # Change to server directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Install requirements
    if install_requirements():
        # Start server
        start_server()
    else:
        print("❌ Setup failed. Please check the error messages above.")
        sys.exit(1)