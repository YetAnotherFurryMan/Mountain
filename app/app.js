function setup(ex, model, restrict){
	ex.all('/app', (res, reg) => {
		res.setHeader('Content-Type', 'text/plain');
		res.send('Hello from app!');
	});

	return false;
}

exports.setup = setup;
