/**
 * IndexedDB Wrapper script
 * 
 * Copyright 2015 BBC Chartering GmbH - http://www.bbc-chartering.com
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */
function IndexedDBWrapper (dbName, options) {
	var self = this;
	
	var db;
	var settings = {version: 1, skipKeys: false, debug: 0 };
	
	/**
	 * @constructor
	 */
	var init = function () {
		if(!self.IsAvailable()) {
			return;
		}
		for (var attrname in options) { settings[attrname] = options[attrname]; }
	};
	
	var debug = function(sourceName, msg){
		console.log('IDB:DEBUG:' + sourceName + ': ' + msg);
	};
	
	var error = function(sourceName, msg) {
		console.error('IDB:' + sourceName +': ' + msg);
		if(typeof self.OnError == 'function') self.OnError(sourceName, msg);
	}
	
	var createStore = function(store) {
		if (db.objectStoreNames.contains(store.name)) { db.deleteObjectStore(store.name); }

		if(settings.debug > 1) debug('CREATESTORE',"Creating table " + store.name + " with keyPath " + store.primaryKey + "(skipKeys:" + settings.skipKeys + ")");
		
		var object;
		if (!settings.skipKeys)
			object = db.createObjectStore(store.name, { keyPath: store.primaryKey });
		else
			object = db.createObjectStore(store.name);
		
		// add the indicies
		if (store.indicies != undefined && store.indicies.length > 0) {
			for (var i = 0; i < store.indicies.length; ++i) {
				object.createIndex("ix" + store.indicies[i], store.indicies[i]);
				if(settings.debug > 1) debug('CREATESTORE',"...with index '" + store.indicies[i] + "'");
			}
		}
	};

	this.IsAvailable = function(){
		if(typeof indexedDB != "undefined")
			return true;
		return false;
	};
	
	this.OnUpgrade = function(){
		if(settings.debug > 1) debug('ONUPGRADE', 'Upgrade action goes here');
	};
	
	this.OnError = function(sourceName, e){};
		
	this.CREATE = function(table, primaryKey, indicies){
		var tableObj = {};
		if(typeof table != 'object') {
			tableObj = { name: table, primaryKey: primaryKey, indicies: indicies };
		} else {
			tableObj = table;
		}
		
		if(!tableObj.hasOwnProperty('name')) throw 'Table object has no table name defined';
		if(!tableObj.hasOwnProperty('primaryKey')) throw 'Table object must contain a primary key';
		
		createStore(tableObj);
	};
	
	this.DESTROY = function(tableName) {
		db.deleteObjectStore(tableName);
	};
	
	/**
	 * Open client database connection
	 */
	this.open = function (successCallback) {
		if(!self.IsAvailable()) return;
		
		var request = indexedDB.open(dbName, settings.version);
	  
		// We can only create Object stores in a versionchange transaction.
		request.onupgradeneeded = function(e){
			if(settings.debug > 0) debug('OPEN',"Upgrading database '" + dbName + "'");
			db = e.target.result;
			// A versionchange transaction is started automatically.
			e.target.transaction.onerror = function(){ error('UPGRADE', "Error in "+ dbName +": " + request.error.message); };;

			//createStores();
			
			if(typeof self.OnUpgrade == 'function') self.OnUpgrade(db, e.oldVersion, e.newVersion);
		};
		
		request.onsuccess = function (e) {
			if(settings.debug > 0) debug('OPEN','IndexedDB successfully initialized ' + e.target.result);
			db = e.target.result;		
			if (typeof successCallback == 'function') successCallback();
		};
		
		request.onerror = function(){ error('OPEN', "Failed to open DB "+ dbName +": " + request.error.message); };
	};
		
	/**
	 * Insert a single row into a specific object store
	 */
	this.INSERT = function (objectStore, data, insertCallback) {
		if(!self.IsAvailable()) return;
		
		var trans = db.transaction([objectStore], "readwrite");
		trans.oncomplete = function(e){
			if(typeof insertCallback == 'function')
				insertCallback();
		};
		
		trans.onerror = function(){ error('INSERT', "Failed to insert data into '" + objectStore + "': " + trans.error.message); };
		
		var store = trans.objectStore(objectStore);

		if(Array === data.constructor) {
			var i = 0;
			putNext();
			function putNext() {
				if (i < data.length) store.put(data[i]).onsuccess = putNext;
				i++;
			}
		} else {
			store.put(data);
		}
	};
	
	/**
	 * Insert a list of array into a specific object store
	 */
	this.INSERTLIST = function (objectStore, ds, completeCallback) { self.INSERT(objectStore, ds, completeCallback); };

	/**
	 * get number of rows
	 */
	this.COUNT = function (objectStore, completeCallback) {
		if(!self.IsAvailable()) return;
		
		var trans = db.transaction([objectStore], "readonly");
		var store = trans.objectStore(objectStore);
		
		var request = store.count();
		request.onsuccess = function () {
			if (typeof completeCallback == 'function') completeCallback(request.result);
		};
		
		request.onerror = function(){ error('SELECT', "Failed to select '" + id + "': " + request.error.message); };
	};
	
	/**
	 * Select a "table" to receive data in "completeCallback" function
	 * 
	 * @param IDBObjectStore objectStore
	 * @param JSON filterIndex list of column names with values to filter for
	 * @param Function completeCallback(data) gets called when transaction is complete
	 */
	this.SELECT = function (objectStore, filterIndex, completeCallback) {
		if(!self.IsAvailable()) return;
		
        var data = [];

		var trans = db.transaction([objectStore], "readonly");
		trans.oncomplete = function (e) {
			if(settings.debug > 1) debug('SELECT',"Received "+ data.length +" items from '" + objectStore + "'");
			if (typeof completeCallback == 'function')
				completeCallback(data);
        };

		var store = trans.objectStore(objectStore);

		var request;
		if (filterIndex) {
			if (store.keyPath != filterIndex.name) {
				var v = filterIndex.value;
				var index = store.index("ix" + filterIndex.name);
				if (typeof v === 'object') {
					request = index.openCursor(IDBKeyRange.bound(v[0], v[1]));
				} else if (v != null) {
					request = index.openCursor(IDBKeyRange.only(v));
				} else {
					request = index.openCursor();
				}
			} else {
				request = store.openCursor(IDBKeyRange.only(filterIndex.value));
			}
		} else {
			// Get everything in the store;
			var keyRange = IDBKeyRange.lowerBound(0);
			request = store.openCursor(keyRange);
		}

		request.onsuccess = function (e) {
			var result = e.target.result;
			if (!!result == false)
				return;
			// store each row into data array
			//var key = result.value[store.keyPath];
			data.push(result.value);
			result.continue();
		};

		request.onerror = function(){ error('SELECT', "Failed to select '" + id + "': " + request.error.message); };
	};

	this.DELETE = function (objectStore, id, deleteCallback) {
		if(!self.IsAvailable()) return;
		
		if (id == undefined) return;
		var trans = db.transaction([objectStore], "readwrite");
		var store = trans.objectStore(objectStore);
		var request;
		
		if(id == '*')
			request = store.clear();
		else
			request = store.delete(id);

		request.onsuccess = function (e) {
			if(settings.debug > 0) debug('DELETE',"Item '" + id + "' deleted from " + objectStore);
			//var result = e.target.result;
			if (typeof deleteCallback == 'function')
				deleteCallback();
		};

		request.onerror = function(){ error('DELETE', "Failed to delete '" + id + "': " + request.error.message); };
	};
	
	this.DELETEALL = function(objectStore, deleteCallback) { self.DELETE(objectStore, '*', deleteCallback); };
	
	this.DESTROYALL = function (successCallback) {
		if(!self.IsAvailable()) return;
		// If the database is open, you must first close the database connection before deleting it. Otherwise, the delete request waits (possibly forever) for the required close request to occur.
		if (db) db.close();
		var request = indexedDB.deleteDatabase(dbName);
		request.onsuccess = function(){
			if(settings.debug > 0) debug('DESTROYALL',"Database '" + dbName + "' destroyed. Reload is recommended");
			if(typeof successCallback == "function") successCallback();
		};
		request.onerror = function(){ error('DESTROYALL', "Failed to destroy '" + dbName + "': " + request.error.message); };
	};

	init();
};
