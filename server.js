var connect = require('connect');
var http = require('http');
var url = require('url');
var fs = require('fs');
var youtubedl = require('youtube-dl');

//volume - amixer set PCM 80%

var app = connect()
	.use(connect.logger('dev'))
	.use(connect.static('public'))
	.use(function(req, res){
		var urlParts = url.parse(req.url, true);
		var pathParts = urlParts.pathname.split('/');
		var moduleName = pathParts.length > 0 ? pathParts[1] : null;

		switch(moduleName) {
			case 'songs':
				if(!pathParts[2]) {
					listSongs(res);
				} else if (pathParts[2] === 'get') {
					getSong(pathParts[3], res);
				} else {
					notFound(res);
				}
			break;
			default:
				notFound(res);
			break;
		}
	});

http.createServer(app).listen(3000);

function notFound() {
	res.statusCode = 404;
	res.end('Not Found');
}

function getSong(id, res) {
	var dl = youtubedl.download('http://www.youtube.com/watch?v=' + id,
		'./public/videos',
		['--extract-audio', '--audio-format=mp3', '--id']);

	dl.on('error', function(err) {
		console.log(err);
	});

	dl.on('end', function(data) {
		console.log('\nDownload finished!');
		console.log('ID:', data.id);
		console.log('Filename:', data.filename);
		console.log('Size:', data.size);
		console.log('Time Taken:', data.timeTaken);
		console.log('Average Speed:', data.averageSpeed);
	});

	res.statusCode = 200;
	res.end('Downloading...');
}

function listSongs(res) {
	res.statusCode = 200;
	res.end('Songs...');
}
