var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var Bing = require('node-bing-api')({accKey: "NI7NeDBXR06vWzeRY1eRXUYG+J42BnjVZe2TNCaxtlU"})
var moment = require('moment')

var connection = mysql.createConnection({
    host: 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
    user: 'linjie',
    password: '5data5base0',
    database: 'YelpBook'
});

function doFollowingQuery(req, res, busInfo, categories, reviews, wordCounts, ratingStatistic, ratingTrend, next) {
    var query = 'SELECT fb_name, time FROM FOLLOWS INNER JOIN USER ON FOLLOWS.user_id = USER.user_id WHERE business_id = "' + req.query.business_id + '" ORDER BY time DESC';
    connection.query(query,
        function (err, follows) {
            if (!err) {
                doNearbyQuery(req, res, busInfo, categories, reviews, wordCounts, ratingStatistic, ratingTrend, follows, next)
            }
            else
                next(new Error(500));
        })
}



function doNearbyQuery(req, res, busInfo, categories, reviews, wordCounts, ratingStatistic, ratingTrend, follows, next) {
    var query = 'SELECT DISTINCT B.business_id, B.name, B.latitude, B.longitude FROM BUSINESS B INNER JOIN CATEGORY C ON B.business_id = C.business_id ' +
        'WHERE ABS(B.longitude - (SELECT B1.longitude FROM BUSINESS B1 ' +
        'WHERE B1.business_id = "' + req.query.business_id + '")) < 0.01 ' +
        'AND ABS(B.latitude - (SELECT B2.latitude FROM BUSINESS B2 ' +
        'WHERE B2.business_id = "' + req.query.business_id + '")) < 0.01 ' +
        'AND B.avg_stars > 3.0 AND C.category IN ' +
        '(SELECT C3.category FROM BUSINESS B3 INNER JOIN CATEGORY C3 ON B3.business_id = C3.business_id) ' +
        'AND B.business_id <> "' + req.query.business_id + '" ORDER BY B.business_id LIMIT 10';
    console.log(query);
    connection.query(query,
        function (err, nearby) {
            if (!err) {
                var msg = req.session.msg;
                req.session.msg = undefined;
                res.render('business', {
                    nearInfo: nearby,
                    business: busInfo,
                    categories: categories,
                    reviews: reviews,
                    wordCounts: wordCounts,
                    ratingStatistic: ratingStatistic,
                    ratingTrend: ratingTrend,
                    msg: msg,
                    follows: follows
                })
            }
            else
                next(new Error(500));
        })
}

function doRatingQuery2(req, res, busInfo, categories, reviews, wordCounts, ratingStatistic, next) {
    var query = 'SELECT date, avg(stars) as stars FROM REVIEW WHERE business_id="' + req.query.business_id + '" GROUP BY date ORDER BY date DESC';
    connection.query(query,
        function (err, ratingTrend) {
            if (!err) {
                doFollowingQuery(req, res, busInfo, categories, reviews, wordCounts, ratingStatistic, ratingTrend, next)
            }
            else
                next(new Error(500));
        })
}

function doRatingQuery1(req, res, busInfo, categories, reviews, wordCounts, next) {
    var query = 'SELECT stars, count(*) as count FROM REVIEW WHERE business_id="' + req.query.business_id + '" GROUP BY stars';
    connection.query(query,
        function (err, ratingStatistic) {
            if (!err) {
                doRatingQuery2(req, res, busInfo, categories, reviews, wordCounts, ratingStatistic)
            }
            else
                next(new Error(500));
        }
    )
}


function doWordCountQuery(req, res, busInfo, categories, reviews, next) {
    connection.query('SELECT * FROM WORD_STATISTICS WHERE business_id = "' + req.query.business_id + '"',
        function (err, wordCounts) {
            if (!err) {
                doRatingQuery1(req, res, busInfo, categories, reviews, wordCounts)
            }
            else
                next(new Error(500));
        }
    )
}

