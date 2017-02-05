class DataProvider {
    constructor(onInit) {
        var _this = this;
        var provider = new firebase.auth.GoogleAuthProvider();

        firebase.auth().signInWithPopup(provider).then(function (result) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // The signed-in user info.
            var user = result.user;
            // ...
        }).catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            if (errorCode === "auth/popup-blocked") {
                alert('Google SignIn popup has been blocked.. Could you allow popups for this page ? :)')
            }
            var errorMessage = error.message;
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;
            // ...
        });

        firebase.auth().onAuthStateChanged(function (user) {
            if (user && (!_this.user || _this.user.uid != user.uid)) {
                _this.user = user;

                _this.getRadars(function (r) {
                    _this.radars = r;
                    onInit();
                });

            } else {
                // No user is signed in.
            }
        });
    }

    getRadars(callback) {
        var _this = this;
        var radars = firebase.database().ref('radars/' + this.user.uid).once('value').then(function (a) {
            callback(_.map(_.values(a.val()), function (x) { return JSON.parse(x); }));
        });
    }

    setRadar(radar) {
        if (!radar.key) {
            radar.key = firebase.database().ref('radars').push().key;
        }
        var updates = {};
        updates['/radars/' + this.user.uid + '/' + radar.key] = JSON.stringify(radar);
        firebase.database().ref().update(updates);
    }
}