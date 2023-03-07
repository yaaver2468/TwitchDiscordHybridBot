const Sequelize = require("sequelize");
const db = require("../utility/database");

const TwitchUser = db.define("TwitchUser", {
	id: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false
	},
	username: {
		type: Sequelize.STRING,
		allowNull: false
	},
	discordID: {
		type: Sequelize.STRING,
		allowNull: true
	},
	previousUsername: {
		type: Sequelize.STRING,
		allowNull: true
	}
}, { timestamps: false, freezeTableName: true });

TwitchUser.sync();

module.exports = TwitchUser;