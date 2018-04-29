const Moment = require('moment');
const { BasicCard, Image, List, SimpleResponse } = require('actions-on-google');

class DataHelper {
  makeAddress(address1, address2, city, state) {
    let text = address1 + ", ";
    if (address2 !== undefined) {
      text = text + ", " + address2;
    }
    text = text + ", " + city + ", " + state;
    return text;
  }

  formatDateTime(milliseconds, format) {
    let d = new Moment(milliseconds);
    let formatted = d.format(format);
    return formatted;
  }

  pickOneOf(array) {
    return array[Math.floor(Math.random()*array.length)];
  }
}

class ConversationHelper {
  constructor(conv) {
    this.conv = conv;
  }

  askOneOf(array) {
    this.conv.ask(new DataHelper().pickOneOf(array));
  }

  askForMore() {
    this.askOneOf([
      `What else can I do for you?`,
      `How else can I help today?`,
      `What else can I help with?`
    ]);
  }

  showGroup(group) {
    console.log('showGroup()');
    this.conv.ask(new BasicCard({
      title: group.name,
      subtitle: group.location,
      image: new Image({
        url: group.imageUrl,
        alt: group.name + ' image'
      })
    }));
  }

  selectFromGroups(groups) {
    let items = {};
    for (var i = groups.length - 1; i >= 0; i--) {
      var key = i.toString();
      let group = groups[i];
      let item = {
        synonyms: [group.name, group.city, group.location],
        title: group.name,
        description: group.location,
        image: new Image({
          url: group.imageUrl,
          alt: group.name + ' image'
        })
      };
      items[i] = { key: item };
      console.log('item: ' + JSON.stringify(items[i]));
    }
    this.conv.ask(new List({
      title: 'GDGs Near You',
      items: items
    }));
  }
}

module.exports = {
  DataHelper,
  ConversationHelper
}
