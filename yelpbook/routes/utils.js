module.exports = {
    redirectLogin: function(res) {
        res.writeHead(302, {
            'Location': '/'
        });
        res.write('Please log in first');
        res.end();
    }
};