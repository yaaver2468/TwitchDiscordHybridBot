const { Client } = require("tmi.js");
const TwitchChannel = require("../models/TwitchChannel");
const TwitchUser = require("../models/TwitchUser");
const TwitchMessage = require("../models/TwitchMessage");
const TwitchAlert = require("../models/TwitchAlert");
const TwitchModeration = require("../models/TwitchModeration");
const utility = require("../utility/twitch-helper");
const { readFileSync, readdirSync } = require("fs");
const { twitchPrefix } = require("../config.json");

class TClient extends Client {
	constructor(username, twitchToken, channels) {
		super({
			options: { debug: false },
			connection: {
				secure: true,
				reconnect: true
			},
			identity: {
				username: username,
				password: twitchToken
			},
			channels: channels
		});
		this.commands = new Map();
		this.phrases = JSON.parse(readFileSync("phrases.json", { encoding: "utf-8" }));
		this.channelIDS = {};
		this.caseNumber = 38617;
		this.moderatedChannels = [ "#sypherpk" ];
		this.recentMessageHistory = {};
		this.uptime = (new Date()).getTime();
		this.downed = this.uptime;
	}

	loadTwitchCommands() {
		const commandFiles = readdirSync(__dirname + "/../twitchcommands").filter(file => file.endsWith('.js'));
		commandFiles.forEach((file) => {
			const command = require(`../twitchcommands/${file}`);
			const commandName = file.slice(0, file.length - 3);
			this.commands.set(commandName, command);
		});
	}

	async createChannelEntries() {
		var channels = await TwitchChannel.findAll();
		channels.forEach((channel) => {
			this.channelIDS[channel.name] = channel.id;
		});
	}

	async twitchCommandHandler(channel, userstate, message) {
		const args = message.slice(twitchPrefix.length).split(/ +/);
		const command = args.shift();
		this.runCommand(command, channel, userstate, message, args);
	}

	async runCommand (command, channel, userstate, message, args) {
		var cmd = this.commands.get(command);
		if (cmd) cmd.run(this, channel, userstate, message, args);
	}

	async sendMessage(channel, message) {
		if (await canSendMessage(channel)) {
			this.say(channel, message)
				.then(() => {
					return true;
				});
		}
		return false;
	}

	async logMessage(channel, userstate, message) {
		if (["streamelements", "nightbot"].indexOf(userstate["username"]) == -1) {
			checkUser(userstate);
			if (userstate["user-id"]) {
				var loggedMessage = await TwitchMessage.create({
					userID: userstate["user-id"],
					channelID: this.getChannelID(channel),
					content: message,
					time: userstate["tmi-sent-ts"]
				});
				return loggedMessage.id;
			} else {
				console.log(`Failed to add message: ${channel} | ${userstate["tmi-sent-ts"]} | ${userstate["display-name"]} | ${message}`);
			}
		}
	}

	banUser(channel, userstate, reason, messageID) {
		this.ban(channel, userstate["username"], `case (${this.caseNumber}) - ${reason}`);
		this.caseNumber++;
		TwitchModeration.create({
			userID: userstate["user-id"],
			channelID: this.getChannelID(channel),
			messageID: messageID
		});
	}

	timeoutUser(channel, userstate, time, reason, messageID) {
		this.timeout(channel, userstate["username"], time, `case (${this.caseNumber}) - ${reason}`);
		this.caseNumber++;
		TwitchModeration.create({
			userID: userstate["user-id"],
			channelID: this.getChannelID(channel),
			messageID: messageID
		});
	}

	async moderateMessage(channel, userstate, message, messageID) {
		if (!userstate["mod"] && this.isChannelModerated(channel)) {
			var phraseCatch = utility.phraseDetector(this.phrases, removeMentionsAndEmotes(userstate["emotes"], message)), reason = null;
			if (phraseCatch != null) {
				reason = phraseCatch["reason"];
				if (phraseCatch["action"] == "ban") {
					this.banUser(channel, userstate, reason, messageID);
				} else {
					this.timeoutUser(channel, userstate, phraseCatch["time"], reason, messageID);
				}
			} else if (utility.selfPromoting(userstate, message)) {
				reason = "self promotion of twitch channel";
				this.timeoutUser(channel, userstate, 1209600, reason, messageID);
			} else if (utility.emojiAbuse(message)) {
				reason = "emoji abuse detected";
				this.timeoutUser(channel, userstate, 300, reason, messageID);
			} else if (utility.specialCharacterAbuse(message)) {
				reason = "special character abuse detected";
				this.timeoutUser(channel, userstate, 90, reason, messageID);
			} else if (utility.fakingChatActions(message)) {
				reason = "faking chat actions";
				this.timeoutUser(channel, userstate, 60, reason, messageID);
			}
		}
	}

	async streakPoster(channel, userstate, message) {
		const STREAK_LENGTH = 3;
		utility.addStreakMessage(this, channel, userstate, message);
		if (this.recentMessageHistory[channel] && this.recentMessageHistory[channel].length == STREAK_LENGTH) {
			if (utility.readyToStreak(this.recentMessageHistory, channel)) {
				this.recentMessageHistory[channel] = [];
				this.sendMessage(channel, message);
			}
		}
	}

	async mwahMachine(channel, userstate, message) {
		const MONTHS_REQUIREMENT = 12;
		const BLOCKED = []
		if (message.toLowerCase().indexOf("mwah") != -1 && BLOCKED.indexOf(userstate["username"])) {
			var storedChannel = await getChannel(channel);
			if (storedChannel.mwah && userstate["badge-info"] && userstate["badge-info"]["subscriber"] >= MONTHS_REQUIREMENT) {
				this.sendMessage(channel, `@${userstate["display-name"]} mwah 💋`);
			}
		}
	}

	async setCaseNumber() {
		var currentCases = await TwitchModeration.findAndCountAll();
		this.caseNumber += currentCases.count;
	}

	getChannelID(channel) {
		return this.channelIDS[channel];
	}

	isChannelModerated(channel) {
		return this.moderatedChannels.indexOf(channel) != -1;
	}

};

async function checkUser(userstate) {
	var user = await getUser(userstate["user-id"]);
	if (!user) {
		if (userstate["user-id"] && userstate["display-name"]) {
			await TwitchUser.create({
				id: userstate["user-id"],
				username: userstate["display-name"]
			});
		}
	} else {
		if (userstate["display-name"] && user.username != userstate["display-name"]) {
			user.previousUsername = user.username;
			user.username = userstate["display-name"];
		}
	}
}

async function getUser(id) {
	return await TwitchUser.findOne({
		where: {
			id: id
		}
	});
}

async function getChannel(channel) {
	return await TwitchChannel.findOne({
		where: {
			name: channel
		}
	});
}

async function canSendMessage(channel) {
	var targetChannel = await getChannel(channel);
	return targetChannel.chatting;
}

function removeMentionsAndEmotes(emotes, message) {
	var formattedMessage = message;
	if (formattedMessage.indexOf("@") != -1) {
		formattedMessage = formattedMessage.split(" ");
		x = 0;
		while (x < formattedMessage.length) {
			if (formattedMessage[x].startsWith("@")) {
				formattedMessage.pop(x);
				x--;
			}
			x++;
		}
		formattedMessage = formattedMessage.join(" ");
	}
	return formattedMessage;
}

module.exports = TClient;