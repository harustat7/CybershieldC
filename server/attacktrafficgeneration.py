# final script
from scapy.all import IP, TCP, UDP, DNS, DNSQR, Raw
import random
import hashlib
import time
import statistics
import pandas as pd
from collections import defaultdict

# -------------------- Helper Functions --------------------
def safe_mean(x): return round(statistics.mean(x), 6) if x else 0
def safe_std(x): return round(statistics.stdev(x), 6) if len(x) > 1 else 0
def safe_min(x): return round(min(x), 6) if x else 0
def safe_max(x): return round(max(x), 6) if x else 0
def safe_var(x): return round(statistics.variance(x), 6) if len(x) > 1 else 0

# -------------------- Generate Synthetic Packets --------------------
packets = []

start = time.time()
def ts(): return round(start + random.uniform(0.001, 2), 6)

# Initial Compromise
for _ in range(50):
    pkt = IP(src="10.0.0.1", dst="192.168.1.10") / TCP(sport=random.randint(1024, 65535), dport=80, flags="S")
    pkt.time = ts()
    packets.append(pkt)

# Reconnaissance
for port in range(20, 30):
    pkt = IP(src="10.0.0.2", dst="192.168.1.11") / TCP(sport=random.randint(1024, 65535), dport=port, flags="S")
    pkt.time = ts()
    packets.append(pkt)

# Lateral Movement
for _ in range(30):
    for dport in [445, 3389]:
        pkt = IP(src="10.0.0.3", dst="192.168.1.12") / TCP(sport=random.randint(1024, 65535), dport=dport, flags="S")
        pkt.time = ts()
        packets.append(pkt)

# Pivoting
for dst_ip in ["192.168.1.13", "192.168.1.14", "192.168.1.15"]:
    pkt = IP(src="10.0.0.4", dst=dst_ip) / TCP(sport=random.randint(1024, 65535), dport=22, flags="S")
    pkt.time = ts()
    packets.append(pkt)

# Data Exfiltration
for _ in range(20):
    pkt = IP(src="10.0.0.5", dst="192.168.1.16") / UDP(sport=random.randint(1024, 65535), dport=53) / Raw("X"*1400)
    pkt.time = ts()
    packets.append(pkt)

# SYN Flood
for _ in range(100):
    pkt = IP(src=f"10.0.1.{random.randint(1, 254)}", dst="192.168.1.20") / TCP(sport=random.randint(1024, 65535), dport=80, flags="S")
    pkt.time = ts()
    packets.append(pkt)

# UDP Flood
for _ in range(100):
    pkt = IP(src=f"10.0.2.{random.randint(1, 254)}", dst="192.168.1.20") / UDP(sport=random.randint(1024, 65535), dport=123) / Raw("X"*800)
    pkt.time = ts()
    packets.append(pkt)

# UDP-lag
for _ in range(100):
    pkt = IP(src=f"10.0.3.{random.randint(1, 254)}", dst="192.168.1.20") / UDP(sport=random.randint(1024, 65535), dport=random.randint(1000, 65535)) / Raw("X"*10)
    pkt.time = ts()
    packets.append(pkt)

# -------------------- Group Packets by Flow --------------------
flows = defaultdict(list)

