const express = require('express');

function APIEntry(){
	this.router = new express.Router();
	this.scheme = {
		'post': new Set(),
		'put': new Set(),
		'delete': new Set(),
		'rpost': new Set(),
		'rput': new Set(),
		'rdelete': new Set()
	};

	this.postMidHnd = (name, middle, handler) => {
		this.scheme.post.add(name);
		this.router.post('/' + name, middle, handler);
		this.router.get('/' + name, middle, handler);
	};

	this.putMidHnd = (name, middle, handler) => {
		this.scheme.put.add(name);
		this.router.put('/' + name, middle, handler);
		this.postMidHnd('put/' + name, middle, handler);
	};

	this.deleteMidHnd = (name, middle, handler) => {
		this.scheme.delete.add(name);
		this.router.delete('/' + name, middle, handler);
		this.postMidHnd('delete/' + name, middle, handler);
	};

	this.postHnd = (name, handler) => { this.postMidHnd(name, (req, res, next) => next(), handler); };
	this.putHnd = (name, handler) => { this.putMidHnd(name, (req, res, next) => next(), handler); };
	this.deleteHnd = (name, handler) => { this.deleteMidHnd(name, (req, res, next) => next(), handler); };
	
	const makeDefaultHandler = (fn) => {
		return (req, res) => {
			const data = fn(req);

			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({'status': (data?'OK':'ERROR'), 'data': data}));
		};
	};

	this.post = (name, fn) => { this.postHnd(name, makeDefaultHandler(fn)); };
	this.put = (name, fn) => { this.putHnd(name, makeDefaultHandler(fn)); };
	this.delete = (name, fn) => { this.deleteHnd(name, makeDefaultHandler(fn)); };

	const restrict = (res, req, next) => {
		if(req.session.user){
			next();
		} else {
			res.sendStatus(401);
		}
	}

	this.postRHnd = (name, handler) => { this.postMidHnd(name, restrict, handler); };
	this.putRHnd = (name, handler) => { this.putMidHnd(name, restrict, handler); };
	this.deleteRHnd = (name, handler) => { this.deleteMidHnd(name, restrict, handler); };

	this.postR = (name, fn) => { this.postRHnd(name, makeDefaultHandler(fn)); };
	this.putR = (name, fn) => { this.putRHnd(name, makeDefaultHandler(fn));	};
	this.deleteR = (name, fn) => { this.deleteRHnd(name, makeDefaultHandler(fn)); };
}

function API(){
	this.router = new express.Router();
	this.scheme = {};

	this.addRouterEntry = (name, router) => {
		this.scheme[name] = [];
		this.router.use('/' + name, router);
	};

	this.addEntry = (name, entry) => {
		this.scheme[name] = entry.scheme;
		this.router.use('/' + name, entry.router);
	};

	// TODO: Auto-generate api.js (aka mountain.js)
	// this.js = () => {
	// 	let js = [];
	//
	// 	return js.join('');
	// };
}

exports.API = API;
exports.APIEntry = APIEntry;
