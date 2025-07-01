import serial
import requests
import json
import time
from datetime import datetime
import pynmea2

# Configuración
SUPABASE_URL = "https://sspehvekjwrwscgskycd.supabase.co/rest/v1/LocationGps"
SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcGVodmVrandyd3NjZ3NreWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNjcxMDUsImV4cCI6MjA1NTY0MzEwNX0.gfO6_TNfmEDK2KOvjp_TJu2k6u5XuTJFRw7yLklvihU"
DEVICE_ID = "24"
GPS_PORT = "COM5"  # Cambia según tu sistema (Windows: "COM3", Linux: "/dev/ttyUSB0")
GPS_BAUDRATE = 9600

class GPSTracker:
    def __init__(self):
        self.gps_serial = None
        self.headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
    def conectar_gps(self):
        """Conecta al módulo GPS"""
        try:
            self.gps_serial = serial.Serial(GPS_PORT, GPS_BAUDRATE, timeout=1)
            print("✅ GPS conectado")
            return True
        except serial.SerialException as e:
            print(f"❌ Error al conectar GPS: {e}")
            return False
    
    def registro_existe(self):
        """Verifica si ya existe un registro para este device_id"""
        try:
            url = f"{SUPABASE_URL}?device_id=eq.{DEVICE_ID}"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                data = response.json()
                return len(data) > 0
            return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Error al verificar registro: {e}")
            return False
    
    def enviar_datos(self, lat, lng, hora, fecha, actualizar=False):
        """Envía datos GPS a Supabase"""
        try:
            payload = {
                "device_id": DEVICE_ID,
                "Latitude": round(lat, 6),
                "Longitude": round(lng, 6),
                "Time": hora,
                "Date": fecha
            }
            
            if actualizar:
                # PATCH para actualizar registro existente
                url = f"{SUPABASE_URL}?device_id=eq.{DEVICE_ID}"
                response = requests.patch(url, headers=self.headers, json=payload)
            else:
                # POST para crear nuevo registro
                response = requests.post(SUPABASE_URL, headers=self.headers, json=payload)
            
            if response.status_code in [200, 201]:
                print("✅ Datos enviados a Supabase.")
                print(f"📨 Código HTTP: {response.status_code}")
                print(response.text)
            else:
                print(f"❌ Error al enviar datos. Código HTTP: {response.status_code}")
                print(response.text)
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error al enviar datos a Supabase: {e}")
    
    def leer_gps(self):
        """Lee y procesa datos del GPS"""
        if not self.gps_serial:
            return None, None, None, None
            
        try:
            line = self.gps_serial.readline().decode('ascii', errors='replace').strip()
            
            if line.startswith('$GPGGA') or line.startswith('$GNGGA'):
                msg = pynmea2.parse(line)
                
                if msg.latitude and msg.longitude:
                    # Obtener fecha y hora actual (el GPGGA no incluye fecha)
                    now = datetime.utcnow()
                    fecha = now.strftime("%Y-%m-%d")
                    hora = now.strftime("%H:%M:%S")
                    
                    return msg.latitude, msg.longitude, hora, fecha
                    
        except (pynmea2.ParseError, UnicodeDecodeError, serial.SerialException) as e:
            # Silenciar errores de parsing comunes
            pass
            
        return None, None, None, None
    
    def ejecutar(self):
        """Función principal del programa"""
        print("🚀 Iniciando GPS Tracker...")
        
        if not self.conectar_gps():
            return
        
        print("📡 Esperando señal GPS...")
        
        while True:
            try:
                lat, lng, hora, fecha = self.leer_gps()
                
                if lat and lng:
                    print("\n🌍 Datos GPS:")
                    print(f"Latitud: {lat:.6f}")
                    print(f"Longitud: {lng:.6f}")
                    print(f"Fecha: {fecha}")
                    print(f"Hora: {hora}")
                    
                    # Verificar si el registro existe y enviar datos
                    existe = self.registro_existe()
                    self.enviar_datos(lat, lng, hora, fecha, existe)
                    
                else:
                    print("⚠️ Esperando señal GPS...")
                
                time.sleep(20)  # Esperar 20 segundos
                
            except KeyboardInterrupt:
                print("\n🛑 Programa detenido por el usuario")
                break
            except Exception as e:
                print(f"❌ Error inesperado: {e}")
                time.sleep(5)
        
        if self.gps_serial:
            self.gps_serial.close()
            print("📴 GPS desconectado")

if __name__ == "__main__":
    tracker = GPSTracker()
    tracker.ejecutar()