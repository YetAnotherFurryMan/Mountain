const express = require('express');
const session = require('express-session');

const ex = express();
ex.use(session({
	resave: false,
	saveUninitialized: false,
	secret: 'Mountain',
}));

ex.use(express.urlencoded({ extended: true }));
ex.use(express.static('www/public'));

ex.get('/', (req, res) => {
	res.redirect('index.html');
});

ex.listen(3030, () => {
	console.log('Mountain opened on localhost:3030');
});
