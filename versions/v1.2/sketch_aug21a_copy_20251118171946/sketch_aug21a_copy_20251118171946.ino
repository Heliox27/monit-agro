#include <WiFi.h>
#include <DHT.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ESPmDNS.h>
#include <time.h>                  // Para hora real

// ================== CAMBIA SOLO ESTO EN CADA ESP32 ==================
String nombreFinca = "Farm A";     // ← "Farm A" o "Farm B"
String mdnsName    = "farma";      // ← "farma" o "farmb"
// ====================================================================

const char* ssid = "Yeltsing";
const char* password = "012345679";
#define BOT_TOKEN "8441517447:AAEg-Iinr6vFiQ9cbfxq86SjqsolY8uJvi4"
#define CHAT_ID   "1549850271"

WiFiClientSecure client;
UniversalTelegramBot bot(BOT_TOKEN, client);

#define DHTPIN 15
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
const int SOIL_PIN = 34;
const int RELAY_PIN = 2;

WebServer server(80);

int hum_min = 35, hum_max = 65;
bool modoAuto = true, bombaOn = false;
int potencia = 85;

float temp = 0, humAir = 0;
int humSuelo = 0;
unsigned long ultimaLectura = 0;   // ← CORREGIDO
unsigned long ultimoInforme = 0;
String analisisIA = "Iniciando análisis IA...";

// Historial de eventos (últimos 20)
struct Evento {
  String hora;
  String texto;
};
Evento historial[20];
byte numEventos = 0;

void agregarEvento(String texto) {
  struct tm timeinfo;
  String horaStr = "??:??";
  if(getLocalTime(&timeinfo)) {
    char buf[6];
    strftime(buf, sizeof(buf), "%H:%M", &timeinfo);
    horaStr = String(buf);
  } else {
    unsigned long secs = millis() / 1000;
    horaStr = String(secs / 3600 % 24) + ":" + String((secs / 60) % 60);
    if (horaStr.length() < 5) horaStr = "0" + horaStr;
    horaStr = horaStr.substring(0,5);
  }
  if (numEventos < 20) {
    historial[numEventos++] = {horaStr, texto};
  } else {
    for(byte i = 0; i < 19; i++) historial[i] = historial[i+1];
    historial[19] = {horaStr, texto};
  }
}

// Alertas expertas (tus favoritas 100% iguales)
void alertaTelegram(String titulo, String valores = "", String accion = "", String producto = "", String beneficio = "") {
  String msg = "*" + nombreFinca + "* — ALERTA EXPERTA\n\n";
  msg += "*" + titulo + "*\n";
  if(valores != "") msg += "Valores: " + valores + "\n\n";
  if(accion  != "") msg += "*QUÉ HACER HOY:*\n" + accion + "\n\n";
  if(producto!= "") msg += "*PRODUCTO RECOMENDADO:*\n" + producto + "\n";
  if(beneficio!="") msg += "*BENEFICIO:*\n" + beneficio;
  bot.sendMessage(CHAT_ID, msg, "Markdown");
  agregarEvento(titulo);
}

