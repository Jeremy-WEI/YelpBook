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


function doGroupMember(req, res, id, next) {
    console.log(id);

    // connection.connect();
    connection.query('SELECT U.user_id, U.fb_name from FOLLOWS F INNER JOIN USER U ON F.user_id = U.user_id where F.business_id = "' + id + '"',
        function (err, memberInfo) {
            console.log('SELECT U.user_id, U.fb_name from FOLLOWS F INNER JOIN USER U ON F.user_id = U.user_id where F.business_id = "' + id + '"');
            console.log(memberInfo);
            if (!err) {
                res.render('group', {
                    members: memberInfo
                });
            } else
                next(new Error(500));
        });
}

router.get('/:id', function(req, res, next) {
    console.log("get request");
    var uid = req.params.id;
    doGroupMember(req, res, uid, next);
    //
    //doFriendQuery(req, res, uid, next);
});

module.exports = router;
