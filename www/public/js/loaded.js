import bs from './bootstrap.js';

const top_bar = document.getElementById('top_bar');

let logio_btn = bs.createBtn();
top_bar.appendChild(logio_btn);

fetch('/api/user/name', {
	'method': 'post'
}).then(res => res.text()).then(res => {
	if(res == ''){
		logio_btn.innerHTML = 'login';
		logio_btn.addEventListener('click', () => {
			location = '/login.html';
		});
	} else {
		logio_btn.innerHTML = 'logout';
		logio_btn.addEventListener('click', () => {
			fetch('/logout').then(res => {
				location.reload();
			});
		});
	}
});

let toggle_theme_btn = bs.createBtn();
top_bar.appendChild(toggle_theme_btn);

fetch('/api/theme/list', {
	'method': 'post'
}).then(res => res.json()).then(theme => {
	let next_theme = theme.data.current.theme;
	if(next_theme == 'dark') next_theme = 'light';
	else next_theme = 'dark';

	toggle_theme_btn.innerHTML = next_theme;
	toggle_theme_btn.addEventListener('click', () => {
		fetch('/api/theme', {
			'method': 'put',
			'headers': {
				'Content-Type': 'application/json'
			},
			'body': JSON.stringify({'theme': next_theme})
		}).then(res => res.json()).then(res => {
			location.reload();
		});
	});
});

fetch('/api/app/list', {
	'method': 'post'
}).then(res => res.json()).then(res => {
	let apps = document.getElementById('apps');
	for(let name of res.data){
		let app = bs.createPanel();
		app.innerHTML += '<h1>' + name + '</h1>';
		app.className += ' w-20 fshrink-0 clickable';
		app.addEventListener('click', () => {
			window.location = '/' + name;
		});
		apps.appendChild(app);
	}
});
