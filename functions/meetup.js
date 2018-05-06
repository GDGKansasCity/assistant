const axios = require('axios');
const { BasicCard, Image } = require('actions-on-google');
const { DataHelper } = require('./helpers');

const baseUrl = "https://api.meetup.com/";
const directories = {
  'NearbyGroups': 'find/groups',
  'EventsForGroup': ':urlname/events'
};
const queries = {
  'NearbyGroups': 'photo-host=public&lon=-94.5883400&text=gdg&lat=39.1695180&page=3&only=name,city,localized_location,group_photo.photo_link,urlname',
  'EventsForGroup': 'photo-host=public&page=1&fields=featured_photo&only=id,venue,time,utc_offset,name,link,featured_photo.photo_link,description'
};

// Meetup Pro url but requires a key we don't have
//'https://api.meetup.com/pro/gdg/groups?key=' + Keys.meetup_token + '&sign=true'

class Group {
  constructor(name, city, location, imageUrl, meetupID) {
    this.name = name;
    this.city = city;
    this.location = location;
    this.imageUrl = imageUrl;
    this.meetupID = meetupID;
  }
}

class Event {
  constructor(name, description, eventUrl, imageUrl, time, venueName, fullAddress, city) {
    this.name = name;
    this.description = description;
    this.eventUrl = eventUrl;
    this.imageUrl = imageUrl;
    this.venueName = venueName;
    this.fullAddress = fullAddress;
    this.city = city;
  }
}

class Meetup {
  do(action, params) {
    let dir = directories[action];
    let url = baseUrl + dir;

    let query = queries[action];
    if (query !== undefined) {
      url = url + "?" + query;
    }

    let keys = Object.keys(params);
    for (var i = keys.length - 1; i >= 0; i--) {
      let key = keys[i];
      let value = params[key];
      console.log('replace ' + key + ' with ' + value);
      url = url.replace(":" + key, value);
    }
    console.log(`url: ` + url);
    return axios.get(url)
  }

  nearbyGroups(lon, lat) {
    // return this.do('NearbyGroups')
    return new Promise((resolve, reject) => {
        resolve(JSON.parse('[{"urlname":"GDG-Kansas-City","group_photo":{"photo_link":"https://secure.meetupstatic.com/photos/event/d/d/6/d/600_458396685.jpeg"},"localized_location":"Kansas City, MO","city":"Kansas City","name":"Google Developer Group Kansas City"}]'));
      })
      .then((res) => {
        const groups = res;//.data;
        let array = [];
        for (var i = groups.length - 1; i >= 0; i--) {
          let group = groups[i];
          console.log(JSON.stringify(group));
          array[i] = this.parseGroup(group)
        }
        return array;
      });
  }

  eventsForGroup(meetupID) {
    let params = {
      urlname: meetupID
    };
    return this.do('EventsForGroup', params)
      .then((res) => {
        const events = res.data;
        let array = [];
        for (var i = events.length - 1; i >= 0; i--) {
          let event = events[i];
          console.log(JSON.stringify(event));
          array[i] = this.parseEvent(event);
        }
        return array;
      });
  }

  parseGroup(group) {
    let name = group.name;
    let city = group.city;
    let location = group.localized_location;
    let imageUrl = group.group_photo.photo_link;
    let meetupID = group.urlname;
    return new Group(name, city, location, imageUrl, meetupID);
  }

  parseEvent(event) {
    const dataHelper = new DataHelper();

    const name = event.name;
    const description = event.description;
    const eventUrl = event.link;
    let imageUrl = event.featured_photo.photo_link;

    let epochTime = event.time + event.utc_offset;
    let time = dataHelper.formatDateTime(epochTime, 'h:mm a');

    const venue = event.venue;
    const venueName = venue.name;
    const addr1 = venue.address_1;
    const addr2 = venue.address_2;
    const city = venue.city;
    const state = venue.state;
    const address = dataHelper.makeAddress(addr1, addr2, city, state);

    return new Event(name, description, eventUrl, imageUrl, time,
      venueName, address, city);
  }
}

module.exports = {
  Meetup,
  Group,
  Event
}
