import socket
import ipaddress

def get_lan_ips():
    lan_ips = []
    # Method 1: Connect to outside router/DNS to find default route interface
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        primary_ip = s.getsockname()[0]
        s.close()
        if primary_ip and not primary_ip.startswith("127."):
            lan_ips.append(primary_ip)
    except Exception:
        pass

    # Method 2: Scan all host interface addresses
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127.") and ip not in lan_ips:
                try:
                    ip_obj = ipaddress.ip_address(ip)
                    if ip_obj.is_private:
                        lan_ips.append(ip)
                except Exception:
                    pass
    except Exception:
        pass

    return lan_ips or ["127.0.0.1"]

if __name__ == "__main__":
    ips = get_lan_ips()
    print("Primary LAN IP:", ips[0])
    print("All Private IPs:", ips)
