module.exports.run = async (tclient, channel, userstate, message, args) => {
	const REMOVE_PHRASE_TIME = 5 * 60 * 1000;
	if (!userstate.mod) return;
	try {
		var duration = parseInt(args.shift());
		if (isNaN(duration)) throw "Invalid #timeout duration";
		var reason = args.indexOf("reason:") != -1 ? args.slice(args.indexOf("reason:") + 1).join(" ") : "temporary keyphrase timeout";
		timeoutPhrase = reason == "temporary keyphrase timeout" ? args.slice(0).join("") : args.slice(0, args.indexOf("reason:")).join("");
	} catch {
		tclient.say(channel, `@${userstate["username"]} format is #timeout {seconds} {phrase} reason: {reason}`);
		return;
	}
	tclient.phrases["timeout"][timeoutPhrase] = {
		"time": duration,
		"reason": reason,
		"channel": channel
	};
	setTimeout(() => {
		try {
			delete tclient.phrases[timeoutPhrase];
		} catch (e) {
			console.log(`Error trying to delete ${timeoutPhrase}`);
		}
	}, REMOVE_PHRASE_TIME);
};