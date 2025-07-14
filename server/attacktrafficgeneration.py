# final script - MODIFIED TO INCREASE APT ROWS
from scapy.all import IP, TCP, UDP, DNS, DNSQR, Raw
import random
import hashlib
import time
import statistics
import pandas as pd
from collections import defaultdict
from datetime import datetime, timedelta

# -------------------- Helper Functions --------------------
def safe_mean(x): return round(statistics.mean(x), 6) if x else 0
def safe_std(x): return round(statistics.stdev(x), 6) if len(x) > 1 else 0
def safe_min(x): return round(min(x), 6) if x else 0
def safe_max(x): return round(max(x), 6) if x else 0
def safe_var(x): return round(statistics.variance(x), 6) if len(x) > 1 else 0

# -------------------- Generate Live Traffic Function --------------------
def generate_live_traffic_batch(batch_size=100):
    """Generate a single batch of live malicious traffic"""
    packets = []
    start_time = datetime.now()
    
    def ts(): 
        """Generate ISO formatted timestamp"""
        return start_time + timedelta(seconds=random.uniform(0.001, 2))
    
    # Calculate how many packets to generate for each attack type
    apt_packets = batch_size // 2  # 50 packets for APT
    ddos_packets = batch_size // 2  # 50 packets for DDoS
    
    # --- APT ATTACKS (50 packets) ---
    apt_attacks = [
        # Initial Compromise
        ("apt_initial_compromise", lambda: IP(src="10.0.0.1", dst="192.168.1.10") / TCP(sport=random.randint(1024, 65535), dport=80, flags="S")),
        # Reconnaissance
        ("apt_reconnaissance", lambda: IP(src="10.0.0.2", dst="192.168.1.11") / TCP(sport=random.randint(1024, 65535), dport=random.randint(20, 1000), flags="S")),
        # Lateral Movement
        ("apt_lateral_movement", lambda: IP(src="10.0.0.3", dst=f"192.168.1.{random.randint(12, 20)}") / TCP(sport=random.randint(1024, 65535), dport=random.choice([445, 3389, 22]), flags="S")),
        # Pivoting
        ("apt_pivoting", lambda: IP(src="10.0.0.4", dst=f"192.168.2.{random.randint(1, 50)}") / TCP(sport=random.randint(1024, 65535), dport=22, flags="S")),
        # Data Exfiltration
        ("apt_data_exfiltration", lambda: IP(src="10.0.0.5", dst="192.168.1.50") / UDP(sport=random.randint(1024, 65535), dport=53) / Raw("X"*1400))
    ]
    
    # Generate APT packets with labels
    for _ in range(apt_packets):
        attack_label, attack_func = random.choice(apt_attacks)
        pkt = attack_func()
        pkt.time = ts()
        pkt.attack_label = attack_label  # Add attack label to packet
        packets.append(pkt)
    
    # --- DDoS ATTACKS (50 packets) ---
    VICTIM_IP = "192.168.1.100"
    
    ddos_attacks = [
        # SYN Flood
        ("ddos_syn_flood", lambda: IP(src=f"10.0.1.{random.randint(1, 254)}", dst=VICTIM_IP) / TCP(sport=random.randint(1024, 65535), dport=80, flags="S")),
        # DNS Amplification
        ("ddos_dns_amplification", lambda: IP(src=VICTIM_IP, dst=f"8.8.{random.randint(1,254)}.{random.randint(1,254)}") / UDP(sport=random.randint(1024, 65535), dport=53) / DNS(rd=1, qd=DNSQR(qname="example.com"))),
        # NTP Amplification
        ("ddos_ntp_amplification", lambda: IP(src=VICTIM_IP, dst=f"129.6.{random.randint(1,254)}.{random.randint(1,254)}") / UDP(sport=random.randint(1024, 65535), dport=123) / Raw("X"*48)),
        # MSSQL Amplification
        ("ddos_mssql_amplification", lambda: IP(src=VICTIM_IP, dst=f"198.51.{random.randint(1,254)}.{random.randint(1,254)}") / UDP(sport=random.randint(1024, 65535), dport=1434) / Raw(b'\x02')),
        # SSDP Amplification
        ("ddos_ssdp_amplification", lambda: IP(src=VICTIM_IP, dst=f"203.0.113.{random.randint(1,254)}") / UDP(sport=random.randint(1024, 65535), dport=1900) / Raw("M-SEARCH * HTTP/1.1\r\nHost:239.255.255.250:1900\r\nST:ssdp:all\r\n\r\n"))
    ]
    
    # Generate DDoS packets with labels
    for _ in range(ddos_packets):
        attack_label, attack_func = random.choice(ddos_attacks)
        pkt = attack_func()
        pkt.time = ts()
        pkt.attack_label = attack_label  # Add attack label to packet
        packets.append(pkt)
    
    return packets

