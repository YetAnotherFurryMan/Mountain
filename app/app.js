const core = require('../core/core.js');

const themes = {
	'dark': ['dark', 'darker'],
	'light': ['light', 'lighter']
};

function App(ex){
	this.ex = ex;

	ex.all('/hello', (res, reg) => {
		res.setHeader('Content-Type', 'text/plain');
		res.send('Hello from app!');
	});

	const api = new core.API();
	ex.use('/api', api.router);

	const theme = new core.Theme(themes);
	api.addEntry('theme', theme.entry);
	ex.use('/', theme.css);
}

exports.App = App;
