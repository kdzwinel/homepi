var osx = (process.platform === 'darwin');

var connect = require('connect');
var http = require('http');
var url = require('url');
var youtubedl = require('youtube-dl');

var exec = require('child_process').exec;

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/homepi');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
    console.log('DB connection open');
});

var songSchema = mongoose.Schema({
    title: String,
    url: String,
    thumbnail: String,
    id: String,
    filename: String
});
var Song = mongoose.model('Song', songSchema);

var port = process.argv[2] || 3000;

var volume = null;
readSystemVolume();

var app = connect()
    .use(connect.logger('dev'))
    .use(connect.static('public'))
    .use(function (req, res) {
        var urlParts = url.parse(req.url, true);
        var pathParts = urlParts.pathname.split('/');
        var moduleName = pathParts.length > 0 ? pathParts[1] : null;

        switch (moduleName) {
            case 'songs':
                if (!pathParts[2]) {
                    listSongs(res);
                } else if (pathParts[2] === 'get') {
                    getSong(pathParts[3], res);
                } else {
                    notFound(res);
                }
                break;
            case 'player':
                if (pathParts[2] === 'play') {
                    playSong(pathParts[3], res);
                } else if (pathParts[2] === 'stop') {
                    stopPlayer(res);
                } else if (pathParts[2] === 'volume') {
                    if(pathParts[3] !== undefined && pathParts[3] !== "") {
                        changeVolume(pathParts[3], res);
                    } else {
                        getVolume(res);
                    }
                } else {
                    notFound(res);
                }
                break;
            default:
                notFound(res);
                break;
        }
    });

http.createServer(app).listen(port);

function notFound(res) {
    res.statusCode = 404;
    res.end('Not Found');
}

function getSong(id, res) {
    var url = 'http://www.youtube.com/watch?v=' + id;
    var dl = youtubedl.download(url,
        './music/',
        ['--extract-audio', '--audio-format=mp3', '--id']);

    dl.on('error', function (err) {
        console.log(err);
    });

    dl.on('end', function (data) {
        console.log('Song downloaded (' + data.id + ')');

        youtubedl.getInfo(url, [], function(err, info) {
            if (err) throw err;

            console.log('Song info downloaded (', info.id, ' - ', info.title, ')');

            var song = new Song({
                id: info.id,
                title: info.title,
                url: info.url,
                thumbnail: info.thumbnail,
                filename: info.id + '.mp3'
            });

            song.save(function (err) {
                if (err) return console.error(err);

                console.log('Song saved in DB');
            });
        });
    });

    res.statusCode = 200;
    res.end('{"status":"downloading"}');
}

function listSongs(res) {
    res.statusCode = 200;
    Song.find(function (err, songs) {
        if (err) return console.error(err);

        res.end(JSON.stringify(songs));
    });
}

function playSong(id, res) {
    var player = osx ? 'mpg123' : 'play';

    exec('pkill ' + player);
    exec(player + " \"music/" + id + ".mp3\"",
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });

    res.statusCode = 200;
    res.end('{"status":"playing"}');
}

function stopPlayer(res) {
    var player = osx ? 'mpg123' : 'play';

    exec('pkill '+ player);

    res.statusCode = 200;
    res.end('{"status":"stopped"}');
}

function changeVolume(newVolume, res) {
    if(newVolume >= 0 && newVolume <= 100) {
        if(osx) {
            exec('osascript -e "set Volume ' + newVolume/10 + '"');
        } else {
            exec('amixer set PCM ' + newVolume + '%');
        }

        volume = newVolume;
    }

    res.statusCode = 200;
    res.end('{"status":"changed"}');
}

function getVolume(res) {
    res.statusCode = 200;
    res.end('{"volume":"' + volume + '"}')
}

function readSystemVolume() {
    if(osx) {
        exec("osascript -e 'output volume of (get volume settings)'", function(err, stdout, stderr) {
            if(err) {
                console.log(err);
            } else {
                var value = parseInt(stdout, 10);

                if(!isNaN(value)) {
                    volume = value;
                }
            }
        });
    } else {
        exec("amixer get PCM | grep '%]'", function(err, stdout, stderr) {
            if(err) {
                console.log(err);
            } else {
                var matches = stdout.match(/\[([0-9]+)%\]/);

                if(matches.length === 2) {
                    var value = parseInt(matches[1], 10);

                    if(!isNaN(value)) {
                        volume = value;
                    }
                }
            }
        });
    }
}