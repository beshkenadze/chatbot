var sprintf = require('sprintf'),
  phrases = require('./phrases.json'),
  fs = require('fs');

module.exports = {
	prevRandom: -1,
	getRandomTemplate: function (key, id) {
		var index = id || -1;
		if (key in phrases) {
			if (index >= 0) {
				return '#' + index + '\n' + phrases[key][index];
			}
			index = Math.floor(Math.random() * phrases[key].length);

			if (this.prevRandom === index) {
				return this.getRandomTemplate(key);
			} else {
				this.prevRandom = index;
			}

			return '#' + index + '\n' + phrases[key][index];
		}
		return '';
	},
	getQuote: function (object, id) {
		return this.getString('quotes', object, id);
	},
	getString: function (key, object, id) {
		var template = this.getRandomTemplate(key, id);
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