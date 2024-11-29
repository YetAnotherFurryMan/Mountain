const sqlite3 = require('sqlite3').verbose();

let g_ex = undefined;
let g_model = undefined;
let g_db = undefined;
let g_restrict = (req, res, next) => next();

function defaultCallback(err){
	if(err)
		throw err;
}

function dbSection(call){
	if(!g_db)
		throw "No db.";

	const db = new sqlite3.Database(g_db);
	db.serialize(() => {
		call(db);
	});
	db.close();
}

function setup(ex, model, db, restrict){
	if(!ex || !model || !db)
		return true;

	if(restrict)
		g_restrict = restrict;

	g_ex = ex;
	g_model = model;
	g_db = db;

	g_model.select = {};
	g_model.insert = {};
	g_model.update = {};
	g_model.delete = {};

	return false;
}

function apply(schema, callback){
	if(!schema)
		return true;

	if(schema.tables){
		for(let table of schema.tables){
			if(makeTable(table, callback))
				return true;
			if(makeModel(table))
				return true;
			if(makeAPI(table))
				return true;
		}
	}

	return false;
}

function makeTable(table, callback){
	if(!table || !table.name || !table.columns || table.columns.length <= 0)
		return true;

	if(!callback)
		callback = (name, err) => { defaultCallback(err); };

	dbSection((db) => {
		db.all('SELECT * FROM sqlite_master WHERE name = ?;', [table.name], (err, rows) => {
			if(err){
				callback(table.name, err);
				return;
			}

			if(rows.length == 0){
				let sql = 'CREATE TABLE ' + table.name + ' (';
				for(let column of table.columns){
					sql += column.name + ' ' + column.type + ', ';
				}
				sql = sql.slice(0, -2) + ');';
				dbSection((db) => {
					db.run(sql, (err) => {
						callback(table.name, err, 'create');
					});
				});
			} else{
				dbSection((db) => {
					db.all('SELECT * FROM pragma_table_xinfo(?);', [table.name], (err, rows) => {
						if(err){
							callback(table.name, err);
							return;
						}
						
						let compatible = rows.length == table.columns.length;
						let presentColumns = [];
						for(let row of rows){
							let found = false;
							for(let column of table.columns){
								if(row.name == column.name && row.type == column.type){
									presentColumns.push(row.name);
									found = true;
									break;
								}
							}

							if(!found)
								compatible = false;
						}

						if(compatible){
							callback(table.name);
							return;
						}
						
						let sql1 = 'CREATE TABLE ' + table.name + '_tmp (';
						for(let column of table.columns){
							sql1 += column.name + ' ' + column.type + ', ';
						}
						sql1 = sql1.slice(0, -2) + ');';

						let sql2 = 'INSERT INTO ' + table.name + '_tmp SELECT ';
						for(let column of table.columns){
							if(presentColumns.includes(column.name))
								sql2 += column.name;
							else
								sql2 += 'NULL';
							sql2 += ', ';
						}
						sql2 = sql2.slice(0, -2) + ' FROM ' + table.name + ';';

						let sql3 = 'DROP TABLE ' + table.name + ';';

						let sql4 = 'ALTER TABLE ' + table.name + '_tmp RENAME TO ' + table.name + ';';

						dbSection((db) => {
							db.run(sql1, err => callback(table.name, err, 'create tmp'))
							  .run(sql2, err => callback(table.name, err, 'insert tmp'))
							  .run(sql3, err => callback(table.name, err, 'drop'))
							  .run(sql4, err => callback(table.name, err, 'alter tmp'));
						});
					});
				});
			}
		});
	});

	return false;
}

