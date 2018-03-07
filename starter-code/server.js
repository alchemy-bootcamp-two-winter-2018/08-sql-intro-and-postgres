'use strict';

// TODOne: Install and require the NPM Postgres package 'pg' into your server.js, and ensure that it is then listed as a dependency in your package.json

const fs = require('fs');
const express = require('express');
const pg = require('pg');

// COMMENT: Why is the PORT configurable?
// The number of ports, while vast, is finite, and they can't overlap. The ability to select a specific port ensures (or at least enables) that this server is not conflicting with another process/app.
const PORT = process.env.PORT || 3000;
const app = express();

// TODONE: Complete the connection string (conString) for the URL that will connect to your local Postgres database.

// Windows and Linux users: You should have retained the user/password from the pre-work for this course.
// Your OS may require that your conString is composed of additional information including user and password.
const conString = 'postgres://postgres:wastu3eg@localhost:5432/kilovolt';

// Mac:
// const conString = 'postgres://localhost:5432/DBNAME';


// TODONE: Our pg module has a Client constructor that accepts one argument: the conString we just defined.
// This is how it knows the URL and, for Windows and Linux users, our username and password for our database when client.connect() is called below. Thus, we need to pass our conString into our pg.Client() call.

const client = new pg.Client(conString);

// REVIEW: Use the client object to connect to our DB.
client.connect();


// REVIEW: Install the middleware plugins:

// COMMENT: What kind of request body is this first middleware handling?
// It handles .json request bodies. This will be used for the raw data stored in our database.
app.use(express.json());
// COMMENT: What kind of request body is this second middleware handling?
// It handles url encoded bodies in UTF-8 format. The extended:true argument means that it can parse complex things like objects, which we need to work with JSON data.
app.use(express.urlencoded({extended: true}));
// COMMENT: What is this middleware doing for us?
// This middleware establishes the public folder as a root directory as a static (non-changing) URL.
app.use(express.static('./public'));


// REVIEW: Routes for requesting HTML resources
app.get('/new', (request, response) => {
    // COMMENT: 
    // 1) What number(s) of the full-stack-diagram.png image correspond to the following line of code? 
    // 2) What part of the front end process is interacting with this particular piece of `server.js`? 
    // 1: 5. This is the data that the information provides as a RESPONSE to the view's /new REQUEST.
    // 2: The view.
    response.sendFile('new.html', {root: './public'});
});

// REVIEW: Routes for making API calls to use CRUD Operations on our database
app.get('/articles', (request, response) => {
    // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 
    // Which method of article.js is interacting with this particular piece of `server.js`? 
    // What part of CRUD is being enacted/managed by this particular piece of code?
    // 62 = 3, 64 = 5
    // Article.fetchAll
    // This is READ of CRUD
    client.query('SELECT * FROM articles')
        .then(function(result) {
            response.send(result.rows);
        })
        .catch(function(err) {
            console.error(err);
        });
});

app.post('/articles', (request, response) => {
    // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 
    // Which method of article.js is interacting with this particular piece of `server.js`? 
    // What part of CRUD is being enacted/managed by this particular piece of code?
    // 80 = 3, 94 = 4/5
    // Articles.insertRecord
    // This is UPDATE, in that it's updating the database table to include this new article
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
    // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 
    // Which method of article.js is interacting with this particular piece of `server.js`? 
    // What part of CRUD is being enacted/managed by this particular piece of code?
    // 108 = 3, 125 = 4/5
    // Articles.updateRecord
    // This is UPDATE
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
    // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 
    // Which method of article.js is interacting with this particular piece of `server.js`? 
    // What part of CRUD is being enacted/managed by this particular piece of code?
    // 138 = 3, 142 = 4
    // Articles.delteRecord
    // This is DESTROY
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
    // 157 = 3, 161 = 4/5
    // Articles.truncateTable
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
// This is calling ladbDB from the end of this file, which pulls the article data from the DB, or creates a table if it doesn't exist
loadDB();

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}!`);
});


//////// ** DATABASE LOADER ** ////////
////////////////////////////////////////
function loadArticles() {
    // COMMENT: Why is this function called after loadDB?
    // Because that way we can ensure that there is an article table, and hopefully that it's populated with data
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
    // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code?
    // Which method of article.js is interacting with this particular piece of `server.js`?
    // What part of CRUD is being enacted/managed by this particular piece of code?
    // 212 = 3, 223 calls loadArticles, which is its own 1-5 cycle.
    // This function does not appear to interact with any Articles method
    // This method is CREATE, and cycles through loadArticles(), which is READ
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
