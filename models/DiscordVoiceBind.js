const Sequelize = require("sequelize");
const db = require("../utility/database");

const DiscordVoiceBind = db.define("DiscordVoiceBind", {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false
	},
	voiceChannelID: {
		type: Sequelize.STRING,
		allowNull: false
	},
	textChannelID: {
		type: Sequelize.STRING,
		allowNull: false
	}
}, { timestamps: false, freezeTableName: true });

DiscordVoiceBind.sync();

module.exports = DiscordVoiceBind;