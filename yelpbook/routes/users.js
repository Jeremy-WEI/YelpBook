var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
    user     : 'linjie',
    password : '5data5base0',
    database : 'YelpBook',
    multipleStatements: true
});

var moment = require('moment'); //time formatter
var mime = require('mime'); //get mime type

var mongo = require('mongodb');
var MongoClient = mongo.MongoClient; //client side to visit mongo db
var DB; //the db instance
var fs = require('fs'); //file system, used for file IO stream
var Grid = require('gridfs-stream'); //mongoDB file IO
var gridfs; //mongoDB file IO, bounded to var DB
// Retrieve



////console.log("__dirname: " + __dirname);


// Connect to the db
MongoClient.connect("mongodb://dichenli:5data5base0@ds061671.mongolab.com:61671/yelpbook_mongo", function(err, db) {
    if(err) {
        // console.log("mongo connection failed");
        // console.log(err.message);
        throw err; //connection failed, kill the whole server
    }  else {
        //console.log("mongo connection opened");
        DB = db;
        gridfs = Grid(DB, mongo);
    }
});


function redirectLogin(res) {
    res.writeHead(302, {
        'Location': '/'
    });
    res.write('Please log in first');
    res.end();
}


function undefined(obj) {
    return typeof obj === 'undefined';
}


