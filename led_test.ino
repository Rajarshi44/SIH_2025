/*
 * ESP32 LED WebSocket Test
 * Simple LED control via WebSocket - NO MOTORS
 * GPIO 2 - Built-in LED
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "Galaxy A14 5G";
const char* password = "potatochips";

// WebSocket Configuration
const char* ws_host = "10.252.163.187";  // Your computer's IP
const uint16_t ws_port = 3000;
const char* ws_path = "/ws/device?device_id=esp32_1&token=esp32-device-token-xyz";

// LED Pin
#define LED 2

// WebSocket Client
WebSocketsClient webSocket;

// LED State
bool ledState = false;

// Forward declarations
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length);
void handleCommand(char* payload);
void sendAck(String message);
void sendStatus(String state, String message);

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Setup LED
  pinMode(LED, OUTPUT);
  digitalWrite(LED, LOW);
  
  Serial.println("\n=== ESP32 LED WebSocket Test ===");
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    
    // Connect to WebSocket
    Serial.println("Connecting to WebSocket...");
    webSocket.begin(ws_host, ws_port, ws_path);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(2000);
    webSocket.enableHeartbeat(20000, 3000, 2);
  } else {
    Serial.println("\n❌ WiFi Connection FAILED!");
    Serial.println("Check SSID and password!");
  }
}

void loop() {
  webSocket.loop();
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] ❌ Disconnected");
      break;
      
    case WStype_CONNECTED:
      Serial.println("[WS] ✅ Connected to server!");
      sendStatus("IDLE", "ESP32 ready");
      break;
      
    case WStype_TEXT:
      Serial.printf("[WS] ← Message: %s\n", payload);
      handleCommand((char*)payload);
      break;
  }
}

void handleCommand(char* payload) {
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload);
  
  if (error) {
    Serial.println("❌ JSON parse error");
    return;
  }
  
  if (doc["type"] == "command") {
    String command = doc["command"].as<String>();
    
    if (command == "LED_ON") {
      ledState = true;
      digitalWrite(LED, HIGH);
      Serial.println("💡 LED ON");
      sendAck("LED turned ON");
    } 
    else if (command == "LED_OFF") {
      ledState = false;
      digitalWrite(LED, LOW);
      Serial.println("💡 LED OFF");
      sendAck("LED turned OFF");
    }
    else if (command == "START") {
      // Treat START as LED_ON for testing
      ledState = true;
      digitalWrite(LED, HIGH);
      Serial.println("💡 LED ON (via START)");
      sendAck("LED turned ON");
    }
    else if (command == "STOP") {
      // Treat STOP as LED_OFF
      ledState = false;
      digitalWrite(LED, LOW);
      Serial.println("💡 LED OFF (via STOP)");
      sendAck("LED turned OFF");
    }
  }
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

void sendStatus(String state, String message) {
  StaticJsonDocument<128> doc;
  doc["type"] = "status";
  doc["state"] = state;
  doc["message"] = message;
  
  String json;
  serializeJson(doc, json);
  webSocket.sendTXT(json);
}