// ==================== HTML COMPLETO EN PROGMEM ====================
const char index_html[] PROGMEM = R"=====(
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Monit-Agro FINCA</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
  body{margin:0;background:#f0f4f8;font-family:Arial,sans-serif;color:#333}
  header{background:linear-gradient(135deg,#1a5f3d,#2ecc71);color:#fff;text-align:center;padding:20px}
  h1{font-size:3em;margin:0}
  .c{padding:15px;max-width:1000px;margin:auto}
  .card{background:#fff;border-radius:20px;padding:20px;margin:15px 0;box-shadow:0 8px 25px #0001;text-align:center}
  .big{font-size:4.5em;font-weight:bold;color:#1a5f3d}
  .gauge{width:180px;height:180px;margin:20px auto;position:relative}
  svg{width:100%;height:100%;transform:rotate(-90deg)}
  circle{fill:none;stroke:#eee;stroke-width:20}
  .bar{stroke:#2ecc71;stroke-dasharray:502;stroke-dashoffset:502;transition:1.5s}
  .center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:3em;color:#1a5f3d}
  .btn{display:block;width:90%;margin:15px auto;padding:16px;background:#2ecc71;color:#fff;border:none;border-radius:50px;font-size:1.4em;cursor:pointer}
  .btnr{background:#e74c3c}
  .status{padding:18px;border-radius:50px;font-weight:bold;font-size:1.4em;margin:25px 0}
  .on{background:#d4efdf;color:#27ae60}.off{background:#fdf2f8;color:#e74c3c}
  .ia{background:linear-gradient(135deg,#8e44ad,#3498db);color:#fff;padding:25px;border-radius:20px;margin:15px 0;font-size:1.4em;text-align:center}
  .hist{background:#fff;padding:15px;border-radius:15px;margin:15px 0;font-size:1.1em}
  .hist div{padding:8px 0;border-bottom:1px solid #eee}
</style>
</head><body>
<header><h1>Monit-Agro</h1><p>v37 • FINCA • 2025</p></header>
<div class="c">
  <div class="card"><h2>Temperatura</h2><div class="big" id="t">--</div>°C</div>
  <div class="card"><h2>Humedad Aire</h2><div class="big" id="ha">--</div>%</div>
  <div class="card"><h2>Humedad Suelo</h2>
    <div class="gauge"><svg><circle cx="90" cy="90" r="80"></circle><circle class="bar" id="g"></circle></svg>
    <div class="center" id="hs">--%</div></div>
  </div>
  <div class="card ia"><strong>Análisis IA:</strong><br><div id="alerta">Iniciando...</div></div>
  <div class="card">
    <h2>Control Riego</h2>
    <div id="st" class="status off">Cargando...</div>
    <button class="btn" onclick="f('/on')">ENCENDER BOMBA</button>
    <button class="btn btnr" onclick="f('/off')">APAGAR BOM BOMBA</button>
    <button class="btn" onclick="f('/auto')" id="ab">AUTO ON</button>
    <br>Potencia <span id="p">85</span>%<input type="range" min="30" max="100" value="85" style="width:100%" oninput="f('/pot/'+this.value);p.innerText=this.value">
    <hr>
    <label>Encender ≤ <input type="number" id="min" value="35" style="width:80px" onchange="f('/min/'+this.value)">%</label>
    <label style="margin-left:20px">Apagar ≥ <input type="number" id="max" value="65" style="width:80px" onchange="f('/max/'+this.value)">%</label>
  </div>
  <div class="card"><canvas id="chart" height="320"></canvas></div>
  <div class="card"><h2>Últimos 20 eventos</h2><div class="hist" id="historial">Cargando...</div></div>
</div>
<script>
function f(u){fetch(u)}
const chart=new Chart(document.getElementById('chart').getContext('2d'),{type:'line',data:{labels:[],datasets:[
  {label:'Suelo %',data:[],borderColor:'#2ecc71',backgroundColor:'#2ecc7122',fill:true},
  {label:'Temp °C',data:[],borderColor:'#e74c3c',yAxisID:'y2'},
  {label:'Aire %',data:[],borderColor:'#3498db',yAxisID:'y3'}
]},options:{responsive:true,scales:{y:{max:100},y2:{position:'right',max:45},y3:{position:'left',max:100}}}});
setInterval(()=>{fetch('/datos').then(r=>r.json()).then(d=>{
  document.getElementById('t').innerText=d.temp||'--';
  document.getElementById('ha').innerText=d.humAir||'--';
  document.getElementById('hs').innerText=d.humSuelo+'%';
  document.getElementById('g').style.strokeDashoffset=502-(502*d.humSuelo/100);
  document.getElementById('st').innerHTML=d.bomba?'RIEGO ACTIVO':'Apagada '+(d.auto?'(Auto)':'(Manual)');
  document.getElementById('st').className=d.bomba?'status on':'status off';
  document.getElementById('ab').innerText=d.auto?'AUTO ON':'AUTO OFF';
  document.getElementById('min').value=d.min;
  document.getElementById('max').value=d.max;
  document.getElementById('alerta').innerHTML=d.analisisIA;
  let h=new Date().toLocaleTimeString('es-NI',{hour:'2-digit',minute:'2-digit'});
  chart.data.labels.push(h); chart.data.labels=chart.data.labels.slice(-50);
  chart.data.datasets[0].data.push(d.humSuelo);
  chart.data.datasets[1].data.push(d.temp);
  chart.data.datasets[2].data.push(d.humAir);
  chart.data.datasets.forEach(ds=>ds.data=ds.data.slice(-50));
  chart.update();
  let hist=''; d.historial.forEach(e=>hist+=`<div>${e}</div>`);
  document.getElementById('historial').innerHTML=hist||'Sin eventos';
})},5000);
</script>
</body></html>
)=====";

String generarPagina() {
  String pagina = String(index_html);
  pagina.replace("FINCA", nombreFinca);
  return pagina;
}

void handleRoot() { server.send(200, "text/html", generarPagina()); }

void handleDatos() {
  DynamicJsonDocument doc(2048);
  doc["temp"] = round(temp*10)/10.0;
  doc["humAir"] = round(humAir);
  doc["humSuelo"] = humSuelo;
  doc["bomba"] = bombaOn;
  doc["auto"] = modoAuto;
  doc["potencia"] = potencia;
  doc["min"] = hum_min;
  doc["max"] = hum_max;
  doc["analisisIA"] = analisisIA;

  JsonArray h = doc.createNestedArray("historial");
  for(int i = numEventos-1; i >= 0; i--) {
    h.add(historial[i].hora + " → " + historial[i].texto);
  }

  String json;
  serializeJson(doc, json);
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  dht.begin();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }

  configTime(-6*3600, 0, "pool.ntp.org");   // Hora Nicaragua
  client.setInsecure();
  MDNS.begin(mdnsName.c_str());

  String ip = WiFi.localIP().toString();
  Serial.println("\n\n=============================================");
  Serial.println("       MONIT-AGRO v37 CONECTADO");
  Serial.print("Finca    : "); Serial.println(nombreFinca);
  Serial.print("IP       : http://"); Serial.println(ip);
  Serial.print("mDNS     : http://"); Serial.print(mdnsName); Serial.println(".local");
  Serial.println("=============================================\n");

  bot.sendMessage(CHAT_ID, "*" + nombreFinca + "* INICIADO\n\nIP: http://" + ip + "\nmDNS: http://" + mdnsName + ".local\n¡Récord 2025-2026 asegurado!", "Markdown");

  server.on("/", handleRoot);
  server.on("/datos", handleDatos);
  server.on("/on",  [](){ bombaOn=true; modoAuto=false; analogWrite(RELAY_PIN, potencia*2.55); alertaTelegram("BOMBA ENCENDIDA MANUAL", "Potencia: "+String(potencia)+"%", "Riego emergencia", "—", "Evitas pérdida"); agregarEvento("BOMBA ON MANUAL"); server.send(200); });
  server.on("/off", [](){ bombaOn=false; analogWrite(RELAY_PIN, 0); alertaTelegram("BOMBA APAGADA MANUAL", "", "Riego detenido", "—", "Ahorro agua"); agregarEvento("BOMBA OFF MANUAL"); server.send(200); });
  server.on("/auto",[](){ modoAuto=true; alertaTelegram("MODO AUTO ACTIVADO", "", "Sistema controla", "—", "Máxima eficiencia"); agregarEvento("MODO AUTO ON"); server.send(200); });
  server.on("/pot/",[](){ potencia=constrain(server.pathArg(0).toInt(),30,100); if(bombaOn) analogWrite(RELAY_PIN,potencia*2.55); alertaTelegram("POTENCIA AJUSTADA", "Nueva: "+String(potencia)+"%"); agregarEvento("POTENCIA "+String(potencia)+"%"); server.send(200); });
  server.on("/min/",[](){ hum_min=constrain(server.pathArg(0).toInt(),10,90); alertaTelegram("UMBRAL MÍNIMO", "Ahora "+String(hum_min)+"%"); agregarEvento("MIN "+String(hum_min)); server.send(200); });
  server.on("/max/",[](){ hum_max=constrain(server.pathArg(0).toInt(),20,95); alertaTelegram("UMBRAL MÁXIMO", "Ahora "+String(hum_max)+"%"); agregarEvento("MAX "+String(hum_max)); server.send(200); });

  server.begin();
  agregarEvento("Sistema iniciado");
}

void loop() {
  server.handleClient();

  if (millis() - ultimaLectura < 8000) return;
  ultimaLectura = millis();

  int raw = analogRead(SOIL_PIN);
  humSuelo = map(raw, 1520, 3780, 100, 0);
  humSuelo = constrain(humSuelo, 0, 100);

  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t) && t > 0) temp = t;
  if (!isnan(h) && h > 0) humAir = h;

  // Análisis IA
  if (humSuelo > 80) analisisIA = "EXCESO DE RIEGO<br>Suelo saturado<br>Riesgo raíces";
  else if (humSuelo < 30 && humAir < 50) analisisIA = "PLANTA ESTRESADA<br>Suelo y aire seco";
  else if (humAir > 80 && temp > 28) analisisIA = "ALTO RIESGO HONGOS<br>Calor + humedad";
  else if (humSuelo < 35) analisisIA = "Suelo seco<br>Preparando riego";
  else analisisIA = "Condiciones óptimas<br>Frijol rojo feliz";

  // Tus alertas favoritas
  if (humSuelo <= 15) alertaTelegram("ESTRÉS HÍDRICO CRÍTICO!", "Suelo: "+String(humSuelo)+"%", "RIEGA MANUAL YA\n20 L/m² + bioestimulante", "RootPower / Algaflex", "Recuperas planta");
  else if (humSuelo <= 25) alertaTelegram("SUELO MUY SECO", "Suelo: "+String(humSuelo)+"%", "Enciende riego\nSube umbral", "K-Leaf", "Evitas aborto flores");
  if (humSuelo >= 85) alertaTelegram("SUELO INUNDADO!", "Suelo: "+String(humSuelo)+"%", "Apaga bomba + drena", "Peróxido 3%", "Salvas raíces");
  if (humAir >= 85 && temp >= 28) alertaTelegram("ALTO RIESGO HONGOS!", "Aire: "+String(humAir)+"% | "+String(temp,1)+"°C", "Fungicida HOY", "Ridomil Gold", "Protección total");
  if (temp >= 37) alertaTelegram("CALOR EXTREMO!", "Temp: "+String(temp,1)+"°C", "Riego enfriamiento", "Kaolin", "Evitas quemadura");
  if (humSuelo < 30 && humAir < 50) alertaTelegram("PLANTA CRÍTICA!", "Suelo y aire secos", "RIEGA YA + potasio", "NitroK", "Granos pesados");

  if (modoAuto && humSuelo <= hum_min && !bombaOn) {
    bombaOn = true; analogWrite(RELAY_PIN, potencia*2.55);
    alertaTelegram("RIEGO AUTO INICIADO", "Suelo: "+String(humSuelo)+"%", "Bomba al "+String(potencia)+"%", "—", "Riego perfecto");
    agregarEvento("RIEGO AUTO ON");
  }
  if (modoAuto && humSuelo >= hum_max && bombaOn) {
    bombaOn = false; analogWrite(RELAY_PIN, 0);
    alertaTelegram("RIEGO AUTO COMPLETADO", "Suelo: "+String(humSuelo)+"%", "Bomba apagada", "—", "Ahorro agua");
    agregarEvento("RIEGO AUTO OFF");
  }

  if (millis() - ultimoInforme > 86400000UL) {
    ultimoInforme = millis();
    alertaTelegram("INFORME DIARIO", "Temp: "+String(temp,1)+"°C | Suelo: "+String(humSuelo)+"% | Aire: "+String(humAir)+"%", "Todo óptimo", "—", "¡Récord 2025-2026!");
    agregarEvento("Informe diario");
  }
}