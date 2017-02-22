var sprintf = require('sprintf'),
  phrases = require('./phrases.json'),
  fs = require('fs');

module.exports = {
	prevRandom: -1,
	getRandomTemplate: function (key) {
		if (key in phrases) {
			var index = Math.floor(Math.random() * phrases[key].length);
			if (this.prevRandom !== index) {
				this.prevRandom = index;
			}else {
				return this.getRandomTemplate(key);
			}
			return phrases[key][index];
		}
		return '';
	},
	getRandomQuote: function (object) {
		return this.getString('quotes', object);
	},
	getString: function (key, object) {
		var template = this.getRandomTemplate(key);
		if (typeof template !== 'string') {
			for (var i = 0; i < template.length; i++) {
				try {
					template[i] = sprintf(template[i], object);
				} catch (e) {
				}
			}
			return template;
		}
		try {
			return sprintf(template, object);
		} catch (e) {
			return template;
		}
	},
	winner: function (object) {
		return this.getString('winner', object);
	},
	alreadyWinner: function (object) {
		return this.getString('already_winner', object);
	},
	register: function (object) {
		return this.getString('register', object);
	},
	unregister: function (object) {
		return this.getString('unregister', object);
	},
	alreadyRegister: function (object) {
		return this.getString('already_register', object);
	},
	alreadyUnregister: function (object) {
		return this.getString('already_unregister', object);
	}
};