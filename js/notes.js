/*global WildRydes _config*/

var MagicNote = window.MagicNote || {};


(function notesScopeWrapper($) {
    var authToken;

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
        displayNotes(result);
    }

    function showNote(noteId, onSuccess, onFailure) {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/note/show',
            headers: {
                Authorization: authToken
            },
            data: {
                "id": noteId,
            },
            contentType: 'application/json',
            success: onSuccess,
            error: onFailure
        });
    }

    // Register click handler for #request button
    $(function onDocReady() {
        if($('#notes').length > 0) {
            getNotes();
         }

        $('#newNoteForm').submit(handleNoteCreation);

        $(document).on('click', '.item-note', handleShowNote);

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handleShowNote() {
        var noteId = this.id;

        showNote(noteId,
            displayNote,
            function showNoteError(err) {
                console.log(err);
                alert(err);
            }
        );
    }

    function handleNoteCreation(event) {
        var title = $('#noteTitle').val();
        var content = $('#noteContent').val();

        event.preventDefault();
        createNote(title, content,
            function createNoteSuccess(result) {
                $('#noteTitle').val('');
                $('#noteContent').val('');
                alert('Note successfully created');
            },
            function createNoteError(err) {
                console.log(err);
                alert(err);
            }
        );
    }

    function displayNotes(notes) {
        var notesData = notes.data;

        if (notesData.Items.length == 0) {
            $('#status').removeClass("d-none");
        } else {
            $('#status').addClass("d-none");
        }

        for (let i = 0; i < notesData.Items.length; i++) {
            var note = notesData.Items[i];
            $('#notes').append($('<button type="button" class="list-group-item list-group-item-action item-note" id=\'' + note.id.S + '\'>' + note.title.S + '</button>'));
        }
    }

    function displayNote(response) {
        console.log("response:");
        console.log(response);

        var noteData = response.data;

        if (noteData.Items.length == 1) {
            var note = noteData.Items[0];
            document.getElementById("modalNoteTitle").innerHTML = note.title.S;
            document.getElementById("modalNoteContent").innerHTML = note.content.S;
            console.log('Note displayed successfully');

            $('#noteModal').modal('show');
        }
    }   

}(jQuery));
