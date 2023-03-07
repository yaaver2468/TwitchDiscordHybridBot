const { MessageEmbed, MessageAttachment } = require("discord.js");
const { writeFile, unlink } = require("fs");
const gutility = require("../utility/global");

const startColour = "#7289DA", changeColour = "#C9BD36", endColour = "#8D021F";

module.exports = {
	logEmbedBuilder: function (dclient) {
		var logEmbed = new MessageEmbed();
		logEmbed.setTimestamp();
		logEmbed.setFooter({
			 "text": "Logged at",
			 "iconURL": dclient.user.avatarURL()
		});
		return logEmbed;
	},
	addVoiceEmbeds: function(logEmbed, oldState, newState, voiceChangeType) {
		var user = oldState.member.user;
		logEmbed.setAuthor({
			"name": user.tag,
			"iconURL": user.avatarURL()
		});
		switch (voiceChangeType) {
			case "CONNECTED":
				logEmbed.setColor(startColour);
				logEmbed.addField("Joined voice channel", `${newState.channel}`);
				logEmbed.addField("ID: " + newState.sessionId, `${user}`);
				break;
			case "DISCONNECTED":
				logEmbed.setColor(endColour);
				logEmbed.addField("Left voice channel", `${oldState.channel}`);
				logEmbed.addField("ID: " + oldState.sessionId, `${user}`);
				break;
			case "CHANGED":
				logEmbed.setColor(changeColour);
				logEmbed.addField("Switched voice channels", `${oldState.channel} to ${newState.channel}`);
				logEmbed.addField("ID: " + newState.sessionId, `${user}`);
				break;
		}
	},
	addCreateEmbeds: function (logEmbed, message) {
		var member = message.author;
		var channel = message.channel;
		logEmbed.setColor(startColour);
		logEmbed.setAuthor({
			"name": `${member.username} posted in #${channel.name}`,
			"iconURL": member.avatarURL()
		});
		if (message.content.length > 0) {
			logEmbed.addField("Message", `${message.content}`);
		}
		addEmbedAttachmentUrls(logEmbed, message.attachments);
		logEmbed.addField("ID: " + message.id, `${member} [Jump to context](${message.url})`);
	},
	addUpdateEmbeds: function (logEmbed, oldMessage, newMessage) {
		var member = oldMessage.author;
		logEmbed.setColor(changeColour);
		logEmbed.setAuthor({
			"name": `${member.username} edited in #${oldMessage.channel.name}`,
			"iconURL": member.avatarURL()
		});
		logEmbed.addField("Original Message", `${oldMessage.content}`);
		logEmbed.addField("New Message", `${newMessage.content}`);
		logEmbed.addField("ID: " + oldMessage.id, `${member} [Jump to context](${oldMessage.url})`);
		if (oldMessage.attachments != newMessage.attachments) {
			addEmbedAttachmentUrls(logEmbed, newMessage.attachments);
		}
	},
	addDeleteEmbeds: async function (logEmbed, message) {
		var member = message.author;
		logEmbed.setColor(endColour);
		if (message.content != "") {
			logEmbed.addField("Message", `${message.content}`);
		}
		addEmbedDeletedAttachments(logEmbed, message.attachments);
		var deleteActionUser = await getDeleteAuthorizationUser(message);
		if (deleteActionUser.id != member.id) {
			logEmbed.setAuthor({
				"name": `${deleteActionUser.username} deleted ${deleteActionUser.username}'s message from #${message.channel.name}`,
				"iconURL": deleteActionUser.avatarURL()
			});
			logEmbed.addField("ID: " + message.id, `${deleteActionUser} | ${member} [Jump to context](${message.url})`);
		} else {
			logEmbed.setAuthor({
				"name": `${member.username} had their message deleted from #${message.channel.name}`,
				"iconURL": member.avatarURL()
			});
			logEmbed.addField("ID: " + message.id, `${member} [Jump to context](${message.url})`);
		}
	},
	addBulkDeleteEmbeds: function (logEmbed, messages) {
		var channel = messages.first().channel, user = messages.first().author;
		logEmbed.setColor("#F5F5F5");
		logEmbed.setAuthor({
			"name": `${messages.size} messages were deleted in bulk from #${channel.name}\nAuthorized by ${user.tag}`,
			"iconURL": channel.guild.iconURL()
		});
		logEmbed.addField("→", `[Jump to context](${messages.last().url})`);
	},
	createBulkDeletedData: function (messages) {
		var messageArray = Array.from(messages);
		return JSON.stringify(messageArray, null, "\t");
	},
	sendEmbedWithFile: async function (channel, embed, fileData, fileName) {
		writeFile(fileName, fileData, { encoding: "utf-8" }, (err) => {
			if (err) {
				embed.addField("Failed to attach neccessary documents.");
				channel.send({ embeds: [embed] });
			} else {
				const file = new MessageAttachment(fileName);
				channel.send({ embeds: [embed], files: [file] })
					.then(() => {
						unlink(fileName, (err) => {
							if (err) {
								console.log(`Failed to delete file ${fileName}`);
							}
						});
					});
			}
		});
	},
	reactionChain: async function (message, reactions) {
		reactions.forEach(async (reaction) => {
			await message.react(reaction).catch();
		});
		return message;
	},
	sendDelete: async function (channel, sendingMessage, delay) {
		await channel.send(sendingMessage)
				.then((msg) => {
					if (delay) {
						setTimeout(() => {
							msg.delete().catch();
						}, delay);
					} else {
						msg.delete().catch();
					}
				})
				.catch((err) => {
					console.error(err);
				});
	}
};

async function getDeleteAuthorizationUser(message) {
	var auditLog = await message.guild
		.fetchAuditLogs({ limit: 1 })
		.catch(console.error);
	var auditLogEntry = auditLog.entries.first();
	return (auditLogEntry.action == "MESSAGE_DELETE" 
	&& Math.abs((new Date()).getTime() - auditLogEntry.createdTimestamp) < 1000)
	? auditLogEntry.executor : message.author;
}

function addEmbedAttachmentUrls(embed, attachments) {
	attachments = Array.from(attachments);
	attachments.forEach((attachment, idx) => {
		embed.addField(`Attachment #${idx + 1}`, attachment[1].url, true);
	});
}

function addEmbedDeletedAttachments(embed, attachments) {
	attachments = Array.from(attachments);
	attachments.forEach((attachment) => {
		embed.addField("File Name", attachment[1].name, true);
		embed.addField("File Type", attachment[1].contentType, true);
		embed.addField("File Size", `${gutility.numberWithCommas(attachment[1].size)} bytes`, true);
	});
}