# -------------------- Generate Full Dataset (for initial setup) --------------------
def generate_full_dataset():
    """Generate the complete dataset for initial setup"""
    packets = []
    start_time = datetime.now()
    
    def ts(): 
        """Generate ISO formatted timestamp"""
        return start_time + timedelta(seconds=random.uniform(0.001, 2))

    # --- APT ATTACKS (MODIFIED TO GENERATE MORE ROWS) ---

    # Initial Compromise (10 Flows)
    # Simulating 10 separate compromise sessions, each creating a unique flow.
    for _ in range(10):
        initial_compromise_sport = random.randint(1024, 65535)
        for _ in range(5): # Fewer packets per session, but more sessions
            pkt = IP(src="10.0.0.1", dst="192.168.1.10") / TCP(sport=initial_compromise_sport, dport=80, flags="S")
            pkt.time = ts()
            pkt.attack_label = "apt_initial_compromise"
            packets.append(pkt)

    # Reconnaissance (40 Flows)
    # Expanded port scan from 10 ports to 40 ports.
    for port in range(20, 60):
        pkt = IP(src="10.0.0.2", dst="192.168.1.11") / TCP(sport=random.randint(1024, 65535), dport=port, flags="S")
        pkt.time = ts()
        pkt.attack_label = "apt_reconnaissance"
        packets.append(pkt)

    # Lateral Movement (10 Flows)
    # Simulating movement to 2 services (445, 3389) on 5 different internal machines.
    internal_ips = [f"192.168.1.{i}" for i in range(12, 17)] # IPs .12, .13, .14, .15, .16
    for internal_ip in internal_ips:
        for dport in [445, 3389]:
            for _ in range(5): # 5 packets for each session
                pkt = IP(src="10.0.0.3", dst=internal_ip) / TCP(sport=random.randint(1024, 65535), dport=dport, flags="S")
                pkt.time = ts()
                pkt.attack_label = "apt_lateral_movement"
                packets.append(pkt)

    # Pivoting (15 Flows)
    # Increased the number of pivoted targets from 3 to 15.
    dst_ips = [f"192.168.2.{i}" for i in range(1, 16)] # IPs 192.168.2.1 to .15
    for dst_ip in dst_ips:
        pkt = IP(src="10.0.0.4", dst=dst_ip) / TCP(sport=random.randint(1024, 65535), dport=22, flags="S")
        pkt.time = ts()
        pkt.attack_label = "apt_pivoting"
        packets.append(pkt)

    # Data Exfiltration (2 Flows)
    # Simulating 2 separate data exfiltration sessions.
    for _ in range(2):
        data_exfil_sport = random.randint(1024, 65535)
        for _ in range(20): # 20 packets per session
            pkt = IP(src="10.0.0.5", dst="192.168.1.50") / UDP(sport=data_exfil_sport, dport=53) / Raw("X"*1400)
            pkt.time = ts()
            pkt.attack_label = "apt_data_exfiltration"
            packets.append(pkt)

    # --- DoS / DRDoS ATTACKS (UNCHANGED AS REQUESTED) ---
    # Total DoS flows to generate: 100+60+50+40+33 = 283.
    # Grand Total Flows: 77 (APT) + 283 (DoS) = 360 (multiple of 10)
    VICTIM_IP = "192.168.1.100"

    # dos-Syn (SYN Flood) - 100 flows
    for _ in range(100):
        pkt = IP(src=f"10.0.1.{random.randint(1, 254)}", dst=VICTIM_IP) / TCP(sport=random.randint(1024, 65535), dport=80, flags="S")
        pkt.time = ts()
        pkt.attack_label = "ddos_syn_flood"
        packets.append(pkt)

    # DrDoS_DNS - 60 flows
    for _ in range(60):
        reflector_dns_server = f"8.8.{random.randint(1,254)}.{random.randint(1,254)}"
        pkt = IP(src=VICTIM_IP, dst=reflector_dns_server) / UDP(sport=random.randint(1024, 65535), dport=53) / DNS(rd=1, qd=DNSQR(qname="example.com"))
        pkt.time = ts()
        pkt.attack_label = "ddos_dns_amplification"
        packets.append(pkt)

    # DrDoS_NTP - 50 flows
    for _ in range(50):
        reflector_ntp_server = f"129.6.{random.randint(1,254)}.{random.randint(1,254)}"
        pkt = IP(src=VICTIM_IP, dst=reflector_ntp_server) / UDP(sport=random.randint(1024, 65535), dport=123) / Raw("X"*48)
        pkt.time = ts()
        pkt.attack_label = "ddos_ntp_amplification"
        packets.append(pkt)

    # DrDoS_MSSQL - 40 flows
    for _ in range(40):
        reflector_mssql_server = f"198.51.{random.randint(1,254)}.{random.randint(1,254)}"
        pkt = IP(src=VICTIM_IP, dst=reflector_mssql_server) / UDP(sport=random.randint(1024, 65535), dport=1434) / Raw(b'\x02')
        pkt.time = ts()
        pkt.attack_label = "ddos_mssql_amplification"
        packets.append(pkt)

    # DrDoS_SSDP - 33 flows
    for _ in range(33):
        reflector_ssdp_device = f"203.0.113.{random.randint(1,254)}"
        pkt = IP(src=VICTIM_IP, dst=reflector_ssdp_device) / UDP(sport=random.randint(1024, 65535), dport=1900) / Raw("M-SEARCH * HTTP/1.1\r\nHost:239.255.255.250:1900\r\nST:ssdp:all\r\n\r\n")
        pkt.time = ts()
        pkt.attack_label = "ddos_ssdp_amplification"
        packets.append(pkt)

    return packets

