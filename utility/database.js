const { Sequelize } = require('sequelize');
module.exports = new Sequelize('database', 'username', 'password', {
	storage: 'database.db',
	dialect: "sqlite",
	logging: false
});