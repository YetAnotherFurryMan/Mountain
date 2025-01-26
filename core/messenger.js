const APIEntry = require('./api.js').APIEntry;

function Messenger(){
	this.entry = new APIEntry();
	
	this.get = (req) => {
		if(!req || !req.session.messages)
			return {};

		let id = req.session.messages.length - 1;
		return {
			'id': id,
			'message': req.session.messages[id],
		};
	}

	this.list = (req) => {
		if(!req || !req.session.messages)
			return [];

		return {
			'len': req.session.messages.length,
			'messages': req.session.messages,
		};
	}

	this.put = (req, text, type) => {
		if(!req || !text || !type)
			return false;

		if(!req.session.messages)
			req.session.messages = [];

		req.session.messages.push({
			'text': text,
			'type': type,
		});

		return true;
	}

	this.pop = (req) => {
		if(!req || !req.session.messages)
			return {};

		let ret = this.get(req);
		req.session.messages.splice(ret.id);
		return ret;
	}

	this.clear = (req) => {
		if(!req || !req.session.messages)
			return [];

		let ret = this.list(req);
		delete req.session.messages;
		return ret;
	}

	this.entry.post('get', this.get);
	this.entry.post('list', this.list);
	this.entry.put('', (req) => { return this.put(req, req.body.text, req.body.type); });
	this.entry.delete('pop', this.pop);
	this.entry.delete('clear', this.clear);
}

exports.Messenger = Messenger;
