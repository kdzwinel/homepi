(function () {
    "use strict";

    var baseURL = '';

    function getSongs() {
        return $.getJSON(baseURL + '/songs/');
    }

    function showSongs(songs) {
        var $songsList = $('#songs tbody');
        songs.forEach(function(song) {
            var img = $('<img>').addClass('img-rounded').attr('src', song.thumbnail);
            var tdImg = $('<td>').addClass('song-image').append(img);
            var tdTitle = $('<td>').addClass('song-title').text(song.title);
            var tr = $('<tr>').data('song', song).append(tdImg).append(tdTitle);

            $songsList.append(tr);
        });
    }

    getSongs().then(showSongs);

    $('#songs').on('click', 'li', function() {
        var id = $(this).data('song').id;

        $.getJSON(baseURL + '/player/play/' + id);
    });

    $('#stop').click(function(){
        $.getJSON(baseURL + '/player/stop');
    });

    $('#download').click(function(){
        var id = $('#youtube-id').val();
        $.getJSON(baseURL + '/songs/get/' + id);
    });

    var volume = null;
    $('#volume-up').click(function(){
        if(volume === null || volume + 10 > 100) {
            return;
        }

        volume += 10;

        $.getJSON(baseURL + '/player/volume/' + volume);
    });

    $('#volume-down').click(function(){
        if(volume === null || volume - 10 < 0) {
            return;
        }

        volume -= 10;

        $.getJSON(baseURL + '/player/volume/' + volume);
    });

    $.getJSON(baseURL + '/player/volume/').done(function(data) {
        if(data && data.volume) {
            volume = data.volume;
        }
    });
})();