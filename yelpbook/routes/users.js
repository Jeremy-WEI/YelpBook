var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
    user     : 'linjie',
    password : '5data5base0',
    database : 'YelpBook'
});

function redirectLogin(res) {
    res.writeHead(302, {
        'Location': '/'
    });
    res.write('Please log in first');
    res.end();
}



function doFollowsQuery(req, res, id, friendInfo, ownposts, next) {
    connection.query('SELECT B.name FROM BUSINESS B INNER JOIN FOLLOWS ON B.business_id = F.business_id WHERE  =' + id,
        function (err, follows) {
            if (!err)
                res.render('userpage', {
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

        // connection.connect();
        connection.query('SELECT U.fb_name FROM FRIEND F INNER JOIN ON F.user_id2 = U.user_id WHERE F.user_id1 =' + id,
            function (err, friendInfo) {
                if (!err) {
                    doPostQuery(req, res, uid, friendInfo, next);
                } else
                    next(new Error(500));
            });
    }

function getIdQuery(req, res, id, friendInfo, next) {
    connection.query('SELECT H.text FROM HAS_POST H WHERE H.user_id =' + id,
        function (err, ownposts) {
            if (!err)
                doFollowsQuery(req, res, id, friendInfo, ownposts, next)
            else
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
    console.log("myFeed callback found userid: " + userid[0].user_id);
    getPostsQuery(req, res, next, err, userid[0].user_id, msg);
}

//call back function to process a new post
function newPost(req, res, next, err, userid, msg) {
    if (done != true) {
        console.log("File uploaded done==false");
    } else if (false) {

    } else {
        var uid = userid[0].user_id;
        var post_text = req.body.new_post;
        var query = "INSERT INTO HAS_POST (user_id, text, datetime) VALUES ('" + uid + "', '" + post_text + "', NOW())";
        console.log(query);
        connection.query(query,
            function(err, results) {
                if (err)
                    getPostsQuery(req, res, next, err, uid, "The post Failed!");
                else {
                    getPostsQuery(req, res, next, err, uid, "The post was sent successfully!");
                }
            }
        );
    }
}

//to get the user currently logged in. This method requires a callBack to define what to do
//next afert current user is found
function getUserQuery(req, res, next, msg, callBack) {
    if(typeof req.user === 'undefined'){
        redirectLogin(res);
    }
    console.log("getUserQuery fb: " + req.user.id); //get the user who sent request
    var fb = req.user.id;
    var query_find_userid = "SELECT user_id FROM USER WHERE fb_account=" + fb;
    console.log(query_find_userid);
    connection.query(query_find_userid, function (err, userid) {
        if (err) {
            redirectLogin(res);
        } else if (userid.length != 1){
            redirectLogin(res);
        } else {
            callBack(req, res, next, err, userid, msg);
        }
    });
}

function renderUserPosts(res, uid, results,  msg) {
    res.render('user', {"user_id" : uid, "results": results, "message": msg});
}

function getPostsQuery(req, res, next, err, user_id, msg) {
    console.log("getPostsQuery user_id: " + user_id);
//    var fb_name = null;
//    var uid = connection.escape(user_id[0]);
//    console.log("uid: " + uid);
    var uid = user_id;
    var query = "(SELECT * FROM HAS_POST WHERE user_id IN"
    + "(SELECT user_id2 as user_id FROM FRIEND WHERE user_id1='" + uid + "'))"
    + "UNION"
    + "(SELECT * FROM HAS_POST WHERE user_id IN"
    + "(SELECT user_id1 as user_id FROM FRIEND WHERE user_id2=" + uid + "))"
    + "UNION"
    + "(SELECT * FROM HAS_POST WHERE user_id IN (SELECT " + uid + "))";
    console.log(query);
    connection.query(query, function(err, results) {
            if (err)
                renderUserPosts(res, uid, results, "Get Posts failed!");
            else {
                renderUserPosts(res, uid, results, msg);
            }
        }
    );
}

function newPost(req, res, next) {
    connection.query('SELECT user_id FROM USER WHERE fb_account ="' + request.user.id + '"',
        function (err, id) {
            if (!err)
                return id[0];
            else
                next(new Error(500));
        });
}




router.post('/new_post', function(req, res, next) {
    getUserQuery(req, res, next, "New Post", newPost);
});


router.get('/my_feed', function(req, res, next) {
    // query(res);
//    res.render('user', {"title": "abc", "feeds": [{"user": "user1", "text": "user1's text", "datetime": "user1time"}]});

    getUserQuery(req, res, next, "", myFeed);
});

/* GET users listing. */
router.get('/:id', function(req, res, next) {
	// query(res);
//    res.render('user', {"title": "abc", "feeds": [{"user": "user1", "text": "user1's text", "datetime": "user1time"}]});

    getUserQuery(req, res, next, "");
});

/* Get user's homepage.*/
router.get('/homepage', function(req, res, next) {
    var id = getIdQuery(req, res, next);
    doFriendQuery(req, res, id, next);
})


module.exports = router;

