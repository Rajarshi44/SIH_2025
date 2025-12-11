/*
 * Sohojpaat ESP32 WebSocket Client
 * Converted from Blynk to WebSocket for Next.js backend
 */

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <Adafruit_INA219.h>

// ============ WiFi Configuration ============
const char* ssid = "Galaxy A14 5G";
const char* password = "potatochips";

// ============ WebSocket Configuration ============
const char* ws_host = "10.121.155.187";  // CHANGE THIS TO YOUR COMPUTER'S IP
const uint16_t ws_port = 3000;
const char* ws_path = "/ws/device?device_id=esp32_1&token=esp32-device-token-xyz";

// ============ Pin Configuration (Same as Blynk version) ============
#define ENA  25
#define IN1  26
#define IN2  27
#define ENB  33
#define IN3  32
#define IN4  35

#define LED 2  // Internal LED for testing (GPIO 2)

// ============ PWM Configuration ============
const uint32_t PWM_FREQ = 20000;
const uint8_t PWM_RES = 8;
const uint8_t PWM_CH_A = 0;
const uint8_t PWM_CH_B = 1;

// ============ Motor State ============
int motorASpeed = 0;     // 0-255 PWM value
int motorBSpeed = 0;     // 0-255 PWM value
bool motorAOn = false;
bool motorBOn = false;
bool motorAForward = true;
bool motorBForward = true;

bool ledState = false;  // LED on/off state

// ============ INA219 Current Sensors ============
Adafruit_INA219 inaA(0x40);
Adafruit_INA219 inaB(0x41);

// ============ Smoothing Buffers ============
const int SM_LEN = 8;
float bufA[SM_LEN];
float bufB[SM_LEN];
int bufIndex = 0;
int bufCount = 0;

// ============ WebSocket Client ============
WebSocketsClient webSocket;

// ============ Timing ============
unsigned long lastTelemetry = 0;
const unsigned long telemetryInterval = 500;  // 500ms as per spec
unsigned long lastPing = 0;
const unsigned long pingInterval = 20000;  // 20 seconds

// ============ Jam Detection ============
const float JAM_CURRENT_THRESHOLD = 1200.0;  // mA
unsigned long jamStartTimeA = 0;
unsigned long jamStartTimeB = 0;
bool isJammedA = false;
bool isJammedB = false;

// ============ I2C Scanner ============
void scanI2C() {
  Serial.println("\n=== I2C Scanner ===");
  Wire.begin(21, 22);
  byte error, address;
  int deviceCount = 0;
  
  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    if (error == 0) {
      Serial.print("I2C device found at 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
      deviceCount++;
    }
  }
  
  if (deviceCount == 0) {
    Serial.println("No I2C devices found!");
  } else {
    Serial.printf("Found %d device(s)\n", deviceCount);
  }
  Serial.println("==================\n");
}

// ============ Motor Control Functions ============
void startMotor(char motor) {
  if (motor == 'A' || motor == 'B') {
    if (motor == 'A') {
      motorAOn = true;
      digitalWrite(IN1, motorAForward ? HIGH : LOW);
      digitalWrite(IN2, motorAForward ? LOW : HIGH);
      ledcWrite(PWM_CH_A, motorASpeed);
      Serial.printf("Motor A STARTED (speed=%d, forward=%d)\n", motorASpeed, motorAForward);
    } else {
      motorBOn = true;
      digitalWrite(IN3, motorBForward ? HIGH : LOW);
      digitalWrite(IN4, motorBForward ? LOW : HIGH);
      ledcWrite(PWM_CH_B, motorBSpeed);
      Serial.printf("Motor B STARTED (speed=%d, forward=%d)\n", motorBSpeed, motorBForward);
    }
  }
}

void stopMotor(char motor) {
  if (motor == 'A' || motor == 'B') {
    if (motor == 'A') {
      motorAOn = false;
      ledcWrite(PWM_CH_A, 0);
      digitalWrite(IN1, LOW);
      digitalWrite(IN2, LOW);
      Serial.println("Motor A STOPPED");
    } else {
      motorBOn = false;
      ledcWrite(PWM_CH_B, 0);
      digitalWrite(IN3, LOW);
      digitalWrite(IN4, LOW);
      Serial.println("Motor B STOPPED");
    }
  }
}

void setMotorSpeed(char motor, int speed) {
  speed = constrain(speed, 0, 255);
  
  if (motor == 'A') {
    motorASpeed = speed;
    if (motorAOn) {
      ledcWrite(PWM_CH_A, speed);
    }
    Serial.printf("Motor A speed set to %d\n", speed);
  } else if (motor == 'B') {
    motorBSpeed = speed;
    if (motorBOn) {
      ledcWrite(PWM_CH_B, speed);
    }
    Serial.printf("Motor B speed set to %d\n", speed);
  }
}

