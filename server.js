const express = require('express');
const session = require('express-session');

const app = {
	'config': require('./app/config.json'),
	'model': require('./app/model.json'),
};

const server = {
	'messenger': require('./server/messenger.js'),
	'model': require('./server/model.js'),
};

const ex = express();
ex.use(session({
	resave: false,
	saveUninitialized: false,
	secret: app.config.server.secret,
}));

ex.use(express.urlencoded({ extended: true }));
ex.use(express.json());
ex.use(express.static('www/public'));
ex.use(express.static('www/mountain'));

if(server.messenger.setup(ex))
	throw "Failed to setup messenger.";

let model = {};
if(server.model.setup(ex, model, app.config.db))
	throw "Failed to setup model.";

if(server.model.apply(app.model));

ex.get('/', (req, res) => {
	res.redirect('index.html');
});

ex.listen(app.config.server.port, () => {
	console.log('Mountain opened on http://localhost:' + app.config.server.port);
});
