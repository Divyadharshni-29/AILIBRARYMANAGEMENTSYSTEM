import os
import sys
import socket
import ipaddress
import subprocess
import threading
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


def get_lan_ip():
    """Detect the active private IPv4 address for local Wi-Fi / Ethernet."""
    # Method 1: Connect to outside socket to find default route interface
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        if ip and not ip.startswith("127."):
            return ip
    except Exception:
        pass

    # Method 2: Hostname resolution fallback
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127."):
                try:
                    ip_obj = ipaddress.ip_address(ip)
                    if ip_obj.is_private:
                        return ip
                except Exception:
                    pass
    except Exception:
        pass

    return "127.0.0.1"


def print_startup_banner(lan_ip, frontend_port=5173, backend_port=8000):
    print("\n" + "=" * 65)
    print(" 🏫 AI COLLEGE LIBRARY MANAGEMENT SYSTEM - LAN SERVER")
    print("=" * 65)
    print(f"\n💻 Frontend - Local (Your Computer):")
    print(f"   http://localhost:{frontend_port}")
    print(f"\n📱 Frontend - LAN (Friend's Phone / Laptop on Same Wi-Fi):")
    print(f"   http://{lan_ip}:{frontend_port}")
    print(f"\n⚡ Backend API - LAN:")
    print(f"   http://{lan_ip}:{backend_port}")
    print(f"   API Documentation: http://{lan_ip}:{backend_port}/docs")
    print("=" * 65)
    print("📱 HOW TO CONNECT FROM FRIEND'S PHONE/LAPTOP:")
    print(f" 1. Connect their device to the SAME Wi-Fi as this computer.")
    print(f" 2. Open Chrome/Safari and enter:")
    print(f"    http://{lan_ip}:{frontend_port}")
    print(f" 3. Keep this computer and terminal running.")
    print("=" * 65 + "\n")


def start_backend(host="0.0.0.0", port=8000):
    import uvicorn
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=True)


if __name__ == "__main__":
    lan_ip = get_lan_ip()
    print_startup_banner(lan_ip, frontend_port=5173, backend_port=8000)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--info":
        sys.exit(0)

    # Start FastAPI with Uvicorn bound to 0.0.0.0
    start_backend(host="0.0.0.0", port=8000)
