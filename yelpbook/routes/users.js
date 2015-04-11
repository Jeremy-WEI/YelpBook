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

//to render the user news feed page. This method gets all news feeds
function doUserQuery(req, res, next, msg) {
    console.log("req.user.id: " + req.user.id);
    var user_id = get_user(req.user.id);
    console.log("user_id: " + user_id);
//    var fb_name = null;
    var uid = connection.escape(user_id);
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
                next(new Error(500));
            else {
                res.render('user', {"user_id" : uid, "results": results, "message": msg});
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
    if(done==true){
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

