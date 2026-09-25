#include <Wire.h> 
#include <Adafruit_GFX.h> 
#include <Adafruit_SSD1306.h> 
#include <Servo.h> 

// ================= PIN =================
#define HAND_TRIG 2 
#define HAND_ECHO 3 
#define FILL_TRIG 4      
#define FILL_ECHO 5 
#define SERVO_PIN 6 
#define GREEN_LED 7 
#define RED_LED 8 

// ================= OLED =================
Adafruit_SSD1306 display(128, 64, &Wire, -1); 

// ================= SERVO =================
Servo lidServo; 

#define HAND_DISTANCE 15 

bool lidOpen = false;
int lastFillLevel = 0;

// ================= SMOOTH SERVO =================
void moveServoSmooth(int startAngle, int endAngle, int stepDelay) {
  if (startAngle < endAngle) {
    for (int pos = startAngle; pos <= endAngle; pos++) {
      lidServo.write(pos);
      delay(stepDelay);
    }
  } else {
    for (int pos = startAngle; pos >= endAngle; pos--) {
      lidServo.write(pos);
      delay(stepDelay);
    }
  }
}

// ================= ULTRASONIC =================
long getDistance(int trigPin, int echoPin) { 
  digitalWrite(trigPin, LOW); 
  delayMicroseconds(2); 

  digitalWrite(trigPin, HIGH); 
  delayMicroseconds(10); 
  digitalWrite(trigPin, LOW); 

  long duration = pulseIn(echoPin, HIGH, 30000); 
  if (duration == 0) return 999; 

  return duration * 0.0343 / 2; 
} 

// ================= OLED =================
void showOLED(String l1, String l2, String l3) { 
  display.clearDisplay(); 
  display.setTextColor(SSD1306_WHITE); 

  display.setTextSize(2); 
  display.setCursor(0, 0); 
  display.println(l1); 

  display.setTextSize(1); 
  display.setCursor(0, 28); 
  display.println(l2); 

  display.setCursor(0, 42); 
  display.println(l3); 

  display.display(); 
} 

// ================= SETUP =================
void setup() { 
  Serial.begin(9600); 
  Wire.begin();  

  pinMode(HAND_TRIG, OUTPUT); 
  pinMode(HAND_ECHO, INPUT); 
  pinMode(FILL_TRIG, OUTPUT); 
  pinMode(FILL_ECHO, INPUT); 
  pinMode(GREEN_LED, OUTPUT); 
  pinMode(RED_LED, OUTPUT); 

  lidServo.attach(SERVO_PIN); 
  lidServo.write(0); 

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    while (1); 
  } 

  showOLED("READY", "System Boot", "Starting..."); 
  delay(2000); 
}

// ================= LOOP =================
void loop() { 

  long handDistance = getDistance(HAND_TRIG, HAND_ECHO);

  Serial.print("HAND: ");
  Serial.println(handDistance);

  // ================= HAND DETECT =================
  if (handDistance <= HAND_DISTANCE && !lidOpen) {

    lidOpen = true;

    showOLED("OPEN", "Hand detected", "Opening...");

    // 🐢 SLOW OPEN (changed here)
    moveServoSmooth(0, 90, 30);  

    delay(500); 

    // ✅ Measure ONLY when open
    long fillDistance = getDistance(FILL_TRIG, FILL_ECHO);

    if (fillDistance != 999) {
      int fillLevel = map(fillDistance, 30, 5, 0, 100);
      fillLevel = constrain(fillLevel, 0, 100);
      lastFillLevel = fillLevel;
    }

    delay(1500); 

    // ⚡ Slightly faster close (feels natural)
    showOLED("CLOSING", "Please wait", "");
    moveServoSmooth(90, 0, 15);  

    lidOpen = false;
  }

  // ================= DISPLAY =================
  char buffer[20];
  sprintf(buffer, "Fill: %d%%", lastFillLevel);

  if (lastFillLevel >= 85) {
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED, HIGH);
    showOLED("FULL!", buffer, "Empty bin");
  } 
  else if (lastFillLevel >= 60) {
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED, HIGH);
    showOLED("WARNING", buffer, "Almost full");
  } 
  else {
    digitalWrite(RED_LED, LOW);
    digitalWrite(GREEN_LED, HIGH);
    showOLED("READY", buffer, "System OK");
  }

  delay(500);
}