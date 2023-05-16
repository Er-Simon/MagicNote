/*global WildRydes _config*/

var MagicNote = window.MagicNote || {};

(function notesScopeWrapper($) {
    var authToken;
    var limits = new Map();

    MagicNote.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            alert("You are not logged in, log in to manage your notes!");
            window.location.href = '../signin/';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '../signin/';
    });

    function createNote(title, content, onSuccess, onFailure) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/note',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                Title: title,
                Content: content
            }),
            contentType: 'application/json',
            success: onSuccess,
            error: onFailure
        });
    }

    function getNotes() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/note',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                Limits: {
                    Start: limits.get("start"),    
                    End: limits.get("end")
                }
            }),
            contentType: 'application/json',
            success: completeGetRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting notes: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting your notes:\n' + jqXHR.responseText);
            }
        });
    }

    function completeGetRequest(result) {
        console.log('Response received from API: ', result);

        // controlla size di result e in caso disattiva il bottone load notes
        // se != 0 visualizza note
        displayNotes(result);
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#loadMore').click(handleGetClick);
        $('#newNoteForm').submit(handleNoteCreation);

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handleGetClick(event) {
        event.preventDefault();
        
        console.log("limits");
        console.log(limits);

        if (limits.size === 0) {
            limits.set("start", 0);
            limits.set("end", 20);
        } else {
            var actual_value = limits.get("end");
            limits.set("start", actual_value);
            limits.set("end", actual_value + 20);
        }
        
        getNotes();
    }

    function handleNoteCreation(event) {
        var title = $('#noteTitle').val();
        var content = $('#noteContent').val();
        event.preventDefault();
        createNote(title, content,
            function createNoteSuccess(result) {
                console.log('call result: ' + result);
                alert('Note successfully created');
            },
            function createNoteError(err) {
                console.log(err);
                alert(err);
            }
        );
    }

    function displayNotes(notes) {
        for (let i = 0; i < notes.length; i++) {
            console.log(notes[i]);
            $('#notes').append($('<button type="button" class="list-group-item list-group-item-action" ' + notes[i]['id'] + '>' + notes[i]["title"] + '</button>'));
        }
    }
}(jQuery));
