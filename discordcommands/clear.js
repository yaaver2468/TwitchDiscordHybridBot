const { sendDelete } = require("../utility/discord-helper");

module.exports.run = async (dclient, message, args) => {
	var member = message.member;
	var channel = message.channel;
	const DELETE_AFTER_MS = 3000;
	try {
		var deleteCount = parseInt(args[0].trim());
	} catch {
		sendDelete(channel, "Invalid number input.", DELETE_AFTER_MS);
		return;
	}
	if (deleteCount > 0  && deleteCount <= 100) {
		if (channel.permissionsFor(member).has("MANAGE_MESSAGES")) {
			message.delete()
				.then(async () => {
					var totalDeleted = await deleteChannelMessages(channel, deleteCount);
					sendDelete(channel, (totalDeleted == 1) ? `Cleared 1 message.`: `Cleared ${totalDeleted} messages.`, DELETE_AFTER_MS);
				});
		} else {
			sendDelete(channel, "You don't have the permission to delete messages.", DELETE_AFTER_MS);
		}
	} else {
		sendDelete(channel, "The number has to be greater than or equal to 1.", DELETE_AFTER_MS);
	}
};

async function deleteChannelMessages(channel, deleteCount) {
	var messages = await channel.messages.fetch({ 
		limit: deleteCount
	});
	messages = messages.filter( m => !m.pinned);
	await channel.bulkDelete(messages)
	.catch((err) => {
		console.log(err);
	});
	return messages.size + 1;
}