# CyberShield - AI-Powered Cybersecurity Dashboard

A comprehensive cybersecurity monitoring dashboard with AI-powered threat detection and real-time network traffic analysis.

## Features

- **Real-time Traffic Monitoring**: Live network packet analysis with demo and live traffic modes
- **AI Attack Detection**: Machine learning-powered threat detection with confidence scoring
- **Attack History Logs**: Comprehensive security incident timeline
- **User Authentication**: Secure login with OTP verification
- **Attack Traffic Generation**: Python-based attack traffic generation with CSV export to n8n webhooks

## Architecture

### Frontend (React + TypeScript)
- Modern React application with TypeScript
- Tailwind CSS for styling
- Real-time data visualization
- Supabase authentication integration

### Backend Services
1. **Node.js API** (Port 3001): ML training and packet flagging
2. **Python CSV Webhook API** (Port 3002): Attack traffic generation and n8n integration
3. **Supabase**: Authentication and user management

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Supabase account (for authentication)

### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase credentials to .env

# Start development server
npm run dev
```

### 2. Node.js Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start the ML training API
npm start
```

### 3. Python CSV Webhook API Setup
```bash
# Navigate to server directory
cd server

# Install Python dependencies and start API
python start_csv_api.py
```

This will:
- Install required Python packages (requests, pandas, flask, flask-cors, scapy)
- Start the CSV webhook API on port 3002
- Check for the `complete_flow_features.csv` file

### 4. Generate Attack Traffic Data
```bash
# In the server directory, run the attack traffic generation script
cd server
python attacktrafficgeneration.py
```

This creates the `complete_flow_features.csv` file with comprehensive flow features from simulated attack traffic.

### 5. n8n Webhook Setup (Optional)
Set up an n8n workflow with a webhook trigger:
- Webhook URL: `https://metasage-ai.app.n8n.cloud/webhook-test/79975fb8-b60c-4261-a447-77ab1df4d99c`
- Method: POST
- The webhook will receive CSV data with complete flow features

## Attack Traffic Generation

The system uses your provided `attacktrafficgeneration.py` script which generates:

### Attack Types
- **APT Attacks**: Initial Compromise, Reconnaissance, Lateral Movement, Pivoting, Data Exfiltration
- **DDoS Attacks**: SYN Flood, UDP Flood, UDP-lag
- **Normal Traffic**: Legitimate network activity

### Flow Features (80+ features)
The generated CSV includes comprehensive flow features:
- Basic packet information (IPs, ports, protocols, timestamps)
- Flow statistics (duration, packet counts, byte counts)
- Timing features (inter-arrival times, flow rates)
- TCP flag counts and connection states
- Statistical measures (mean, std, min, max, variance)
- Advanced flow characteristics for ML analysis

### CSV Data Structure
Each flow record contains features like:
```csv
src_ip,dst_ip,flow_id,timestamp,src_port,dst_port,protocol,flow_duration,tot_fwd_pkts,tot_bwd_pkts,totlen_fwd_pkts,totlen_bwd_pkts,fwd_pkt_len_max,fwd_pkt_len_min,fwd_pkt_len_mean,fwd_pkt_len_std,bwd_pkt_len_max,bwd_pkt_len_min,bwd_pkt_len_mean,bwd_pkt_len_std,flow_byts_s,flow_pkts_s,fwd_psh_flags,bwd_psh_flags,fwd_urg_flags,bwd_urg_flags,fin_flag_cnt,syn_flag_cnt,rst_flag_cnt,psh_flag_cnt,ack_flag_cnt,urg_flag_cnt,pkt_len_min,pkt_len_max,pkt_len_mean,pkt_len_std,pkt_len_var,pkt_size_avg,down_up_ratio,flow_iat_mean,flow_iat_std,flow_iat_max,flow_iat_min,fwd_iat_tot,fwd_iat_mean,fwd_iat_std,fwd_iat_max,fwd_iat_min,bwd_iat_tot,bwd_iat_mean,bwd_iat_std,bwd_iat_max,bwd_iat_min,fwd_header_len,bwd_header_len,fwd_pkts_s,bwd_pkts_s,fwd_seg_size_avg,bwd_seg_size_avg,fwd_seg_size_min,init_fwd_win_byts,init_bwd_win_byts,fwd_byts_b_avg,fwd_pkts_b_avg,fwd_blk_rate_avg,bwd_byts_b_avg,bwd_pkts_b_avg,bwd_blk_rate_avg,subflow_fwd_pkts,subflow_fwd_byts,subflow_bwd_pkts,subflow_bwd_byts,fwd_act_data_pkts,cwe_flag_count,ece_flag_cnt,active_mean,active_std,active_max,active_min,idle_mean,idle_std,idle_max,idle_min
```

## API Endpoints

### Node.js API (Port 3001)
- `POST /api/flag-packet`: Flag packets for ML training
- `PUT /api/flag-packet/:id`: Update packet flags
- `GET /api/flagged-packets`: Get all flagged packets
- `GET /api/model-stats`: Get ML model statistics

### Python CSV Webhook API (Port 3002)
- `POST /api/demo-traffic/start`: Start periodic CSV sending to webhook
- `POST /api/demo-traffic/stop`: Stop CSV sending
- `GET /api/demo-traffic/status`: Get current status
- `POST /api/demo-traffic/send-once`: Send CSV file once to webhook
- `POST /api/generate-traffic`: Generate new attack traffic CSV
- `GET /api/health`: Health check

## Usage

1. **Start all services**: Frontend (5173), Node.js API (3001), Python API (3002)
2. **Generate attack traffic**: Run `python attacktrafficgeneration.py` to create the CSV file
3. **Login**: Use the authentication system with OTP verification
4. **Configure n8n webhook**: Set the webhook URL in the Live Traffic Monitor
5. **Send CSV data**: 
   - Click "Send Once" to send the CSV file immediately
   - Click "Start" under Demo to begin periodic CSV sending (every 10 seconds)
6. **Monitor packets**: View real-time packet analysis in the dashboard
7. **Flag attacks**: Use the dropdown to flag packets for ML training

## Development

### File Structure
```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── services/           # API services
├── types/              # TypeScript types
└── utils/              # Utility functions

server/
├── index.js                    # Node.js ML training API
├── attacktrafficgeneration.py # Your attack traffic generation script
├── csv_webhook_sender.py      # CSV webhook sender class
├── updated_demo_api.py        # Python Flask API
└── start_csv_api.py           # Python setup script
```

### Key Technologies
- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, Python, Flask
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OTP
- **Real-time**: Custom hooks with mock data simulation
- **Attack Generation**: Python with Scapy for packet simulation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details