const Moment = require('moment');

exports.makeAddress = function(address1, address2, city, state) {
  let text = address1 + ", ";
  if (address2 !== undefined) {
    text = text + ", " + address2;
  }
  text = text + ", " + city + ", " + state;
  return text;
}

exports.formatDateTime = function(milliseconds, format) {
  let d = new Moment(milliseconds);
  let formatted = d.format(format);
  return formatted;
}

exports.pickOneOf = function(array) {
  return array[Math.floor(Math.random()*array.length)];
}
