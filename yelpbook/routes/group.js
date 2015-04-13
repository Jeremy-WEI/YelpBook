var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var Bing = require('node-bing-api')({accKey:"NI7NeDBXR06vWzeRY1eRXUYG+J42BnjVZe2TNCaxtlU"})
var moment = require('moment')
var connection = mysql.createConnection({
    host: 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
    user: 'linjie',
    password: '5data5base0',
    database: 'YelpBook'
});


function doGroupMember(req, res, id, msg, results, next) {
    //console.log(id);

    // connection.connect();
    connection.query('SELECT U.user_id, U.fb_name from FOLLOWS F INNER JOIN USER U ON F.user_id = U.user_id where F.business_id = "' + id + '"',
        function (err, memberInfo) {
            //console.log("hhhhhhhhhhhhhhhh");
            //console.log('SELECT U.user_id, U.fb_name from FOLLOWS F INNER JOIN USER U ON F.user_id = U.user_id where F.business_id = "' + id + '"');
            //console.log(JSON.parse(JSON.stringify(memberInfo)));
            if (!err) {
                res.render('group', {
                    members: memberInfo,
                    msg: msg,
                    business_id: id,
                    results: results
                });
            } else
                next(new Error(500));
        });
}

function redirectUser(res, user_id) {
    res.writeHead(302, {
        'Location': '/user/' + user_id
    });
    res.end();
}
//call back function to show my news feed
function myFeed(req, res, next, err, userid, msg) {
    //console.log("myFeed callback found userid: " + userid);
    getPostsQuery(req, res, next, err, userid, msg);
}


//call back function to process a new post
function newPost(req, res, next, err, bid, userid, msg) {
    if (!undefined(global.done) && global.done != true) { //file upload not done
       //console.log("File uploaded done==false");
    } else {
        var uid = userid;
        var post_text = req.body.new_post;
        var datetime = moment().format('YYYY-MM-DD HH:mm:ss');
        var query = "INSERT INTO CLUB_POST (busi_id, date_time, text, u_id) VALUES ('" + bid + "','" + datetime + "', '"+ post_text + "', '"  + uid + "')";
        console.log(query);
        connection.query(query,
            function(err, results) { //query returns
                if (err)
                    getPostsQuery(req, res, next, err, bid,  "The post Failed in mysql query!");
                else  {
                    getPostsQuery(req, res, next, err, bid, "The post was sent successfully, no image!");
                }
            }
        );
    }
}

//to get the user currently logged in. This method requires a callBack to define what to do
//next afert current user is found
function getUserQuery(req, res, next, bid, msg, callBack) {
    if(undefined(req.user)){
        redirectLogin(res);
    }
    //console.log("getUserQuery fb: " + req.user.id); //get the user who sent request
    var fb = req.user.id;
    var query_find_userid = "SELECT user_id FROM USER WHERE fb_account=" + fb;
    //console.log(query_find_userid);
    connection.query(query_find_userid, function (err, userid) {
        if (err) {
            redirectLogin(res);
        } else if (userid.length != 1){
            redirectLogin(res);
        } else {
            callBack(req, res, next, err, bid, userid[0].user_id, msg);
        }
    });
}

//function renderUserPosts(res, uid, results,  msg) {
//    //console.log(results);
//    res.render('group', {"results": results, "message": msg, members: ["abcd"]});
//}

function getPostsQuery(req, res, next, err, bid, msg) {
    //console.log("getPostsQuery user_id: " + user_id);
//    var fb_name = null;
//    var uid = connection.escape(user_id[0]);
//    console.log("uid: " + uid);
//    var uid = user_id;
    var query = 'SELECT CB.u_id,CB.busi_id,CB.text,CB.date_time,U.fb_name FROM CLUB_POST CB INNER JOIN USER U ON U.user_id = CB.u_id WHERE CB.busi_id = "' + bid + '"' ;
    //console.log(query);
    connection.query(query, function(err, results) {
            if (err)
                //renderUserPosts(res, uid, results, "Get Posts failed!");
                doGroupMember(req, res, bid, "Get Posts failed!", results, next);
            else {
                //renderUserPosts(res, uid, results, msg);
                doGroupMember(req, res, bid, "", results, next);
            }
        }
    );
}

router.post('/new_post/:id', function(req, res, next) {
    var bid = req.params.id;
    console.log(":id/new_post : " + bid);
    getUserQuery(req, res, next, bid, "New Post", newPost);
});

//show my news feeds page
router.get('/:id/my_feed', function(req, res, next) {
    var bid = req.params.id;
    getUserQuery(req, res, next, bid, "", myFeed);
});

router.get('/:id', function(req, res, next) {
    console.log("get request");
    var bid = req.params.id;
    console.log(":id/new_post : " + bid);
    getPostsQuery(req, res, next, undefined, bid, "");
    //
    //doFriendQuery(req, res, uid, next);
});

function undefined(obj) {
    //console.log("======undefined?");
    //console.log(obj);
    //console.log(typeof obj === 'undefined');
    //console.log("undefined=====");
    return typeof obj === 'undefined';
}

function redirectLogin(res) {
    res.writeHead(302, {
        'Location': '/'
    });
    res.write('Please log in first');
    res.end();
}

module.exports = router;
