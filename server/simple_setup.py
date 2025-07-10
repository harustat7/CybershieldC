#!/usr/bin/env python3
"""
Simplified setup script that works in WebContainer environment
"""

import sys
import os

def check_python_version():
    """Check Python version compatibility"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("Error: Python 3.8 or higher required")
        sys.exit(1)
    print(f"✓ Python version: {version.major}.{version.minor}.{version.micro}")

def check_dependencies():
    """Check if required dependencies are available"""
    print("Checking dependencies...")
    
    required_modules = [
        ('pandas', 'pandas'),
        ('numpy', 'numpy'),
        ('scapy', 'scapy.all'),
    ]
    
    missing_modules = []
    
    for module_name, import_name in required_modules:
        try:
            __import__(import_name)
            print(f"✓ {module_name} is available")
        except ImportError:
            print(f"✗ {module_name} is missing")
            missing_modules.append(module_name)
    
    if missing_modules:
        print(f"\nMissing modules: {', '.join(missing_modules)}")
        print("Please install them using:")
        print(f"pip install {' '.join(missing_modules)}")
        return False
    
    return True

def check_permissions():
    """Check if we have necessary permissions"""
    print("Checking permissions...")
    
    # Check if running as root (ideal for packet capture)
    if os.geteuid() == 0:
        print("✓ Running as root - full packet capture capabilities available")
    else:
        print("⚠ Not running as root - some packet capture features may be limited")
        print("  For full functionality, run with: sudo python enhanced_live_traffic_capture.py")
    
    return True

def main():
    """Main setup function"""
    print("Traffic Capture Environment Check")
    print("="*40)
    
    # Check Python version
    check_python_version()
    
    # Check dependencies
    deps_ok = check_dependencies()
    
    # Check permissions
    perms_ok = check_permissions()
    
    print("\n" + "="*40)
    if deps_ok and perms_ok:
        print("✓ Environment check completed successfully!")
        print("="*40)
        print("\nYou can now run the traffic capture tool:")
        print("python enhanced_live_traffic_capture.py")
        if os.geteuid() != 0:
            print("\nFor full functionality, run as root:")
            print("sudo python enhanced_live_traffic_capture.py")
    else:
        print("✗ Environment check failed!")
        print("Please resolve the issues above before running the traffic capture tool.")
        sys.exit(1)

if __name__ == "__main__":
    main()