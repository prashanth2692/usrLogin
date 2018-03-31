var mongoose = require('mongoose')


var fuelRefillingSchema = new mongoose.Schema({
  totalAmount: Number,
  odometerReading: Number,
  file: String,
  dateTime: Date
})


module.exports = mongoose.model('fuelRefilling', fuelRefillingSchema, 'fuelRefilling')