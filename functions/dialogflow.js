// Dialogflow fulfillment
'use strict';

const { dialogflow, Permission, Suggestions, Confirmation, SimpleResponse } = require('actions-on-google');
const axios = require('axios');

const { ConversationHelper, DataHelper } = require('./helpers');
const { Meetup, Group, Event } = require('./meetup');

// process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const app = dialogflow({
  debug: true,
  // verification: {
  //   "Auth": "a2bd12e3-a233-406f-8346-8919d012b015"
  // }
}).middleware((conv, app) => {
  console.log('Start middleware init');
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
  return meetup(conv);
});
app.intent('suggestion.nextmeetup.yes', conv => {
  return meetup(conv);
});

function meetup(conv) {
  let meetupID = "GDG-Kansas-City"; // TODO: conv.user.storage.meetup
  if (!meetupID) return conv.ask(`Find the nearest group first.`);

  let meetup = new Meetup();
  console.log('meetupID: ' + meetupID);
  return meetup.eventsForGroup(meetupID)
    .then((events) => {
      console.log('Received events array');
      if (events.length === 0) {
        conv.ask(`This group doesn't have any meetups scheduled yet.`);
      } else {
        // TODO: more than one
        let event = events[0];
        const dataHelper = new DataHelper();
        let time = dataHelper.formatDateTime(event.time, 'h:mm a');
        let speakableDate = dataHelper.formatDateTime(event.time, 'dddd, MMMM Do');
        let speakableDateTime = speakableDate + ' at ' + time;
        conv.ask(new SimpleResponse({
          text: `Here's the next meetup.`,
          speech: `The next meetup is ` + event.name + ` on ` + speakableDateTime
        }));
        conv.helper.showEvent(event);
      }
      conv.helper.askForMore();
    })
    .catch((error) => {
      console.error(error);
      conv.ask(`Whoops, I had trouble getting the next meetup. Can I help with anything else?`);
    });
}

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
  conv.user.storage.location = location;

  let meetup = new Meetup();
  return meetup.nearbyGroups(location.longitude, location.latitude)
    .then((groups) => {
      if (groups.length === 0) {
        conv.ask(`Looks like there aren't any GDGs near you.`);
        // TODO: start one
        conv.helper.askForMore();

      } else if (groups.length === 1) {
        // TODO: groups array doesn't seem to be ordered by distance
        let group = groups[0];

        // TODO: need to confirm this?
        conv.user.storage.meetup = group.meetupID;

        conv.ask(new SimpleResponse({
          text: `Here's the closest group to you.`,
          speech: group.name + ` is the closest group to you.`
        }));
        conv.helper.showGroup(group);
        conv.helper.askForMore();
      } else {
        let items = {};
        groups.forEach(group => {
          
        });
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

app.intent('group.select', conv => {
  var { Group, Lookup } = require('./lookup');
  // Lookup().
});

module.exports = {
  app
};
