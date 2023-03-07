const { readFileSync } = require("fs");
const path = require("path");

module.exports.run = async (tclient, channel, userstate, message, args) => {
	var phrases = readFileSync(path.resolve(__dirname, "../phrases.json"), { encoding:"utf8" });
	phrases = JSON.parse(phrases);
	tclient.phrases = phrases;
};