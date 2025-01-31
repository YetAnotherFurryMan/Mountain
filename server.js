const express = require('express');
const session = require('express-session');

const config = require('./config.json');
const core = require('./core/core.js');

if(!config.port) config.port = 3030;
if(!config.host) config.host = 'localhost';
if(!config.secret) config.secret = 'Mountain';
if(!config.app) config.app = 'app';
if(!Array.isArray(config.app)) config.app = [config.app];

const themes = {
	'dark': ['dark', 'darker'],
	'light': ['light', 'lighter']
};

const ex = express();
ex.use(session({
	resave: false,
	saveUninitialized: false,
	secret: config.secret,
}));

ex.use(express.urlencoded({ extended: true }));
ex.use(express.json());
ex.use(express.static('www/public'));
ex.use('/css', express.static('www/css'));

let api = new core.API();
ex.use('/api', api.router);

let messenger = new core.Messenger();
api.addEntry('messenger', messenger.entry);

let theme = new core.Theme(themes);
api.addEntry('theme', theme.entry);
ex.use('/', theme.css);

let model = new core.Model('mountain');

let user = new core.User(model, messenger);
api.addEntry('user', user.entry);

let apps = [];
for(let path of config.app){
	try{
		let app = new core.App(path);
		ex.use('/' + app.config.name, app.router);
		apps.push(app);
	} catch(e){
		console.log(e);
		process.exit(1);
	}
}

// Pernament redirects
ex.post('/login', (req, res) => { res.redirect(308, '/api/user/login'); });
ex.all('/logout', (req, res) => { res.redirect(308, '/api/user/logout'); });

ex.listen(config.port, config.host, () => {
	console.log('Mountain opened on http://' + config.host + ':' + config.port);
});

function deathcall(){
	console.log('Shutting down the server...');
	process.exit(0);
}

process.on('SIGINT', deathcall);  // CTRL+C
process.on('SIGQUIT', deathcall); // Keyboard quit
process.on('SIGTERM', deathcall); // `kill` command
