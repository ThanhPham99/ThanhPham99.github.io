var fs = require('fs');
var text = fs.readFileSync('meo.txt',{encoding: 'utf-8'});
console.log(text);