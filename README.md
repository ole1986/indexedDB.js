# IndexedDB Wrapper script

The IndexedDB Wrapper is used to SELECT, DELETE, INSERT and CREATE database object stores more easily using the HTML5 Indexed Database API.

http://www.w3.org/TR/IndexedDB/ - IndexedDB on W3.ORG
http://caniuse.com/#feat=indexeddb - Browser support

## Minify using node.js (optional)

You can minify the script(s) by using node js command

`>node make`

## Example

```
$indexedDB = new IndexedDBWrapper('<databaseName>', {debug: 1});
$indexedDB.addTable( 'test', 'key', [] );
 
var readAll = function(tableName){
	$indexedDB.SELECT(tableName, null, function(data){ console.log(data); });
};

var insertOk = function(){
	readAll('test');
};
 
var openOk = function(){
// db successfully opened and test table added
	$indexedDB.INSERT('test', {key: '1', name: 'test 123'}, insertOk);
};

$indexedDB.open(openOk)

```