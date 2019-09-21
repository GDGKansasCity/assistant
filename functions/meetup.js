const axios = require('axios');
const { BasicCard, Image } = require('actions-on-google');
const { DataHelper } = require('./helpers');
const Secrets = require('./secrets.json');

const baseUrl = "https://api.meetup.com/";
const directories = {
  'NearbyGroups': 'find/groups',
  'EventsForGroup': ':urlname/events'
};
const queries = {
  'NearbyGroups': 'photo-host=secure&order=distance&lon=:lon&text=Google+Developer+Group&lat=:lat&page=2&only=name,city,localized_location,group_photo.photo_link,urlname',
  'EventsForGroup': 'photo-host=secure&page=1&fields=featured_photo&only=id,venue,time,utc_offset,name,link,featured_photo.photo_link,description'
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
  do(action, params, auth) {
    let dir = directories[action];
    let url = baseUrl + dir;

    let query = queries[action];
    if (query !== undefined) {
      url = url + "?" + query;
    }

    if (auth !== undefined && auth) {
      url = url + (query === undefined ? "?" : "&");
      url = url + "key=" + Secrets.meetupToken + "&sign=true";
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
    let params = {
      lon: lon,
      lat: lat
    };
    return this.do('NearbyGroups', params, true)
      .then((res) => {
        const groups = res.data;
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
          console.log('event: ' + JSON.stringify(event));
          array[i] = this.parseEvent(event);
        }
        return array;
      });
  }

  parseGroup(group) {
    let name = group.name;
    let city = group.city;
    let location = group.localized_location;

    let photo = group.group_photo;
    let imageUrl = "https://developers.google.com/programs/community/images/logo-lockup-gdg-horizontal.png";
    if (photo !== undefined) {
      imageUrl = group.group_photo.photo_link;
    }
    
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