function doReviewQuery(req, res, busInfo, categories, next) {
    connection.query('SELECT * FROM REVIEW INNER JOIN USER ON REVIEW.user_id = USER.user_id WHERE REVIEW.business_id = "' + req.query.business_id + '" ORDER BY date DESC',
        function (err, reviews) {
            if (!err) {
                for (var i = 0; i < reviews.length; i++) {
                    reviews[i].date = moment(reviews[i].date).format(' MM-DD-YYYY')
                }
                doWordCountQuery(req, res, busInfo, categories, reviews, next)
            }
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
    var query = "SELECT * FROM BUSINESS WHERE upper(name) LIKE \"" + query_string.toUpperCase() + "%\" LIMIT 50";
    connection.query(query, function (err, results) {
        if (err) {
            next(new Error(500));
        } else {
            res.render('businesses', {results: results});
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

function redirectBusiness(req, res, business_id, msg) {
    req.session.msg = msg;
    res.writeHead(302, {
        'Location': '/business?business_id=' + business_id
    });
    res.end();
}

function addReview(req, res, next) {
    if (!req.user) {
        // user doesn't login
        // redirect to login page
        res.render('index', {user: req.user});
    }
    else {
        var fb_account = req.user.id;
        var query_find_userid = "SELECT user_id FROM USER WHERE fb_account=" + fb_account;
        connection.query(query_find_userid, function (err, userid) {
            if (err) {
                next(new Error(500));
            }
            else {
                var user_id = userid[0].user_id;
                var business_id = req.params.business_id;
                var review = req.body.review;
                var rating = req.body.rating;
                var date = new Date();
                var nowdate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
                var query_add_review = "INSERT INTO REVIEW (business_id, user_id, text, stars, date) VALUES (\"" + business_id + "\", " + user_id
                    + ", \"" + review + "\", " + rating + ", \"" + nowdate + "\")";
                connection.query(query_add_review, function (err, review) {
                    if (err) {
                        next(new Error(500));
                    }
                    // successfully add review
                    redirectBusiness(req, res, business_id, "The review was added!");
                });
            }
        });
    }
}


function doFollow(req, res, next) {
    var business_id = req.params.business_id;
    if (!req.user) {
        // user doesn't login
        // redirect to login page
        res.render('index', {user: req.user});
    }
    else {
        var fb_account = req.user.id;
        var query_find_userid = "SELECT user_id FROM USER WHERE fb_account=" + fb_account;
        connection.query(query_find_userid, function (err, userid) {
            if (err) {
                next(new Error(500));
            }
            else if (userid.length != 0) {
                var user_id = userid[0].user_id;
                //console.log(user_id);
                var query_check_exist = "SELECT * FROM FOLLOWS WHERE business_id=\"" + business_id + "\" AND user_id=" + user_id;
                //console.log(query_check_exist);
                connection.query(query_check_exist, function (err, exist) {
                    if (err) {
                        next(new Error(400));
                    }
                    else if (exist.length == 0) {
                        // follow does not exist
                        var query_add_follow = "INSERT INTO FOLLOWS (business_id, user_id, time) VALUES (\"" + business_id + "\", " + user_id + ", now())";
                        //console.log(query_add_follow);
                        connection.query(query_add_follow, function (err, follow) {
                            if (err) {
                                next(new Error(500));
                            }
                            // successfully create follows
                            req.session.follow = 'succ';
                        });
                    }
                    else if (exist.length != 0) {
                        //console.log("exists!!!!!")
                        req.session.follow = 'exist';
                    }
                });
                redirectBusiness(req, res, business_id, "You've followed the business!");

            }
        });
    }
}

router.get('/search', function (req, res, next) {
    if (req.query.search == undefined)
        next(new Error(404));
    else {
        doBusinessSearch(req, res, next);
    }
});

//add review
router.post('/addreview/:business_id', function (req, res, next) {
    if (req.params.business_id == undefined) {
        //console.log("/:business_id: business_id == undefined");
        next(new Error(404));
    }
    else {
        //console.log("add review");
        addReview(req, res, next);
    }
});


//function callBing(res, body) {
//
//}


//do bing search
router.get('/bing/:name/:id', function (req, res, next) {
    if (req.params.name === undefined) {
        console.log("can't use bing");
        next(new Error(404));
    }
    else {
        console.log("add review");
        console.log(req.params.name);
        Bing.web(req.params.name, function (error, ress, body) {
            console.log(body.d.results);
            res.render('bingresult', {
                bodyresults: body.d.results,
                b_id: req.params.id
            });
        }, {
            top: 10, //number of results(max 50)
            skip: 0 // skip first 0 results
        })
    }
});


//do follow
router.post('/follow/:business_id', function (req, res, next) {
    if (req.params.business_id == undefined) {
        //console.log("/:business_id: business_id == undefined");
        next(new Error(404));
    } else {
        //console.log("/post/:business_id: doFollow");
        doFollow(req, res, next);
    }
});

router.post('/', function (req, res, next) {
    //console.log("POST /business/");
    next(new Error(404));
});

router.get('/', function (req, res, next) {
    //console.log("/business/");
    if (req.query.business_id == undefined)
        next(new Error(404));
    else
        doBusinessQuery(req, res, next);
});

module.exports = router;

