/*global MagicNote _config AmazonCognitoIdentity AWSCognito*/

var MagicNote = window.MagicNote || {};

console.log(MagicNote);


(function scopeWrapper($) {
    var signinUrl = '../signin/';
    var homeUrl = '../';

    var poolData = {
        UserPoolId: _config.cognito.userPoolId,
        ClientId: _config.cognito.userPoolClientId
    };

    var userPool;

    if (!(_config.cognito.userPoolId &&
          _config.cognito.userPoolClientId &&
          _config.cognito.region)) {
        $('#noCognitoMessage').show();
        return;
    }

    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var user = userPool.getCurrentUser();

    if (typeof AWSCognito !== 'undefined') {
        AWSCognito.config.region = _config.cognito.region;
    }

    MagicNote.signOut = function signOut() {
        
        if (user === null) {
            return;
        }

        user.signOut();

        window.location = homeUrl;
    };

    MagicNote.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        var cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    reject(err);
                } else if (!session.isValid()) {
                    resolve(null);
                } else {
                    resolve(session.getIdToken().getJwtToken());
                }
            });
        } else {
            resolve(null);
        }
    });


    /*
     * Cognito User Pool functions
     */

    function register(email, password, onSuccess, onFailure) {
        var dataEmail = {
            Name: 'email',
            Value: email
        };

        var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);

        console.log("attributeEmail");
        console.log(attributeEmail);

        userPool.signUp(toUsername(email), password, [attributeEmail], null,
            function signUpCallback(err, result) {
                console.log("err");
                console.log(err);
                if (!err) {
                    onSuccess(result);
                } else {
                    onFailure(err);
                }
            }
        );
    }

    function signin(email, password, onSuccess, onFailure) {
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: toUsername(email),
            Password: password
        });

        var cognitoUser = createCognitoUser(email);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: onSuccess,
            onFailure: onFailure
        });
    }

    function verify(email, code, onSuccess, onFailure) {
        createCognitoUser(email).confirmRegistration(code, true, function confirmCallback(err, result) {
            if (!err) {
                onSuccess(result);
            } else {
                onFailure(err);
            }
        });
    }

    function createCognitoUser(email) {
        return new AmazonCognitoIdentity.CognitoUser({
            Username: toUsername(email),
            Pool: userPool
        });
    }

    function toUsername(email) {
        return email.replace('@', '-at-');
    }

    /*
     *  Event Handlers
     */

    $(function onDocReady() {
        $('#signinForm').submit(handleSignin);
        $('#registrationForm').submit(handleRegister);
        $('#verifyForm').submit(handleVerify);
        $('#signOut').click(handleSignout);
    });

    function handleSignin(event) {
        var email = $('#emailInputSignin').val();
        var password = $('#passwordInputSignin').val();
        event.preventDefault();
        signin(email, password,
            function signinSuccess() {
                console.log('Successfully Logged In');
                window.location.href = '../notes/';
            },
            function signinError(err) {
                console.log(err);
                console.log(typeof err);
                console.log(err.stack);
                console.log(err.message);
                console.log(err.name);

                var errorMessage = document.getElementById("errorMessage");
                var errorMessageText = document.getElementById("errorMessageText");

                if (err.name === "UserNotConfirmedException") {
                    errorMessageText.innerHTML = "Your account is not verified, complete the <a href='../verify/'>verification</a> now.";
                } else if (err.name === "NotAuthorizedException") {
                    errorMessageText.innerHTML = "You have entered invalid credentials.";
                }
                
                errorMessage.className = "d-block"; 
                
                alert(err);
            }
        );
    }

    function handleRegister(event) {
        var email = $('#emailInputRegister').val();
        var password = $('#passwordInputRegister').val();

        var onSuccess = function registerSuccess(result) {
            var cognitoUser = result.user;
            console.log('user name is ' + cognitoUser.getUsername());
            var confirmation = ('Registration successful. Please check your email inbox or spam folder for your verification code.');
            alert(confirmation);
            if (confirmation) {
                window.location.href = '../verify/';
            }
        };

        var onFailure = function registerFailure(err) {
            alert(err);
        };

        event.preventDefault();

        register(email, password, onSuccess, onFailure);
    }

    function handleVerify(event) {
        var email = $('#emailInputVerify').val();
        var code = $('#codeInputVerify').val();
        event.preventDefault();
        verify(email, code,
            function verifySuccess(result) {
                console.log('call result: ' + result);
                console.log('Successfully verified');
                alert('Verification successful. You will now be redirected to the login page.');
                window.location.href = signinUrl;
            },
            function verifyError(err) {
                alert(err);
            }
        );
    }

    function handleSignout(event) {
        event.preventDefault();

        if (Object.keys(MagicNote).length === 0) {
            return;
        }

        MagicNote.signOut();
    }
}(jQuery));