function makeModel(table){
	if(!table || !table.name)
		return true;

	g_model.select[table.name] = (filter, callback) => {
		if(!callback)
			callback = defaultCallback;

		const handler = (err, rows) => {
			if(err){
				callback(err);
				return;
			}

			callback(null, rows);
		};

		if(!filter){
			dbSection(db => {
				db.all('SELECT OID as id, * FROM ' + table.name + ';', handler);
			});
		} else{
			let sql = 'SELECT OID as id, * FROM ' + table.name;
			let x = [];
			let and = ' WHERE ';
			
			for(let col of table.columns){
				if(filter[col.name]){
					if(typeof filter[col.name] === 'object' && !Array.isArray(filter[col.name])){
						if(!filter[col.name].type || !filter[col.name].value){
							callback('Bad filter for column: ' + col.name);
							return;
						}

						let type = filter[col.name].type;
						if(type == '='){
							sql += and + col.name + ' = ?';
							x.push(filter[col.name].value);
						} else if(type == 'like'){
							sql += and + col.name + ' LIKE ?';
							x.push(filter[col.name].value);
						} else if(type == 'in'){
							if(!Array.isArray(filter[col.name].value)){
								callback('Bad filter for column: ' + col.name + ' "in" expects value to be an array.');
								return;
							}

							sql += and + col.name + ' IN (';
							for(let e of filter[col.name].value){
								sql += '?, ';
								x.push(e);
							}
							sql = sql.slice(0, -2) + ')';
						}
					} else{
						sql += and + col.name + ' = ?';
						x.push(filter[col.name]);
					}
					
					and = ' AND ';
				}
			}

			if(filter.id){
				sql += and + 'id = ?';
				x.push(filter.id);
			}

			// TODO: Add ORDER BY
			// TODO: Add CONSTRUCT pseudo-columns
			
			sql += ';';

			dbSection(db => {
				db.all(sql, x, handler);
			});
		}
	};

	g_model.insert[table.name] = (data, callback) => {
		if(!callback)
			callback = defaultCallback;

		if(!data){
			callback('No data provided!');
			return;
		}

		if(!Array.isArray(data))
			data = [data];

		let sql = 'INSERT INTO ' + table.name + ' VALUES ';
		let x = [];
		for(let d of data){
			sql += '(';
			for(let col of table.columns){
				if(!d[col.name]){
					sql += 'NULL, ';
				} else{
					sql += '?, ';
					x.push(d[col.name]);
				}
			}
			sql = sql.slice(0, -2) + '), ';
		}
		sql = sql.slice(0, -2) + ';';

		dbSection(db => {
			db.run(sql, x, callback);
		});
	};

	g_model.update[table.name] = (id, data, callback) => {
		if(!callback)
			callback = defaultCallback;

		if(!id){
			callback('No ID provided!');
			return;
		}

		if(!data){
			callback('No data provided!');
			return;
		}

		let sql = 'UPDATE ' + table.name + ' SET ';
		let x = [];
		for(let col of table.columns){
			if(data[col.name]){
				sql += col.name + ' = ?, ';
				x.push(data[col.name]);
			}
		}
		sql = sql.slice(0, -2) + ' WHERE OID = ?;';
		x.push(id);

		dbSection(db => {
			db.run(sql, x, callback);
		});
	};

	g_model.delete[table.name] = (id, callback) => {
		if(!callback)
			callback = defaultCallback;

		if(!id){
			callback('No ID provided!');
			return;
		}

		let sql = 'DELETE FROM ' + table.name + ' WHERE OID ';

		if(Array.isArray(id)){
			if(id.lenght < 1){
				callback('No ID provided: empty list.');
				return;
			}

			sql += 'IN (';
			for(let i of id)
				sql += i + ', ';
			sql = sql.slice(0, -2) + ');';
		} else{
			id = [id];
			sql += '= ?;';
		}

		dbSection(db => {
			db.run(sql, id, callback);
		});
	};

	return false;
}

function makeAPI(table, callback){
	if(!table || !table.name || !table.columns)
		return true;

	if(!table.expose)
		return false;

	if(table.expose.includes('select')){
		console.log('POST /api/' + table.name);
		g_ex.post('/api/' + table.name, g_restrict, (req, res) => {
			res.setHeader('Content-Type', 'application/json');
			g_model.select[table.name](req.body, (err, rows) => {
				if(err){
					callback(err);
					res.send('[]');
					return;
				}
				res.send(JSON.stringify(rows));
			});
		});

		console.log('POST /api/' + table.name + '/id');
		g_ex.post('/api/' + table.name + '/:id', g_restrict, (req, res) => {
			res.setHeader('Content-Type', 'application/json');
			g_model.select[table.name]({id: req.params.id}, (err, rows) => {
				if(err){
					callback(err);
					res.send('{}');
					return;
				}
				res.send(JSON.stringify(rows[0]));
			});
		});
	}

	if(table.expose.includes('insert')){
		console.log('PUT /api/' + table.name);
		g_ex.put('/api/' + table.name, g_restrict, (req, res) => {
			res.setHeader('Content-Type', 'text/plain');
			g_model.insert[table.name](req.body, (err) => {
				if(err){
					callback(err);
					res.send('ERROR');
					return;
				}
				res.send('OK');
			});
		});
	}
	
	if(table.expose.includes('update')){
		console.log('POST /api/' + table.name + '/id/set');
		g_ex.post('/api/' + table.name + '/:id/set', g_restrict, (req, res) => {
			res.setHeader('Content-Type', 'text/plain');
			g_model.update[table.name](req.params.id, req.body, (err) => {
				if(err){
					callback(err);
					res.send('ERROR');
					return;
				}
				res.send('OK');
			});
		});
	}

	if(table.expose.includes('delete')){
		console.log('DELETE /api/' + table.name + '/id');
		g_ex.delete('/api/' + table.name + '/:id', g_restrict, (req, res) => {
			res.setHeader('Content-Type', 'text/plain');
			g_model.delete[table.name](req.params.id, (err) => {
				if(err){
					callback(err);
					res.send('ERROR');
					return;
				}
				res.send('OK');
			});
		});
	}

	return false;
}

exports.setup = setup;
exports.apply = apply;
exports.makeTable = makeTable;
exports.makeModel = makeModel;
exports.makeAPI = makeAPI;
