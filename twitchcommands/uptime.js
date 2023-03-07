module.exports.run = async (tclient, channel, userstate, message, args) => {
	if (!userstate.mod) return;
	var botLife = userstate["tmi-sent-ts"] - tclient.uptime;
	var uph = Math.round(botLife / 1000 / 3600);
	var upm = Math.round(botLife / 1000 / 60) % 60;
	var ups = Math.round(botLife / 1000) % 60;
	tclient.say(channel, `The bot has been stable for ${uph}h ${upm}m ${ups}s`);
};