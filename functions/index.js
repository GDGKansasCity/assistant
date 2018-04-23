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
const meetupUrl = 'https://api.meetup.com/GDG-Kansas-City/events?&sign=true&photo-host=public&page=1&fields=featured_photo&only=id,venue,time,name,link,featured_photo.photo_link,description';

const Helpers = require('./helpers');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const app = dialogflow();

app.intent('meetup.next', conv => {
  return axios.get(meetupUrl)
    .then((res) => {
      const events = res.data;
      let response = "";
      let card;

      if (events.length === 0) {
        response = `There aren't any upcoming events.`;
      } else {
        const event = events[0];
        const title = event.name;
        const description = event.description;
        const eventUrl = event.link;
        let photoUrl = event.featured_photo.photo_link;

        let epochTime = event.time + event.utc_offset;
        let speakableDate = Helpers.formatDateTime(epochTime, 'dddd, MMMM Do');
        let time = Helpers.formatDateTime(epochTime, 'h:mm a');
        let speakableDateTime = speakableDate + ' at ' + time;
        let displayableDate = Helpers.formatDateTime(epochTime, 'dddd M/D');
        let displaybleDateTime = displayableDate + ', ' + time;

        const venue = event.venue;
        const venueName = venue.name;
        const addr1 = venue.address_1;
        const addr2 = venue.address_2;
        const city = venue.city;
        const state = venue.state;
        const address = Helpers.makeAddress(addr1, addr2, city, state);

        let textOutput = `What else can I help with?`;
        let speechOutput = `The next meetup is ` + title + ` at ` + venueName + ` on ` + speakableDateTime + `. ` + textOutput;
        response = new SimpleResponse({text: '', speech: speechOutput});

        // response = `The next meetup is "` + title + `" at ` + venueName + `.`;
        card = new BasicCard({
          title: title,
          subtitle: displaybleDateTime + " at " + venueName,
          text: description,
          buttons: new Button({
            title: 'Open on Meetup.com',
            url: eventUrl
          }),
          image: new Image({
            url: photoUrl,
            alt: 'Event photo',
          })
        });
      }

      conv.ask(response);
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
