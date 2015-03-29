var express = require('express');
var router = express.Router();

console.log('mysql');
var mysql      = require('mysql');
var connection = mysql.createConnection({
	host     : 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
	user     : 'linjie',
	password : '5data5base0',
	database : 'YelpBook'
});


function query(res) {
	connection.connect();
	connection.query('SELECT COUNT(*) from BUSINESS', 
		function(err, rows, fields) {
			if (!err) {
				console.log('The solution is: ', rows);
				res.send(rows);
			} else {
				console.log('Error while performing Query.');
			}
			connection.end();
		});
}


/* GET users listing. */
router.get('/', function(req, res, next) {
	query(res);
});


module.exports = router;

