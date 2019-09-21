const functions = require('firebase-functions');

// Hello world to check up status
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

const dialogflow = require('./dialogflow');
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(dialogflow.app);