function doFollowsQuery(req, res, id, friendInfo, ownposts, next) {
    connection.query('SELECT B.name FROM BUSINESS B INNER JOIN FOLLOWS ON B.business_id = F.business_id WHERE F.user_id=' + id,
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
        connection.query('SELECT P.text FROM POST P WHERE P.user_id =' + id,
            function (err, ownposts) {
                if (!err)
                    doFollowsQuery(req, res, id, friendInfo, ownposts, next)
                else
                    next(new Error(500));
            });
    }

    function doFriendQuery(req, res, id, next) {

        // connection.connect();
        connection.query('SELECT U.fb_name FROM FRIEND F INNER JOIN USER U ON F.user_id2 = U.user_id WHERE F.user_id1 =' + id,
            function (err, friendInfo) {
                if (!err) {
                    doPostQuery(req, res, uid, friendInfo, next);
                } else
                    next(new Error(500));
            });
    }

function getIdQuery(req, res, id, friendInfo, next) {
    connection.query('SELECT H.text FROM POST H WHERE H.user_id =' + id,
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

function redirectHomepage(req, res, user_id, msg) {
    req.session.msg = msg;
    res.setHeader("Location", '/homepage/' + user_id);
    res.writeHead(302);
    res.end();
}

//call back function to show my news feed
function myFeed(req, res, next, err, userid, msg) {
    // console.log("myFeed callback found userid: " + userid);
    getPostsQuery(req, res, next, err, userid, msg);
}


//call back function to process a new post
function newPost(req, res, next, err, userid, msg) {
    if (!undefined(global.done) && global.done != true) { //file upload not done
        // console.log("File uploaded done==false");
    }
    else {
        console.log(req.body);
        var uid = userid;
        var post_text = req.body.new_post;
        var datetime = moment().format('YYYY-MM-DD HH:mm:ss');
        var file = req.file;
        var photo_name;
        var friend_list = req.body.friend;
        var business = req.body.location;
        if(undefined(file)) {
            photo_name = 'NULL';
            global.done = true;
        } else {
            photo_name = uid + "_" + file.name;
        }
        var query = "";
        if(business == "null") query = "INSERT INTO POST (user_id, text, datetime, photo_name) VALUES ('" + uid + "', '" + post_text + "', '" + datetime + "', '" + photo_name + "')";
        else query = "INSERT INTO POST (user_id, text, datetime, photo_name, business_ref) VALUES ('" + uid + "', '" + post_text + "', '" + datetime + "', '" + photo_name + "', '" + business + "')";
        var query_with_friend = 'INSERT INTO WITH_FRIEND (user_id, post_datetime, friend_id) VALUES ';
        if(friend_list) {
            for(var i=0;i<friend_list.length;i++){
                var tuple = "("+uid+", \""+datetime+"\", "+friend_list[i]+")";
                if(i==0) query_with_friend = query_with_friend + tuple;
                else query_with_friend = query_with_friend + ","+tuple;
            }
            query = query+";"+query_with_friend;
        }
        console.log("*******************************************");
        console.log("insert post and with friend");
        console.log(query);
        connection.query(query,
            function(err, results) { //query returns
                if (err) {
                    console.log(err);
                    getPostsQuery(req, res, next, err, uid, "The post Failed in mysql query!");
                }
                else if (undefined(file)) {
                    getPostsQuery(req, res, next, err, uid, "The post was sent successfully, no image!");
                } else {
                    // write file to mongoDB
                    writeStream = gridfs.createWriteStream({
                        filename: photo_name,
                        metadata: {
                            user_id: uid,
                            datetime: datetime
                        }
                    });
                    fs.createReadStream(file.path).pipe(writeStream);
                    writeStream.on("close", function () {
                        fs.unlinkSync(__dirname + "/../uploads/" + file.name); //delete the file in local uploads
                        getPostsQuery(req, res, next, err, uid, "The post was sent successfully!");
                    });
                }
            }
        );
    }
}

//to get the user currently logged in. This method requires a callBack to define what to do
//next afert current user is found
function getUserQuery(req, res, next, msg, callBack) {
    if(undefined(req.user)){
        redirectLogin(res);
    }
    var fb = req.user.id;
    var query_find_userid = "SELECT user_id FROM USER WHERE fb_account=" + fb;
//    console.log(query_find_userid);
    connection.query(query_find_userid, function (err, userid) {
        if (err) {
            redirectLogin(res);
        } else if (!userid || userid.length != 1 || !userid[0] || !userid[0].user_id){
//            console.log("invalid user id: " + userid[0].user_id); //userid 0 is not allowed!
            redirectLogin(res);
        } else {
            callBack(req, res, next, err, userid[0].user_id, msg);
        }
    });
}

function renderUserPosts(res, uid, results,  msg) {
    var query_friend_list = 'SELECT user_id2 FROM FRIEND WHERE user_id1='+uid;
    console.log(query_friend_list);
    connection.query(query_friend_list, function(err, friends) {
            if (err){
                console.log("error");
                res.render('user', {"user_id" : uid,  "results": results, "message": msg});
            }
            else {
                // find the name of the friend
                var user_id_list = [];
                var str = "";
                for(var i=0;i<friends.length;i++){
                    user_id_list.push(friends[i].user_id2);
                    if(str == "") str = friends[i].user_id2;
                    else str = str + ","+ friends[i].user_id2;
                }
                str = "("+str+")";
                var query_find_name;
                if(str == "()") query_find_name = 'SELECT user_id, fb_name FROM USER WHERE user_id in (null)';
                else query_find_name = 'SELECT user_id, fb_name FROM USER WHERE user_id in '+str;
                console.log(query_find_name);
                connection.query(query_find_name, function(err, friendname){
                    if(err){
                        res.render('user', {"user_id" : uid, "results": results, "message": msg});
                    }
                    else{
                        console.log(friendname);
                        var query_find_follows = 'SELECT B.business_id, B.name FROM FOLLOWS F INNER JOIN BUSINESS B ON '
                        +'F.business_id=B.business_id WHERE user_id='+uid;
                        connection.query(query_find_follows, function(err, businesses){
                            if(err){
                                res.render('user', {"user_id" : uid, "results" : results, "message" : msg});
                            }
                            else{
                                res.render('user', {"user_id" : uid, "friends" : friendname, "businesses": businesses, "results": results, "message": msg})
                            }
                        });
                    }
                });


            }
        }
    );
}


function getPostsQuery(req, res, next, err, user_id, msg) {
    // console.log("getPostsQuery user_id: " + user_id);
//    var fb_name = null;
//    var uid = connection.escape(user_id[0]);
//    // console.log("uid: " + uid);
    var uid = user_id;
    var query = 'SELECT user_id, fb_name, B.name, B.business_id, text, datetime, photo_name, friend_id, friend_fb_name FROM ' +
        '(SELECT FF.user_id, FF.fb_name, FF.business, text, datetime, photo_name, ' +
        'friend_id, USER.fb_name as friend_fb_name FROM (SELECT R.user_id, USER.fb_name, ' +
        'business, text, datetime, photo_name, friend_id FROM (SELECT P.user_id as user_id, ' +
        'P.text as text, P.datetime as datetime, P.photo_name as photo_name, P.business_ref ' +
        'as business, W.friend_id as friend_id FROM (SELECT * FROM (SELECT * FROM POST ' +
        'WHERE POST.user_id='+uid+' OR POST.user_id IN (SELECT FRIEND.user_id2 FROM USER ' +
        'INNER JOIN FRIEND ON USER.user_id=FRIEND.user_id1 WHERE FRIEND.user_id1='+uid+')) as buffer) P ' +
        'LEFT OUTER JOIN WITH_FRIEND W on P.user_id=W.user_id and P.datetime=W.post_datetime) R ' +
        'INNER JOIN USER ON R.user_id = USER.user_id) FF LEFT OUTER JOIN USER ' +
        'on FF.friend_id = USER.user_id) M LEFT OUTER JOIN BUSINESS B ON M.business=B.business_id '+
        'ORDER BY M.datetime DESC, M.user_id';
    console.log(query);
    // console.log(query);

    connection.query(query, function(err, results) {

            if (err)
                renderUserPosts(res, uid, results, "Get Posts failed!");
            else {
                var user_id;
                var user_name;
                var text;
                var datetime;
                var photo_name;
                var friend_id;
                var friend_name;
                var finalresults = [];
                var friend_list = [];
                var business;
                var business_id;
                for(var i=0;i<results.length;i++) {
                    if (results[i].user_id == user_id && String(results[i].datetime) == String(datetime)) {
                        // same post
                        if(friend_name != null) friend_list.push([results[i].friend_id, results[i].friend_fb_name]);
                    }
                    else {
                        if (typeof user_id != 'undefined') {
                            var post = {
                                "user_id": user_id,
                                "user_name": user_name,
                                "text": text,
                                "datetime": datetime,
                                "photo_name": photo_name,
                                "friend_list": friend_list,
                                "business": business,
                                "business_id": business_id
                            }
                            console.log("push to final results");
                            console.log(post);
                            finalresults.push(post);
                        }
                        user_id = results[i].user_id;
                        user_name = results[i].fb_name;
                        text = results[i].text;
                        datetime = moment(results[i].datetime).format('MM-DD-YYYY HH:mm:ss');
                        photo_name = results[i].photo_name;
                        friend_id = results[i].friend_id;
                        friend_name = results[i].friend_fb_name;
                        business = results[i].name;
                        business_id = results[i].business_id;
                        friend_list = [];
                        if(friend_name != null) {
                            friend_list.push([friend_id, friend_name]);
                        }
                    }
                }
                var finalpost = {
                    "user_id": user_id,
                    "user_name": user_name,
                    "text": text,
                    "datetime": datetime,
                    "photo_name": photo_name,
                    "friend_list": friend_list,
                    "business": business,
                    "business_id": business_id
                }
                if(typeof user_id != 'undefined') finalresults.push(finalpost);
                renderUserPosts(res, uid, finalresults, msg);
            }
        }
    );


}
//
//function newPost(req, res, next) {
//    connection.query('SELECT user_id FROM USER WHERE fb_account ="' + request.user.id + '"',
//        function (err, id) {
//            if (!err)
//                return id[0];
//            else
//                next(new Error(500));
//        });
//}

//get photo from MongoDB
function getPhotoQuery(req, res, next) {
    var photo_name = req.params.id;

    //console.log(photo_name);
    if(undefined(photo_name)) {
        //console.log("photo_name === 'undefined'");
        next(new error(404));
    }
    var collection = gridfs.files;
    //console.log("collection" + collection);
    collection.findOne({"filename": photo_name}, function(err, item) {
        if(err || !item) {
            //console.log("can't find file from mongoDB fs.files");
            next(new Error(404));
        } else {
            //console.log("findone callback");
            var length = item.length;
            var type = mime.lookup(photo_name);
            //console.log(length);
            //console.log(type);
            res.writeHead(200, {
                'Content-Type': type,
                'Content-Length': length
            });

            //read from mongodb
            var readstream = gridfs.createReadStream({
                filename: photo_name
            });
            //console.log("done find readstream");
            readstream.pipe(res);
            readstream.on('error', function(err) {
                //console.log('file stream error!');
                res.end(err);
            })
        }
    });
}

function addFriend(req, res, next, err, uid, msg) { //req, res, next, err, userid[0].user_id, msg
    if(err) {
        return next(new Error(404));
    }
    var friend_id = req.params.id;
    if(!friend_id || !uid) {
        return next(new Error(500));
    }

    console.log("friend_id: " + friend_id + " uid: " + uid);
    if(friend_id == uid) { //return to the friend page, send message
        redirectHomepage(req, res, friend_id, "You can't friend youself!");
        return;
    }
    var query = "INSERT INTO FRIEND (user_id1, user_id2) VALUES (" + uid + ", " + friend_id + "), (" + friend_id + ", " + uid + ")";
    connection.query(query, function(err, results) {
            if (err)
                redirectHomepage(req, res, friend_id, "Add friend failed!");
            else {
                redirectHomepage(req, res, friend_id, "Add friend success");
            }
        }
    );
}



//post request to create a new post
router.post('/new_post', function(req, res, next) {
    console.log("##############haha");
    getUserQuery(req, res, next, "New Post", newPost);
});

//show my news feeds page
router.get('/my_feed', function(req, res, next) {
    getUserQuery(req, res, next, "", myFeed);
});

///* GET users listing for another user. */
//router.get('/:id', function(req, res, next) {
//	myFeed(req, res, next, null, req.params.id, "get /users/:id");
//});

/* Get user's homepage.*/
router.get('/homepage', function(req, res, next) {
    var id = getIdQuery(req, res, next);
    doFriendQuery(req, res, id, next);
});


router.get('/images/:id', function(req, res, next) {
    getPhotoQuery(req, res, next);
});

router.get('/friend/:id', function(req, res, next) {
    //console.log("/images/:id");
    getUserQuery(req, res, next, "", addFriend);
});


module.exports = router;

