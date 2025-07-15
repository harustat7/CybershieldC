# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import os
# import subprocess
# import threading
# import time
# from csv_webhook_sender import CSVWebhookSender

# app = Flask(__name__)
# CORS(app, origins=["http://localhost:5173"])

# # Global variables to track the senders
# csv_sender = None
# sender_thread = None
# live_capture = None

# @app.route('/api/demo-traffic/start', methods=['POST'])
# def start_demo_traffic():
#     """Start demo traffic generation and CSV file sending"""
#     global csv_sender, sender_thread
    
#     try:
#         data = request.get_json() or {}
#         webhook_url = data.get('webhook_url', 'https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9')
        
#         # Check if already running
#         if csv_sender and csv_sender.is_running:
#             return jsonify({
#                 'success': False,
#                 'message': 'Demo traffic is already running',
#                 'status': 'already_running'
#             }), 400
        
#         # Create CSV sender instance
#         csv_sender = CSVWebhookSender(webhook_url)
        
#         # Check if CSV file exists
#         if not csv_sender.check_csv_file():
#             return jsonify({
#                 'success': False,
#                 'message': 'CSV file not found. Please run the attack traffic generation script first.',
#                 'status': 'csv_not_found'
#             }), 400
        
#         # Start sending CSV file in a separate thread
#         def send_csv_file_periodically():
#             csv_sender.start_periodic_sending(interval_seconds=10)  # Send every 10 seconds
        
#         sender_thread = threading.Thread(target=send_csv_file_periodically, daemon=True)
#         sender_thread.start()
        
#         return jsonify({
#             'success': True,
#             'message': 'Demo traffic started successfully - sending CSV file to webhook',
#             'webhook_url': webhook_url,
#             'status': 'running',
#             'csv_file': 'complete_flow_features.csv',
#             'upload_type': 'file_upload'
#         })
        
#     except Exception as e:
#         return jsonify({
#             'success': False,
#             'message': f'Failed to start demo traffic: {str(e)}',
#             'status': 'error'
#         }), 500

# @app.route('/api/demo-traffic/stop', methods=['POST'])
# def stop_demo_traffic():
#     """Stop demo traffic generation"""
#     global csv_sender, sender_thread
    
#     try:
#         if not csv_sender or not csv_sender.is_running:
#             return jsonify({
#                 'success': False,
#                 'message': 'Demo traffic is not running',
#                 'status': 'not_running'
#             }), 400
        
#         # Stop the CSV sender
#         csv_sender.stop()
        
#         # Wait for thread to finish
#         if sender_thread and sender_thread.is_alive():
#             sender_thread.join(timeout=5)
        
#         return jsonify({
#             'success': True,
#             'message': 'Demo traffic stopped successfully',
#             'status': 'stopped'
#         })
        
#     except Exception as e:
#         return jsonify({
#             'success': False,
#             'message': f'Failed to stop demo traffic: {str(e)}',
#             'status': 'error'
#         }), 500

# @app.route('/api/demo-traffic/status', methods=['GET'])
# def get_demo_traffic_status():
#     """Get demo traffic status"""
#     try:
#         global csv_sender
        
#         is_running = csv_sender and csv_sender.is_running
#         webhook_url = csv_sender.webhook_url if csv_sender else None
        
#         return jsonify({
#             'success': True,
#             'status': {
#                 'running': is_running,
#                 'webhook_url': webhook_url,
#                 'csv_file': 'complete_flow_features.csv',
#                 'upload_type': 'file_upload'
#             }
#         })
        
#     except Exception as e:
#         return jsonify({
#             'success': False,
#             'message': f'Failed to get status: {str(e)}',
#             'status': {'running': False, 'webhook_url': None}
#         }), 500

# @app.route('/api/demo-traffic/send-once', methods=['POST'])
# def send_csv_once():
#     """Send CSV file once to webhook"""
#     try:
#         data = request.get_json() or {}
#         webhook_url = data.get('webhook_url', 'https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9')
        
#         # Create temporary sender
#         temp_sender = CSVWebhookSender(webhook_url)
        
