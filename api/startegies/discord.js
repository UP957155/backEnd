//Get dependencies
const passport = require('passport');
require('dotenv').config();
const DiscordOAuth2 = require('passport-discord');

//Set up passport serialize user
passport.serializeUser((user, done) => {
    done(null, user)
})

//Set up passport deserialize user
passport.deserializeUser((user, done) => {
    done(null, user)
})

//Use discord authentication
passport.use(new DiscordOAuth2({
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: process.env.callbackURL,
    scope: ['identify','email', 'guilds'] //get data from successful authentication
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile)
}))