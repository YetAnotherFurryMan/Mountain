const mountain = {
	'messenger': {
		'get': async () => {
			return fetch('/api/messenger/get', {
				'method': 'post',
			}).then(res => res.json());
		},
		'list': async () => {
			return fetch('/api/messenger/list', {
				'method': 'post',
			}).then(res => res.json());
		},
		'put': async (text, type) => {
			return fetch('/api/messenger/put', {
				'method': 'post',
				'headers': {
					'Content-Type': 'application/json',
				},
				'body': JSON.stringify({ 'text': text, 'type': type }),
			}).then(res => res.json());
		},
		'pop': async () => {
			return fetch('/api/messenger/pop', {
				'method': 'delete',
			}).then(res => res.json());
		},
		'clear': async () => {
			return fetch('/api/messenger/clear', {
				'method': 'delete',
			}).then(res => res.json());
		},
	},
	// 'model': {
	// 	'get': async (table, id) => {
	// 		if(!table)
	// 			throw "No table provided";
	//
	// 		return fetch('/api/' + table + '/' + id, {
	// 			'method': 'post',
	// 		}).then(res => res.json());
	// 	},
	// 	'list': async (table, filter) => {
	// 		if(!table)
	// 			throw "No table provided";
	//
	// 		return fetch('/api/' + table, {
	// 			'method': 'post',
	// 			'headers': {
	// 				'Content-Type': 'application/json',
	// 			},
	// 			'body': JSON.stringify(filter),
	// 		}).then(res => res.json());
	// 	},
	// 	'put': async (table, data) => {
	// 		if(!table)
	// 			throw "No table provided";
	//
	// 		return fetch('/api/' + table, {
	// 			'method': 'put',
	// 			'headers': {
	// 				'Content-Type': 'application/json',
	// 			},
	// 			'body': JSON.stringify(data),
	// 		}).then(res => res.json());
	// 	},
	// 	'set': async (table, id, data) => {
	// 		if(!table)
	// 			throw "No table provided";
	//
	// 		return fetch('/api/' + table + '/' + id + '/set', {
	// 			'method': 'post',
	// 			'headers': {
	// 				'Content-Type': 'application/json',
	// 			},
	// 			'body': JSON.stringify(data),
	// 		}).then(res => res.json());
	// 	},
	// 	'delete': async (table, id) => {
	// 		if(!table)
	// 			throw "No table provided";
	//
	// 		return fetch('/api/' + table + '/' + id, {
	// 			'method': 'delete',
	// 		}).then(res => res.json());
	// 	},
	// },
	'user': {
		'login': async (login, password) => {
			return fetch('/api/user/login', {
				'method': 'post',
				'headers': {
					'Content-Type': 'application/json',
				},
				'body': JSON.stringify({ 'login': login, 'pass': password }),
			});
		},
		'logout': async () => {
			return fetch('/api/user/logout', {
				'method': 'post',
			});
		},
		'get': async () => {
			return fetch('/api/user/name', {
				'method': 'post',
			}).then(res => res.text());
		},
		'new': async (name, password) => {
			return fetch('/api/user/new', {
				'method': 'post',
				'headers': {
					'Content-Type': 'application/json',
				},
				'body': JSON.stringify({ 'name': name, 'password': password }),
			}).then(res => res.json());
		},
	},
	'theme': {
		'get': async () => {
			return fetch('api/theme/get', {
				'method': 'post',
			}).then(res => res.json());
		},
		'list': async () => {
			return fetch('api/theme/list', {
				'method': 'post',
			}).then(res => res.json());
		},
		'put': async (theme, variant) => {
			return fetch('api/theme', {
				'method': 'put',
				'headers': {
					'Content-Type': 'application/json',
				},
				'body': JSON.stringify({ 'theme': theme, 'variant': variant }),
			}).then(res => res.json());
		},
	},
};
