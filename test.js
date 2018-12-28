var mongoose = require('mongoose')

mongoose.connect("mongodb://localhost:27017/mydb");

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


var kittySchema = mongoose.Schema({
  name: String,
  qwe: String
});


var Kitten1 = mongoose.model('Kitten', kittySchema);



db.once('open', function () {
  console.log('db connection established')
  var silence = new Kitten1({ name: 'Silence', });
  console.log(silence);
  silence.save()

  Kitten1.find(function (err, docs) {
    console.log(docs)
  })
});
