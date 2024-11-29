const express = require('express');
const session = require('express-session');

const app = {
	'config': require('./app/config.json'),
};

const ex = express();
ex.use(session({
	resave: false,
	saveUninitialized: false,
	secret: app.config.server.secret,
}));

ex.use(express.urlencoded({ extended: true }));
ex.use(express.static('www/public'));

ex.get('/', (req, res) => {
	res.redirect('index.html');
});

ex.listen(app.config.server.port, () => {
	console.log('Mountain opened on http://localhost:' + app.config.server.port);
});
