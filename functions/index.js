const functions = require('firebase-functions');

// Hello world to check up status
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

// Dialogflow fulfillment
'use strict';

const { dialogflow, Permission, Suggestions, Confirmation, SimpleResponse } = require('actions-on-google');
const axios = require('axios');

const { ConversationHelper } = require('./helpers');
const Events = require('./events');
const { Meetup, Group } = require('./meetup');
const meetupUrl = 'https://api.meetup.com/GDG-Kansas-City/events?&sign=true&photo-host=public&page=1&fields=featured_photo&only=id,venue,time,utc_offset,name,link,featured_photo.photo_link,description';

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const app = dialogflow()
  .middleware(conv => {
    conv.helper = new ConversationHelper(conv);
  });

app.intent('input.welcome', conv => {
  console.log('userValue = ' + JSON.stringify(conv.user));
  let name = conv.user.name.given;
  if (name !== undefined) {
    conv.ask(`Hi ` + name + `! What can I do for you today?`);
  } else {
    conv.helper.askOneOf([
      `Hi there! What can I do for you?`,
      `Hello, how can I help you?`
    ]);
  }
});

app.intent('recovery.fail', conv => {
  conv.ask(`Sorry, I'm having trouble understanding what you want. Try asking about the next meetup or what we do.`);
  conv.ask(new Suggestions(`Next Meetup`, `What is GDG`));
});

app.intent('usename', conv => {
  conv.ask(new Permission({
    context: 'To address you by name',
    permissions: 'NAME'
  }));
});

app.intent('usename.permission', (conv, params, granted) => {
  if (granted) {
    let name = conv.user.name;
    conv.user.storage.name = name;

    // https://developers.google.com/actions/assistant/save-data#nodejs
    conv.ask(new Confirmation(`Thanks ` + name.given + `! Would you like me to save your name so I don't have to ask every time? Otherwise, I'll only remember during this conversation.`));
    conv.contexts.set('confirmation-request-NAME', 1);
  } else {
    conv.ask(`No problem. Let me know if you want me to use your name later.`);
    conv.helper.askForMore();
  }
});

app.intent('usename.persistconfirmation', (conv, params, granted) => {
  if (granted) {
    conv.user.storage.name = conv.user.name;
    conv.ask(`I'll remember your name for next time.`);
  } else {
    conv.ask(`No problem. You can ask me again later if you change your mind.`);
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

app.intent('group.closest', conv => {
  console.log('intent: group.closest');
  conv.ask(new Permission({
    context: 'To find the nearest GDG',
    permissions: 'DEVICE_PRECISE_LOCATION'
  }));
});

app.intent('group.closest.permission', (conv, params, granted) => {
  console.log('intent: group.closest.permission');
  if (!granted) return conv.ask('No worries');

  // TODO: on Google Home, support DEVICE_COARSE_LOCATION
  let location = conv.device.location.coordinates;
  conv.user.data = { location: location };

  let meetup = new Meetup();
  return meetup.nearbyGroups(location.longitude, location.latitude)
    .then((groups) => {
      if (groups.length === 0) {
        conv.ask(`Looks like there aren't any GDGs near you.`);
        // TODO: start one
        conv.helper.askForMore();

      } else { // TODO: support lists
        let group = groups[0];

        conv.ask(new SimpleResponse({
          text: `Here's the closest group to you.`,
          speech: group.name + ` is the closest group to you.`
        }));
        conv.helper.showGroup(group);
        conv.helper.askForMore();
      }
    });
});

app.intent('group.closest_old', conv => {
  let meetup = new Meetup();
  return meetup.nearbyGroups(0, 0)
    .then((groups) => {
      if (groups.length === 0) {
        conv.ask(`Looks like there aren't any GDGs near you.`);
        conv.helper.askForMore();

      } else if (groups.length === 1) {
        let group = groups[0];
        conv.ask(new SimpleResponse({
          text: `Here's the closest group to you.`,
          speech: group.name + ` is the closest group to you.`
        }));
        conv.helper.showGroup(group);
        conv.helper.askForMore();

      } else {
        conv.ask(`Here are the closest groups to you.`);
        conv.helper.selectFromGroups(groups);
        // TODO: listen for selection
      }
      return;
    })
    .catch((err) => {
      console.error('Error: ' + err);
      conv.ask(`Oops, I ran into a problem finding groups near you.`);
      conv.helper.askForMore();
    });
});

// app.intent('group.closest', conv => {
//   console.log('including ?');
//   return axios.get('https://api.meetup.com/pro/gdg/groups?key=' + Keys.meetup_token + '&sign=true')
//     .then((res) => {
//       console.log('pro groups data = ' + JSON.stringify(res.data));
//       conv.ask(`Look at the logs for the group data.`);
//       return;
//     })
//     .catch((err) => {
//       console.error('Error: ' + err);
//       console.log(err.response);
//       console.log(err.response.data);
//       conv.ask(`Look at the logs for an error.`);
//     })
//     .then(() => {
//       conv.helper.askForMore();
//       return;
//     });
// });

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
