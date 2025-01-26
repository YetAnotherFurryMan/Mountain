const fs = require('fs');
const sqlite = require('node:sqlite');

const sqlite3 = require('sqlite3').verbose();

const database = new sqlite.DatabaseSync(":memory:");

process.on('exit', function () {
	console.log('Closing in-memory model...');
	database.close(
		err => console.error(err)
	);
});

const db = {
	attach: database.prepare('ATTACH ? AS ?;'),
};

function createTable(mname, name, scheme){
	const sqlite_master = database.prepare('SELECT * FROM \'' + mname + '\'.sqlite_master WHERE name = ?;');

	const master = sqlite_master.all(name);

	if(master.length <= 0){
		let sql = 'CREATE TABLE \'' + mname + '\'.\'' + name + '\' (';
		for(let [cname, cattribs] of Object.entries(scheme.columns)){
			sql += cname + ' ' + cattribs.type + ', ';
		}
		sql = sql.slice(0, -2) + ');';
		database.exec(sql);
	} else{
		let presentCols = [];
		let compatible = database.prepare('SELECT * FROM \'' + mname + '\'.' + 'pragma_table_xinfo(\'' + name + '\');').all().length == Object.entries(scheme.columns).length;

		const pragma_table_xinfo = database.prepare('SELECT * FROM \'' + mname + '\'.' + 'pragma_table_xinfo(\'' + name + '\') WHERE name = ?;');
		for(let [cname, cattribs] of Object.entries(scheme.columns)){
			const xinfo = pragma_table_xinfo.all(cname);
			if(xinfo.length != 0 && xinfo[0].type == cattribs.type){
				presentCols.push(cname);
			} else{
				compatible = false;
			}
		}

		if(compatible){
			console.log('Table ', mname + '.' + name, ' is compatible.');
			return;
		}

		let sql1 = 'CREATE TABLE \'' + mname + '\'.\'' + name + '_tmp\' (';
		for(let [cname, cattribs] of Object.entries(scheme.columns)){
			sql1 += cname + ' ' + cattribs.type + ', ';
		}
		sql1 = sql1.slice(0, -2) + ');';
		database.exec(sql1);

	 	let sql2 = 'INSERT INTO \'' + mname + '\'.\'' + name + '_tmp\' SELECT ';
		for(let [cname, cattribs] of Object.entries(scheme.columns)){
	 		if(presentCols.includes(cname))
	 			sql2 += '\'' + cname + '\'';
	 		else
	 			sql2 += 'NULL';
	 		sql2 += ', ';
	 	}
	 	sql2 = sql2.slice(0, -2) + ' FROM ' + name + ';';
		database.exec(sql2);

		database.exec('DROP TABLE \'' + mname + '\'.\'' + name + '\';');
		database.exec('ALTER TABLE \'' + mname + '\'.\'' + name + '_tmp\' RENAME TO \'' + name + '\';');
	}
}

