function get(req){
	if(!req || !req.session.messages)
		return {};

	let id = req.session.messages.length - 1;
	return {
		'id': id,
		'message': req.session.messages[id],
	};
}

function list(req){
	if(!req || !req.session.messages)
		return [];

	return {
		'len': req.session.messages.length,
		'messages': req.session.messages,
	};
}

function put(req, text, type){
	if(!req || !text || !type)
		return true;

	if(!req.session.messages)
		req.session.messages = [];

	req.session.messages.push({
		'text': text,
		'type': type,
	});

	return false;
}

function pop(req){
	if(!req || !req.session.messages)
		return {};

	let ret = get(req);
	req.session.messages.splice(ret.id);
	return ret;
}

function clear(req){
	if(!req || !req.session.messages)
		return [];

	let ret = list(req);
	delete req.session.messages;
	return ret;
}

function setup(ex){
	if(!ex)
		return true;

	ex.post('/message', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(get(req)));
	});

	ex.post('/messages', (req, res) => {
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(list(req)));
	});

	ex.put('/message', (req, res) => {
		res.setHeader('Content-Type', 'text/plain');
		if(put(req, req.body.text, req.body.type))
			res.send('ERROR');
		else
			res.send('OK');
	});

	ex.delete('/message', (req, res) => {
		res.setHeader('Constnt-Type', 'application/json');
		res.send(JSON.stringify(pop(req)));
	});

	ex.delete('/messages', (req, res) => {
		res.setHeader('Constnt-Type', 'application/json');
		res.send(JSON.stringify(clear(req)));
	});

	return false;
}

exports.setup = setup;
exports.get = get;
exports.list = list;
exports.put = put;
exports.pop = pop;
exports.clear = clear;
