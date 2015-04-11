var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
    user     : 'linjie',
    password : '5data5base0',
    database : 'YelpBook'
});

function doUserQuery(req, res, next, msg) {
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
                res.render('user', {"user_id" : uid, "results": results, "message": msg});
            }
        }
    );
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
    newPost(req, res, next);
});

/* GET users listing. */
router.get('/:id', function(req, res, next) {
	// query(res);
//    res.render('user', {"title": "abc", "feeds": [{"user": "user1", "text": "user1's text", "datetime": "user1time"}]});

    doUserQuery(req, res, next, "");
});

/* Get user's homepage.*/
router.get('/homepage', function(req, res, next) {
    var id = getIdQuery(req, res, next);
    doFriendQuery(req, res, id, next);
})



module.exports = router;

