const functions = require('firebase-functions');

// Hello world to check up status
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

// Dialogflow fulfillment
'use strict';

const { dialogflow, Permission, Suggestions } = require('actions-on-google');
const axios = require('axios');

const { ConversationHelper } = require('./helpers');
const Events = require('./events');
const meetupUrl = 'https://api.meetup.com/GDG-Kansas-City/events?&sign=true&photo-host=public&page=1&fields=featured_photo&only=id,venue,time,utc_offset,name,link,featured_photo.photo_link,description';

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const app = dialogflow()
  .middleware(conv => {
    conv.helper = new ConversationHelper(conv);
  });

app.intent('input.welcome', conv => {
  console.log('userValue = ' + JSON.stringify(conv.user));
  conv.helper.askForMore();
});

app.intent('recovery.fail', conv => {
  conv.ask(`Sorry, I'm having trouble understanding what you want. Try asking about the next meetup or what we do.`);
  conv.ask(new Suggestions(`Next Meetup`, `What is GDG`));
});

app.intent('demo.name', conv => {
  conv.ask(new Permission({
    context: 'To address you by name',
    permissions: 'NAME'
  }));
});

app.intent('demo.name.permission', (conv, params, granted) => {
  if (granted) {
    let name = conv.user.name;
    conv.user.storage.name = name;
    conv.ask(`Thanks ` + name.given + `. I'll use your name during this conversation.`);
  } else {
    conv.ask(`No problem. Let me know if you want me to use your name later.`);
  }
  conv.helper.askForMore();
});

app.intent('meetup.next', conv => {
  return axios.get(meetupUrl)
    .then((res) => {
      const events = res.data;
      if (events.length === 0) {
        conv.ask(`There aren't any upcoming events.`);
      } else {
        Events.mentionMeetup(conv, events[0]);
      }

      conv.helper.askForMore();
      return;
    })
    .catch((err) => {
      console.log('Error: ' + err);
      conv.ask(`Sorry, I wasn't able to look up the next meetup. Can I help with anything else?`);
    });
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
