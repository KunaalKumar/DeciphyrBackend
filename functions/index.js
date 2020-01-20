const admin = require('firebase-admin');
var serviceAccount = require("./admin.json");
const functions = require('firebase-functions');
const fs = require('fs');
const readline = require('readline');
const missingTokenException = "Missing token";
const errorVerifyingUserException = "Error verifying user";


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://deciphyr-253e6.firebaseio.com"
});

let db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// POST
exports.startNewGame = functions.https.onRequest((req, res) => {
    if (req.method != "POST") {
        return res.status(400).send("Bad Request");
    }
    verifyUser(req.get("Authorization")).then(uid => {
        console.log("Logged in");
        let players = [];
        players.push(uid);
        getRandomWords(2).then(async words => {
            res.status(200).send(words);
        });
    }).catch(exception => {
        if (exception == missingTokenException) {
            console.log("Missing token:\n" + exception);
            res.status(401).send("Auth header not provided");
        } else if (exception == errorVerifyingUserException) {
            console.log("Error validating user:\n" + exception);
            res.status(401).send("Error validating user");
        } else {
            console.log("Error" + exception);
            res.status(401).send("Unexpected Error");
        }
    });
});

// Returns list of random nouns for the amount specified
function getRandomWords(numberOfWords) {
    let words = [];
    return readFile().then(async list => {
        for (var i = 0; i < numberOfWords; i++) {
            let isUnique = false;
            while (!isUnique) {
                var word = list[getRandomInt(list.length)];
                if (!words.includes(word))
                    isUnique = true
            }
            words.push(word);
        }
        return words;
    });
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

// If token was valid, returns user id
// Throws missingTokenException if idToken is null/empty
// Reference: https://firebase.google.com/docs/auth/admin/verify-id-tokens
function verifyUser(idToken) {
    return admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            return decodedToken.uid;
        })
        .catch(function (error) {
            if (!idToken) {
                console.log("Missing token\n" + error);
                throw missingTokenException;
            }
            console.log("Error verifying user\n" + error);
            throw errorVerifyingUserException; //Forbidden
        });
}

async function readFile() {
    const fileStream = fs.createReadStream('word_list.txt');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    let list = [];

    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        // console.log(`Line from file: ${line}`);
        list.push(line);
    }
    return list;
}