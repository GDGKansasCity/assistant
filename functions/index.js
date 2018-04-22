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
const {
  dialogflow,
  BasicCard,
  BrowseCarousel,
  BrowseCarouselItem,
  Button,
  Carousel,
  Image,
  LinkOutSuggestion,
  List,
  MediaObject,
  Suggestions,
  SimpleResponse,
 } = require('actions-on-google');
const axios = require('axios');
const meetupUrl = 'https://api.meetup.com/GDG-Kansas-City/events?&sign=true&photo-host=public&page=1&fields=featured_photo&status=upcoming&only=id,venue.name,utc_offset,time,name,link,featured_photo';

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const app = dialogflow();

app.intent('meetup.next', conv => {
  console.log('meetup.next without agent');
  return axios.get(meetupUrl)
    .then((res) => {
      const events = res.data;
      let prettyResponse = "";
      let card;
      if (events.length === 0) {
        prettyResponse = `There aren't any upcoming events.`;
      } else {
        const event = events[0];
        const name = event.name;
        const location = event.venue.name;
        const eventUrl = event.link;
        prettyResponse = `The next meetup is "` + name + `" at ` + location + `.`;
        card = new BasicCard({
          title: name,
          subtitle: location,
          text: `Description goes here`,
          buttons: new Button({
            title: `Open on Meetup.com`,
            url: eventUrl
          })
        });
      }

      conv.ask(prettyResponse + ` What else can I help with?`);
      if (card !== undefined) {
        conv.ask(card);
      }
      return;
    })
    .catch((err) => {
      console.log('Error: ' + err);
      conv.ask(`Sorry, I wasn't able to look up the next meetup. Can I help with anything else?`);
      });
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
