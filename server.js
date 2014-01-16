'use strict';

var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));

var port = process.env.PORT || 4000;
app.listen(port, function() {
    console.log("Server ready on port " + port);
});