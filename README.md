# IndexedDB Wrapper script (no jquery required)

The IndexedDB Wrapper is used to SELECT, DELETE, INSERT and CREATE database object stores more easily using the HTML5 Indexed Database API. **No additional libraries are required**

<p align="center"><img src="../../blob/gh-pages/images/IndexedDBWrapper-first.png"></p>


---
http://www.w3.org/TR/IndexedDB/ - IndexedDB on W3.ORG

http://caniuse.com/#feat=indexeddb - Browser support

## Implementation

Include the indexedDB.js file into the HTML document using &lt;script&gt; Tag

```html
<script type="text/javascript" src="../src/indexedDB.js"></script>
```

Checkout examples/first.html for a fully working (but limited) example

## Example
```javascript
$indexedDB = new IndexedDBWrapper('<databaseName>', {debug: 1});

$indexedDB.OnUpgrade = function(db, oldVersion, newVersion){
	// initial database creation
	if(newVersion == 1) {
		$indexedDB.CREATE('test', 'key');
	}
};

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
## Minify using node.js (optional)

You can minify the script(s) by using node js command

```
npm install
node make
```
