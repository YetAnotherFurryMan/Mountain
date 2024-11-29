const express = require('express');
const session = require('express-session');

const app = {
	'config': require('./app/config.json'),
};

const server = {
	'messenger': require('./server/messenger.js'),
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

ex.get('/', (req, res) => {
	res.redirect('index.html');
});

ex.listen(app.config.server.port, () => {
	console.log('Mountain opened on http://localhost:' + app.config.server.port);
});