#         # Send CSV file once
#         success = temp_sender.send_csv_once()
        
#         if success:
#             return jsonify({
#                 'success': True,
#                 'message': 'CSV file sent successfully to webhook',
#                 'webhook_url': webhook_url,
#                 'upload_type': 'file_upload'
#             })
#         else:
#             return jsonify({
#                 'success': False,
#                 'message': 'Failed to send CSV file to webhook',
#                 'webhook_url': webhook_url
#             }), 500
            
#     except Exception as e:
#         return jsonify({
#             'success': False,
#             'message': f'Failed to send CSV file: {str(e)}',
#             'status': 'error'
#         }), 500

# # ==================== LIVE TRAFFIC ENDPOINTS ====================

# # @app.route('/api/live-traffic/start', methods=['POST'])
# # def start_live_traffic():
# #     """Start live traffic capture"""
# #     global live_capture
    
# #     try:
# #         data = request.get_json() or {}
# #         webhook_url = data.get('webhook_url', 'https://trialover098754321.app.n8n.cloud/webhook/646e1ad7-dd61-41b2-9893-997ee6157030')
# #         interface = data.get('interface', 'Wi-Fi')
# #         batch_size = data.get('batch_size', 100)
        
# #         # Check if already running
# #         if live_capture and live_capture.is_running:
# #             return jsonify({
# #                 'success': False,
# #                 'message': 'Live traffic capture is already running',
# #                 'status': 'already_running'
# #             }), 400
        
# #         # Create live capture instance
# #         live_capture = LiveTrafficCapture(
# #             interface=interface,
# #             webhook_url=webhook_url,
# #             packet_batch_size=batch_size
# #         )
        
# #         # Start capture
# #         success = live_capture.start_capture()
        
# #         if success:
# #             return jsonify({
# #                 'success': True,
# #                 'message': f'Live traffic capture started on interface {interface}',
# #                 'webhook_url': webhook_url,
# #                 'interface': interface,
# #                 'batch_size': batch_size,
# #                 'status': 'running',
# #                 'upload_type': 'file_upload'
# #             })
# #         else:
# #             return jsonify({
# #                 'success': False,
# #                 'message': 'Failed to start live traffic capture',
# #                 'status': 'error'
# #             }), 500
        
# #     except Exception as e:
# #         return jsonify({
# #             'success': False,
# #             'message': f'Failed to start live traffic: {str(e)}',
# #             'status': 'error'
# #         }), 500

# # @app.route('/api/live-traffic/stop', methods=['POST'])
# # def stop_live_traffic():
# #     """Stop live traffic capture"""
# #     global live_capture
    
# #     try:
# #         if not live_capture or not live_capture.is_running:
# #             return jsonify({
# #                 'success': False,
# #                 'message': 'Live traffic capture is not running',
# #                 'status': 'not_running'
# #             }), 400
        
# #         # Stop the capture
# #         success = live_capture.stop_capture()
        
# #         if success:
# #             return jsonify({
# #                 'success': True,
# #                 'message': 'Live traffic capture stopped successfully',
# #                 'status': 'stopped'
# #             })
# #         else:
# #             return jsonify({
# #                 'success': False,
# #                 'message': 'Failed to stop live traffic capture',
# #                 'status': 'error'
# #             }), 500
        
# #     except Exception as e:
# #         return jsonify({
# #             'success': False,
# #             'message': f'Failed to stop live traffic: {str(e)}',
# #             'status': 'error'
# #         }), 500

# # @app.route('/api/live-traffic/status', methods=['GET'])
# # def get_live_traffic_status():
# #     """Get live traffic capture status"""
# #     try:
# #         global live_capture
        
# #         if live_capture:
# #             status = live_capture.get_status()
# #             return jsonify({
# #                 'success': True,
# #                 'status': status
# #             })
# #         else:
# #             return jsonify({
# #                 'success': True,
# #                 'status': {
# #                     'running': False,
# #                     'interface': None,
# #                     'webhook_url': None,
# #                     'packet_count': 0,
# #                     'batch_size': 100,
# #                     'flows_count': 0,
# #                     'uptime': 0
# #                 }
# #             })
        
