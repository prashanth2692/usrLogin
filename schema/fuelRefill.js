var mongoose = require('mongoose')


var fuelRefillingSchema = mongoose.Schema({
  totalAmount: Number,
  odometerReading: Number,
  file: String
})


exports = fuelRefillingSchema