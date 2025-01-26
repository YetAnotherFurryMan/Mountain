const express = require('express');

const APIEntry = require('./api.js').APIEntry;

function Theme(themes){
	if(!themes)
		throw "Failed to create Themes with no themes given.";

	this.themes = {};
	
	for(let [key, val] of Object.entries(themes)){
		if(Array.isArray(val))
			this.themes[key] = val;
		else if(val)
			this.themes[key] = [val];
		else
			console.error('Ignoring theme: ', key);
	}

	this.theme = Object.keys(this.themes)[0];
	this.variant = Object.values(this.themes)[0][0];

	this.entry = new APIEntry();
	
	this.entry.putHnd('', (req, res) => {
		res.setHeader('Content-Type', 'application/json');

		if(!req.session.theme)
			req.session.theme = Object.keys(this.themes)[0];

		if(req.body.theme){
			if(!this.themes[req.body.theme]){
				res.send('{"status": "ERROR"}');
				return;
			}

			req.session.theme = req.body.theme;
			req.session.variant = this.themes[req.body.theme][0];
		}

		if(req.body.variant){
			if(!this.themes[req.session.theme].includes(req.body.variant)){
				res.send('{"status": "ERROR"}');
				return;
			}

			req.session.variant = req.body.variant;
		}

		res.send('{"status": "OK"}');
	});

	this.entry.postHnd('get', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		
		if(!req.session.theme)
			req.session.theme = Object.keys(this.themes)[0];

		if(!req.session.variant)
			req.session.variant = this.themes[req.session.theme][0];

		res.send(JSON.stringify({
			'status': 'OK',
			'data': {
				'theme': req.session.theme,
				'variant': req.session.variant
			}
		}));
	});

	this.entry.postHnd('list', (req, res) => {
		res.setHeader('Content-Type', 'application/json');

		if(!req.session.theme)
			req.session.theme = Object.keys(this.themes)[0];

		if(!req.session.variant)
			req.session.variant = this.themes[req.session.theme][0];
		
		res.send(JSON.stringify({
			'status': 'OK',
			'data': {
				'themes': this.themes, 
				'current': {
					'theme': req.session.theme, 
					'variant': req.session.variant
				}
			}
		}));
	});

	this.css = express.Router();

	this.css.all('/theme', (req, res) => {
		if(!req.session.theme)
			req.session.theme = Object.keys(this.themes)[0];

		if(!req.session.variant)
			req.session.variant = this.themes[req.session.theme][0];

		res.redirect('css/' + req.session.theme + '/theme.css');
	});

	this.css.all('/variant', (req, res) => {
		if(!req.session.theme)
			req.session.theme = Object.keys(this.themes)[0];

		if(!req.session.variant)
			req.session.variant = this.themes[req.session.theme][0];

		res.redirect('css/' + req.session.theme + '/' + req.session.variant + '.css');
	});
}

exports.Theme = Theme;