# -------------------- Group Packets by Flow --------------------
def group_packets_by_flow(packets):
    flows = defaultdict(list)
    
    for pkt in packets:
        if IP not in pkt:
            continue
        
        if TCP in pkt:
            proto_num = 6
            sport = pkt[TCP].sport
            dport = pkt[TCP].dport
        elif UDP in pkt:
            proto_num = 17
            sport = pkt[UDP].sport
            dport = pkt[UDP].dport
        else:
            proto_num = pkt[IP].proto
            sport = 0
            dport = 0
        
        key = (pkt[IP].src, pkt[IP].dst, sport, dport, proto_num)
        flows[key].append(pkt)
    
    return flows

# -------------------- Feature Extraction Function --------------------
def extract_features(pkts):
    if not pkts:
        return {}

    pkts.sort(key=lambda x: x.time)
    src = pkts[0][IP].src
    fwd_pkts, bwd_pkts = [], []
    fwd_len, bwd_len = [], []
    fwd_times, bwd_times = [], []
    lengths = [len(p) for p in pkts]
    times = [p.time for p in pkts]
    
    if TCP in pkts[0]:
        proto_num = 6
        sport = pkts[0][TCP].sport
        dport = pkts[0][TCP].dport
    elif UDP in pkts[0]:
        proto_num = 17
        sport = pkts[0][UDP].sport
        dport = pkts[0][UDP].dport
    else:
        proto_num = pkts[0][IP].proto
        sport = 0
        dport = 0

    for p in pkts:
        l = len(p)
        t = p.time
        if p[IP].src == src:
            fwd_pkts.append(p)
            fwd_len.append(l)
            fwd_times.append(t)
        else:
            bwd_pkts.append(p)
            bwd_len.append(l)
            bwd_times.append(t)

    iat_all = [t2 - t1 for t1, t2 in zip(times[:-1], times[1:])]
    iat_fwd = [t2 - t1 for t1, t2 in zip(fwd_times[:-1], fwd_times[1:])]
    iat_bwd = [t2 - t1 for t1, t2 in zip(bwd_times[:-1], bwd_times[1:])]
    duration = (times[-1] - times[0]).total_seconds() if len(times) > 1 else 1e-6
    total_bytes = sum(lengths)
    total_pkts = len(pkts)

    flags = {'FIN': 0, 'SYN': 0, 'RST': 0, 'PSH': 0, 'ACK': 0, 'URG': 0}
    for p in pkts:
        if TCP in p:
            f = p[TCP].flags
            if f:
                flags['FIN'] += int("F" in str(f))
                flags['SYN'] += int("S" in str(f))
                flags['RST'] += int("R" in str(f))
                flags['PSH'] += int("P" in str(f))
                flags['ACK'] += int("A" in str(f))
                flags['URG'] += int("U" in str(f))

    return {
        "timestamp": times[0].isoformat(), "src_port": sport, "dst_port": dport, "protocol": proto_num,
        "flow_duration": round(duration * 1_000_000), "tot_fwd_pkts": len(fwd_pkts), "tot_bwd_pkts": len(bwd_pkts),
        "totlen_fwd_pkts": sum(fwd_len), "totlen_bwd_pkts": sum(bwd_len), "fwd_pkt_len_max": safe_max(fwd_len),
        "fwd_pkt_len_min": safe_min(fwd_len), "fwd_pkt_len_mean": safe_mean(fwd_len), "fwd_pkt_len_std": safe_std(fwd_len),
        "bwd_pkt_len_max": safe_max(bwd_len), "bwd_pkt_len_min": safe_min(bwd_len), "bwd_pkt_len_mean": safe_mean(bwd_len),
        "bwd_pkt_len_std": safe_std(bwd_len), "flow_byts_s": round(total_bytes/duration, 6) if duration > 0 else 0,
        "flow_pkts_s": round(total_pkts/duration, 6) if duration > 0 else 0, "fwd_psh_flags": flags['PSH'],
        "bwd_psh_flags": 0, "fwd_urg_flags": flags['URG'], "bwd_urg_flags": 0, "fin_flag_cnt": flags['FIN'],
        "syn_flag_cnt": flags['SYN'], "rst_flag_cnt": flags['RST'], "psh_flag_cnt": flags['PSH'], "ack_flag_cnt": flags['ACK'],
        "urg_flag_cnt": flags['URG'], "pkt_len_min": safe_min(lengths), "pkt_len_max": safe_max(lengths),
        "pkt_len_mean": safe_mean(lengths), "pkt_len_std": safe_std(lengths), "pkt_len_var": safe_var(lengths),
        "pkt_size_avg": safe_mean(lengths), "down_up_ratio": round(len(bwd_pkts)/len(fwd_pkts), 6) if len(fwd_pkts) > 0 else 0,
        "flow_iat_mean": safe_mean(iat_all), "flow_iat_std": safe_std(iat_all), "flow_iat_max": safe_max(iat_all),
        "flow_iat_min": safe_min(iat_all), "fwd_iat_tot": round(sum(iat_fwd), 6), "fwd_iat_mean": safe_mean(iat_fwd),
        "fwd_iat_std": safe_std(iat_fwd), "fwd_iat_max": safe_max(iat_fwd), "fwd_iat_min": safe_min(iat_fwd),
        "bwd_iat_tot": round(sum(iat_bwd), 6), "bwd_iat_mean": safe_mean(iat_bwd), "bwd_iat_std": safe_std(iat_bwd),
        "bwd_iat_max": safe_max(iat_bwd), "bwd_iat_min": safe_min(iat_bwd),
        "fwd_header_len": sum((p[TCP].dataofs or 0) * 4 for p in fwd_pkts if TCP in p),
        "bwd_header_len": sum((p[TCP].dataofs or 0) * 4 for p in bwd_pkts if TCP in p),
        "fwd_pkts_s": round(len(fwd_pkts)/duration, 6) if duration > 0 else 0,
        "bwd_pkts_s": round(len(bwd_pkts)/duration, 6) if duration > 0 else 0,
        "fwd_seg_size_avg": safe_mean(fwd_len), "bwd_seg_size_avg": safe_mean(bwd_len), "fwd_seg_size_min": safe_min(fwd_len),
        "init_fwd_win_byts": sum(p[TCP].window for p in fwd_pkts if TCP in p and p[TCP].flags.S) or 0,
        "init_bwd_win_byts": sum(p[TCP].window for p in bwd_pkts if TCP in p and p[TCP].flags.S) or 0,
        "fwd_byts_b_avg": safe_mean(fwd_len), "fwd_pkts_b_avg": len(fwd_pkts),
        "fwd_blk_rate_avg": round(len(fwd_pkts)/duration, 6) if duration > 0 else 0,
        "bwd_byts_b_avg": safe_mean(bwd_len), "bwd_pkts_b_avg": len(bwd_pkts),
        "bwd_blk_rate_avg": round(len(bwd_pkts)/duration, 6) if duration > 0 else 0,
        "subflow_fwd_pkts": len(fwd_pkts), "subflow_fwd_byts": sum(fwd_len), "subflow_bwd_pkts": len(bwd_pkts),
        "subflow_bwd_byts": sum(bwd_len),
        "fwd_act_data_pkts": len([p for p in fwd_pkts if Raw in p and len(p[Raw].load) > 0]),
        "cwe_flag_count": 0, "ece_flag_cnt": 0, "active_mean": 0, "active_std": 0, "active_max": 0,
        "active_min": 0, "idle_mean": 0, "idle_std": 0, "idle_max": 0, "idle_min": 0
    }

