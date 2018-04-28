const { SimpleResponse, BasicCard, Button, Image } = require('actions-on-google');
const { DataHelper } = require('./helpers');

const dataHelper = new DataHelper();

// Returns { simpleResponse, basicCard }
exports.mentionMeetup = function (conv, event) {
  const title = event.name;
  const description = event.description;
  const eventUrl = event.link;
  let photoUrl = event.featured_photo.photo_link;

  let epochTime = event.time + event.utc_offset;
  let time = dataHelper.formatDateTime(epochTime, 'h:mm a');
  let speakableDate = dataHelper.formatDateTime(epochTime, 'dddd, MMMM Do');
  let speakableDateTime = speakableDate + ' at ' + time;
  let displayableDate = dataHelper.formatDateTime(epochTime, 'dddd M/D');
  let displaybleDateTime = displayableDate + ', ' + time;

  const venue = event.venue;
  const venueName = venue.name;
  const addr1 = venue.address_1;
  const addr2 = venue.address_2;
  const city = venue.city;
  const state = venue.state;
  const address = dataHelper.makeAddress(addr1, addr2, city, state);

  let speech = "The next meetup is " + title + " at " + venueName + " on " + speakableDateTime;
  let text = "Here's some information on the next meetup."
  conv.ask(new SimpleResponse({text: text, speech: speech}));

  // response = `The next meetup is "` + title + `" at ` + venueName + `.`;
  conv.ask(new BasicCard({
    title: title,
    subtitle: displaybleDateTime + " at " + venueName,
    // text: description, // TODO: shorten
    buttons: new Button({
      title: 'Open on Meetup.com',
      url: eventUrl
    }),
    image: new Image({
      url: photoUrl,
      alt: 'Event photo',
    })
  }));
}
