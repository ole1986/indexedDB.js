var fs = require('fs');
var compressor = require('node-minify');

// Using Google Closure
new compressor.minify({
    type: 'gcc',
    language: 'ECMASCRIPT5',
	fileIn: 'src/*.js',
    fileOut: 'build/indexedDB.min.js',
	
    callback: function(err, min){
		if(err != null){
			console.log('ERR: ' + err);
			return;
		}
        console.log('Compressed: ' + this.fileOut);
    }
});