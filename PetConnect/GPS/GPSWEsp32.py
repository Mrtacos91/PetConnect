import network
from machine import UART
import utime

# Reemplaza con tus datos de WiFi
ssid = "VIH..."
password = "OnomatopeYa1"

# Configuración del baud rate (NEO-6M normalmente usa 9600)
gpsBaudRate = 9600

# Inicializa la UART2 en ESP32 para conectar el GPS
gps = UART(2, baudrate=gpsBaudRate, rx=16, tx=17, timeout=1000)

print("\n🔍 Iniciando pruebas con GPS...")

# Esperar que el GPS se estabilice
utime.sleep(2)

# Vaciar el buffer del GPS antes de leer
while gps.any():
    gps.read()

print("⏳ Esperando datos del GPS...")
utime.sleep(3)

# Verifica si el GPS está enviando datos
if gps.any() > 0:
    print("✅ GPS detectado en baud rate " + str(gpsBaudRate))
else:
    print("❌ No se detecta el GPS. Verifica conexiones y baud rate.")
    while True:
        pass

# Conectar a WiFi
print("\n🔍 Conectando a WiFi...")
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(ssid, password)
intento = 0
while not wlan.isconnected() and intento < 20:
    utime.sleep(0.5)
    print("🔄 ", end='')
    intento += 1

if wlan.isconnected():
    print("\n✅ ¡Conectado al WiFi!")
    print("📡 Dirección IP: ", wlan.ifconfig()[0])
else:
    print("\n❌ No se pudo conectar al WiFi.")

# Bucle principal
while True:
    line = gps.readline()
    if line is not None:
        try:
            line = line.decode('utf-8').strip()
            print("📡 Datos GPS recibidos: " + line)
            if line.startswith('$'):
                print("✅ Datos NMEA válidos recibidos.")
            else:
                print("⚠️ Datos no reconocidos. Posible problema de baud rate o conexión.")
                hex_str = ' '.join([hex(ord(c)) for c in line])
                print("Hex: " + hex_str)
        except UnicodeError:
            print("⚠️ Error decoding GPS data.")
    else:
        print("⚠️ No se detectan datos GPS...")
        utime.sleep(5)