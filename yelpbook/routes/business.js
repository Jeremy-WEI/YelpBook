var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
	host     : 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
	user     : 'linjie',
	password : '5data5base0',
	database : 'YelpBook'
});

function doCategoryQuery(req, res, busInfo, next) {
	connection.query('SELECT category FROM CATEGORY WHERE business_id = "' + req.query.business_id + '"', 
	function(err, categories) {
		if (!err)
			res.render('business', {business: busInfo, categories: categories});
			// res.send(rows);
		else
			next(new Error(500));
			// console.log('Error while performing Query.');
		// connection.end();
	});
}

function doBusinessQuery(req, res, next) {
	// connection.connect();
	connection.query('SELECT * FROM BUSINESS WHERE business_id = "' + req.query.business_id + '"', 
	function(err, busInfo) {
		if (!err) {
			if (busInfo.length == 0) {
//				connection.end();
				next(new Error(404));
			}
			else 
				doCategoryQuery(req, res, busInfo, next);
			// res.send(rows);
		} else
			next(new Error(500));
			// connection.end();
	});
}

function doBusinessSearch(req, res, next) {
    var query_string = req.query.search;
    console.log(query_string);
    var query = "SELECT * FROM BUSINESS WHERE name LIKE \"%" + query_string + "%\" LIMIT 50";
    connection.query(query, function(err, results) {
        if(err) {
            next(new Error(500));
        } else {
            res.render('businesses', {"results": results});
        }
    });
}

router.get('/', function(req, res, next) {
	if (req.query.business_id == undefined)
		next(new Error(404));
	else
		doBusinessQuery(req, res, next);
});


router.get('/search', function(req, res, next) {
    if (req.query.search == undefined)
        next(new Error(404));
    else {
        doBusinessSearch(req, res, next);
    }
});

module.exports = router;

