const admin = require('firebase-admin');
var serviceAccount = require("./admin.json");
const functions = require('firebase-functions');
const fs = require('fs');
const readline = require('readline');


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

exports.getRandomWord = functions.https.onRequest((request, res) => {
    db.collection("Words").doc("Test").get().then(doc => {
        // console.log("First word is " + doc.data().words);
        var word = doc.data().words[getRandomInt(doc.data().words.length)];
        console.log("Word is " + word);
        res.status(200).send({ word });
    }).catch(err => {
        console.log(err);
        res.status(400).send(err);
    });
});

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

// exports.addAll = functions.https.onRequest((request, response) => {
//     // readFile();
//     readFile().then(async (list) => {
//         console.log(list.length);
//     db.collection("Words").doc("Test").set({
//         words: list
//     });
//         response.send("Hello from Firebase!");
//     });
// });

// async function readFile() {
//     const fileStream = fs.createReadStream('word_list.txt');
//     const rl = readline.createInterface({
//         input: fileStream,
//         crlfDelay: Infinity
//     });
//     let list = [];

//     for await (const line of rl) {
//         // Each line in input.txt will be successively available here as `line`.
//         // console.log(`Line from file: ${line}`);
//         list.push(line);
//     }
//     return list;
// }