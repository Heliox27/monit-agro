/*
  Monit-Agro — Versión 1.0 (Anterior)
  Notas: control básico y registro mínimo por Serial.
  Esta iteración prioriza simplicidad para validación en campo.
*/

#include <DHT.h>  

// ----- Configuración del sensor DHT11 -----
#define DHTPIN 2         
#define DHTTYPE DHT11    
DHT dht(DHTPIN, DHTTYPE);

// ----- Sensor de humedad del suelo -----
const int SensorPin = A0;  

// ----- Bomba de agua (controlada por relé) -----
const int RelayPin = 7;   
bool bombaEncendida = false; 

// ----- Umbrales de humedad -----
int HUMEDAD_MIN = 30;   // Activa bomba cuando ≤ 30%
int HUMEDAD_MAX = 50;   // Apaga bomba cuando ≥ 50%

void setup() {
  Serial.begin(9600);
  dht.begin();
  pinMode(RelayPin, OUTPUT);
  digitalWrite(RelayPin, LOW); // Relé apagado por defecto (activo en HIGH ahora)
  delay(1000); // Este tiempo esta en milisegundos este es 1 segundo
}

void loop() {
  // --- Lectura de sensores ---
  float temperatura = dht.readTemperature();
  float humedadAire = dht.readHumidity();
  int valorBruto = analogRead(SensorPin);

  // --- Convertir humedad del suelo ---
  int humedadSuelo = map(valorBruto, 0, 1023, 100, 0);
  humedadSuelo = constrain(humedadSuelo, 0, 100);

  // ----------- SALIDA PARA SERIAL PLOTTER -----------
  // Enviar todos los valores en una sola línea
  if (!isnan(temperatura) && !isnan(humedadAire)) {
    Serial.print("Temperatura:");
    Serial.print(temperatura);
    Serial.print("\t");

    Serial.print("HumedadAire:");
    Serial.print(humedadAire);
    Serial.print("\t");

    Serial.print("HumedadSuelo:");
    Serial.println(humedadSuelo);
  }

  // ----------- SALIDA PARA SERIAL MONITOR -----------
  if (isnan(temperatura) || isnan(humedadAire)) {
    Serial.println(" Error al leer el sensor DHT11");
  } else {
    Serial.println(" Lecturas:");
    Serial.print(" Temperatura del aire: ");
    Serial.print(temperatura);
    Serial.println(" °C");

    Serial.print(" Humedad del aire: ");
    Serial.print(humedadAire);
    Serial.println(" %");
  }

  Serial.print(" Humedad del suelo: ");
  Serial.print(humedadSuelo);
  Serial.println(" %");

  // --- Control de bomba con histéresis ---
  if (humedadSuelo <= HUMEDAD_MIN && !bombaEncendida) {
    digitalWrite(RelayPin, HIGH);  // Activa relé (HIGH enciende)
    bombaEncendida = true;
    Serial.println(" Bomba ACTIVADA (riego en marcha)");
  } 
  else if (humedadSuelo >= HUMEDAD_MAX && bombaEncendida) {
    digitalWrite(RelayPin, LOW); // Apaga relé
    bombaEncendida = false;
    Serial.println(" Bomba DESACTIVADA (riego detenido)");
  }

  Serial.println("-------------------------");
  delay(2000); // Este tiempo esta en segundos 
}