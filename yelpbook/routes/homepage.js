var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
    user     : 'linjie',
    password : '5data5base0',
    database : 'YelpBook'
});
var uid;

function doFollowsQuery(req, res, id, friendInfo, ownposts, next) {
    connection.query('SELECT B.name FROM BUSINESS B INNER JOIN FOLLOWS F ON B.business_id = F.business_id WHERE F.user_id =' + id,
        function (err, follows) {
            if (!err)
                res.render('homepage', {
                    friends: friendInfo,
                    posts: ownposts,
                    follows: follows

                });
            else
                next(new Error(500));
        });
}

function doPostQuery(req, res, id, friendInfo, next) {
    connection.query('SELECT H.text FROM HAS_POST H WHERE H.user_id =' + id,
        function (err, ownposts) {
            if (!err)
                doFollowsQuery(req, res, id, friendInfo, ownposts, next)
            else
                next(new Error(500));
        });
}

function doFriendQuery(req, res, id, next) {
    console.log(id);

    // connection.connect();
    connection.query('SELECT U.fb_name FROM FRIEND F INNER JOIN USER U ON F.user_id2 = U.user_id WHERE F.user_id1 =' + id,
        function (err, friendInfo) {
            console.log('SELECT U.fb_name FROM FRIEND F INNER JOIN USER U ON F.user_id2 = U.user_id WHERE F.user_id1 =' + id);
            if (!err) {
                doPostQuery(req, res, id, friendInfo, next);
            } else
                next(new Error(500));
        });
}

function getIdQuery(req, res, next) {
    var query = 'SELECT user_id FROM USER WHERE fb_account = "' + req.user.id + '"';
    console.log(query);
    connection.query(query,
        function (err, id) {
            if (!err){
                uid = id[0].user_id;
                doFriendQuery(req, res, uid, next);
            }
            else
                next(new Error(500));
        });
}


/* Get user's homepage.*/
router.get('/', function(req, res, next) {
    console.log("get request");
    getIdQuery(req, res, next);
    //
    //doFriendQuery(req, res, uid, next);
});



module.exports = router;

