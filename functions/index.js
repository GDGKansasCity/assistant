// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions'); 
const { dialogflow } = require('actions-on-google');
const axios = require('axios');
const meetupUrl = 'https://api.meetup.com/GDG-Kansas-City/events?&sign=true&photo-host=public&page=1&fields=featured_photo&only=id,venue,time,utc_offset,name,link,featured_photo.photo_link,description';

const Helpers = require('./helpers');
const Events = require('./events');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const app = dialogflow();

app.intent('meetup.next', conv => {
  return axios.get(meetupUrl)
    .then((res) => {
      const events = res.data;
      if (events.length === 0) {
        conv.ask(`There aren't any upcoming events.`);
      } else {
        Events.mentionMeetup(conv, events[0]);
      }

      conv.ask(`What else can I help with?`);
      return;
    })
    .catch((err) => {
      console.log('Error: ' + err);
      conv.ask(`Sorry, I wasn't able to look up the next meetup. Can I help with anything else?`);
      });
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
