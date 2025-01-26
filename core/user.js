const hash = require('pbkdf2-password')();

const APIEntry = require('./api.js').APIEntry;

const scheme = {
	tables: {
		'users': {
			columns: {
				'name': { type: 'TEXT' },
				'hash': { type: 'TEXT' },
				'salt': { type: 'TEXT' },
			},
		},
	},
};

function authenticate(model, name, pass, fn){
	const users = model.select.users({name: name});

	if(users.length <= 0){
		fn(null, null);
		return;
	}

	const user = users[0];
	hash({ password: pass, salt: user.salt }, (err, pass, salt, hash) => {
    	if(err)
			return fn(err);

    	if(hash === user.hash)
			return fn(null, user)
    	
		fn(null, null)
	});
}

function User(model, messenger){
	this.model = model;
	this.messenger = messenger;

	model.apply(scheme);

	// Ensure use mountain:mountain exists
	const users = model.select.users();
	if(users.length <= 0){
		hash({ password: 'mountain' }, (err, pass, salt, hash) => {
			if(err){
				throw err;
			}
	  
			this.model.insert.users({name: 'mountain', hash: hash, salt: salt});
		});
	}

	this.entry = new APIEntry();

	this.entry.postHnd('login', (req, res, next) => {
		if(!req.body)
			return res.sendStatus(400)
	  	
		authenticate(this.model, req.body.login, req.body.pass, (err, user) => {
	    	if(err)
				return next(err);
	
	    	if(user){
	      		req.session.regenerate(() => {
	        		req.session.user = user;
	        		this.messenger.put(req, 'Authenticated as ' + user.name, 'succes');
	        		res.redirect('/app');
	      		});
	    	} else {
	      		this.messenger.put(req, 'Authentication failed', 'error');
	      		res.redirect('/');
	    	}
	  	});
	});

	this.entry.postHnd('name', (req, res) => {
		res.setHeader('Content-Type', 'text/plain');
		if(req.session.user)
			res.send(req.session.user.name);
		else
			res.send('');
	});

	this.entry.postHnd('logout', (req, res) => {
		req.session.destroy(() => {
			res.redirect('/');
		});
	});

	this.entry.postMidHnd('new', (req, res, next) => {
		if(req.session.user && req.session.user.name === 'mountain'){
			next();
		} else{
			this.messenger.put(req, 'Only mountain can create new users.', 'error');
			res.sendStatus(401);
		}
	}, (req, res) => {
		if(!req.body || !req.body.name || !req.body.password)
			return res.sendStatus(400);

		res.setHeader('Constent-Type', 'application/json');
		
		hash({ password: req.body.password }, (err, pass, salt, hash) => {
			if(err){
				res.sendStatus(400);
				res.send(JSON.stringify({status: 'ERROR', data: err}));
				return;
			}
	  
			const ret = this.model.insert.users({name: req.body.name, hash: hash, salt: salt});
			res.send(JSON.stringify({status: (ret?'OK':'ERROR'), data: ret}));
		});
	});
}

exports.User = User;