# -------------------- Extract and Save to CSV --------------------
def compute_flow_id(src_ip, dst_ip, src_port, dst_port, proto):
    flow_str = f"{src_ip}-{dst_ip}-{src_port}-{dst_port}-{proto}"
    return hashlib.md5(flow_str.encode()).hexdigest()

def process_packets_to_csv(packets, output_file="complete_flow_features.csv"):
    """Process packets and save to CSV"""
    flows = group_packets_by_flow(packets)
    
    records = []
    for flow_key, pkts in flows.items():
        src_ip, dst_ip, src_port, dport, proto = flow_key
        base_features = extract_features(pkts)
        if base_features:
            base_features["src_ip"] = src_ip
            base_features["dst_ip"] = dst_ip
            base_features["flow_id"] = compute_flow_id(src_ip, dst_ip, src_port, dport, proto)
            
            # Add attack label - use the most common label in the flow
            attack_labels = [p.attack_label for p in pkts if hasattr(p, 'attack_label')]
            if attack_labels:
                # Get the most common attack label in this flow
                from collections import Counter
                label_counts = Counter(attack_labels)
                most_common_label = label_counts.most_common(1)[0][0]
                base_features["attack_label"] = most_common_label
            else:
                base_features["attack_label"] = "unknown"
            
            records.append(base_features)

    df = pd.DataFrame(records)
    if not df.empty:
        # Ensure attack_label is included in the columns
        cols = ['flow_id', 'src_ip', 'src_port', 'dst_ip', 'dst_port', 'protocol', 'timestamp', 'attack_label'] + [col for col in df.columns if col not in ['flow_id', 'src_ip', 'src_port', 'dst_ip', 'dst_port', 'protocol', 'timestamp', 'attack_label']]
        df = df[cols]
        df.to_csv(output_file, index=False)
        print(f"✅ Saved {len(df)} rows to {output_file}")
        
        # Print attack label distribution
        if 'attack_label' in df.columns:
            label_counts = df['attack_label'].value_counts()
            print("📊 Attack Label Distribution:")
            for label, count in label_counts.items():
                print(f"   {label}: {count} flows")
        
        return True
    else:
        print(f"❌ No valid flows found to save")
        return False

def generate_live_batch_csv(batch_size=100, output_file="live_batch.csv"):
    """Generate a live batch of traffic and save to CSV"""
    print(f"🔄 Generating live traffic batch with {batch_size} packets...")
    packets = generate_live_traffic_batch(batch_size)
    return process_packets_to_csv(packets, output_file)

# -------------------- Main Execution --------------------
if __name__ == "__main__":
    print("🔧 CyberShield Attack Traffic Generator")
    print("=" * 50)
    
    # Generate full dataset for initial setup
    print("📊 Generating full attack traffic dataset...")
    packets = generate_full_dataset()
    process_packets_to_csv(packets, "complete_flow_features.csv")
    
    print("✅ Attack traffic generation complete!")
