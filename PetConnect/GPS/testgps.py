import serial

PORT = "COM3"  
BAUD_RATE = 9600  

try:
    ser = serial.Serial(PORT, BAUD_RATE, timeout=1)
    print("✅ Conexión establecida con el módulo GPS.")
except Exception as e:
    print(f"❌ Error al conectar con el GPS: {e}")
    exit()

while True:
    try:
        line = ser.readline().decode("utf-8", errors="ignore").strip()
        if line:
            print(f"📡 Datos recibidos: {line}")
    except Exception as e:
        print(f"⚠️ Error al leer datos: {e}")
