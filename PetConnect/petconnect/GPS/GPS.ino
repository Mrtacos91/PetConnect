#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>

const char* ssid = "VIH...";
const char* password = "OnomatopeYa1";
const char* supabaseUrl = "https://sspehvekjwrwscgskycd.supabase.co/rest/v1/LocationGps";
const char* supabaseApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcGVodmVrandyd3NjZ3NreWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNjcxMDUsImV4cCI6MjA1NTY0MzEwNX0.gfO6_TNfmEDK2KOvjp_TJu2k6u5XuTJFRw7yLklvihU";
const char* deviceId = "24";

HardwareSerial gpsSerial(2);
const int gpsBaudRate = 9600;
TinyGPSPlus gps;

void setup() {
  Serial.begin(115200);
  delay(1000);
  gpsSerial.begin(gpsBaudRate, SERIAL_8N1, 16, 17);
  WiFi.begin(ssid, password);
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? "\n✅ WiFi conectado" : "\n❌ Error al conectar WiFi");
}

bool registroExiste() {
  HTTPClient http;
  String url = String(supabaseUrl) + "?device_id=eq." + deviceId;
  http.begin(url);
  http.addHeader("apikey", supabaseApiKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseApiKey);
  int httpCode = http.GET();

  bool existe = false;
  if (httpCode == 200) {
    String payload = http.getString();
    existe = payload.length() > 2;
  }

  http.end();
  return existe;
}

void enviarDatos(double lat, double lng, const char* hora, const char* fecha, bool actualizar) {
  HTTPClient http;
  String url = actualizar
    ? String(supabaseUrl) + "?device_id=eq." + deviceId // Para PATCH usando device_id
    : String(supabaseUrl); // Para POST

  http.begin(url);
  http.addHeader("apikey", supabaseApiKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseApiKey);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=representation");

  String jsonPayload = "{";
  jsonPayload += "\"device_id\": \"" + String(deviceId) + "\",";
  jsonPayload += "\"Latitude\": " + String(lat, 6) + ",";
  jsonPayload += "\"Longitude\": " + String(lng, 6) + ",";
  jsonPayload += "\"Time\": \"" + String(hora) + "\",";
  jsonPayload += "\"Date\": \"" + String(fecha) + "\"";
  jsonPayload += "}";

  int httpCode = actualizar ? http.PATCH(jsonPayload) : http.POST(jsonPayload);

  if (httpCode > 0) {
    Serial.println("✅ Datos enviados a Supabase.");
    Serial.print("📨 Código HTTP: ");
    Serial.println(httpCode);
    Serial.println(http.getString());
  } else {
    Serial.println("❌ Error al enviar datos a Supabase.");
    Serial.print("Código HTTP: ");
    Serial.println(httpCode);
  }

  http.end();
}

void loop() {
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  if (gps.location.isUpdated() && gps.date.isValid() && gps.time.isValid()) {
    double lat = gps.location.lat();
    double lng = gps.location.lng();

    char fecha[11];
    snprintf(fecha, sizeof(fecha), "%04d-%02d-%02d",
             gps.date.year(), gps.date.month(), gps.date.day());

    char hora[9];
    snprintf(hora, sizeof(hora), "%02d:%02d:%02d",
             gps.time.hour(), gps.time.minute(), gps.time.second());

    Serial.println("🌍 Datos GPS:");
    Serial.printf("Latitud: %.6f\n", lat);
    Serial.printf("Longitud: %.6f\n", lng);
    Serial.print("Fecha: "); Serial.println(fecha);
    Serial.print("Hora: "); Serial.println(hora);

    if (WiFi.status() == WL_CONNECTED) {
      bool existe = registroExiste();
      enviarDatos(lat, lng, hora, fecha, existe);
    } else {
      Serial.println("❌ WiFi no conectado.");
    }
  } else {
    Serial.println("⚠️ Esperando señal GPS...");
  }

  delay(20000);
}