void setMotorDirection(char motor, bool forward) {
  if (motor == 'A') {
    motorAForward = forward;
    if (motorAOn) {
      digitalWrite(IN1, forward ? HIGH : LOW);
      digitalWrite(IN2, forward ? LOW : HIGH);
    }
  } else if (motor == 'B') {
    motorBForward = forward;
    if (motorBOn) {
      digitalWrite(IN3, forward ? HIGH : LOW);
      digitalWrite(IN4, forward ? LOW : HIGH);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== Setup begin ===");

  scanI2C();

  Wire.begin(21, 22);
  inaA.begin();
  inaB.begin();
  inaA.setCalibration_32V_2A();
  inaB.setCalibration_32V_2A();

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(LED, OUTPUT);  // Set LED pin as output
  digitalWrite(LED, LOW);  // Start with LED off


   ledcAttachChannel(ENA, PWM_FREQ, PWM_RES, PWM_CH_A);
  ledcAttachChannel(ENB, PWM_FREQ, PWM_RES, PWM_CH_B);
  Serial.println("PWM & motor pins initialized");

  for (int i = 0; i < SM_LEN; i++) {
    bufA[i] = bufB[i] = 0;
  }

  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    Serial.print(".");
    delay(500);
    wifiAttempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    return;
  }

  // Connect to WebSocket
  Serial.println("Connecting to WebSocket server...");
  webSocket.begin(ws_host, ws_port, ws_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(2000);
  webSocket.enableHeartbeat(20000, 3000, 2);
  
  Serial.println("=== Setup complete ===\n");
}

// ============ WebSocket Event Handler ============
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] ❌ Disconnected");
      break;
      
    case WStype_CONNECTED:
      Serial.println("[WS] ✅ Connected to server!");
      sendStatus("IDLE", "ESP32 connected and ready");
      break;
      
    case WStype_TEXT:
      Serial.printf("[WS] ← Message: %s\n", payload);
      handleCommand((char*)payload);
      break;
      
    case WStype_ERROR:
      Serial.println("[WS] ⚠️ Error");
      break;
      
    case WStype_PING:
      Serial.println("[WS] 🏓 Ping");
      break;
      
    case WStype_PONG:
      Serial.println("[WS] 🏓 Pong");
      break;
  }
}