for pkt in packets:
    if IP not in pkt:
        continue
    proto = "TCP" if TCP in pkt else "UDP" if UDP in pkt else "OTHER"
    key = (pkt[IP].src, pkt[IP].dst, pkt.sport if TCP in pkt or UDP in pkt else 0, pkt.dport if TCP in pkt or UDP in pkt else 0, proto)
    flows[key].append(pkt)

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
    duration = times[-1] - times[0] if len(times) > 1 else 0.001
    total_bytes = sum(lengths)
    total_pkts = len(pkts)

    # TCP flag counters
    flags = {'FIN': 0, 'SYN': 0, 'RST': 0, 'PSH': 0, 'ACK': 0, 'URG': 0}
    for p in pkts:
        if TCP in p:
            f = p[TCP].flags
            flags['FIN'] += int("F" in f)
            flags['SYN'] += int("S" in f)
            flags['RST'] += int("R" in f)
            flags['PSH'] += int("P" in f)
            flags['ACK'] += int("A" in f)
            flags['URG'] += int("U" in f)

    return {
        "timestamp": round(times[0], 6),
        "src_port": pkts[0].sport,
        "dst_port": pkts[0].dport,
        "protocol": pkts[0].proto,
        "flow_duration": round(duration, 6),
        "tot_fwd_pkts": len(fwd_pkts),
        "tot_bwd_pkts": len(bwd_pkts),
        "totlen_fwd_pkts": sum(fwd_len),
        "totlen_bwd_pkts": sum(bwd_len),
        "fwd_pkt_len_max": safe_max(fwd_len),
        "fwd_pkt_len_min": safe_min(fwd_len),
        "fwd_pkt_len_mean": safe_mean(fwd_len),
        "fwd_pkt_len_std": safe_std(fwd_len),
        "bwd_pkt_len_max": safe_max(bwd_len),
        "bwd_pkt_len_min": safe_min(bwd_len),
        "bwd_pkt_len_mean": safe_mean(bwd_len),
        "bwd_pkt_len_std": safe_std(bwd_len),
        "flow_byts_s": round(total_bytes/duration, 6),
        "flow_pkts_s": round(total_pkts/duration, 6),
        "fwd_psh_flags": flags['PSH'],
        "bwd_psh_flags": 0,
        "fwd_urg_flags": flags['URG'],
        "bwd_urg_flags": 0,
        "fin_flag_cnt": flags['FIN'],
        "syn_flag_cnt": flags['SYN'],
        "rst_flag_cnt": flags['RST'],
        "psh_flag_cnt": flags['PSH'],
        "ack_flag_cnt": flags['ACK'],
        "urg_flag_cnt": flags['URG'],
        "pkt_len_min": safe_min(lengths),
        "pkt_len_max": safe_max(lengths),
        "pkt_len_mean": safe_mean(lengths),
        "pkt_len_std": safe_std(lengths),
        "pkt_len_var": safe_var(lengths),
        "pkt_size_avg": round(total_bytes/total_pkts, 6),
        "down_up_ratio": round(sum(bwd_len)/sum(fwd_len), 6) if sum(fwd_len) > 0 else 0,
        "flow_iat_mean": safe_mean(iat_all),
        "flow_iat_std": safe_std(iat_all),
        "flow_iat_max": safe_max(iat_all),
        "flow_iat_min": safe_min(iat_all),
        "fwd_iat_tot": round(sum(iat_fwd), 6),
        "fwd_iat_mean": safe_mean(iat_fwd),
        "fwd_iat_std": safe_std(iat_fwd),
        "fwd_iat_max": safe_max(iat_fwd),
        "fwd_iat_min": safe_min(iat_fwd),
        "bwd_iat_tot": round(sum(iat_bwd), 6),
        "bwd_iat_mean": safe_mean(iat_bwd),
        "bwd_iat_std": safe_std(iat_bwd),
        "bwd_iat_max": safe_max(iat_bwd),
        "bwd_iat_min": safe_min(iat_bwd),
        "fwd_header_len": sum((p[TCP].dataofs or 0) * 4 for p in fwd_pkts if TCP in p),
        "bwd_header_len": sum((p[TCP].dataofs or 0) * 4 for p in bwd_pkts if TCP in p),
        "fwd_pkts_s": round(len(fwd_pkts)/duration, 6),
        "bwd_pkts_s": round(len(bwd_pkts)/duration, 6),
        "fwd_seg_size_avg": safe_mean(fwd_len),
        "bwd_seg_size_avg": safe_mean(bwd_len),
        "fwd_seg_size_min": safe_min(fwd_len),
        "init_fwd_win_byts": random.randint(1000, 20000),
        "init_bwd_win_byts": random.randint(1000, 20000),
        "fwd_byts_b_avg": safe_mean(fwd_len),
        "fwd_pkts_b_avg": len(fwd_pkts),
        "fwd_blk_rate_avg": round(len(fwd_pkts)/duration, 6),
        "bwd_byts_b_avg": safe_mean(bwd_len),
        "bwd_pkts_b_avg": len(bwd_pkts),
        "bwd_blk_rate_avg": round(len(bwd_pkts)/duration, 6),
        "subflow_fwd_pkts": len(fwd_pkts),
        "subflow_fwd_byts": sum(fwd_len),
        "subflow_bwd_pkts": len(bwd_pkts),
        "subflow_bwd_byts": sum(bwd_len),
        "fwd_act_data_pkts": len([p for p in fwd_pkts if Raw in p]),
        "cwe_flag_count": 0,
        "ece_flag_cnt": 0,
        "active_mean": safe_mean(iat_all),
        "active_std": safe_std(iat_all),
        "active_max": safe_max(iat_all),
        "active_min": safe_min(iat_all),
        "idle_mean": 0,
        "idle_std": 0,
        "idle_max": 0,
        "idle_min": 0
    }

# -------------------- Extract and Save to CSV --------------------


def compute_flow_id(src_ip, dst_ip, src_port, dst_port, proto):
    flow_str = f"{src_ip}-{dst_ip}-{src_port}-{dst_port}-{proto}"
    return hashlib.md5(flow_str.encode()).hexdigest()

records = []
for flow_key, pkts in flows.items():
    src_ip, dst_ip, src_port, dst_port, proto = flow_key
    base_features = extract_features(pkts)
    if base_features:  # Only append valid flows
        base_features["src_ip"] = src_ip
        base_features["dst_ip"] = dst_ip
        base_features["flow_id"] = compute_flow_id(src_ip, dst_ip, src_port, dst_port, proto)
        records.append(base_features)

# Reorder columns to put src_ip, dst_ip, flow_id first
df = pd.DataFrame(records)
cols = ['src_ip', 'dst_ip', 'flow_id'] + [col for col in df.columns if col not in ['src_ip', 'dst_ip', 'flow_id']]
df = df[cols]

df.to_csv("complete_flow_features.csv", index=False)
print("✅ Saved to complete_flow_features.csv")

