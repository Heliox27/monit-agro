#include <WiFi.h>
#include <DHT.h>
#include <WebServer.h>

// --- Wi-Fi ---
const char* ssid = "Mondragon";
const char* password = "Mondragon55";

// --- Servidor web ---
WebServer server(80);

// --- DHT11 ---
#define DHTPIN 15
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// --- Sensor de humedad del suelo ---
const int SensorPin = 34;

// --- Relé para bomba ---
const int RelayPin = 2;
bool bombaEncendida = false;
int HUMEDAD_MIN = 30;
int HUMEDAD_MAX = 50;

void setup() {
  Serial.begin(115200);
  delay(1000);

  dht.begin();
  pinMode(RelayPin, OUTPUT);
  digitalWrite(RelayPin, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Conectando a Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.println(" Conectado a Wi-Fi");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // --- Endpoints ---
  server.on("/", handleRoot);    // Interfaz web
  server.on("/datos", handleDatos);   // JSON de sensores
  server.on("/bomba", handleBomba);   // Control bomba
  server.begin();
  Serial.println(" Servidor web iniciado");
}

void loop() {
  server.handleClient();

  // --- Lectura sensores ---
  int valorBruto = analogRead(SensorPin);
  int humedadSuelo = map(valorBruto, 0, 4095, 100, 0);
  humedadSuelo = constrain(humedadSuelo, 0, 100);

  // --- Control automático de bomba ---
  if (humedadSuelo <= HUMEDAD_MIN && !bombaEncendida) {
    digitalWrite(RelayPin, HIGH);
    bombaEncendida = true;
    Serial.println(" Bomba ACTIVADA (automático)");
  } else if (humedadSuelo >= HUMEDAD_MAX && bombaEncendida) {
    digitalWrite(RelayPin, LOW);
    bombaEncendida = false;
    Serial.println(" Bomba DESACTIVADA (automático)");
  }

  delay(2000);
}

// --- Interfaz web ---
void handleRoot() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>🌱 Monitor de Riego ESP32</title>
<style>
body { font-family: Arial; text-align:center; margin:0; padding:0; background:#f0f0f0; }
h1 { background:#4CAF50; color:white; padding:20px; margin:0;}
.container { padding:20px; }
.card { background:white; padding:20px; margin:10px auto; width:300px; border-radius:10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);}
button { padding:10px 20px; margin:5px; border:none; border-radius:5px; cursor:pointer;}
#on { background:#4CAF50; color:white;}
#off { background:#f44336; color:white;}
</style>
</head>
<body>
<h1> Monitor de Riego ESP32</h1>
<div class="container">
  <div class="card">
    <h2>Datos del sensor</h2>
    <p> Temperatura: <span id="temp">--</span> °C</p>
    <p> Humedad aire: <span id="humAire">--</span> %</p>
    <p> Humedad suelo: <span id="humSuelo">--</span> %</p>
    <p>Bomba: <span id="bomba">--</span></p>
    <button id="on">Encender bomba</button>
    <button id="off">Apagar bomba</button>
  </div>
</div>
<script>
function actualizarDatos(){
  fetch('/datos')
    .then(res => res.json())
    .then(data => {
      document.getElementById('temp').innerText = data.temperatura;
      document.getElementById('humAire').innerText = data.humedadAire;
      document.getElementById('humSuelo').innerText = data.humedadSuelo;
      document.getElementById('bomba').innerText = data.bombaEncendida ? "ENCENDIDA" : "APAGADA";
    });
}

// Control manual de bomba
document.getElementById('on').addEventListener('click', () => {
  fetch('/bomba?estado=1');
});
document.getElementById('off').addEventListener('click', () => {
  fetch('/bomba?estado=0');
});

// Actualizar cada 2 segundos
setInterval(actualizarDatos, 2000);
actualizarDatos();
</script>
</body>
</html>
)rawliteral";

  server.send(200, "text/html", html);
}

// --- Función que devuelve los datos en JSON ---
void handleDatos() {
  float temperatura = dht.readTemperature();
  float humedadAire = dht.readHumidity();
  int valorBruto = analogRead(SensorPin);
  int humedadSuelo = map(valorBruto, 0, 4095, 100, 0);
  humedadSuelo = constrain(humedadSuelo, 0, 100);

  String json = "{";
  json += "\"temperatura\": " + String(temperatura, 1) + ",";
  json += "\"humedadAire\": " + String(humedadAire, 1) + ",";
  json += "\"humedadSuelo\": " + String(humedadSuelo) + ",";
  json += "\"bombaEncendida\": " + String(bombaEncendida ? "true" : "false");
  json += "}";

  server.send(200, "application/json", json);
}

// --- Función para controlar la bomba manualmente ---
void handleBomba() {
  if (server.hasArg("estado")) {
    String estado = server.arg("estado");
    if (estado == "1") {
      digitalWrite(RelayPin, HIGH);
      bombaEncendida = true;
      server.send(200, "text/plain", "Bomba ENCENDIDA");
      Serial.println(" Bomba ACTIVADA (manual)");
      return;
    } else if (estado == "0") {
      digitalWrite(RelayPin, LOW);
      bombaEncendida = false;
      server.send(200, "text/plain", "Bomba APAGADA");
      Serial.println(" Bomba DESACTIVADA (manual)");
      return;
    }
  }
  server.send(400, "text/plain", "Parámetro 'estado' inválido. Usa 0 o 1.");
}
