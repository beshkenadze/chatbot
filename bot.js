require('dotenv').config();

var TelegramBot = require('node-telegram-bot-api');
var botToken = process.env.BOT_TOKEN || 'some-default-token';
var firebaseApiKey = process.env.FIREBASE_API_KEY || 'some-default-key';
var firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'some-default-project-id';

// Setup polling way
var bot = new TelegramBot(botToken, {polling: true});
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
var today = moment().format("YYYY-MM-DD");
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
					  '/round – запустить раунд');
				}
			},
			"count": function (msg) {
				bot.getChatMembersCount(msg.chat.id).then(function (count) {
					console.log("Total users %d", count);

				});
			},
			"hello": function (msg) {
				console.log(msg);
			},
			"round": function (msg) {
				findTodayWinner(function (winner) {
					if (winner === null) {
						usersRef.once("value", function (snapshot) {
							var keys = [];
							for (var userKey in snapshot.val()) {
								keys.push(userKey);
							}
							var rand = keys[Math.floor(Math.random() * keys.length)];
							winner = snapshot.val()[rand];
							console.log('winner is %s', winner.username);

							winnersRef.child(today).set(winner, function (error) {
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
						winnerMessage(msg.chat.id, winner);
					}
				});

			},
			"register": function (msg) {
				var user = msg.from;
				findUserInRef(usersRef, user, function (exists) {
					console.log("exists:" + exists);
					if (exists) {
						botMessage(msg.chat.id, '<b>Эй!</b> Ты уже участвуешь в игре <b>"Говнокодер Дня"</b>!');
					} else {
						usersRef.push(user, function (error) {
							if (error) {
								console.error("Data could not be saved." + error);
							} else {
								console.log("Data saved successfully.");
								botMessage(msg.chat.id, '<b>OK!</b> Ты теперь участвуешь в игре <b>"Говнокодер Дня"</b>!');
							}
						});
					}
				});
				console.log("hello %s", user.id);
			},

		},
	},
	cmd: function (cmd, args) {
		this.handle(args, cmd);
	}
});
var winnerMessage = function (to, user) {
	botMessage(to, 'Ого, вы посмотрите только! А <b>Говнокодер Дня</b> то - @' + user.username);
};
var botMessage = function (to, message) {
	console.log(message);
	bot.sendMessage(to, message, {
		parse_mode: "HTML"
	});
};
var findUserInRef = function (dbRef, user, callback) {
	if (typeof callback === "undefined") {
		callback = function () {
		};
	}

	dbRef.orderByChild('id').equalTo(user.id).once('value', function (snapshot) {
		var exists = (snapshot.val() !== null);
		callback(exists);
	});
};
var findTodayWinner = function (callback) {
	if (typeof callback === "undefined") {
		callback = function () {
		};
	}

	winnersRef.child(today).once('value', function (snapshot) {
		callback(snapshot.val());
	});
};
// Matches /echo [whatever]
bot.onText(/\/(\w+) ?(.*)/, function (msg, match) {
	var fromId = msg.from.id;
	var cmd = match[1];
	var args = match[2];

	console.log("cmd: %s, args: %s", cmd, args);
	// console.log(msg);
	commandSignal.handle(cmd, msg);
});

bot.getMe().then(function (me) {
	console.log('Hi my name is %s!', me.username);
});