'use strict';

// TODOne: Install and require the NPM Postgres package 'pg' into your server.js, and ensure that it is then listed as a dependency in your package.json

const fs = require('fs');
const express = require('express');
const pg = require('pg');

// COMMENTed: Why is the PORT configurable?
// My understanding is that it doesn't matter at the moment, but when we connect to an environment like Heroku, we'll want it to be able to tell the server which port to use.
const PORT = process.env.PORT || 3000;
const app = express();

// TODOne: Complete the connection string (conString) for the URL that will connect to your local Postgres database.

// Windows and Linux users: You should have retained the user/password from the pre-work for this course.
// Your OS may require that your conString is composed of additional information including user and password.
// const conString = 'postgres://USER:PASSWORD@HOST:PORT/DBNAME';

// Mac:
const conString = 'postgres://localhost:5432/kilovolt';


// TODOne: Our pg module has a Client constructor that accepts one argument: the conString we just defined.
// This is how it knows the URL and, for Windows and Linux users, our username and password for our database when client.connect() is called below. Thus, we need to pass our conString into our pg.Client() call.

const client = new pg.Client(conString);

// REVIEW: Use the client object to connect to our DB.
client.connect();


// REVIEW: Install the middleware plugins:

// COMMENTed: What kind of request body is this first middleware handling?
// So this is my understanding of what's happening here: app.use is used to "mount middleware" - in other words, we're saying "Hey Express, here are some functions I want you to have access to as you process requests and responses." The express.json middleware parses, not surprisingly, JSON passed to the server in a request. After the middleware runs, the request gets a "body" property containing the parsed object.
app.use(express.json());
// COMMENTed: What kind of request body is this second middleware handling?
// Data posted to the server can come in formats other than JSON. The middleware below handles requests that are urlencoded (like traditional HTML form submissions) and, again, adds a body property holding the parsed information to the request object.
app.use(express.urlencoded({extended: true}));
// COMMENTed: What is this middleware doing for us?
// This middleware tells Express where to find our site's static (and public) assets so it can serve them to visitors when requested.
app.use(express.static('./public'));


// REVIEW: Routes for requesting HTML resources
app.get('/new', (request, response) => {
    // COMMENTed: 
    // 1) What number(s) of the full-stack-diagram.png image correspond to the following line of code? 
    // 2) What part of the front end process is interacting with this particular piece of `server.js`? 
    // I'd say the following line of code corresponds to #5 in the diagram. It's triggered by #2, when a user navigates to whatever-domain-this-ends-up-at.com/new in order to get our file stored at whatever-domain-this-ends-up-at.com/public/new.html. 
    response.sendFile('new.html', {root: './public'});
});

// REVIEW: Routes for making API calls to use CRUD Operations on our database
app.get('/articles', (request, response) => {
    // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 
    // Which method of article.js is interacting with this particular piece of `server.js`? 
    // What part of CRUD is being enacted/managed by this particular piece of code?
    // The code below corresponds to numbers 3, 4, and 5 in the diagram (and is triggered by 2). (Not sure how literally I should take "the following line of code." Specifically, a `client.query` line corresponds to 3, a line like `result.rows` corresponds to 4, and a `response.send` line corresponds to 5. I suppose the `.catch` part could correspond to anywhere from 2 through 5, depending on the problem.) Requests come from the `fetchAll` method in article.js. It's the R (i.e. Read) in CRUD being enacted.
    client.query('SELECT * FROM articles')
        .then(function(result) {
            response.send(result.rows);
        })
        .catch(function(err) {
            console.error(err);
        });
});

app.post('/articles', (request, response) => {
    // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 
    // Which method of article.js is interacting with this particular piece of `server.js`? 
    // What part of CRUD is being enacted/managed by this particular piece of code?
    // 3 and 5 in the diagram again (with a successful 4 inferred), plus this time data from 2 (all the `request.body` lines) is involved. This one interacts with the `insertRecord` method. This is an example of "C" (Create).
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
    // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 
    // Which method of article.js is interacting with this particular piece of `server.js`? 
    // What part of CRUD is being enacted/managed by this particular piece of code?
    // Another 2, 3, (4), 5. This one interacts with the `updateRecord` method (which doesn't seem to get called yet). The UPDATE keyword is a good hint that this is a "U".
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
    // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 
    // Which method of article.js is interacting with this particular piece of `server.js`? 
    // What part of CRUD is being enacted/managed by this particular piece of code?
    // And, to complete CRUD with a "D(elete or Destroy)", we have another 2, 3, (4), 5. This one handles requests from `deleteRecord`.
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
    // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? 
    // Which method of article.js is interacting with this particular piece of `server.js`? 
    // What part of CRUD is being enacted/managed by this particular piece of code?
    // Pretty similar to the last answer: 3, (4), 5, and D. (No reference to data getting passed with the request this time.) This one interacts with `truncateTable` (and is extra destructive).
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

// COMMENTed: What is this function invocation doing?
// The line below calls the `loadDB` function, which makes sure there's a table to hold articles in the database and then calls `loadArticles` to load it up with article data.
loadDB();

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}!`);
});


//////// ** DATABASE LOADER ** ////////
////////////////////////////////////////
function loadArticles() {
    // COMMENTed: Why is this function called after loadDB?
    // It's pretty hard to load something that doesn't exist.
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
    // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
    // Here we're dealing with queries and results exchanged between the server and database, so 3 and 4. I don't think article.js / the front end get involved here. The "C" part of CRUD will be enacted. You might expect that's the case because of the CREATE keyword, but my reading suggests that CRUD doesn't really relate to the database itself getting set up, as it is here. Instead, I think it's the INSERTing that happens in `loadArticles` callback that corresponds to the Creating of persistent data.
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
