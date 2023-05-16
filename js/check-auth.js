var MagicNote = window.MagicNote || {};

if (MagicNote !== null) {
    MagicNote.authToken.then(function setAuthToken(token) {
        if (token) {
            alert("You are already logged in, please log out to visit this page!");
            window.location.href = '../notes/';
        }
    });
}