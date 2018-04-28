const Moment = require('moment');

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
}

module.exports = {
  DataHelper,
  ConversationHelper
}