function createModel(mname, name, scheme, model){
	// Select
	model.select[name] = (filter) => {
		const base = 'SELECT OID as id, * FROM \'' + mname + '\'.\'' + name + '\'';
		if(!filter){
			return database.prepare(base + ';').all();
		} else {
			let sql = base;
			let x = [];
			let and = ' WHERE ';

			for(let [cname, cattribs] of Object.entries(scheme.columns).concat([['id', {'type': 'INT'}]])){
				if(filter[cname]){
					if(typeof filter[cname] === 'object' && !Array.isArray(filter[cname])){
						if(!filter[cname].type || !filter[cname].value){
							continue;
						}

						let type = filter[cname].type;
						if(['=', '>', '<', '>=', '<=', '!=', '<>'].includes(type)){
							sql += and + '\"' + cname + '\" ' + type + ' ?';
							x.push(filter[cname].value);
						} else if(type == 'like'){
							sql += and + '\"' + cname + '\" LIKE ?';
							x.push(filter[cname].value);
						} else if(type == 'in'){
							if(!Array.isArray(filter[cname].value)){
								return [];
							}

							sql += and + '\"' + cname + '\" IN (';
							for(let e of filter[cname].value){
								sql += '?, ';
								x.push(e);
							}
							sql = sql.slice(0, -2) + ')';
						}
					} else{
						sql += and + '\"' + cname + '\" = ?';
						x.push(filter[cname]);
					}
					
					and = ' AND ';
				}
			}

			if(filter.order){
				and = ' ORDER BY ';

				for(let [cname, cattribs] of Object.entries(scheme.columns).concat([['id', {'type': 'INT'}]])){
					if(filter.order[cname]){
						if(!['ASC', 'DESC'].includes(filter.order[cname])){
							// WARNING: Here I do NOT want to return, because ordering may not be a feature-breaking problem and is (I think) easly noticable.
							//          We'll use default (ASC) here.
							filter.order[cname] = 'ASC';
						}

						sql += and + '\"' + cname + '\" ' + filter.order[cname];

						and = ', ';
					}
				}
			}

			// TODO: Add CONSTRUCT pseudo-columns

			sql += ';';

			console.log(sql);
			return database.prepare(sql).all(...x);
		}
	};

	// Insert
	model.insert[name] = (data) => {
		if(!Array.isArray(data))
			data = [data];

		if(data.length <= 0)
			return {};

		let sql = 'INSERT INTO \'' + mname + '\'.\'' + name + '\' VALUES ';
		let x = [];

		for(let e of data){
			sql += '(';
			for(let [cname, cattribs] of Object.entries(scheme.columns)){
				if(!e[cname]){
					sql += 'NULL, ';
				} else{
					sql += '?, ';
					x.push(e[cname]);
				}
			}
			sql = sql.slice(0, -2) + '), ';
		}
		sql = sql.slice(0, -2) + ';';

		return database.prepare(sql).run(...x);
	};

	// Update
	model.update[name] = (id, data) => {
		if(!id || !data)
			return {};

		let sql = 'UPDATE \'' + mname + '\'.\'' + name + '\' SET ';
		let x = [];

		for(let [cname, cattribs] of Object.entries(scheme.columns)){
			if(data[cname]){
				sql += '\'' + cname + '\' = ?, ';
				x.push(data[cname]);
			}
		}
		sql = sql.slice(0, -2) + ' WHERE OID ';

		if(Array.isArray(id)){
			sql += 'IN (' + '?, '.repeat(id.length);
			sql = sql.slice(0, -2) + ');';
			x = x.concat(id);
		} else{
			sql += '= ?;';
			x.push(id);
		}

		return database.prepare(sql).run(...x);
	};

	// Delete
	model.delete[name] = (id) => {
		if(!id)
			return {};

		let sql = 'DELETE FROM \'' + mname + '\'.\'' + name + '\' WHERE OID ';
		if(Array.isArray(id)){
			if(id.length <= 0)
				return {};

			sql += 'IN (' + '?, '.repeat(id.length);
			sql = sql.slice(0, -2) + ');';
		} else{
			sql += '= ?;';
			id = [id];
		}

		return database.prepare(sql).run(...id);
	};
}

function createApply(name, model){
	return (scheme) => {
		if(scheme.tables){
			for(let [n, s] of Object.entries(scheme.tables)){
				createTable(name, n, s);
				createModel(name, n, s, model);
			}
		}
	};
}

let models = {};

function Model(name){
	if(!name){
		throw "Unnamed models are not allowed.";
	}

	if(models[name]){
		return models[name];
	}

	this.name = name;
	this.select = {};
	this.insert = {};
	this.update = {};
	this.delete = {};

	db.attach.run('db/' + name + '.db', name);
	this.apply = createApply(name, this);

	models[name] = this;
}

exports.Model = Model;

