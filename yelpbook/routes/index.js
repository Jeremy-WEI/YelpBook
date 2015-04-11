var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
    user: 'linjie',
    password: '5data5base0',
    database: 'YelpBook'
});

function insertUser(req, res, next) {
    if(!req.user){
        res.render('index', {user: req.user});
    }
    else{
        var user_id = req.user.id;
        var user_displayName = req.user.displayName;
        console.log(user_id);
        console.log(user_displayName);
//        check whether user has already stayed in the database
        var query = "SELECT * FROM USER WHERE fb_account=" + user_id;
        console.log(query);
        connection.query(query, function(err, results){
            if(err)
                next(new Error(500));
            else if(results.length == 0){
                // insert user into database
                var query_insert = "INSERT INTO USER (fb_account, fb_name) VALUES ("+user_id+", \""+user_displayName+"\")";
                connection.query(query_insert, function(err, results){
                    if(err)
                        next(new Error(500));
                })
            }
        })
        res.render('index', {user: req.user});
    }

}


/* GET users listing. */
router.get('/', function(req, res, next) {
    insertUser(req, res, next);
});



///* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { user: req.user });
//});

module.exports = router;
