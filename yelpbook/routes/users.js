var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'mydatabase.cfxag8k1xo7h.us-east-1.rds.amazonaws.com',
    user     : 'linjie',
    password : '5data5base0',
    database : 'YelpBook'
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
        //console.log("mongo connection failed");
        //console.log(err.message);
        throw err; //connection failed, kill the whole server
    } else {
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
//    //console.log("======undefined?");
//    //console.log(obj);
//    //console.log(typeof obj === 'undefined');
//    //console.log("undefined=====");
    return typeof obj === 'undefined';
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
        connection.query('SELECT U.fb_name FROM FRIEND F INNER JOIN ON F.user_id2 = U.user_id WHERE F.user_id1 =' + id,
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

//call back function to show my news feed
function myFeed(req, res, next, err, userid, msg) {
    ////console.log("myFeed callback found userid: " + userid);
    getPostsQuery(req, res, next, err, userid, msg);
}


//call back function to process a new post
function newPost(req, res, next, err, userid, msg) {
    if (!undefined(global.done) && global.done != true) { //file upload not done
        //console.log("File uploaded done==false");
    } else {
        var uid = userid[0].user_id;
        var post_text = req.body.new_post;
        var datetime = moment().format('YYYY-MM-DD HH:mm:ss');
        var file = req.file;
        var photo_name;
        if(undefined(file)) {
            photo_name = "NULL";
            global.done = true;
        } else {
            photo_name = uid + "_" + file.name;
        }
        var query = "INSERT INTO POST (user_id, text, datetime, photo_name) VALUES ('" + uid + "', '" + post_text + "', '" + datetime + "', '" + photo_name + "')";
        //console.log(query);
        connection.query(query,
            function(err, results) { //query returns
                if (err)
                    getPostsQuery(req, res, next, err, uid, "The post Failed in mysql query!");
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
                        //console.log("file pipe to DB done");
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
            callBack(req, res, next, err, userid[0].user_id, msg);
        }
    });
}

function renderUserPosts(res, uid, results,  msg) {
    res.render('user', {"user_id" : uid, "results": results, "message": msg});
}

function getPostsQuery(req, res, next, err, user_id, msg) {
    //console.log("getPostsQuery user_id: " + user_id);
//    var fb_name = null;
//    var uid = connection.escape(user_id[0]);
//    //console.log("uid: " + uid);
    var uid = user_id;
    var query = "SELECT DISTINCT * FROM USER INNER JOIN ((SELECT * FROM POST WHERE user_id IN"
    + "(SELECT user_id2 as user_id FROM FRIEND WHERE user_id1='" + uid + "'))"
    + "UNION"
    + "(SELECT * FROM POST WHERE user_id IN"
    + "(SELECT user_id1 as user_id FROM FRIEND WHERE user_id2=" + uid + "))"
    + "UNION"
    + "(SELECT * FROM POST WHERE user_id IN (SELECT " + uid
    + "))) AS POSTS ON USER.user_id = POSTS.user_id ORDER BY POSTS.datetime DESC";
    //console.log(query);
    connection.query(query, function(err, results) {
            if (err)
                renderUserPosts(res, uid, results, "Get Posts failed!");
            else {
                renderUserPosts(res, uid, results, msg);
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



//post request to create a new post
router.post('/new_post', function(req, res, next) {
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
    //console.log("/images/:id");
    getPhotoQuery(req, res, next);
});




module.exports = router;

