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
			return fetch('/message', {
				'method': 'put',
				'headers': {
					'Content-Type': 'application/json',
				},
				'body': JSON.stringify({ 'text': text, 'type': type }),
			}).then(res => res.text());
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
	}
};
