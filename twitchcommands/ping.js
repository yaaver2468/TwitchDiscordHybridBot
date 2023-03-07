module.exports.run = async (tclient, channel, userstate, message, args) => {
	if (!userstate.mod) return;
	tclient.say(channel, `Ping: ${userstate["tmi-sent-ts"] - (new Date()).getTime()}ms`);
};