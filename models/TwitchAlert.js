const Sequelize = require("sequelize");
const db = require("../utility/database");

const TwitchAlert = db.define("TwitchAlert", {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false
	},
	twitchID: {
		type: Sequelize.STRING,
		allowNull: false
	},
	discordID: {
		type: Sequelize.STRING,
		allowNull: false
	},
	trigger: {
		type: Sequelize.STRING,
		allowNull: false
	}
}, { timestamps: false, freezeTableName: true });

TwitchAlert.sync();

module.exports = TwitchAlert;