// ============ Handle Commands from Server ============
void handleCommand(char* payload) {
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload);
  
  if (error) {
    Serial.print("❌ JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }
  
  if (doc["type"] == "command") {
    String command = doc["command"].as<String>();
    String motorStr = doc["motor"].as<String>();
    char motor = motorStr == "A" ? 'A' : 'B';
    
    Serial.printf("📥 Command: %s, Motor: %c\n", command.c_str(), motor);
    
    if (command == "START") {
      startMotor(motor);
      sendAck("Motor " + motorStr + " started");
      sendStatus("RUNNING", "Motor " + motorStr + " is now running");
    } 
    else if (command == "STOP") {
      stopMotor(motor);
      sendAck("Motor " + motorStr + " stopped");
      if (!motorAOn && !motorBOn) {
        sendStatus("IDLE", "All motors stopped");
      }
    } 
    else if (command == "SET_SPEED") {
      int value = doc["value"] | 0;
      // Convert 0-100 percentage to 0-255 PWM
      int pwmSpeed = map(value, 0, 100, 0, 255);
      setMotorSpeed(motor, pwmSpeed);
      sendAck("Motor " + motorStr + " speed set to " + String(value) + "%");
    }
    else if (command == "SET_DIRECTION") {
      String direction = doc["direction"].as<String>();
      bool forward = (direction == "forward" || direction == "FORWARD");
      setMotorDirection(motor, forward);
      sendAck("Motor " + motorStr + " direction set to " + direction);
      Serial.printf("Motor %c direction: %s\n", motor, direction.c_str());
    }
    else if (command == "FORWARD") {
      setMotorDirection(motor, true);
      sendAck("Motor " + motorStr + " set to FORWARD");
      Serial.printf("Motor %c set to FORWARD\n", motor);
    }
    else if (command == "REVERSE") {
      setMotorDirection(motor, false);
      sendAck("Motor " + motorStr + " set to REVERSE");
      Serial.printf("Motor %c set to REVERSE\n", motor);
    }
    else if (command == "RESET") {
      stopMotor('A');
      stopMotor('B');
      sendAck("All motors stopped (RESET)");
      sendStatus("IDLE", "System reset - all motors stopped");
    }
    else if (command == "LED_ON") {
      ledState = true;
      digitalWrite(LED, HIGH);  // Turn LED ON
      sendAck("LED turned ON");
      sendTelemetry();  // Send immediate telemetry update
      Serial.println("💡 LED ON");
    }
    else if (command == "LED_OFF") {
      ledState = false;
      digitalWrite(LED, LOW);  // Turn LED OFF
      sendAck("LED turned OFF");
      sendTelemetry();  // Send immediate telemetry update
      Serial.println("💡 LED OFF");
    }
  }
}

// ============ Sensor Reading with Smoothing ============
void readSensors(float &avgCurrentA, float &voltageA, float &avgCurrentB, float &voltageB) {
  // Read raw values
  float currA = inaA.getCurrent_mA();
  float currB = inaB.getCurrent_mA();
  
  // Add to smoothing buffers
  bufA[bufIndex] = currA;
  bufB[bufIndex] = currB;
  bufIndex = (bufIndex + 1) % SM_LEN;
  if (bufCount < SM_LEN) bufCount++;
  
  // Calculate averages
  float sumA = 0, sumB = 0;
  for (int i = 0; i < bufCount; i++) {
    sumA += bufA[i];
    sumB += bufB[i];
  }
  
  avgCurrentA = sumA / bufCount;
  avgCurrentB = sumB / bufCount;
  voltageA = inaA.getBusVoltage_V();
  voltageB = inaB.getBusVoltage_V();
}

// ============ Jam Detection ============
void detectJams(float currentA, float currentB) {
  // Motor A jam detection
  if (motorAOn && currentA > JAM_CURRENT_THRESHOLD && motorASpeed < 50) {
    if (jamStartTimeA == 0) {
      jamStartTimeA = millis();
    } else if (millis() - jamStartTimeA > 1000) {
      if (!isJammedA) {
        isJammedA = true;
        Serial.println("⚠️ MOTOR A JAMMED!");
        sendStatus("ERROR", "Motor A jammed - high current detected");
      }
    }
  } else {
    jamStartTimeA = 0;
    isJammedA = false;
  }
  
  // Motor B jam detection
  if (motorBOn && currentB > JAM_CURRENT_THRESHOLD && motorBSpeed < 50) {
    if (jamStartTimeB == 0) {
      jamStartTimeB = millis();
    } else if (millis() - jamStartTimeB > 1000) {
      if (!isJammedB) {
        isJammedB = true;
        Serial.println("⚠️ MOTOR B JAMMED!");
        sendStatus("ERROR", "Motor B jammed - high current detected");
      }
    }
  } else {
    jamStartTimeB = 0;
    isJammedB = false;
  }
}

// ============ Send Telemetry to Server ============
void sendTelemetry() {
  float avgCurrentA, voltageA, avgCurrentB, voltageB;
  readSensors(avgCurrentA, voltageA, avgCurrentB, voltageB);
  
  // Detect jams
  detectJams(avgCurrentA, avgCurrentB);
  
  StaticJsonDocument<512> doc;
  doc["type"] = "telemetry";
  
  JsonObject motorA = doc.createNestedObject("motorA");
  motorA["voltage"] = voltageA;
  motorA["current"] = avgCurrentA / 1000.0;  // Convert mA to A
  motorA["rpm"] = motorAOn ? map(motorASpeed, 0, 255, 0, 2000) : 0;
  motorA["status"] = motorAOn ? "running" : "idle";
  
  JsonObject motorB = doc.createNestedObject("motorB");
  motorB["voltage"] = voltageB;
  motorB["current"] = avgCurrentB / 1000.0;  // Convert mA to A
  motorB["rpm"] = motorBOn ? map(motorBSpeed, 0, 255, 0, 2000) : 0;
  motorB["status"] = motorBOn ? "running" : "idle";
  
  doc["isJammed"] = isJammedA || isJammedB;
  doc["ledState"] = ledState;  // Include LED state in telemetry
  doc["timestamp"] = getISOTimestamp();
  
  String json;
  serializeJson(doc, json);
  webSocket.sendTXT(json);
  
  // Print to serial for debugging
  Serial.printf("📊 A: %.2fV %.0fmA | B: %.2fV %.0fmA\n", 
                voltageA, avgCurrentA, voltageB, avgCurrentB);
}

// ============ Send Status Update ============
void sendStatus(String state, String message) {
  StaticJsonDocument<128> doc;
  doc["type"] = "status";
  doc["state"] = state;
  doc["message"] = message;
  
  String json;
  serializeJson(doc, json);
  webSocket.sendTXT(json);
}

// ============ Send ACK ============
void sendAck(String message) {
  StaticJsonDocument<128> doc;
  doc["type"] = "ack";
  doc["message"] = message;
  doc["success"] = true;
  
  String json;
  serializeJson(doc, json);
  webSocket.sendTXT(json);
}

// ============ Get ISO Timestamp ============
String getISOTimestamp() {
  unsigned long ms = millis();
  char timestamp[32];
  snprintf(timestamp, sizeof(timestamp), "2025-12-10T%02d:%02d:%02d.000Z",
           (int)((ms / 3600000) % 24),
           (int)((ms / 60000) % 60),
           (int)((ms / 1000) % 60));
  return String(timestamp);
}

// ============ Main Loop ============
void loop() {
  webSocket.loop();
  
  // Send telemetry at regular intervals
  if (millis() - lastTelemetry >= telemetryInterval) {
    if (webSocket.isConnected()) {
      sendTelemetry();
    }
    lastTelemetry = millis();
  }
}
