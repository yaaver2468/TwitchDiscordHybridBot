const Sequelize = require("sequelize");
const db = require("../utility/database");

const TwitchChannel = db.define("TwitchChannel", {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false
	},
	name: {
		type: Sequelize.STRING,
		allowNull: false
	},
	chatting: {
		type: Sequelize.BOOLEAN,
		allowNull: false
	},
	moderated: {
		type: Sequelize.BOOLEAN,
		allowNull: false
	},
	mwah: {
		type: Sequelize.BOOLEAN,
		allowNull: false
	}
}, { timestamps: false, freezeTableName: true });

TwitchChannel.sync();

module.exports = TwitchChannel;