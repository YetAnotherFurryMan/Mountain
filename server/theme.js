let g_themes = {};
let g_names = [];

function setup(ex, themes){
	if(themes){
		for(let theme of themes){
			if(!theme.name || !theme.variants)
				return true;

			if(!theme.variants.length)
				continue;

			g_names.push(theme.name);
			g_themes[theme.name] = theme.variants;
		}
	}

	ex.get('/theme', (req, res) => {
		if(g_names.length <= 0){
			res.status(404);
			res.send('404 Not Found');
			return;
		}

		if(!req.session.theme)
			req.session.theme = g_names[0];

		res.redirect('/css/' + req.session.theme + '/theme.css');
	});

	ex.get('/variant', (req, res) => {
		if(g_names.length <= 0){
			res.status(404);
			res.send('404 Not Found');
			return;
		}

		if(!req.session.theme)
			req.session.theme = g_names[0];

		if(!req.session.variant)
			req.session.variant = g_themes[req.session.theme][0];

		res.redirect('/css/' + req.session.theme + '/' + req.session.variant + '.css');
	});

	ex.put('/theme', (req, res) => {
		res.setHeader('Content-Type', 'text/plain');

		if(g_names.length <= 0){
			// TODO: callback
			res.send('ERROR');
			return;
		}

		if(!req.session.theme)
			req.session.theme = g_names[0];

		if(req.body.theme){
			if(!g_names.includes(req.body.theme)){
				// TODO: callback
				res.send('ERROR');
				return;
			}

			req.session.theme = req.body.theme;
			req.session.variant = g_themes[req.body.theme][0];
		}

		if(req.body.variant){
			if(!g_themes[req.session.theme].includes(req.body.variant)){
				// TODO: callback
				res.send('ERROR');
				return;
			}

			req.session.variant = req.body.variant;
		}

		res.send('OK');
	});

	ex.post('/theme', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		
		if(g_names.length <= 0){
			res.send('{}');
			return;
		}

		if(!req.session.theme)
			req.session.theme = g_names[0];

		if(!req.session.variant)
			req.session.variant = g_themes[req.session.theme][0];

		res.send(JSON.stringify({ 'theme': req.session.theme, 'variant': req.session.variant }));
	});

	ex.post('/themes', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({
			'names': g_names, 
			'themes': g_themes, 
			'current': {
				'name': req.session.theme, 
				'variant': req.session.variant
			}
		}));
	});
}

exports.setup = setup;
