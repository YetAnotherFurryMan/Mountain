const hash = require('pbkdf2-password')();

const scheme = {
	'tables': [
		{
			'name': 'users',
			'columns': [
				{ 'name': 'name', 'type': 'TEXT' },
				{ 'name': 'hash', 'type': 'TEXT' },
				{ 'name': 'salt', 'type': 'TEXT' },
			],
		},
	],
};

let g_messenger = () => {};
let g_smodel = undefined;

function authenticate(model, name, pass, fn){
	if(exports.log)
		console.log('Authenticating %s:%s', name, pass);
  
	model.select.users({name: name}, (err, users) => {
		if(err)
			return fn(err);

		if(users.length <= 0)
			return fn(null, null)

		let user = users[0];
  	
		hash({ password: pass, salt: user.salt }, (err, pass, salt, hash) => {
    		if(err)
				return fn(err);

    		if(hash === user.hash)
				return fn(null, user)
    	
			fn(null, null)
  		});
	});
}

function setup(ex, smodel, messenger, callback){
	if(!ex || !smodel)
		return true;

	if(messenger)
		g_messenger = messenger;

	g_smodel = smodel;

	if(!callback)
		callback = (table, err, op) => { if(err) throw err; };

	let applicationRes = g_smodel.apply(scheme, (table, err, op) => {
		if(err){
			callback(table, err, op);
			return;
		}

		if(op && op.includes('create')){
			// Ensure at least one user: arron:aaron
			hash({ password: 'mountain' }, (err, pass, salt, hash) => {
				if(err){
					callback(table, err, 'insert');
					return;
				}
	  
				g_smodel.model.insert.users({name: 'mountain', hash: hash, salt: salt}, callback);
			});
		} else{
			callback(table, err, op);
		}
	});

	if(applicationRes)
		return true;

	ex.post('/login', (req, res, next) => {
	  	if(!req.body)
			return res.sendStatus(400)
	  	
		authenticate(g_smodel.model, req.body.login, req.body.pass, (err, user) => {
	    	if(err)
				return next(err);
	
	    	if(user){
	      		req.session.regenerate(() => {
	        		req.session.user = user;
	        		g_messenger.put(req, 'Authenticated as ' + user.name, 'succes');
	        		res.redirect('/');
	      		});
	    	} else {
	      		g_messenger.put(req, 'Authentication failed', 'error');
	      		res.redirect('/login.html');
	    	}
	  	});
	});

	ex.post('/username', (req, res) => {
		res.setHeader('Content-Type', 'text/plain');
		if(req.session.user)
			res.send(req.session.user.name);
		else
			res.send('');
	});

	ex.all('/logout', (req, res) => {
		req.session.destroy(() => {
			res.redirect('/');
		});
	});

	return false;
}

exports.setup = setup;
