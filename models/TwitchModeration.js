const Sequelize = require("sequelize");
const db = require("../utility/database");

const TwitchModeration = db.define("TwitchModeration", {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false
	},
	userID: {
		type: Sequelize.STRING,
		allowNull: false
	},
	channelID: {
		type: Sequelize.INTEGER,
		allowNull: false
	},
	messageID: {
		type: Sequelize.INTEGER,
		allowNull: false
	}
}, { timestamps: false, freezeTableName: true });

TwitchModeration.sync();

module.exports = TwitchModeration;