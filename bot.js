require('dotenv').config();

var Phrases = require('./phrases');
var TelegramBot = require('node-telegram-bot-api');
var botToken = process.env.BOT_TOKEN || 'some-default-token';
var firebaseApiKey = process.env.FIREBASE_API_KEY || 'some-default-key';
var firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'some-default-project-id';
var GAME_NAME = process.env.GAME_NAME || 'some-default-project-name';

// Setup polling way
var bot = new TelegramBot(botToken, {
	polling: true
});
var firebase = require("firebase");


var config = {
	apiKey: firebaseApiKey,
	authDomain: firebaseProjectId + ".firebaseapp.com",
	databaseURL: "https://" + firebaseProjectId + ".firebaseio.com",
	storageBucket: firebaseProjectId + ".appspot.com",
};
firebase.initializeApp(config);
//
var db = firebase.database();

var projectsRef = db.ref("projects");
var usersRef = db.ref("users");
var winnersRef = db.ref("winners");

var machina = require('machina');
var moment = require('moment');

var today = function () {
	return moment().format("YYYY-MM-DD");
};
var getUserNameFromUser = function (user) {
	return user.username || (user.first_name || "" + " " + user.last_name || "").trim();
};
var commandSignal = new machina.Fsm({
	initialize: function (options) {
		// your setup code goes here...
	},

	namespace: "command-signal",
	initialState: "ready",
	states: {
		ready: {
			"*": function (inputArgs, msg) {
				if (msg) {
					bot.sendMessage(msg.chat.id, "Sorry! I don't get you!");
				}
			},
			"start": function (msg) {
				if (msg) {
					botMessage(msg.chat.id, '<b>Список комманд!</b> \n' +
					  '/register – регистрация  \n' +
					  '/round – запустить раунд \n' +
					  '/unregister – перестать участвовать');
				}
			},
			"count": function (msg) {
				bot.getChatMembersCount(msg.chat.id).then(function (count) {
					console.log("Total users %d", count);
				});
			},
			"hello": function (msg) {
				botMessage(msg.chat.id, "Ты! У твоих тимлидов есть живые джуниоры? \n\
     — Сэр, да, сэр!\n\
     — Готов поспорить, они об этом жалеют! Ты такой говнокодер, что мог бы стать шедевром современного программирования.");
			},
			"quote": function (msg, id) {
				var user = msg.from;
				botMessage(msg.chat.id, Phrases.getQuote(getUserNameFromUser(user), id));
			},
			"round": function (msg) {
				this.handle('quote', msg);
				findTodayWinner(function (winner) {
					if (winner === null) {
						usersRef.once("value", function (snapshot) {
							if (snapshot === null) return;
							var keys = [];
							for (var userKey in snapshot.val()) {
								keys.push(userKey);
							}
							if (keys.length <= 0) {
								botMessage(msg.chat.id, Phrases.getString("empty_participant"), msg.message_id)
								return;
							}
							var rand = keys[Math.floor(Math.random() * keys.length)];
							winner = snapshot.val()[rand];

							console.log('winner is %s', winner.username);

							winnersRef.child(today()).set(winner, function (error) {
								if (error) {
									console.error("Data could not be saved." + error);
								} else {
									console.log("Data saved successfully.");
									/** @namespace msg.chat */
									winnerMessage(msg.chat.id, winner);
								}
							});
						});
					} else {
						winnerMessage(msg.chat.id, winner, true);
					}
				});

			},
			"register": function (msg) {
				var user = msg.from;
				findUser(usersRef, user, function (exists) {
					console.log("exists:" + exists);
					if (exists) {
						botMessage(msg.chat.id, Phrases.alreadyRegister({
							username: getUserNameFromUser(user),
							game: GAME_NAME
						}), msg.message_id);
					} else {
						usersRef.push(user, function (error) {
							if (error) {
								console.error("Data could not be saved." + error);
							} else {
								console.log("Data saved successfully.");
								botMessage(msg.chat.id, Phrases.register({
									username: getUserNameFromUser(user),
									game: GAME_NAME
								}), msg.message_id);
							}
						});
					}
				});
			},
			"unregister": function (msg) {
				var user = msg.from;
				findUser(usersRef, user, function (exists, snapshot) {
					console.log("exists:" + exists);
					if (exists) {
						removeSnapshotFromRef(snapshot, usersRef, function (error) {
							if (error) {
								console.error("Data could not be saved." + error);
							} else {
								console.log("Data updated successfully.");
								botMessage(msg.chat.id, Phrases.unregister({
									username: getUserNameFromUser(user),
									game: GAME_NAME
								}), msg.message_id);
							}
						});
					} else {
						botMessage(msg.chat.id, Phrases.alreadyUnregister({
							username: getUserNameFromUser(user),
							game: GAME_NAME
						}), msg.message_id);
					}
				});
				console.log("hello %s", user.id);
			},


		},
	},
	cmd: function (cmd, msg, args) {
		this.handle(msg, cmd, args);
	}
});
var winnerMessage = function (to, user, already) {
	var data = {username: (already ? '' : '@') + getUserNameFromUser(user), game: GAME_NAME};
	botMessage(to, already ? Phrases.alreadyWinner(data) : Phrases.winner(data));
};
var botMessage = function (to, message, from_id) {
	console.log(message);

	var messageData = {
		parse_mode: "HTML"
	};

	if (from_id && from_id > 0) {
		messageData['reply_to_message_id'] = from_id;
	}

	bot.sendMessage(to, message, messageData);
};
var findUser = function (dbRef, user, callback) {
	if (typeof callback === "undefined") {
		callback = function () {
		};
	}

	dbRef.orderByChild('id').equalTo(user.id).once('value', function (snapshot) {
		callback(snapshot !== null ? snapshot.exists() : false, snapshot);
	});
};

var removeSnapshotFromRef = function (snapshot, ref, cb) {
	if (typeof cb === "undefined") {
		cb = function () {
		};
	}

	var refPath = Object.keys(snapshot.val())[0];
	ref.child(refPath).remove(cb);
};

var findTodayWinner = function (callback) {
	if (typeof callback === "undefined") {
		callback = function () {
		};
	}

	winnersRef.child(today()).once('value', function (snapshot) {
		callback(snapshot.val());
	});
};
var unregisterUser = function (dbRef, user, callback) {
	if (typeof callback === "undefined") {
		callback = function () {
		};
	}
	dbRef.orderByChild('id').equalTo(user.id).remove(callback);
};
// Matches /echo [whatever]
bot.onText(/\/(\w+) ?(.*)/, function (msg, match) {
	var fromId = msg.message_id;
	var cmd = match[1];
	var args = match[2];

	console.log("cmd: %s, args: %s", cmd, args);
	// console.log(msg);
	commandSignal.handle(cmd, msg, args);
});

bot.getMe().then(function (me) {
	console.log('Hi my name is %s!', me.username);
});
//
// bot.getUpdates().then(function (data) {
// 	console.log(data);
// });