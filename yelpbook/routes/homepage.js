var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var moment = require('moment')

var connection = mysql.createConnection({
    host     : 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
    user     : 'linjie',
    password : '5data5base0',
    database : 'YelpBook'
});
//var connection = require("./business");
var uid;
var utils = require('./utils');

function doFollowsQuery(req, res, id, friendInfo, ownposts, myself, next) {
    connection.query('SELECT * FROM BUSINESS B INNER JOIN FOLLOWS F ON B.business_id = F.business_id WHERE F.user_id =' + id,
        function (err, follows) {
            if (!err) {
                var msg = req.session.msg;
                req.session.msg = undefined;
                res.render('homepage', {
                    friends: friendInfo,
                    posts: ownposts,
                    follows: follows,
                    myself: myself,
                    user_id: id,
                    msg: msg
                });}
            else
                next(new Error(500));
        });
}

function doPostQuery(req, res, id, friendInfo, myself, next) {
    connection.query('SELECT * FROM POST P WHERE P.user_id =' + id + ' ORDER BY P.datetime DESC',
        function (err, ownposts) {
            if (!err) {
                for (var i = 0; i < ownposts.length; i++) {
                    ownposts[i].datetime = moment(ownposts[i].datetime).format('MM-DD-YYYY')
                }
                doFollowsQuery(req, res, id, friendInfo, ownposts, myself, next)
            }
            else
                next(new Error(500));
        });
}

function doFriendQuery(req, res, id, myself, next) {
    console.log(id);

    // connection.connect();
    connection.query('SELECT * FROM FRIEND F INNER JOIN USER U ON F.user_id2 = U.user_id WHERE F.user_id1 =' + id,
        function (err, friendInfo) {
            console.log('SELECT * FROM FRIEND F INNER JOIN USER U ON F.user_id2 = U.user_id WHERE F.user_id1 =' + id);
            if (!err) {
                doPostQuery(req, res, id, friendInfo, myself, next);
            } else
                next(new Error(500));
        });
}

function getIdQuery(req, res, next) {
    if(typeof req.user === 'undefined') {
        utils.redirectLogin(res);
    }
    var query = 'SELECT user_id FROM USER WHERE fb_account = "' + req.user.id + '"';
    console.log(query);
    connection.query(query,
        function (err, id) {
            if (!err){
                uid = id[0].user_id;
                doFriendQuery(req, res, uid, true, next);
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

router.get('/:id', function(req, res, next) {
    console.log("get request");
    var uid = req.params.id;
    doFriendQuery(req, res, uid, false, next);
    //
    //doFriendQuery(req, res, uid, next);
});

module.exports = router;

