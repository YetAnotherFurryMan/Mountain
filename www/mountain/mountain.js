const mountain = {
	'messenger': {
		'get': async () => {
			return fetch('/message', {
				'method': 'post',
			}).then(res => res.json());
		},
		'list': async () => {
			return fetch('/messages', {
				'method': 'post',
			}).then(res => res.json());
		},
		'put': async (text, type) => {
			return fetch('/message/put', {
				'method': 'post',
				'headers': {
					'Content-Type': 'application/json',
				},
				'body': JSON.stringify({ 'text': text, 'type': type }),
			}).then(res => res.json());
		},
		'pop': async () => {
			return fetch('/message', {
				'method': 'delete',
			}).then(res => res.json());
		},
		'clear': async () => {
			return fetch('/messages', {
				'method': 'delete',
			}).then(res => res.json());
		},
	},
	'model': {
		'get': async (table, id) => {
			if(!table)
				throw "No table provided";

			return fetch('/api/' + table + '/' + id, {
				'method': 'post',
			}).then(res => res.json());
		},
		'list': async (table, filter) => {
			if(!table)
				throw "No table provided";

			return fetch('/api/' + table, {
				'method': 'post',
				'headers': {
					'Content-Type': 'application/json',
				},
				'body': JSON.stringify(filter),
			}).then(res => res.json());
		},
		'put': async (table, data) => {
			if(!table)
				throw "No table provided";

			return fetch('/api/' + table + '/put', {
				'method': 'post',
				'headers': {
					'Content-Type': 'application/json',
				},
				'body': JSON.stringify(data),
			}).then(res => res.json());
		},
		'set': async (table, id, data) => {
			if(!table)
				throw "No table provided";

			return fetch('/api/' + table + '/' + id + '/set', {
				'method': 'post',
				'headers': {
					'Content-Type': 'application/json',
				},
				'body': JSON.stringify(data),
			}).then(res => res.json());
		},
		'delete': async (table, id) => {
			if(!table)
				throw "No table provided";

			return fetch('/api/' + table + '/' + id, {
				'method': 'delete',
			}).then(res => res.json());
		},
	},
	'user': {
		'login': async (login, password) => {
			return fetch('/login', {
				'method': 'post',
				'headers': {
					'Content-Type': 'application/json',
				},
				'body': JSON.stringify({ 'login': login, 'pass': password}),
			});
		},
		'logout': async () => {
			return fetch('/logout', {
				'method': 'post',
			});
		},
		'get': async () => {
			return fetch('/username', {
				'method': 'post',
			}).then(res => res.text());
		},
	},
	'theme': {
		'get': async () => {
			return fetch('/theme', {
				'method': 'post',
			}).then(res => res.json());
		},
		'list': async () => {
			return fetch('/themes', {
				'method': 'post',
			}).then(res => res.json());
		},
		'put': async (theme, variant) => {
			return fetch('/theme', {
				'method': 'put',
				'headers': {
					'Content-Type': 'application/json',
				},
				'body': JSON.stringify({ 'theme': theme, 'variant': variant }),
			}).then(res => res.text());
		},
	},
};
