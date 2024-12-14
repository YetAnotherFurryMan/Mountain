const express = require('express');
const session = require('express-session');

const app = {
	'config': require('./app/config.json'),
	'model': require('./app/model.json'),
	'app': require('./app/app.js'),
};

const server = {
	'messenger': require('./server/messenger.js'),
	'model': require('./server/model.js'),
	'user': require('./server/user.js'),
	'theme': require('./server/theme.js'),
};

function modelCallback(table, err, op){
	if(err)
		throw err;

	if(op)
		console.log('Done: ' + op + ' on ' + table);
	else
		console.log('Loaded: ' + table);
}

function modelErrorCallback(err){
	if(err)
		server.messenger.put('ERROR', err);
}

function restrict(req, res, next){
	if(app.config.restrict == 'no'){
		next();
	} else if(req.session.user){
		next();
	} else {
		server.messenger.put(req, 'Access denided.', 'error');
		res.sendStatus(401);
	}
}

if(!app.config.www)
	app.config.www = {};

if(!app.config.www.www)
	app.config.www.www = 'www';

if(!app.config.www.public)
	app.config.www.public = 'public';

if(!app.config.www.private)
	app.config.www.private = 'private';

if(!app.config.www.css)
	app.config.www.css = 'css';

const ex = express();
ex.use(session({
	resave: false,
	saveUninitialized: false,
	secret: app.config.server.secret,
}));

ex.use(express.urlencoded({ extended: true }));
ex.use(express.json());
ex.use(express.static('www/mountain'));
ex.use(express.static(app.config.www.www + '/' + app.config.www.public));
ex.use('/css', express.static(app.config.www.www + '/' + app.config.www.css));
ex.use('/r', restrict, express.static(app.config.www.www + '/' + app.config.www.private));

if(server.messenger.setup(ex))
	throw "Failed to setup messenger.";

let model = {};
if(server.model.setup(ex, model, app.config.db, restrict))
	throw "Failed to setup model.";

if(server.user.setup(ex, server.model, server.messenger, modelCallback))
	throw "Failed to setup user.";

if(server.model.apply(app.model, modelCallback, modelErrorCallback))
	throw "Failed to apply application model.";

if(server.theme.setup(ex, app.config.themes))
	throw "Failed to setup themes.";

if(app.app.setup(ex, model))
	throw "Failed to setup application.";

ex.get('/', (req, res) => {
	res.redirect('index.html');
});

ex.listen(app.config.server.port, () => {
	console.log('Mountain opened on http://localhost:' + app.config.server.port);
});
