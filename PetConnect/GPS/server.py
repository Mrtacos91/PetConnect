from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import serial
from threading import Thread
import time

app = Flask(__name__)
CORS(app)

# Variables globales para almacenar posición
current_pos = {'lat': 0.0, 'lng': 0.0, 'valid': False}

def parse_gprmc(data):
    try:
        if data[2] != 'A':  # Campo de estado de validación (A = válido)
            return None
            
        # Latitud: campo 3 (formato DDMM.MMMM)
        lat_str = data[3]
        lat_deg = float(lat_str[:2])
        lat_min = float(lat_str[2:])
        lat = lat_deg + (lat_min / 60)
        if data[4] == 'S':  # Campo de hemisferio
            lat = -lat
            
        # Longitud: campo 5 (formato DDDMM.MMMM)
        lon_str = data[5]
        lon_deg = float(lon_str[:3])
        lon_min = float(lon_str[3:])
        lon = lon_deg + (lon_min / 60)
        if data[6] == 'W':  # Campo de hemisferio
            lon = -lon
            
        return (lat, lon)
    except Exception as e:
        print(f"Error en parseo: {str(e)}")
        return None

def gps_reader():
    global current_pos
    ser = serial.Serial(
    "COM3",
    baudrate=4800,  # Baud rate más común en módulos GPS
    timeout=2,
    parity=serial.PARITY_NONE
)
    
    while True:
        try:
            line = ser.readline().decode('ascii', errors='replace').strip()
            print(f"Dato bruto: {line}")  # <-- Nueva línea de depuración
            if line.startswith('$GPRMC'):
                parts = line.split(',')
                result = parse_gprmc(parts)
                if result:
                    current_pos = {
                        'lat': result[0],
                        'lng': result[1],
                        'valid': True
                    }
                    print(f"Coordenadas actualizadas: {current_pos}")
        except Exception as e:
            print(f"Error: {str(e)}")
        time.sleep(1)

@app.route('/gps-data')
def get_gps_data():
    return jsonify(current_pos)

@app.route('/')
def index():
    return send_from_directory('static', 'GpsWeb.html')

if __name__ == '__main__':
    Thread(target=gps_reader, daemon=True).start()
    app.run(host='0.0.0.0', port=5000, debug=False)