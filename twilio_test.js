const accountSid = 'AC1b001fb44e8653d923ab09b25b991398';
const authToken = 'f809acf6f289f4d93818b7c12846155b';
const client = require('twilio')(accountSid, authToken);

client.messages
  .create({
    body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
    from: '+12602010488',
    to: '+917093974017'
  })
  .then(message => console.log(message.sid))
  .catch(err => { console.log(err) })
  .done();


// send to whatsapp
const accountSid = 'AC1b001fb44e8653d923ab09b25b991398';
const authToken = '[AuthToken]';
const client = require('twilio')(accountSid, authToken);

client.messages
  .create({
    body: 'Your Yummy Cupcakes Company order of 1 dozen frosted cupcakes has shipped and should be delivered on July 10, 2019. Details: http://www.yummycupcakes.com/',
    from: 'whatsapp:+14155238886',
    to: 'whatsapp:+917093974017'
  })
  .then(message => console.log(message.sid))
  .done();