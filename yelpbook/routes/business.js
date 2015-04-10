var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
	host     : 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
	user     : 'linjie',
	password : '5data5base0',
	database : 'YelpBook'
});

function doReviewQuery(req, res, busInfo, categories, next) {
    connection.query('SELECT * FROM REVIEW INNER JOIN USER ON REVIEW.user_id = USER.user_id WHERE REVIEW.business_id = "' + req.query.business_id + '"',
        function(err, reviews) {
            if (!err)
                res.render('business', {business: busInfo, categories: categories, reviews: reviews});
            else
                next(new Error(500));
        });
}

function doCategoryQuery(req, res, busInfo, next) {
	connection.query('SELECT category FROM CATEGORY WHERE business_id = "' + req.query.business_id + '"', 
	function(err, categories) {
		if (!err)
			doReviewQuery(req, res, busInfo, categories, next)
		else
			next(new Error(500));
	});
}

function doBusinessQuery(req, res, next) {
	// connection.connect();
	connection.query('SELECT * FROM BUSINESS WHERE business_id = "' + req.query.business_id + '"', 
	function(err, busInfo) {
		if (!err) {
			if (busInfo.length == 0)
				next(new Error(404));
			else
				doCategoryQuery(req, res, busInfo, next);
		} else
			next(new Error(500));
	});
}

router.get('/', function(req, res, next) {
	if (req.query.business_id == undefined)
		next(new Error(404));
	else
		doBusinessQuery(req, res, next);
});


module.exports = router;