# #     except Exception as e:
# #         return jsonify({
# #             'success': False,
# #             'message': f'Failed to get live traffic status: {str(e)}',
# #             'status': {'running': False}
# #         }), 500

# # @app.route('/api/live-traffic/interfaces', methods=['GET'])
# # def get_network_interfaces():
# #     """Get available network interfaces with friendly names"""
# #     try:
# #         interfaces = LiveTrafficCapture.get_friendly_interfaces()
        
# #         # Extract just the names and friendly names for the API response
# #         interface_list = []
# #         friendly_names = {}
        
# #         for iface in interfaces:
# #             interface_list.append(iface['name'])
# #             friendly_names[iface['name']] = iface['friendly_name']
        
# #         # Determine default interface (prefer Wi-Fi, then Ethernet)
# #         default_interface = 'Wi-Fi'
# #         if interface_list:
# #             for iface in interfaces:
# #                 if 'wi-fi' in iface['friendly_name'].lower() or 'wireless' in iface['friendly_name'].lower():
# #                     default_interface = iface['name']
# #                     break
# #             else:
# #                 # If no Wi-Fi found, use first Ethernet
# #                 for iface in interfaces:
# #                     if 'ethernet' in iface['friendly_name'].lower():
# #                         default_interface = iface['name']
# #                         break
# #                 else:
# #                     # Use first available interface
# #                     default_interface = interface_list[0] if interface_list else 'Wi-Fi'
        
# #         return jsonify({
# #             'success': True,
# #             'interfaces': interface_list,
# #             'friendly_names': friendly_names,
# #             'default': default_interface,
# #             'detailed_interfaces': interfaces
# #         })
        
# #     except Exception as e:
# #         print(f"Error getting network interfaces: {e}")
# #         return jsonify({
# #             'success': False,
# #             'message': f'Failed to get network interfaces: {str(e)}',
# #             'interfaces': ['Wi-Fi', 'Ethernet'],
# #             'friendly_names': {'Wi-Fi': 'Wi-Fi', 'Ethernet': 'Ethernet'},
# #             'default': 'Wi-Fi'
# #         }), 500

# # ==================== EXISTING ENDPOINTS ====================

# @app.route('/api/generate-traffic', methods=['POST'])
# def generate_traffic():
#     """Generate new attack traffic and CSV file"""
#     try:
#         print("🔄 Generating new attack traffic...")
        
#         # Run the attack traffic generation script
#         result = subprocess.run(
#             ['python', 'attacktrafficgeneration.py'],
#             capture_output=True,
#             text=True,
#             timeout=60
#         )
        
#         if result.returncode == 0:
#             return jsonify({
#                 'success': True,
#                 'message': 'Attack traffic generated successfully',
#                 'output': result.stdout,
#                 'csv_file': 'complete_flow_features.csv'
#             })
#         else:
#             return jsonify({
#                 'success': False,
#                 'message': 'Failed to generate attack traffic',
#                 'error': result.stderr
#             }), 500
            
#     except subprocess.TimeoutExpired:
#         return jsonify({
#             'success': False,
#             'message': 'Traffic generation timed out',
#             'status': 'timeout'
#         }), 500
#     except Exception as e:
#         return jsonify({
#             'success': False,
#             'message': f'Failed to generate traffic: {str(e)}',
#             'status': 'error'
#         }), 500

# @app.route('/api/health', methods=['GET'])
# def health_check():
#     """Health check endpoint"""
#     csv_exists = os.path.exists('complete_flow_features.csv')
    
#     # Check if live capture is available
#     live_available = True
#     interfaces = []
#     try:
#         interfaces = LiveTrafficCapture.get_friendly_interfaces()
#         live_available = len(interfaces) > 0
#     except Exception as e:
#         print(f"Live capture check failed: {e}")
#         live_available = False
#         interfaces = [
#             {'name': 'Wi-Fi', 'friendly_name': 'Wi-Fi', 'ip_address': None},
#             {'name': 'Ethernet', 'friendly_name': 'Ethernet', 'ip_address': None}
#         ]
    
