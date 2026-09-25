const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  level: Number,
  distance: Number,
  time: String
});

module.exports = mongoose.model("Data", schema);