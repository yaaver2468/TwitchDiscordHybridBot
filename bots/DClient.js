const { Client, Collection } = require('discord.js');
const DiscordVoiceBind = require("../models/DiscordVoiceBind");
const utility = require("../utility/discord-helper");
const { readdirSync } = require("fs");
const { discordPrefix } = require("../config.json");

const LOGGING_CHANNEL = "logs-seeker";

class DClient extends Client {
	constructor() {
		super({
			intents: [
				"GUILDS",
				"GUILD_MESSAGES",
				"GUILD_VOICE_STATES"
			],
		});
		this.commands = new Collection();
		this.deleted = "";
	}

	loadDiscordCommands() {
		const commandFiles = readdirSync(__dirname + "/../discordcommands").filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const command = require(`../discordcommands/${file}`);
			const commandName = file.slice(0, file.length - 3);
			this.commands.set(commandName, command);
		}
	}

	async discordCommandHandler(message) {
		const args = message.content.slice(discordPrefix.length).split(/ +/);
		const command = args.shift().toLowerCase();
		this.runCommand(command, message, args);
	}

	async logMessageCreate(message) {
		if (message.channel.name == LOGGING_CHANNEL) return;
		var logsChannel = this.getLogsChannel(message.guild);
		if (logsChannel) {
			var logEmbed = utility.logEmbedBuilder(this);
			utility.addCreateEmbeds(logEmbed, message);
			logsChannel.send({ embeds: [logEmbed] }).catch();
		}
	}

	async logMessageDelete(message) {
		if (message.channel.name == LOGGING_CHANNEL) return;
		var logsChannel = this.getLogsChannel(message.guild);
		if (logsChannel) {
			var logEmbed = utility.logEmbedBuilder(this);
			await utility.addDeleteEmbeds(logEmbed, message);
			logsChannel.send({ embeds: [logEmbed] }).catch();
		}
	}

	async logMessageUpdate(oldMessage, newMessage) {
		if (oldMessage.channel.name == LOGGING_CHANNEL) return;
		var logsChannel = this.getLogsChannel(oldMessage.guild);
		if (logsChannel) {
			var logEmbed = utility.logEmbedBuilder(this);
			utility.addUpdateEmbeds(logEmbed, oldMessage, newMessage);
			logsChannel.send({ embeds: [logEmbed] }).catch();
		}
	}

	async logMessagesDeleted (messages) {
		if (messages.first().channel.name == LOGGING_CHANNEL) return;
		var channel = messages.first().channel, logsChannel = this.getLogsChannel(messages.first().guild);
		if (logsChannel) {
			var logEmbed = utility.logEmbedBuilder(this), fileName = `${channel.id}.json`;
			utility.addBulkDeleteEmbeds(logEmbed, messages);
			await utility.sendEmbedWithFile(logsChannel, logEmbed, utility.createBulkDeletedData(messages) , fileName);
		}
	}

	async logVoice (oldState, newState, voiceChangeType) {
		var logsChannel = this.getLogsChannel(oldState.guild);
		if (logsChannel) {
			var logEmbed = utility.logEmbedBuilder(this);
			utility.addVoiceEmbeds(logEmbed, oldState, newState, voiceChangeType);
			logsChannel.send({ embeds: [logEmbed] }).catch();
		}
	}

	async runCommand (command, message, args) {
		var cmd = this.commands.get(command);
		if (cmd) cmd.run(this, message, args);
	}

	async voiceBindEventHandler (oldState, newState) {
		if (oldState.channelId == newState.channelId) return "OTHER";
		if (oldState.channelId == null && newState.channelId) {
			this.updateBoundChannels(newState, true);
			this.logVoice(oldState, newState, "CONNECTED");
		} else if (oldState.channelId && newState.channelId == null) {
			this.updateBoundChannels(oldState, false);
			this.logVoice(oldState, newState, "DISCONNECTED");
		} else {
			await this.updateBoundChannels(oldState, false);
			await this.updateBoundChannels(newState, true);
			this.logVoice(oldState, newState, "CHANGED");
		}
	}

	async updateBoundChannels (voiceState, accessPolicy) {
		var voiceBindings = await DiscordVoiceBind.findAll({
			where: {
				voiceChannelID: voiceState.channelId
			}
		});
		voiceBindings.forEach(async (voiceBinding) => {
			await this.voiceBinding(voiceBinding.textChannelID, voiceState.member, accessPolicy);
		});
	}

	async voiceBinding (textChannelID, member, accessPolicy) {
		var textChannel = this.getChannel(textChannelID);
		// exception for fait in sauce channels
		if (textChannel.name.indexOf("sauce") != -1) return;
		if (textChannel) {
			var canSeeChannel = textChannel.permissionsFor(member).serialize();
			if (!canSeeChannel.VIEW_CHANNEL) {
				await textChannel.permissionOverwrites.create(member, {
					"VIEW_CHANNEL": accessPolicy
				}).catch();
			} else {
				await textChannel.permissionOverwrites.delete(member).catch();
			}
		} else {
			await DiscordVoiceBind.destroy({
				where: {
					textChannelID: textChannelID
				}
			}).catch();
		}
	}

	getLogsChannel (guild) {
		return guild.channels.cache.find(c => c.name === LOGGING_CHANNEL);
	}

	getChannel (channelID) {
		return this.channels.cache.find(c => c.id === channelID);
	}

	getUser (userID) {
		return this.users.cache.find(u => u.id === userID);
	}
}

module.exports = DClient;