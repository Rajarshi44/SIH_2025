/*
 * Sohojpaat ESP32 WebSocket Client
 * 
 * This code connects the ESP32 to the Sohojpaat Next.js backend via WebSocket
 * and enables real-time bidirectional communication for motor control.
 * 
 * Hardware:
 * - ESP32 Dev Board
 * - 2x INA219 Current Sensors (I2C addresses: 0x40, 0x41)
 * - L298N Motor Driver
 * - 2x DC Motors
 * 
 * Pin Configuration:
 * - Motor A: ENA=25, IN1=26, IN2=27
 * - Motor B: ENB=33, IN3=32, IN4=35
 * - I2C: SDA=21, SCL=22
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_INA219.h>

// ============ WiFi Configuration ============
const char* ssid = "Galaxy A14 5G";          // Change this
const char* password = "potatochips";   // Change this

// ============ WebSocket Configuration ============
const char* ws_host = "10.121.155.187";  // Your server IP address
const uint16_t ws_port = 3000;
const char* ws_path = "/ws/device?device_id=esp32_1&token=esp32-device-token-xyz";

// ============ Motor Configuration ============
#define MOTOR_A_ENA 25
#define MOTOR_A_IN1 26
#define MOTOR_A_IN2 27

#define MOTOR_B_ENB 33
#define MOTOR_B_IN3 32
#define MOTOR_B_IN4 35

#define PWM_FREQ 5000
#define PWM_RESOLUTION 8
#define PWM_CHANNEL_A 0
#define PWM_CHANNEL_B 1

// ============ Current Sensors ============
Adafruit_INA219 ina219_A(0x40);  // Motor A sensor
Adafruit_INA219 ina219_B(0x41);  // Motor B sensor

// ============ WebSocket Client ============
WebSocketsClient webSocket;

// ============ Motor State ============
struct MotorState {
  bool running;
  int speed;         // 0-100
  bool forward;
  float voltage;
  float current;
  int rpm;
};

MotorState motorA = {false, 0, true, 0, 0, 0};
MotorState motorB = {false, 0, true, 0, 0, 0};

// ============ Timing ============
unsigned long lastTelemetry = 0;
const unsigned long telemetryInterval = 1000; // Send every 1 second

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== Sohojpaat ESP32 WebSocket Client ===");
  
  // Initialize I2C
  Wire.begin();
  
  // Initialize current sensors
  if (!ina219_A.begin()) {
    Serial.println("Failed to find Motor A INA219 sensor!");
  }
  if (!ina219_B.begin()) {
    Serial.println("Failed to find Motor B INA219 sensor!");
  }
  
  // Setup motor pins
  pinMode(MOTOR_A_IN1, OUTPUT);
  pinMode(MOTOR_A_IN2, OUTPUT);
  pinMode(MOTOR_B_IN3, OUTPUT);
  pinMode(MOTOR_B_IN4, OUTPUT);
  
  // Setup PWM
  ledcSetup(PWM_CHANNEL_A, PWM_FREQ, PWM_RESOLUTION);
  ledcSetup(PWM_CHANNEL_B, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(MOTOR_A_ENA, PWM_CHANNEL_A);
  ledcAttachPin(MOTOR_B_ENB, PWM_CHANNEL_B);
  
  // Stop motors initially
  stopMotor('A');
  stopMotor('B');
  
  // Connect to WiFi
  connectWiFi();
  
  // Connect to WebSocket
  webSocket.begin(ws_host, ws_port, ws_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(3000);
  webSocket.enableHeartbeat(15000, 3000, 2);  // ping every 15s, timeout 3s, 2 retries
  
  Serial.println("Setup complete!");
}

void loop() {
  webSocket.loop();
  
  // Send telemetry at regular intervals
  if (millis() - lastTelemetry >= telemetryInterval) {
    readSensors();
    sendTelemetry();
    lastTelemetry = millis();
  }
}

// ============ WiFi Functions ============
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

// ============ WebSocket Event Handler ============
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected");
      break;
      
    case WStype_CONNECTED:
      Serial.println("[WS] Connected to server");
      sendStatus("IDLE", "ESP32 connected and ready");
      break;
      
    case WStype_TEXT:
      Serial.printf("[WS] Received: %s\n", payload);
      handleCommand((char*)payload);
      break;
      
    case WStype_ERROR:
      Serial.println("[WS] Error occurred");
      break;
      
    case WStype_PING:
      Serial.println("[WS] Ping");
      break;
      
    case WStype_PONG:
      Serial.println("[WS] Pong");
      break;
  }
}

// ============ Command Handler ============
void handleCommand(char* payload) {
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload);
  
  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }
  
  if (doc["type"] == "command") {
    String command = doc["command"].as<String>();
    String motor = doc["motor"].as<String>();
    char motorChar = motor == "A" ? 'A' : 'B';
    
    Serial.printf("Command: %s, Motor: %c\n", command.c_str(), motorChar);
    
    if (command == "START") {
      startMotor(motorChar);
      sendAck("Motor " + motor + " started");
    } 
    else if (command == "STOP") {
      stopMotor(motorChar);
      sendAck("Motor " + motor + " stopped");
    } 
    else if (command == "SET_SPEED") {
      int speed = doc["value"] | 0;
      setMotorSpeed(motorChar, speed);
      sendAck("Motor " + motor + " speed set to " + String(speed) + "%");
    }
    else if (command == "RESET") {
      stopMotor('A');
      stopMotor('B');
      sendAck("All motors stopped (RESET)");
    }
  }
}

// ============ Motor Control Functions ============
void startMotor(char motor) {
  if (motor == 'A') {
    motorA.running = true;
    digitalWrite(MOTOR_A_IN1, motorA.forward ? HIGH : LOW);
    digitalWrite(MOTOR_A_IN2, motorA.forward ? LOW : HIGH);
    ledcWrite(PWM_CHANNEL_A, map(motorA.speed, 0, 100, 0, 255));
    Serial.println("Motor A started");
  } else {
    motorB.running = true;
    digitalWrite(MOTOR_B_IN3, motorB.forward ? HIGH : LOW);
    digitalWrite(MOTOR_B_IN4, motorB.forward ? LOW : HIGH);
    ledcWrite(PWM_CHANNEL_B, map(motorB.speed, 0, 100, 0, 255));
    Serial.println("Motor B started");
  }
}

void stopMotor(char motor) {
  if (motor == 'A') {
    motorA.running = false;
    digitalWrite(MOTOR_A_IN1, LOW);
    digitalWrite(MOTOR_A_IN2, LOW);
    ledcWrite(PWM_CHANNEL_A, 0);
    Serial.println("Motor A stopped");
  } else {
    motorB.running = false;
    digitalWrite(MOTOR_B_IN3, LOW);
    digitalWrite(MOTOR_B_IN4, LOW);
    ledcWrite(PWM_CHANNEL_B, 0);
    Serial.println("Motor B stopped");
  }
}

void setMotorSpeed(char motor, int speed) {
  speed = constrain(speed, 0, 100);
  
  if (motor == 'A') {
    motorA.speed = speed;
    if (motorA.running) {
      ledcWrite(PWM_CHANNEL_A, map(speed, 0, 100, 0, 255));
    }
    Serial.printf("Motor A speed: %d%%\n", speed);
  } else {
    motorB.speed = speed;
    if (motorB.running) {
      ledcWrite(PWM_CHANNEL_B, map(speed, 0, 100, 0, 255));
    }
    Serial.printf("Motor B speed: %d%%\n", speed);
  }
}

// ============ Sensor Reading ============
void readSensors() {
  // Read Motor A
  motorA.voltage = ina219_A.getBusVoltage_V();
  motorA.current = ina219_A.getCurrent_mA() / 1000.0;  // Convert to Amps
  
  // Read Motor B
  motorB.voltage = ina219_B.getBusVoltage_V();
  motorB.current = ina219_B.getCurrent_mA() / 1000.0;
  
  // Calculate RPM (simplified - you may need encoder for accurate RPM)
  if (motorA.running) {
    motorA.rpm = map(motorA.speed, 0, 100, 0, 2000);
  } else {
    motorA.rpm = 0;
  }
  
  if (motorB.running) {
    motorB.rpm = map(motorB.speed, 0, 100, 0, 2000);
  } else {
    motorB.rpm = 0;
  }
}

// ============ WebSocket Send Functions ============
void sendTelemetry() {
  StaticJsonDocument<512> doc;
  doc["type"] = "telemetry";
  
  JsonObject motorAData = doc.createNestedObject("motorA");
  motorAData["voltage"] = motorA.voltage;
  motorAData["current"] = motorA.current;
  motorAData["rpm"] = motorA.rpm;
  motorAData["status"] = motorA.running ? "running" : "idle";
  
  JsonObject motorBData = doc.createNestedObject("motorB");
  motorBData["voltage"] = motorB.voltage;
  motorBData["current"] = motorB.current;
  motorBData["rpm"] = motorB.rpm;
  motorBData["status"] = motorB.running ? "running" : "idle";
  
  // Check for jam detection (high current)
  bool isJammed = (motorA.current > 3.0 || motorB.current > 3.0);
  doc["isJammed"] = isJammed;
  
  doc["timestamp"] = getISOTimestamp();
  
  String json;
  serializeJson(doc, json);
  webSocket.sendTXT(json);
}

void sendStatus(String state, String message) {
  StaticJsonDocument<128> doc;
  doc["type"] = "status";
  doc["state"] = state;
  doc["message"] = message;
  
  String json;
  serializeJson(doc, json);
  webSocket.sendTXT(json);
}

void sendAck(String message) {
  StaticJsonDocument<128> doc;
  doc["type"] = "ack";
  doc["message"] = message;
  doc["success"] = true;
  
  String json;
  serializeJson(doc, json);
  webSocket.sendTXT(json);
}

// ============ Utility Functions ============
String getISOTimestamp() {
  // Simple timestamp (you can use NTP for real time)
  unsigned long ms = millis();
  char timestamp[32];
  snprintf(timestamp, sizeof(timestamp), "2025-12-10T%02d:%02d:%02d.000Z",
           (int)((ms / 3600000) % 24),
           (int)((ms / 60000) % 60),
           (int)((ms / 1000) % 60));
  return String(timestamp);
}
