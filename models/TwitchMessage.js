const Sequelize = require("sequelize");
const db = require("../utility/database");

const TwitchMessage = db.define("TwitchMessage", {
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
	content: {
		type: Sequelize.STRING,
		allowNull: true
	},
	time: {
		type: Sequelize.TIME,
		allowNull: false
	}
}, { timestamps: false, freezeTableName: true });

TwitchMessage.sync();

module.exports = TwitchMessage;