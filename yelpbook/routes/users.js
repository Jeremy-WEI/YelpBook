var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
    user     : 'linjie',
    password : '5data5base0',
    database : 'YelpBook'
});

function doUserQuery(req, res, next) {
    console.log(req.params.id);
    var user_id = req.params.id;
    var fb_name = null;
    var uid = connection.escape(user_id);
    console.log(uid);
    var query = "(SELECT * FROM HAS_POST WHERE user_id IN"
    + "(SELECT user_id2 as user_id FROM FRIEND WHERE user_id1=" + uid + "))"
    + "UNION"
    + "(SELECT * FROM HAS_POST WHERE user_id IN"
    + "(SELECT user_id1 as user_id FROM FRIEND WHERE user_id2=" + uid + "))"
    + "UNION"
    + "(SELECT * FROM HAS_POST WHERE user_id IN (SELECT " + uid + "))";
    console.log(query);
    connection.query(query, function(err, results) {
            if (err)
                next(new Error(500));
            else {
                res.render('user', {"user_id" : uid, "results": results});
            }
        }
    );
}

/* GET users listing. */
router.get('/:id', function(req, res, next) {
	// query(res);
//    res.render('user', {"title": "abc", "feeds": [{"user": "user1", "text": "user1's text", "datetime": "user1time"}]});

    doUserQuery(req, res, next);
});



module.exports = router;

