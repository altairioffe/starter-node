const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const twilio = require('twilio');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
require('dotenv').config(); //to pull .env 

//nodemodules/twilio/lib/rest/Twilio.js

// Load configuration information from system environment variables.
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Create an authenticated client to access the Twilio REST API
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const app = express();

// view engine setup 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// render home page
app.get('/', function(req, res, next) {
  res.render('index');
});

//1. CUSTOMER HITS CONFIRM ORDER / PAYMENT, creates post request to /message
//2.1 SERVER handles a POST request to send SMS to restaurant (sent via ajax on our home page)
app.post('/message', function(req, res, next) {
  // Use the REST client to send a text message
  client.messages.create({
    to: '+16474445945',
    from: TWILIO_PHONE_NUMBER,
    body: req.body.message
    //'New Order Text Sent!'
  }).then(function(message) {
    // When we get a response from Twilio, respond to the HTTP POST request
    res.redirect('/confirmed');
  });
});

// OR 2.2 SERVER handles a POST request to make an outbound call (sent via ajax on our home page)
app.post('/call', function(req, res, next) {
  // Use the REST client to send a text message
  client.calls.create({
    to: req.body.to,
    from: TWILIO_PHONE_NUMBER,
    url: 'http://demo.twilio.com/docs/voice.xml'
  }).then(function(message) {
    // When we get a response from Twilio, respond to the HTTP POST request
    res.send('Call incoming!');
  });
});

//RENDERS ORDER CONFIRMATION PAGE W MAP
app.get('/confirmed', function(req, res, next) {
  res.render('confirmation');
});



//Helper FUNCTION, send text reminding customer to leave CAN BE TEXT OR CALL
const remindCustomerToLeave = function() {
  client.messages.create({
    to: '+12266788585', //CHANGE TO ADD 2nd PHONE NUMBER;
    from: TWILIO_PHONE_NUMBER,
    body: 'You should leave to pick up your order now!' 
  }).then((message)=> console.log('FROM REMINDER .THEN FUNCTION: ', message.body));
};



//LISTEN FOR SMS  **NEED TO CONFIGURE ROUTE ON VALID DOMAIN / SERVER / DOES NOT WORK ON LOCALHOST
app.post('/inbound', (req, res) => {
  remindCustomerToLeave();
  const twiml = new MessagingResponse();

  twiml.message('Thanks for confirming ETA!');
  res.writeHead(200, {'Content-Type': 'text/xml'});
  console.log('TRIGGERED FROM INBOUND ROUTE: ', req.Body);
  res.end(twiml.toString());

});

// Create a TwiML document to provide instructions for an outbound call
app.post('/hello', function(req, res, next) {
  // Create a TwiML generator
  const twiml = new twilio.twiml.VoiceResponse();
  // const twiml = new twilio.TwimlResponse();
  twiml.say('Hello there! You have successfully configured a web hook.');
  twiml.say('Good luck on your Twilio quest!', { 
      voice:'woman' 
  });

  // Return an XML response to this request
  res.set('Content-Type','text/xml');
  res.send(twiml.toString());
});




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//console.log(twilio)
module.exports = app;


////////


// let order = {
//   item: {
//     quantity: 0
//   },
//   subtotal
  
// };

// const increaseItemQuantity = function(item) {
//   order[item].quantity++;
//   order[subtotal] = order.subtotal += item.price;
// };


// const decreaseItemQuantity = function(item) {
//   if (order[item].quantity > 0) {
//     order[item].quantity--;
//     order[subtotal] = order.subtotal -= item.price;
//   }
// };

// const generateRandomString = function() {
//   let random = [];
//   let characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 1, 2, 3, 4, 5, 6, 7, 8, 9];
//   for (let i = 0; i < 6; i++) {
//     random.push(characters[(Math.floor(Math.random() * 18))]);
//   }
//   return random.join('');
// };