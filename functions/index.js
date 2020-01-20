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
    verifyUser(req.get("Authorization"), true).then(uid => {
        // Find an existing game
        db.collection("Games")
            .where("gameStatus", "==", "Finding players")
            .orderBy('timeCreated', 'asc')
            .get()
            .then(async querySnapshot => {
                console.log("Finding existing game...");

                for (var i = 0; i < querySnapshot.docs.length; i++) {
                    let game = querySnapshot.docs[i];
                    let players = game.data().players;
                    if (!players.includes(uid)) {
                        players.push(uid);
                        game.ref.update({ "players": players });
                        console.log("Added to game: " + game.id);
                        return res.status(201).send("Success");
                    }
                };

                console.log("No pending game found, making new game");

                // Create new game
                let players = [];
                players.push(uid);
                getRandomWords(8).then(async words => {
                    let result = {
                        players: players,
                        gameStatus: "Finding players",
                        team1Words: words.slice(0, 4),
                        team2Words: words.slice(4, 8),
                        timeCreated: admin.firestore.FieldValue.serverTimestamp()
                    };
                    db.collection("Games").add(result)
                        .then(ref => {
                            return res.status(201).send({ gameId: ref.id });
                        })
                        .catch(error => {
                            console.log("Error:\n" + error);
                            return res.status(200).send("Error occured starting game.");
                        });

                })
                    .catch(err => {
                        console.log(err);
                        return res.status(200).send("Error occured");
                    });
            });
    }).catch(exception => {
        if (exception == missingTokenException) {
            console.log("Missing token:\n" + exception);
            return res.status(401).send("Auth header not provided");
        } else if (exception == errorVerifyingUserException) {
            console.log("Error validating user:\n" + exception);
            return res.status(401).send("Error validating user");
        } else {
            console.log("Error" + exception);
            return res.status(401).send("Unexpected Error");
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
function verifyUser(idToken, isTest) {
    if (isTest) {
        return Promise.resolve("TestUser");
    }
    idToken = admin.auth().createCustomToken();
    if (!idToken) {
        console.log("Missing token\n" + error);
        throw missingTokenException;
    }
    return admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
            return decodedToken.uid;
        })
        .catch(function (error) {
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