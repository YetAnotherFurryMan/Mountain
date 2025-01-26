const fs = require('fs');
const express = require('express');

let names = [];

function makeRestrict(messenger){
	return (req, res, next) => {
		if(req.session.user){
			next();
		} else {
			messenger.put(req, 'Access denided.', 'error');
			res.sendStatus(401);
		}
	};
}

function App(path, messenger){
	path = path.replaceAll('${CWD}', process.cwd());

	this.path = path;
	this.config = require(path + '/config.json');

	if(!this.config.name)
		throw "Unnamed applications are not allowed.";

	if(names.includes(this.config.name))
		throw "Cannot register more than one application with the same name: " + this.config.name

	this.router = new express.Router();
	
	if(fs.existsSync(path + '/www')){
		if(fs.existsSync(path + '/www/public'))
			this.router.use(express.static(path + '/www/public'));

		if(fs.existsSync(path + '/www/css'))
			this.router.use('/css', express.static(path + '/www/css'));

		if(fs.existsSync(path + '/www/private'))
			this.router.use('/r', makeRestrict(messenger), express.static(path + '/www/private'));
	}
	
	if(fs.existsSync(path + '/app.js')){
		const app = require(path + '/app.js');
		this.app = new app.App(this.router, messenger);
	}
}

exports.App = App;
