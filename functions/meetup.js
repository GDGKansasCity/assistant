const axios = require('axios');
const { BasicCard, Image } = require('actions-on-google');

const baseUrl = "https://api.meetup.com/";
const directories = {
  'NearbyGroups': 'find/groups',
  'EventsForGroup': ':group/events'
};

const params = {
  'NearbyGroups': 'photo-host=public&lon=-94.5883400&text=gdg&lat=39.1695180&page=3&only=name,city,localized_location,group_photo.photo_link',
  'EventsForGroup': 'photo-host=public&page=1&fields=featured_photo&only=id,venue,time,utc_offset,name,link,featured_photo.photo_link,description'
};

class Group {
  constructor(name, city, location, imageUrl) {
    this.name = name;
    this.city = city;
    this.location = location;
    this.imageUrl = imageUrl;
  }
}

class Meetup {
  do(action) {
    let url = baseUrl + directories[action] + params[action];
    return axios.get(url)
  }

  nearbyGroups(lon, lat) {
    // return this.do('NearbyGroups')
    return new Promise((resolve, reject) => {
        resolve(JSON.parse('[{"group_photo":{"photo_link":"https://secure.meetupstatic.com/photos/event/d/d/6/d/600_458396685.jpeg"},"localized_location":"Kansas City, MO","city":"Kansas City","name":"Google Developer Group Kansas City"}]'));
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
      })
      .catch((err) => {
        console.error('Error: ' + err);
      });
  }

  // evensForGroup(groupId) {
  //   return this.do('EventsForGroup')
  //     .then((res) => {
  //       const events = res.data;
  //       if (events.length === 0) {
  //         conv.ask(`There aren't any upcoming events.`);
  //       } else {
  //         Events.mentionMeetup(conv, events[0]);
  //       }

  //       conv.helper.askForMore();
  //       return;
  //     });
  // }

  parseGroup(group) {
    let name = group.name;
    let city = group.city;
    let location = group.localized_location;
    let imageUrl = group.group_photo.photo_link;
    return new Group(name, city, location, imageUrl);
  }
}

module.exports = {
  Meetup,
  Group
}
