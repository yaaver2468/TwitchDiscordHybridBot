const DiscordVoiceBind = require("../models/DiscordVoiceBind");
const { reactionChain } = require("../utility/discord-helper");

module.exports.run = async (dclient, message, args) => {
	var member = message.member, textChannel = message.channel, voiceChannel = member.voice.channel, guild = message.guild;
	if (member.voice) {
		if (textChannel.permissionsFor(member).has("MANAGE_CHANNELS")) {
			var binding = await DiscordVoiceBind.findOne({
				where: {
					voiceChannelID: voiceChannel.id,
					textChannelID: textChannel.id
				}
			});
			if (binding) {
				await binding.destroy();
				await reactionChain(message, ["✅", "🗑"]);
			} else {
				await DiscordVoiceBind.create({
					voiceChannelID: voiceChannel.id,
					textChannelID: textChannel.id
				});
				textChannel.permissionOverwrites.create(guild.roles.everyone, {
					"VIEW_CHANNEL": false
				});
				await reactionChain(message, ["✅", "🤝"]);
			}
		} else {
			textChannel.send("You don't have the manage channel permission here.")
				.then(() => {
					message.delete().catch();
				})
				.catch();
		}
	} else {
		textChannel.send("Please join a voice channel to use this command.")
			.then(() => {
				message.delete().catch();
			})
			.catch();
	}
};