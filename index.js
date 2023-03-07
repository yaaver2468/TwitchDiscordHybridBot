const { discordToken, discordPrefix, twitchToken, twitchPrefix, channels } = require("./config.json");
const DClient = require("./bots/DClient");
const TClient = require("./bots/TClient");


async function main() {
	const dclient = new DClient();
	const tclient = new TClient("TwitchUsername", twitchToken, channels);

	await tclient.setCaseNumber();
	tclient.loadTwitchCommands();
	await tclient.createChannelEntries();
	dclient.loadDiscordCommands();

	console.log(`Both bots are prepared to launch at ${currentTime()}...`);

	dclient.login(discordToken);
	tclient.connect();

	// Functions

	function currentTime() {
		return (new Date()).toLocaleString('en-US', { month: "numeric", "day": "numeric", hour: 'numeric', minute: 'numeric', hour12: true });
	}

	// Discord

	dclient.on("ready", () => {
		console.log(`${dclient.user.tag} is connected to discord.`);
	});

	dclient.on("channelPinsUpdate", async (channel) => {
		channel.messages.fetchPinned()
			.then((messages) => {
				if (messages.size == 50) {
					channel.send("You've reached the maximum number of pin's for this channel.").catch();
				}
			})
			.catch();
	});

	dclient.on("messageCreate", async (message) => {
		if (message.author.bot || message.system) return;
		if (message.content.startsWith(discordPrefix)) {
			dclient.discordCommandHandler(message);
		}
	});

	dclient.on("messageDelete", async (message) => {
		var timeDifference = (new Date()).getTime() - message.createdTimestamp;
		if (message.author.bot || (timeDifference) < 250 || message.system) return;
		dclient.logMessageDelete(message);
	});

	dclient.on("messageUpdate", async (oldMessage, newMessage) => {
		if (oldMessage.author.bot) return;
		dclient.logMessageUpdate(oldMessage, newMessage);
	});

	dclient.on("messageDeleteBulk", async messages => {
		dclient.logMessagesDeleted(messages);
	});

	dclient.on("voiceStateUpdate", (oldState, newState) => {
		dclient.voiceBindEventHandler(oldState, newState);
	});

	// Twitch

	tclient.once("connected", async (address, port) => {
		console.log(`${tclient.getUsername()} is connected to twitch @${address}:${port}.`);
	});

	tclient.on("connected", async (address, port) => {
		tclient.downed = (new Date()).getTime();
	});

	tclient.on("message", async (channel, userstate, message, self) => {
		if (self) return;
		switch (userstate["message-type"]) {
			case "chat":
				var messageID = await tclient.logMessage(channel, userstate, message);
				tclient.streakPoster(channel, userstate, message);
				tclient.mwahMachine(channel, userstate, message);
				try {
					tclient.moderateMessage(channel, userstate, message, messageID);
				} catch {
					console.log(`Crashed when moderating:\n${channel.slice(1)} - ${userstate["display-name"]}: ${message}`);
				}
				if (message.startsWith(twitchPrefix)) {
					tclient.twitchCommandHandler(channel, userstate, message);
				}
				break;
			case "whisper":
				if (message.toLowerCase().indexOf("sub") != -1 || message.toLowerCase().indexOf("follow") != -1) {
					tclient.whisper(channel, "Yeah sure just pay me at suckafatone.com Kreygasm");
				}
				break;
		}
	});
}

main();