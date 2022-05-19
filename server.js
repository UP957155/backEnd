"use strict"
//Get dependencies
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const app = express();
const router = require('./api/router');
require('dotenv').config();

//Use session cookies
app.use( session({
    secret: process.env.secret,
    cookie: {
        maxAge: 60000 * 60 * 24
    },
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
//Use api router
app.use(router)

//Set up port
const PORT = process.env.port || 8080
//Run server
app.listen(PORT, () => {
    console.log('App listening on port: ' + PORT);
})