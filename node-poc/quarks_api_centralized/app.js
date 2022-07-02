const bodyParser = require('body-parser');
const express = require('express');
const mysql = require('mysql');
const {body, validationResult} = require('express-validator');
const Timestamp = require("timestamp-nano");

const app = express();
app.use(bodyParser.json());

require('dotenv').config();

const database = mysql.createConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.get('/init', (req, res) => {
    let createMessagesTableSQL = 'CREATE TABLE IF NOT EXISTS messages(id int AUTO_INCREMENT, channel VARCHAR(50), msg_timestamp bigint , email VARCHAR(50), text LONGTEXT, PRIMARY KEY(id))';
    let createEmailTokenTableSQL = 'CREATE TABLE IF NOT EXISTS email_token(id int AUTO_INCREMENT, email VARCHAR(50), token VARCHAR(50), PRIMARY KEY(id))';

    database.query(createEmailTokenTableSQL, (err) => {
        if (err) throw err
        database.query(createMessagesTableSQL, (err) => {
            if (err) throw err
            res.send('Table created!')
        });
    });
});

app.get('/initAccountTokens', (req, res) => {

    let testToken = 'qwerty12345'
    let tokens = []
    tokens.push({
        email: 'alice@org.com',
        token: testToken
    });
    tokens.push({
        email: 'bob@org.com',
        token: testToken
    });
    tokens.push({
        email: 'charlie@org.com',
        token: testToken
    });

    const insertTokenSQL = 'INSERT INTO email_token SET ?';

    for (let token of tokens) {
        database.query(insertTokenSQL, token, (err, row) => {
            if (err) throw err;
            console.log(row);
        });
    }

    res.send("added");


});


app.post('/sendMessage',
    body('email').isEmail().escape(),
    body('text').not().isEmpty().escape(),
    body('channel').not().isEmpty().escape(),
    (req, res) => {
        console.log(req.body);
        const errors = validationResult(req);

        if (errors.array().length > 0) {
            res.send(errors.array());
        } else {

            let requestToken = req.header("token")
            const message = {
                email: req.body.email,
                text: req.body.text,
                channel: req.body.channel,
                msg_timestamp: Date.now()
            };

            const checkTokenSQL = 'SELECT token FROM email_token WHERE email = "' + message.email + '" and token = ?';
            const insertMessageSQL = 'INSERT INTO messages SET ?';

            database.query(checkTokenSQL, requestToken, (err, row) => {
                if (err) throw err;
                if (row.length === 0) {
                    res.status(403).send('invalid token');
                } else {
                    database.query(insertMessageSQL, message, (err, row) => {
                        if (err) throw err;
                        res.send('message sent');
                    });
                }

            });


        }
    }
);

app.post('/readMessage',
    body('channel').not().isEmpty().escape(),
    body('email').isEmail().escape(),
    (req, res) => {
        console.log(req.body);
        const errors = validationResult(req);

        if (errors.array().length > 0) {
            res.send(errors.array());
        } else {

            let requestToken = req.header("token")
            let channel = req.body.channel
            let email = req.body.email

            const checkTokenSQL = 'SELECT token FROM email_token WHERE email = "' + email + '" and token = ?';
            const queryMessageSql = 'SELECT * FROM messages WHERE channel = ?';

            database.query(checkTokenSQL, requestToken, (err, row) => {
                if (err) throw err;
                if (row.length === 0) res.status(403).send('invalid token')

                database.query(queryMessageSql, channel, (err, result) => {
                    if (err) throw err;

                    res.json({
                        'messages': result
                    })
                });

            });


        }
    }
);

app.listen(3000, () => {
    console.log('Server running!');
});