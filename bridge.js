const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const axios = require("axios");

const SERIAL_PORT = "COM7";
const BAUD_RATE = 9600;
const BACKEND_URL = "http://localhost:5000/data";

let handDistance = 0;
let fillDistance = 0;
let fillLevel = 0;

console.log("");
console.log("======================================");
console.log("     🚀 SMART DUSTBIN BRIDGE");
console.log("======================================");
console.log(`🔌 Arduino : ${SERIAL_PORT}`);
console.log(`📡 Baud    : ${BAUD_RATE}`);
console.log(`🌐 Backend : ${BACKEND_URL}`);
console.log("");

const port = new SerialPort({
  path: SERIAL_PORT,
  baudRate: BAUD_RATE
});

const parser = port.pipe(
  new ReadlineParser({
    delimiter: "\n"
  })
);

port.on("open", () => {
  console.log("✅ Arduino connected!");
  console.log("📡 Waiting for sensor data...");
  console.log("");
});

port.on("error", (err) => {
  console.error("❌ Serial error:", err.message);
});

parser.on("data", async (raw) => {

  const message = raw.trim();

  if (!message) return;

  console.log(`📥 ${message}`);

  // ------------------------------------------
  // HAND DISTANCE
  // ------------------------------------------

  const handMatch = message.match(
    /HAND:\s*([\d.]+)\s*cm/i
  );

  if (handMatch) {

    handDistance = Number(handMatch[1]);

    console.log(
      `✋ Hand distance = ${handDistance} cm`
    );

    return;
  }

  // ------------------------------------------
  // FILL DISTANCE
  // ------------------------------------------

  const fillMatch = message.match(
    /FILL:\s*([\d.]+)\s*cm/i
  );

  if (fillMatch) {

    fillDistance = Number(fillMatch[1]);

    console.log(
      `🗑️ Fill distance = ${fillDistance} cm`
    );

    return;
  }

  // ------------------------------------------
  // FILL LEVEL
  // ------------------------------------------

  const levelMatch = message.match(
    /FILL LEVEL:\s*([\d.]+)\s*%/i
  );

  if (levelMatch) {

    fillLevel = Number(levelMatch[1]);

    console.log(
      `📊 Fill level = ${fillLevel}%`
    );

    await sendData();

    return;
  }

  console.log("ℹ️ Arduino message ignored");
});

// ------------------------------------------
// SEND TO BACKEND
// ------------------------------------------

async function sendData() {

  const payload = {

    binId: "BIN_01",

    level: fillLevel,

    distance: fillDistance,

    weight: Number(
      (fillLevel * 0.8).toFixed(2)
    )

  };

  console.log("");
  console.log("📤 Sending data:");
  console.log(JSON.stringify(payload, null, 2));

  try {

    const response = await axios.post(
      BACKEND_URL,
      payload,
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 5000
      }
    );

    console.log(
      "✅ Backend response:",
      response.data
    );

    console.log("");

  } catch (error) {

    console.error(
      "❌ Backend request failed:",
      error.message
    );

    if (error.response) {

      console.error(
        "HTTP:",
        error.response.status
      );

      console.error(
        error.response.data
      );
    }

    console.log("");
  }
}

port.on("close", () => {

  console.log("");
  console.log("🔌 Arduino connection closed");

});