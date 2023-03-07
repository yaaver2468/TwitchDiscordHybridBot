const { MessageEmbed } = require('discord.js');
const { reactionChain } = require("../utility/discord-helper");

module.exports.run = async (dclient, message, args) => {
	message.delete().catch();
	var user = message.member.user;
	args = args.join(" ");
	const numbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
	var pollOptions = args.split("|"), question = pollOptions.shift();
	if (pollOptions.length > 0 && question.length != 0) {
		var pollEmbed = new MessageEmbed()
			.setColor('#8D0215')
			.setTitle(question)
			.setAuthor({
				"name": `${user.tag} asks`,
				"iconURL": user.avatarURL()
			})
			.setTimestamp()
			.setFooter({
				"text": dclient.user.username,
				"iconURL": dclient.user.avatarURL()
			});
		pollOptions.forEach((pollOption, idx) => {
			pollEmbed.addField("\u200B", `${numbers[idx]} ${pollOption.trim()}`);
		});
		message.channel.send({
				embeds: [pollEmbed]
			})
			.then((msg) => {
				reactionChain(msg, numbers.slice(0, pollOptions.length));
			})
			.catch();
	} else {
		message.channel.send("Poll format `.poll question you have | option 1 | option 2 | ... | option 9`").catch();
	}
};