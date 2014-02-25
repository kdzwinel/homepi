(function () {
    "use strict";

    var baseURL = '';

    function getSongs() {
        return $.getJSON(baseURL + '/songs/');
    }

    function showSongs(songs) {
        var $songsList = $('#songs');
        songs.forEach(function(song) {
            var img = $('<img>').addClass('thumbnail').attr('src', song.thumbnail);
            var span = $('<span>').addClass('title').text(song.title);
            var li = $('<li>').data('song', song).append(img).append(span);

            $songsList.append(li);
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

    $('#change-volume').click(function(){
        var value = $('#volume').val();
        $.getJSON(baseURL + '/player/volume/' + value);
    });
})();