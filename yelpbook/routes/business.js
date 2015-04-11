var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
    user: 'linjie',
    password: '5data5base0',
    database: 'YelpBook'
});

function doWordCountQuery(req, res, busInfo, categories, reviews, next) {
    connection.query('SELECT * FROM WORD_STATISTICS WHERE business_id = "' + req.query.business_id + '"',
        function (err, wordCounts) {
            if (!err)
                res.render('business', {
                    business: busInfo,
                    categories: categories,
                    reviews: reviews,
                    wordCounts: wordCounts
                });
            else
                next(new Error(500));
        });
}
function doReviewQuery(req, res, busInfo, categories, next) {
    connection.query('SELECT * FROM REVIEW INNER JOIN USER ON REVIEW.user_id = USER.user_id WHERE REVIEW.business_id = "' + req.query.business_id + '"',
        function (err, reviews) {
            if (!err)
                doWordCountQuery(req, res, busInfo, categories, reviews, next)
            else
                next(new Error(500));
        });
}

function doCategoryQuery(req, res, busInfo, next) {
    connection.query('SELECT category FROM CATEGORY WHERE business_id = "' + req.query.business_id + '"',
        function (err, categories) {
            if (!err)
                doReviewQuery(req, res, busInfo, categories, next)
            else
                next(new Error(500));
        });
}

function doBusinessQuery(req, res, next) {
    // connection.connect();
    connection.query('SELECT * FROM BUSINESS WHERE business_id = "' + req.query.business_id + '"',
        function (err, busInfo) {
            if (!err) {
                if (busInfo.length == 0)
                    next(new Error(404));
                else
                    doCategoryQuery(req, res, busInfo, next);
            } else
                next(new Error(500));
        });
}

function doBusinessSearch(req, res, next) {
    var query_string = req.query.search;
    console.log(query_string);
    var query = "SELECT * FROM BUSINESS WHERE name LIKE \"%" + query_string + "%\" LIMIT 50";
    connection.query(query, function (err, results) {
        if (err) {
            next(new Error(500));
        } else {
            res.render('businesses', {"results": results});
        }
    });
}

router.get('/', function (req, res, next) {
    //res.render('test', {
    //});
    if (req.query.business_id == undefined)
        next(new Error(404));
    else
        doBusinessQuery(req, res, next);
});

function redirectBusiness(res, business_id) {
    res.writeHead(302, {
        'Location': '/business?business_id=' + business_id
    });
    res.end();
}

//follow not tested!
function doFollow(req, res, next) {
    var business_id = req.params.business_id;
    var user_id = req.user;
    var query = "INSERT INTO FOLLOWS (business_id, user_id) VALUES ('" + business_id + "', '" + user_id + "')";
    console.log(query);
    connection.query(query, function (err, reviews) {
        if (err) {
            console.log(err.message);
            var msg = err.message;
            //case: no user id found (unkonwn user request for follow, probably not logged in
            if(msg.indexOf("a foreign key constraint fails") > -1 &&
                msg.indexOf("FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`)") > -1) {
                redirectBusiness(res, business_id);
            } else {
                next(new Error(400));
            }
        } else { //success, redirect to original page
            redirectBusiness(res, business_id);
        }
    });
}

router.get('/search', function (req, res, next) {
    if (req.query.search == undefined)
        next(new Error(404));
    else {
        doBusinessSearch(req, res, next);
    }
});

//do follow
router.post('/follow/:business_id', function (req, res, next) {
    if (req.params.business_id == undefined) {
        console.log("/:business_id: business_id == undefined");
        next(new Error(404));
    } else {
        console.log("/post/:business_id: doFollow");
        doFollow(req, res, next);
    }
});

router.post('/', function (req, res, next) {
    console.log("POST /business/");
    next(new Error(404));
});

router.get('/', function (req, res, next) {
    console.log("/business/");
    if (req.query.business_id == undefined)
        next(new Error(404));
    else
        doBusinessQuery(req, res, next);
});

module.exports = router;

