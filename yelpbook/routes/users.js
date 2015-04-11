var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
    user     : 'linjie',
    password : '5data5base0',
    database : 'YelpBook'
});

function get_user(req) {
    console.log("fb: " + req.user.id);
    var fb = req.user.id;
    var query_find_userid = "SELECT user_id FROM USER WHERE fb_account=" + fb;
    console.log(query_find_userid);
    connection.query(query_find_userid, function (err, userid) {
        if (err) {
            return undefined;
        } else if (userid.length != 1){
            // use cannot be found or more than one user_id mapped to one facebook account
            return undefined;
        } else {
            return userid[0];
        }
    });
}

function redirectLogin(res) {
    res.writeHead(302, {
        'Location': '/login'
    });
    res.write('Please log in first');
    res.end();
}

//to render the user news feed page. This method gets all news feeds
function doUserQuery(req, res, next, msg) {
    console.log("getCurrentUser fb: " + req.user.id); //get the user who sent request
    var fb = req.user.id;
    var query_find_userid = "SELECT user_id FROM USER WHERE fb_account=" + fb;
    console.log(query_find_userid);
    connection.query(query_find_userid, function (err, userid) {
        console.log(userid);
        if (err) {
            redirectLogin(res);
        } else if (userid.length != 1){
            redirectLogin(res);
        } else {
            getPostsQuery(req, res, next, err, userid[0], msg);
        }
    });
}

function renderUserPosts(res, uid, results,  msg) {
    res.render('user', {"user_id" : uid, "results": results, "message": msg});
}

function getPostsQuery(req, res, next, err, user_id, msg) {
    console.log("getPostsQuery user_id: " + user_id);
//    var fb_name = null;
    var uid = connection.escape(user_id[0]);
    console.log("uid: " + uid);
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
                renderUserPosts(res, uid, results, "Get Posts failed!");
            else {
                renderUserPosts(res, uid, results, msg);
            }
        }
    );
}

function redirectUser(res, user_id) {
    res.writeHead(302, {
        'Location': '/user/' + user_id
    });
    res.end();
}

function newPost(req, res, next) {
    if(done==true) {
        console.log(req.files);
        console.log("req.user.id: " + req.user.id);
        var user_id = get_user(req.user.id);
        console.log("user_id: " + user_id);
        var post_text = connection.escape(req.body.new_post);
        console.log(user_id);
        console.log(post_text);
        var query = "INSERT INTO HAS_POST (user_id, text, datetime) VALUES (" + user_id + ", " + post_text + ", NOW())";
        console.log(query);
        connection.query(query, function(err, results) {
                if (err)
                    doUserQuery(req, res, next, "The post Failed!");
                else {
                    doUserQuery(req, res, next, "The post was sent successfully!");
                }
            }
        );
    } else {
        console.log("File not yet uploaded");
    }
}


router.post('/new_post', function(req, res, next) {
    newPost(req, res, next);
});

/* GET users listing. */
router.get('/:id', function(req, res, next) {
	// query(res);
//    res.render('user', {"title": "abc", "feeds": [{"user": "user1", "text": "user1's text", "datetime": "user1time"}]});

    doUserQuery(req, res, next, "");
});




module.exports = router;

