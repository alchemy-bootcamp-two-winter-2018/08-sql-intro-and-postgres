'use strict';

// TODOne: Install and require the NPM Postgres package 'pg' into your server.js, and ensure that it is then listed as a dependency in your package.json

const pg = require('pg');
const fs = require('fs');
const express = require('express');
const PORT = process.env.PORT || 3000;

// COMMENT: Why is the PORT configurable?
// Because you can't use the same port for two different server processes.
const app = express();


// TODOne: Complete the connection string (conString) for the URL that will connect to your local Postgres database.

const conString = 'postgres://postgres:Alchemy@localhost:5432/kilovolt';


// Windows and Linux users: You should have retained the user/password from the pre-work for this course.
// Your OS may require that your conString is composed of additional information including user and password.
// const conString = 'postgres://USER:PASSWORD@HOST:PORT/DBNAME';

// Mac:
// const conString = 'postgres://localhost:5432/DBNAME';


// TODOne: Our pg module has a Client constructor that accepts one argument: the conString we just defined.
// This is how it knows the URL and, for Windows and Linux users, our username and password for our database when client.connect() is called below. Thus, we need to pass our conString into our pg.Client() call.

const client = new pg.Client(conString);

// REVIEW: Use the client object to connect to our DB.
client.connect();


// REVIEW: Install the middleware plugins:

// COMMENT: What kind of request body is this first middleware handling?
// JSON-encoded
app.use(express.json());
// COMMENT: What kind of request body is this second middleware handling?
// urlencoded
app.use(express.urlencoded({extended: true}));
// COMMENT: What is this middleware doing for us?
// it gets express.static running so it can serve files
app.use(express.static('./public'));


// REVIEW: Routes for requesting HTML resources
app.get('/new', (request, response) => {
    // COMMENT: 
    // 1) What number(s) of the full-stack-diagram.png image correspond to the following line of code? 1, 2, 5
    // 2) What part of the front end process is interacting with this particular piece of `server.js`? new.html
    // My responses immediately follow the above questions.
    response.sendFile('new.html', {root: './public'});
});

// REVIEW: Routes for making API calls to use CRUD Operations on our database
app.get('/articles', (request, response) => {
    
    // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 2,3,4,5
    // Which method of article.js is interacting with this particular piece of `server.js`? Article.fetchAll
    // What part of CRUD is being enacted/managed by this particular piece of code? READ
    // My responses immediately follow the questions above.
    client.query('SELECT * FROM articles')
        .then(function(result) {
            response.send(result.rows);
        })
        .catch(function(err) {
            console.error(err);
        });
});

app.post('/articles', (request, response) => {
    // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 2,3,4,5
    // Which method of article.js is interacting with this particular piece of `server.js`? Article.prototype.insertRecord
    // What part of CRUD is being enacted/managed by this particular piece of code? CREATE
    // My responses immediately follow the questions above.
    client.query(
        `INSERT INTO
        articles(title, author, "authorUrl", category, "publishedOn", body)
        VALUES ($1, $2, $3, $4, $5, $6);
    `,
        [
            request.body.title,
            request.body.author,
            request.body.authorUrl,
            request.body.category,
            request.body.publishedOn,
            request.body.body
        ]
    )
        .then(function() {
            response.send('insert complete');
        })
        .catch(function(err) {
            console.error(err);
        });
});

app.put('/articles/:id', (request, response) => {
    // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 2,3,4,5
    // Which method of article.js is interacting with this particular piece of `server.js`? Article.prototype.updateRecord
    // What part of CRUD is being enacted/managed by this particular piece of code? UPDATE
    // My responses immediately follow the above questions.
    client.query(
        `UPDATE articles
        SET
        title=$1, author=$2, "authorUrl"=$3, category=$4, "publishedOn"=$5, body=$6
        WHERE article_id=$7;
    `,
        [
            request.body.title,
            request.body.author,
            request.body.authorUrl,
            request.body.category,
            request.body.publishedOn,
            request.body.body,
            request.params.id
        ]
    )
        .then(() => {
            response.send('update complete');
        })
        .catch(err => {
            console.error(err);
        });
});

app.delete('/articles/:id', (request, response) => {
    // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 2,3,4,5
    // Which method of article.js is interacting with this particular piece of `server.js`? 
    //Article.prototype.deleteRecord
    // What part of CRUD is being enacted/managed by this particular piece of code? DELETE
    // My responses immediately follow the above questions.
    client.query(
        `DELETE FROM articles WHERE article_id=$1;`,
        [request.params.id]
    )
        .then(() => {
            response.send('Delete complete');
        })
        .catch(err => {
            console.error(err);
        });
});

app.delete('/articles', (request, response) => {
    // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 
    // Which method of article.js is interacting with this particular piece of `server.js`? 
    // What part of CRUD is being enacted/managed by this particular piece of code?
    // All answers are identical to the answers for the other app.delete method above
    client.query(
        'DELETE FROM articles;'
    )
        .then(() => {
            response.send('Delete complete');
        })
        .catch(err => {
            console.error(err);
        });
});

// COMMENT: What is this function invocation doing?
// loads the database into memory
loadDB();

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}!`);
});


//////// ** DATABASE LOADER ** ////////
////////////////////////////////////////
function loadArticles() {
    // COMMENT: Why is this function called after loadDB?
    // The datbase is what contains the articles (data) - no sense in trying  to load the articles if we don't have access to the contents of the database already.
    client.query('SELECT COUNT(*) FROM articles')
        .then(result => {
            // REVIEW: result.rows is an array of objects that Postgres returns as a response to a query.
            // If there is nothing on the table, then result.rows[0] will be undefined, which will make count undefined. parseInt(undefined) returns NaN. !NaN evaluates to true.
            // Therefore, if there is nothing on the table, line below will evaluate to true and 
            // `return` to stop rest of function.
            if(parseInt(result.rows[0].count) > 0) return;
            
            // REVIEW: fs is built-in node module for interacting with the file system.
            fs.readFile('./public/data/hackerIpsum.json', (err, fd) => {
                JSON.parse(fd.toString()).forEach(ele => {
                    client.query(`
                        INSERT INTO
                        articles(title, author, "authorUrl", category, "publishedOn", body)
                        VALUES ($1, $2, $3, $4, $5, $6);
                    `,
                    [ele.title, ele.author, ele.authorUrl, ele.category, ele.publishedOn, ele.body]
                    );
                });
            });
            
        });
}

function loadDB() {
    // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 3, 4
    // Which method of article.js is interacting with this particular piece of `server.js`? none, this is entirely server/database side code
    // What part of CRUD is being enacted/managed by this particular piece of code? CREATE
    // My responses are immediately following the above questions.
    client.query(`
      CREATE TABLE IF NOT EXISTS articles (
      article_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      "authorUrl" VARCHAR (255),
      category VARCHAR(20),
      "publishedOn" DATE,
      body TEXT NOT NULL);`
    )
        .then(() => {
            loadArticles();
        })
        .catch(err => {
            console.error(err);
        });
}