// let g_model = undefined;
// let g_db = undefined;
// let g_restrict = (req, res, next) => next();
//
// function defaultCallback(err){
// 	if(err){
// 		console.error(err);
// 		abort();
// 	}
// }
//
// function dbSection(call){
// 	if(!g_db)
// 		throw "No db.";
//
// 	const db = new sqlite3.Database(g_db);
// 	db.parallelize(() => {
// 		call(db);
// 	});
// 	db.close();
// }
//
// function setup(model, db, restrict){
// 	if(!model || !db)
// 		return true;
//
// 	if(restrict)
// 		g_restrict = restrict;
//
// 	g_model = model;
// 	g_db = db;
//
// 	g_model.select = {};
// 	g_model.insert = {};
// 	g_model.update = {};
// 	g_model.delete = {};
//
// 	exports.model = g_model;
//
// 	return false;
// }
//
// function apply(ex, schema, callback, errCallback){
// 	if(!ex || !schema)
// 		return true;
//
// 	if(schema.tables){
// 		for(let table of schema.tables){
// 			if(makeTable(table, callback))
// 				return true;
// 			if(makeModel(table))
// 				return true;
// 			if(makeAPI(ex, table, errCallback))
// 				return true;
// 		}
// 	}
//
// 	return false;
// }
//
// function makeTable(table, callback){
// 	if(!table || !table.name || !table.columns || table.columns.length <= 0)
// 		return true;
//
// 	if(!callback)
// 		callback = (name, err) => { defaultCallback(err); };
//
// 	if(table.name.startsWith('mountain_') || table.name == 'order'){
// 		callback(table.name, 'Name is forbidden.');
// 		return true;
// 	}
//
// 	dbSection((db) => {
// 		db.all('SELECT * FROM sqlite_master WHERE name = ?;', [table.name], (err, rows) => {
// 			if(err){
// 				callback(table.name, err);
// 				return;
// 			}
//
// 			if(rows.length == 0){
// 				let sql = 'CREATE TABLE ' + table.name + ' (';
// 				for(let column of table.columns){
// 					sql += column.name + ' ' + column.type + ', ';
// 				}
// 				sql = sql.slice(0, -2) + ');';
// 				dbSection((db) => {
// 					db.run(sql, (err) => {
// 						callback(table.name, err, 'create');
// 					});
// 				});
// 			} else{
// 				dbSection((db) => {
// 					db.all('SELECT * FROM pragma_table_xinfo(?);', [table.name], (err, rows) => {
// 						if(err){
// 							callback(table.name, err);
// 							return;
// 						}
//
// 						let compatible = rows.length == table.columns.length;
// 						let presentColumns = [];
// 						for(let row of rows){
// 							let found = false;
// 							for(let column of table.columns){
// 								if(row.name == column.name && row.type == column.type){
// 									presentColumns.push(row.name);
// 									found = true;
// 									break;
// 								}
// 							}
//
// 							if(!found)
// 								compatible = false;
// 						}
//
// 						if(compatible){
// 							callback(table.name);
// 							return;
// 						}
//
// 						let sql1 = 'CREATE TABLE ' + table.name + '_tmp (';
// 						for(let column of table.columns){
// 							sql1 += column.name + ' ' + column.type + ', ';
// 						}
// 						sql1 = sql1.slice(0, -2) + ');';
//
// 						let sql2 = 'INSERT INTO ' + table.name + '_tmp SELECT ';
// 						for(let column of table.columns){
// 							if(presentColumns.includes(column.name))
// 								sql2 += column.name;
// 							else
// 								sql2 += 'NULL';
// 							sql2 += ', ';
// 						}
// 						sql2 = sql2.slice(0, -2) + ' FROM ' + table.name + ';';
//
// 						let sql3 = 'DROP TABLE ' + table.name + ';';
//
// 						let sql4 = 'ALTER TABLE ' + table.name + '_tmp RENAME TO ' + table.name + ';';
//
// 						dbSection((db) => {
// 							db.run(sql1, err => callback(table.name, err, 'create tmp'))
// 							  .run(sql2, err => callback(table.name, err, 'insert tmp'))
// 							  .run(sql3, err => callback(table.name, err, 'drop'))
// 							  .run(sql4, err => callback(table.name, err, 'alter tmp'));
// 						});
// 					});
// 				});
// 			}
// 		});
// 	});
//
// 	return false;
// }
//
// function makeModel(table){
// 	if(!table || !table.name)
// 		return true;
//
// 	g_model.select[table.name] = (filter, callback) => {
// 		if(!callback)
// 			callback = defaultCallback;
//
// 		const handler = (err, rows) => {
// 			if(err){
// 				callback(err);
// 				return;
// 			}
//
// 			callback(null, rows);
// 		};
//
// 		if(!filter){
// 			dbSection(db => {
// 				db.all('SELECT OID as id, * FROM ' + table.name + ';', handler);
// 			});
// 		} else{
// 			let sql = 'SELECT OID as id, * FROM ' + table.name;
// 			let x = [];
// 			let and = ' WHERE ';
//
// 			for(let col of table.columns){
// 				if(filter[col.name]){
// 					if(typeof filter[col.name] === 'object' && !Array.isArray(filter[col.name])){
// 						if(!filter[col.name].type || !filter[col.name].value){
// 							callback('Bad filter for column: ' + col.name);
// 							return;
// 						}
//
// 						let type = filter[col.name].type;
// 						if(type == '='){
// 							sql += and + col.name + ' = ?';
// 							x.push(filter[col.name].value);
// 						} else if(type == 'like'){
// 							sql += and + col.name + ' LIKE ?';
// 							x.push(filter[col.name].value);
// 						} else if(type == 'in'){
// 							if(!Array.isArray(filter[col.name].value)){
// 								callback('Bad filter for column: ' + col.name + ' "in" expects value to be an array.');
// 								return;
// 							}
//
// 							sql += and + col.name + ' IN (';
// 							for(let e of filter[col.name].value){
// 								sql += '?, ';
// 								x.push(e);
// 							}
// 							sql = sql.slice(0, -2) + ')';
// 						}
// 					} else{
// 						sql += and + col.name + ' = ?';
// 						x.push(filter[col.name]);
// 					}
//
// 					and = ' AND ';
// 				}
// 			}
//
// 			if(filter.id){
// 				sql += and + 'id = ?';
// 				x.push(filter.id);
// 			}
//
// 			if(filter.order){
// 				if(!Array.isArray(filter.order))
// 					filter.order = [filter.order];
//
// 				and = ' ORDER BY ';
//
// 				for(let order of filter.order){
// 					if(typeof order === 'object' && !Array.isArray(order)){
// 						if(!order.name || !order.type){
// 							callback('Incomplite order object.');
// 							return;
// 						}
// 					} else{
// 						order = {name: order, type: 'ASC'};
// 					}
//
// 					if(!['ASC', 'DESC'].includes(order.type)){
// 						callback('Bad order type: ' + order.type);
// 						return;
// 					}
//
// 					if(order.name != 'id'){
// 						let found = false;
// 						for(let col of table.columns){
// 							if(col.name == order.name){
// 								found = true;
// 								break;
// 							}
// 						}
// 						if(!found){
// 							callback('Bad order name: ' + order.name);
// 							return;
// 						}
// 					}
//
// 					sql += and + order.name + ' ' + order.type;
//
// 					and = ', ';
// 				}
// 			}
//
// 			// TODO: Add CONSTRUCT pseudo-columns
//
// 			sql += ';';
//
// 			dbSection(db => {
// 				db.all(sql, x, handler);
// 			});
// 		}
// 	};
//
// 	g_model.insert[table.name] = (data, callback) => {
// 		if(!callback)
// 			callback = defaultCallback;
//
// 		if(!data){
// 			callback('No data provided!');
// 			return;
// 		}
//
// 		if(!Array.isArray(data))
// 			data = [data];
//
// 		let sql = 'INSERT INTO ' + table.name + ' VALUES ';
// 		let x = [];
// 		for(let d of data){
// 			sql += '(';
// 			for(let col of table.columns){
// 				if(!d[col.name]){
// 					sql += 'NULL, ';
// 				} else{
// 					sql += '?, ';
// 					x.push(d[col.name]);
// 				}
// 			}
// 			sql = sql.slice(0, -2) + '), ';
// 		}
// 		sql = sql.slice(0, -2) + ';';
//
// 		dbSection(db => {
// 			db.run(sql, x, err => {
// 				if(err)
// 					callback(err);
// 			}).all('SELECT last_insert_rowid() as id;', [], (err, id) => callback(err, id[0].id));
// 		});
// 	};
//
// 	g_model.update[table.name] = (id, data, callback) => {
// 		if(!callback)
// 			callback = defaultCallback;
//
// 		if(!id){
// 			callback('No ID provided!');
// 			return;
// 		}
//
// 		if(!data){
// 			callback('No data provided!');
// 			return;
// 		}
//
// 		let sql = 'UPDATE ' + table.name + ' SET ';
// 		let x = [];
// 		for(let col of table.columns){
// 			if(data[col.name]){
// 				sql += col.name + ' = ?, ';
// 				x.push(data[col.name]);
// 			}
// 		}
// 		sql = sql.slice(0, -2) + ' WHERE OID = ?;';
// 		x.push(id);
//
// 		dbSection(db => {
// 			db.run(sql, x, callback);
// 		});
// 	};
//
// 	g_model.delete[table.name] = (id, callback) => {
// 		if(!callback)
// 			callback = defaultCallback;
//
// 		if(!id){
// 			callback('No ID provided!');
// 			return;
// 		}
//
// 		let sql = 'DELETE FROM ' + table.name + ' WHERE OID ';
//
// 		if(Array.isArray(id)){
// 			if(id.lenght < 1){
// 				callback('No ID provided: empty list.');
// 				return;
// 			}
//
// 			sql += 'IN (';
// 			for(let i of id)
// 				sql += i + ', ';
// 			sql = sql.slice(0, -2) + ');';
// 		} else{
// 			id = [id];
// 			sql += '= ?;';
// 		}
//
// 		dbSection(db => {
// 			db.run(sql, id, callback);
// 		});
// 	};
//
// 	return false;
// }
//
// function makeAPI(ex, table, callback){
// 	if(!table || !table.name || !table.columns)
// 		return true;
//
// 	if(!table.expose)
// 		return false;
//
// 	if(table.expose.includes('select')){
// 		console.log('POST /api/' + table.name);
// 		ex.post('/api/' + table.name, g_restrict, (req, res) => {
// 			res.setHeader('Content-Type', 'application/json');
// 			g_model.select[table.name](req.body, (err, rows) => {
// 				if(err){
// 					callback(err);
// 					res.send('{"status":"ERROR"}');
// 					return;
// 				}
// 				res.send(JSON.stringify({status: 'OK', data: rows}));
// 			});
// 		});
//
// 		console.log('POST /api/' + table.name + '/id');
// 		ex.post('/api/' + table.name + '/:id', g_restrict, (req, res) => {
// 			res.setHeader('Content-Type', 'application/json');
// 			g_model.select[table.name]({id: req.params.id}, (err, rows) => {
// 				if(err){
// 					callback(err);
// 					res.send('{"status":"ERROR"}');
// 					return;
// 				}
// 				res.send(JSON.stringify({status: 'OK', data: rows[0]}));
// 			});
// 		});
// 	}
//
// 	if(table.expose.includes('insert')){
// 		const handler = (req, res) => {
// 			res.setHeader('Content-Type', 'application/json');
// 			g_model.insert[table.name](req.body, (err, id) => {
// 				if(err){
// 					callback(err);
// 					res.send('{"status":"ERROR"}');
// 					return;
// 				}
// 				res.send(JSON.stringify({status: 'OK', id: id}));
// 			});
// 		};
//
// 		console.log('PUT /api/' + table.name);
// 		ex.put('/api/' + table.name, g_restrict, handler);
// 		console.log('POST /api/' + table.name + '/put');
// 		ex.post('/api/' + table.name + '/put', g_restrict, handler);
// 	}
//
// 	if(table.expose.includes('update')){
// 		console.log('POST /api/' + table.name + '/id/set');
// 		ex.post('/api/' + table.name + '/:id/set', g_restrict, (req, res) => {
// 			res.setHeader('Content-Type', 'application/json');
// 			g_model.update[table.name](req.params.id, req.body, (err) => {
// 				if(err){
// 					callback(err);
// 					res.send('{"status":"ERROR"}');
// 					return;
// 				}
// 				res.send('{"status":"OK"}');
// 			});
// 		});
// 	}
//
// 	if(table.expose.includes('delete')){
// 		console.log('DELETE /api/' + table.name + '/id');
// 		ex.delete('/api/' + table.name + '/:id', g_restrict, (req, res) => {
// 			res.setHeader('Content-Type', 'application/json');
// 			g_model.delete[table.name](req.params.id, (err) => {
// 				if(err){
// 					callback(err);
// 					res.send('{"status":"ERROR"}');
// 					return;
// 				}
// 				res.send('{"status":"OK"}');
// 			});
// 		});
// 	}
//
// 	return false;
// }
//
// exports.setup = setup;
// exports.apply = apply;
// exports.makeTable = makeTable;
// exports.makeModel = makeModel;
// exports.makeAPI = makeAPI;
