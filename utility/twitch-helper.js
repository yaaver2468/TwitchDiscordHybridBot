module.exports = {
	addStreakMessage: function (tclient, channel, userstate, message) {
		const STREAK_LENGTH = 3;
		if (userstate["subscriber"] && ["hi", "yes", "l", "no", "gg", "f", "hey", "hello"].indexOf(message.toLowerCase()) == -1) {
			if (tclient.recentMessageHistory[channel]) {
				tclient.recentMessageHistory[channel].push(message);
				if (tclient.recentMessageHistory[channel].length > STREAK_LENGTH) {
					tclient.recentMessageHistory[channel].pop(0);
				}
			} else {
				tclient.recentMessageHistory[channel] = [ message ]
			}
		}
	},
	readyToStreak: function (recentMessageHistory, channel) {	
		var previousMessage = null;
		recentMessageHistory[channel].forEach((message) => {
			if (previousMessage == null) {
				previousMessage = message;
			} else if (message != previousMessage) {
				return false;
			}
		});
		return true;
	},
	phraseDetector: function (phrases, message) {
		var formattedMessage = formatForTrigger(message), match = getMatchingTrigger(phrases, formattedMessage);
		if (["nig", "niga", "nigge"].indexOf(formattedMessage) != -1) {
			return {
				"action": "ban",
				"reason": "hate speech detected"
			};
		}
		if (match == null) {
			formattedMessage = cleanRepeats(formattedMessage);
			match = getMatchingTrigger(phrases, formattedMessage);
			if (match == null) {
				formattedMessage = formattedMessage.replace(/\s/g, "");
				match = getMatchingTrigger(phrases, formattedMessage);
				if (match == null) {
					formattedMessage = formattedMessage.replace(/[^0-9a-z]/gi, '');
					match = getMatchingTrigger(phrases, formattedMessage);
					return match;
				} else {
					match["action"] = "timeout";
				}
			}
		}
		return match;
	},
	selfPromoting: function (username, message) {
		return message.toLowerCase().replace(/\s/g, "").indexOf(`twitch.tv/${username}`) != -1;
	},
	emojiAbuse: function (message) {
		const EMOJI_LIMIT = 12;
		return specialCharacterCount(message) - specialCharacterCount(removeEmojis(message)) > EMOJI_LIMIT;
	},
	repeatedMessages: function (message) {
		return false;
	},
	specialCharacterAbuse: function (message) {
		const SPECIAL_LIMIT = 12;
		var norm = swapSpecialCharacters(message), junk = 0, x = 0;
		if (norm.length != message.length) return false;
		while (junk < SPECIAL_LIMIT && x < norm.length) {
			if (norm[x] != message[x]) junk++;
			x++;
		}
		if (junk >= SPECIAL_LIMIT) return true;
		return false;
	},
	fakingChatActions: function (message) {
		return message.startsWith("<") && message.endsWith(">");
	}
};

function getMatchingTrigger(phrases, message) {
	var match = null;
	banKeys = Object.keys(phrases["ban"]);
	banKeys.forEach((key) => {
		if (message.indexOf(key) != -1) {
			match = {
				"action": "ban",
				"reason": phrases["ban"][key]
			};
		}
	});
	timeoutKeys = Object.keys(phrases["timeout"]);
	timeoutKeys.forEach((key) => {
		if (message.indexOf(key) != -1) {
			match = {
				"action": "timeout",
				"reason": phrases["timeout"][key]["reason"],
				"time": phrases["timeout"][key]["time"]
			};
		}
	});
	return match;
}

function formatForTrigger(message) {
	return swapSpecialCharacters(message.toLowerCase()
		.replace("i grow", "")
			.replace("schwarzenegger", "")
				.replace("|\\|", "n"));
}

function swapSpecialCharacters(str) {
	return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function cleanRepeats(line) {
	function popSlice(line, idx) { 
		return line.slice(0, idx) + line.slice(idx + 1);
	}
	var x = 0;
	while (x < line.length - 1) {
		if (line[x] == line[x + 1] && line[x] != "g") line = popSlice(line, x--);
		else x++;
	}
	while (line.replace("ggg").length != line.length) line = line.replace("ggg", "gg");
	return line;
}

function removeEmojis(string) {
	var regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
	return string.replace(regex, "");
}

function specialCharacterCount(str) {
	return Array.from(str.split(/[\ufe00-\ufe0f]/).join("")).length;
}