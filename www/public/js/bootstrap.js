function createBtn(){
	let btn = document.createElement('button');
	btn.className = 'btn clickable';
	return btn;
}

function createPanel(){
	let panel = document.createElement('section');
	panel.className = 'panel';
	return panel;
}

export default {
	createBtn: createBtn,
	createPanel: createPanel,
};
