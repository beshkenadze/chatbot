yaml = require('js-yaml');
sprintf = require('sprintf');
fs = require('fs');

// Get document, or throw exception on error
try {
	var doc = yaml.safeLoad(fs.readFileSync('phrases.yml', 'utf8'));
} catch (e) {
	console.log(e);
}

module.exports = {
	getRandomTemplate: function (key) {
		if (key in doc) {
			return doc[key][Math.floor(Math.random() * doc[key].length)];
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