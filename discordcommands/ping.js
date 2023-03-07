module.exports.run = async (dclient, message, args) => {
	var channel = message.channel;
	message.delete().catch();
	channel.send("Pinging...").then((msg) => {
		msg.edit("Ping: " + (msg.createdTimestamp - message.createdTimestamp) + " ms").catch();
	});
};