const { sendDelete } = require("../utility/discord-helper");

module.exports.run = async (dclient, message, args) => {
	message.delete().catch();
	var botLife = dclient.uptime;
	var uph = Math.round(botLife / 1000 / 3600);
	var upm = Math.round(botLife / 1000 / 60) % 60;
	var ups = Math.round(botLife / 1000) % 60;
	sendDelete(message.channel, `The bot has been stable for ${uph}h ${upm}m ${ups}s.`, 3000);
};