#define BLYNK_PRINT Serial
#define BLYNK_TEMPLATE_ID "TMPL3ZO1MoFph"
#define BLYNK_TEMPLATE_NAME "sih"
#define BLYNK_AUTH_TOKEN "jqgvOmWQYbb-LOwqjXL3oCNKJtqyRBrU"

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <Adafruit_INA219.h>

const char ssid[] = "Deepam";
const char pass[] = "buddy1234";

// Updated pin mapping
#define ENA  25
#define IN1  26
#define IN2  27

#define ENB  33
#define IN3  32
#define IN4  35

const uint32_t PWM_FREQ = 20000;
const uint8_t PWM_RES = 8;
const uint8_t PWM_CH_A = 0;
const uint8_t PWM_CH_B = 1;

int motorASpeed = 0;
int motorBSpeed = 0;
bool motorAOn = false;
bool motorBOn = false;

Adafruit_INA219 inaA(0x40);
Adafruit_INA219 inaB(0x41);

const int SM_LEN = 8;
float bufA[SM_LEN];
float bufB[SM_LEN];
int bufIndex = 0;
int bufCount = 0;

BlynkTimer timer;

void scanI2C() {
  Serial.println("\nI2C Scanner start");
  Wire.begin(21, 22);
  byte error, address;
  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    if (error == 0) {
      Serial.print("I2C device found at 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
    }
  }
  Serial.println("--- Scanner done ---");
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


   ledcAttachChannel(ENA, PWM_FREQ, PWM_RES, PWM_CH_A);
  ledcAttachChannel(ENB, PWM_FREQ, PWM_RES, PWM_CH_B);
  Serial.println("PWM & motor pins initialized");

  for (int i = 0; i < SM_LEN; i++) {
    bufA[i] = bufB[i] = 0;
  }

  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi connected");
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);
  timer.setInterval(1000L, reportSensors);
}

// Blynk controls
BLYNK_WRITE(V1) { motorASpeed = param.asInt(); if (motorAOn) ledcWrite(PWM_CH_A, motorASpeed); }
BLYNK_WRITE(V2) { motorBSpeed = param.asInt(); if (motorBOn) ledcWrite(PWM_CH_B, motorBSpeed); }

BLYNK_WRITE(V3) {
  motorAOn = param.asInt();
  if (motorAOn) {
    digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
    ledcWrite(PWM_CH_A, motorASpeed);
  } else {
    ledcWrite(PWM_CH_A, 0);
    digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
  }
}

BLYNK_WRITE(V4) {
  motorBOn = param.asInt();
  if (motorBOn) {
    digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
    ledcWrite(PWM_CH_B, motorBSpeed);
  } else {
    ledcWrite(PWM_CH_B, 0);
    digitalWrite(IN3, LOW); digitalWrite(IN4, LOW);
  }
}

void reportSensors() {
  float currA = inaA.getCurrent_mA();
  float voltA = inaA.getBusVoltage_V();
  float currB = inaB.getCurrent_mA();
  float voltB = inaB.getBusVoltage_V();

  bufA[bufIndex] = currA;
  bufB[bufIndex] = currB;
  bufIndex = (bufIndex + 1) % SM_LEN;
  if (bufCount < SM_LEN) bufCount++;

  float sumA = 0, sumB = 0;
  for (int i = 0; i < bufCount; i++) {
    sumA += bufA[i];
    sumB += bufB[i];
  }

  float avgA = sumA / bufCount;
  float avgB = sumB / bufCount;

  Blynk.virtualWrite(V5, voltA);
  Blynk.virtualWrite(V6, avgA);
  Blynk.virtualWrite(V7, voltB);
  Blynk.virtualWrite(V8, avgB);

  Serial.printf("MOTOR A: V=%.2f I=%.2f mA | MOTOR B: V=%.2f I=%.2f mA\n", voltA, avgA, voltB, avgB);
}

void loop() {
  Blynk.run();
  timer.run();
}