#     return jsonify({
#         'success': True,
#         'message': 'CSV Webhook API is running',
#         'service': 'cybershield-csv-webhook',
#         'version': '1.0.0',
#         'csv_file_exists': csv_exists,
#         'csv_file': 'complete_flow_features.csv',
#         'upload_type': 'file_upload',
#         'webhook_url': 'https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9',
#         'live_capture_available': live_available,
#         'available_interfaces': [iface['friendly_name'] for iface in interfaces[:5]]  # Limit to first 5
#     })

# if __name__ == '__main__':
#     port = int(os.environ.get('PORT', 3002))
#     print(f"🚀 CSV Webhook API starting on port {port}")
#     print(f"📊 Ready to send complete_flow_features.csv file to n8n webhook")
#     print(f"📄 CSV file path: complete_flow_features.csv")
#     print(f"📡 Default webhook: https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9")
#     print(f"🔴 Live traffic capture available")
    
#     app.run(host='0.0.0.0', port=port, debug=True)



from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import subprocess
import threading
import time
from csv_webhook_sender import CSVWebhookSender

app = Flask(__name__)
CORS(app)

# Global variables to track the senders
csv_sender = None
sender_thread = None
live_capture = None

@app.route('/api/demo-traffic/start', methods=['POST'])
def start_demo_traffic():
    """Start demo traffic generation and CSV file sending"""
    global csv_sender, sender_thread
    
    try:
        data = request.get_json() or {}
        webhook_url = data.get('webhook_url', 'https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9')
        
        # Check if already running
        if csv_sender and csv_sender.is_running:
            return jsonify({
                'success': False,
                'message': 'Demo traffic is already running',
                'status': 'already_running'
            }), 400
        
        # Create CSV sender instance
        csv_sender = CSVWebhookSender(webhook_url)
        
        # Check if CSV file exists (for fallback)
        if not csv_sender.check_csv_file():
            return jsonify({
                'success': False,
                'message': 'Base CSV file not found. Please run the attack traffic generation script first.',
                'status': 'csv_not_found'
            }), 400
        
        # Start sending live traffic batches in a separate thread
        def send_live_traffic_batches():
            csv_sender.start_periodic_sending(interval_seconds=10)  # Send every 10 seconds
        
        sender_thread = threading.Thread(target=send_live_traffic_batches, daemon=True)
        sender_thread.start()
        
        return jsonify({
            'success': True,
            'message': 'Demo traffic started successfully - generating live malicious traffic batches',
            'webhook_url': webhook_url,
            'status': 'running',
            'batch_size': '100 packets per CSV',
            'upload_type': 'live_traffic_batches',
            'attack_types': ['APT', 'DDoS'],
            'description': 'Live malicious traffic generation with APT and DDoS attacks'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to start demo traffic: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/api/demo-traffic/stop', methods=['POST'])
def stop_demo_traffic():
    """Stop demo traffic generation"""
    global csv_sender, sender_thread
    
    try:
        if not csv_sender or not csv_sender.is_running:
            return jsonify({
                'success': False,
                'message': 'Demo traffic is not running',
                'status': 'not_running'
            }), 400
        
        # Stop the CSV sender
        csv_sender.stop()
        
        # Wait for thread to finish
        if sender_thread and sender_thread.is_alive():
            sender_thread.join(timeout=5)
        
        return jsonify({
            'success': True,
            'message': 'Demo traffic stopped successfully',
            'status': 'stopped'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to stop demo traffic: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/api/demo-traffic/status', methods=['GET'])
def get_demo_traffic_status():
    """Get demo traffic status"""
    try:
        global csv_sender
        
        is_running = csv_sender and csv_sender.is_running
        webhook_url = csv_sender.webhook_url if csv_sender else None
        
        return jsonify({
            'success': True,
            'status': {
                'running': is_running,
                'webhook_url': webhook_url,
                'csv_file': 'complete_flow_features.csv',
                'upload_type': 'file_upload'
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get status: {str(e)}',
            'status': {'running': False, 'webhook_url': None}
        }), 500

@app.route('/api/demo-traffic/send-once', methods=['POST'])
def send_csv_once():
    """Send live traffic batch once to webhook"""
    try:
        data = request.get_json() or {}
        webhook_url = data.get('webhook_url', 'https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9')
        
        # Create temporary sender
        temp_sender = CSVWebhookSender(webhook_url)
        
        # Send live traffic batch once
        success = temp_sender.send_csv_once()
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Live traffic batch sent successfully to webhook',
                'webhook_url': webhook_url,
                'upload_type': 'live_traffic_batch',
                'batch_size': '100 packets',
                'attack_types': ['APT', 'DDoS']
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to send live traffic batch to webhook',
                'webhook_url': webhook_url
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to send live traffic batch: {str(e)}',
            'status': 'error'
        }), 500

# ==================== LIVE TRAFFIC ENDPOINTS ====================

@app.route('/api/live-traffic/start', methods=['POST'])
def start_live_traffic():
    """Start live traffic capture"""
    global live_capture
    
#     try:
#         data = request.get_json() or {}
#         webhook_url = data.get('webhook_url', 'https://trialover098754321.app.n8n.cloud/webhook/646e1ad7-dd61-41b2-9893-997ee6157030')
#         interface = data.get('interface', 'Wi-Fi')
#         batch_size = data.get('batch_size', 100)
        
#         # Check if already running
#         if live_capture and live_capture.is_running:
#             return jsonify({
#                 'success': False,
#                 'message': 'Live traffic capture is already running',
#                 'status': 'already_running'
#             }), 400
        
#         # Create live capture instance
#         live_capture = LiveTrafficCapture(
#             interface=interface,
#             webhook_url=webhook_url,
#             packet_batch_size=batch_size
#         )
        
#         # Start capture
#         success = live_capture.start_capture()
        
#         if success:
#             return jsonify({
#                 'success': True,
#                 'message': f'Live traffic capture started on interface {interface}',
#                 'webhook_url': webhook_url,
#                 'interface': interface,
#                 'batch_size': batch_size,
#                 'status': 'running',
#                 'upload_type': 'file_upload'
#             })
#         else:
#             return jsonify({
#                 'success': False,
#                 'message': 'Failed to start live traffic capture',
#                 'status': 'error'
#             }), 500
        
#     except Exception as e:
#         return jsonify({
#             'success': False,
#             'message': f'Failed to start live traffic: {str(e)}',
#             'status': 'error'
#         }), 500

# @app.route('/api/live-traffic/stop', methods=['POST'])
# def stop_live_traffic():
#     """Stop live traffic capture"""
#     global live_capture
    
#     try:
#         if not live_capture or not live_capture.is_running:
#             return jsonify({
#                 'success': False,
#                 'message': 'Live traffic capture is not running',
#                 'status': 'not_running'
#             }), 400
        
#         # Stop the capture
#         success = live_capture.stop_capture()
        
#         if success:
#             return jsonify({
#                 'success': True,
#                 'message': 'Live traffic capture stopped successfully',
#                 'status': 'stopped'
#             })
#         else:
#             return jsonify({
#                 'success': False,
#                 'message': 'Failed to stop live traffic capture',
#                 'status': 'error'
#             }), 500
        
#     except Exception as e:
#         return jsonify({
#             'success': False,
#             'message': f'Failed to stop live traffic: {str(e)}',
#             'status': 'error'
#         }), 500

# @app.route('/api/live-traffic/status', methods=['GET'])
# def get_live_traffic_status():
#     """Get live traffic capture status"""
#     try:
#         global live_capture
        
#         if live_capture:
#             status = live_capture.get_status()
#             return jsonify({
#                 'success': True,
#                 'status': status
#             })
#         else:
#             return jsonify({
#                 'success': True,
#                 'status': {
#                     'running': False,
#                     'interface': None,
#                     'webhook_url': None,
#                     'packet_count': 0,
#                     'batch_size': 100,
#                     'flows_count': 0,
#                     'uptime': 0
#                 }
#             })
        
#     except Exception as e:
#         return jsonify({
#             'success': False,
#             'message': f'Failed to get live traffic status: {str(e)}',
#             'status': {'running': False}
#         }), 500

# @app.route('/api/live-traffic/interfaces', methods=['GET'])
# def get_network_interfaces():
#     """Get available network interfaces with friendly names"""
#     try:
#         interfaces = LiveTrafficCapture.get_friendly_interfaces()
        
#         # Extract just the names and friendly names for the API response
#         interface_list = []
#         friendly_names = {}
        
#         for iface in interfaces:
#             interface_list.append(iface['name'])
#             friendly_names[iface['name']] = iface['friendly_name']
        
#         # Determine default interface (prefer Wi-Fi, then Ethernet)
#         default_interface = 'Wi-Fi'
#         if interface_list:
#             for iface in interfaces:
#                 if 'wi-fi' in iface['friendly_name'].lower() or 'wireless' in iface['friendly_name'].lower():
#                     default_interface = iface['name']
#                     break
#             else:
#                 # If no Wi-Fi found, use first Ethernet
#                 for iface in interfaces:
#                     if 'ethernet' in iface['friendly_name'].lower():
#                         default_interface = iface['name']
#                         break
#                 else:
#                     # Use first available interface
#                     default_interface = interface_list[0] if interface_list else 'Wi-Fi'
        
#         return jsonify({
#             'success': True,
#             'interfaces': interface_list,
#             'friendly_names': friendly_names,
#             'default': default_interface,
#             'detailed_interfaces': interfaces
#         })
        
#     except Exception as e:
#         print(f"Error getting network interfaces: {e}")
#         return jsonify({
#             'success': False,
#             'message': f'Failed to get network interfaces: {str(e)}',
#             'interfaces': ['Wi-Fi', 'Ethernet'],
#             'friendly_names': {'Wi-Fi': 'Wi-Fi', 'Ethernet': 'Ethernet'},
#             'default': 'Wi-Fi'
#         }), 500

# ==================== EXISTING ENDPOINTS ====================

@app.route('/api/generate-traffic', methods=['POST'])
def generate_traffic():
    """Generate new attack traffic and CSV file"""
    try:
        print("🔄 Generating new attack traffic...")
        
        # Run the attack traffic generation script
        result = subprocess.run(
            ['python', 'attacktrafficgeneration.py'],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            return jsonify({
                'success': True,
                'message': 'Attack traffic generated successfully',
                'output': result.stdout,
                'csv_file': 'complete_flow_features.csv'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to generate attack traffic',
                'error': result.stderr
            }), 500
            
    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'message': 'Traffic generation timed out',
            'status': 'timeout'
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to generate traffic: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    csv_exists = os.path.exists('complete_flow_features.csv')
    
    # Check if live capture is available
    live_available = True
    interfaces = []
    try:
        interfaces = LiveTrafficCapture.get_friendly_interfaces()
        live_available = len(interfaces) > 0
    except Exception as e:
        print(f"Live capture check failed: {e}")
        live_available = False
        interfaces = [
            {'name': 'Wi-Fi', 'friendly_name': 'Wi-Fi', 'ip_address': None},
            {'name': 'Ethernet', 'friendly_name': 'Ethernet', 'ip_address': None}
        ]
    
    return jsonify({
        'success': True,
        'message': 'CSV Webhook API is running',
        'service': 'cybershield-csv-webhook',
        'version': '1.0.0',
        'csv_file_exists': csv_exists,
        'csv_file': 'complete_flow_features.csv',
        'upload_type': 'file_upload',
        'webhook_url': 'https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9',
        'live_capture_available': live_available,
        'available_interfaces': [iface['friendly_name'] for iface in interfaces[:5]]  # Limit to first 5
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3002))
    print(f"🚀 CSV Webhook API starting on port {port}")
    print(f"📊 Ready to send complete_flow_features.csv file to n8n webhook")
    print(f"📄 CSV file path: complete_flow_features.csv")
    print(f"📡 Default webhook: https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9")
    print(f"🔴 Live traffic capture available")
    
    app.run(host='0.0.0.0', port=port, debug=True)