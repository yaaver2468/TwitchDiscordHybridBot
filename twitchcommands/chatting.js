const TwitchChannel = require("../models/TwitchChannel");

module.exports.run = async (tclient, channel, userstate, message, args) => {
	if (!userstate.mod) return;
	var chattingChannel = await TwitchChannel.findOne({
		where: {
			name: channel
		}
	});
	chattingChannel.chatting = !chattingChannel.chatting;
	chattingChannel.save();
	tclient.say(channel, `Chat setting for this channel: ${chattingChannel.mwah}`);
};