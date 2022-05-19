"use strict"
//Get dependencies
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const { verify } = require('jsonwebtoken');
const {createRefreshToken, createAccessToken} = require('../jsonWebTokenFunctions/tokens');
const db = require('../datastore/db-datastore');
require('dotenv').config();
require('../startegies/discord');

router.use(cookieParser())
router.use(express.json())
router.use(express.urlencoded({extends: false}))



//Authentication router (manager)

//Redirect to authorization of the bot
router.get('/invite', (req, res) => {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=896381644825571368&permissions=138513214528&scope=bot`)
})

//Use passport for discord authentication
router.get('/auth', passport.authenticate('discord'))

//After successful auth redirect to client
router.get('/success', passport.authenticate('discord'), (req, res) => {
    res.redirect('http://localhost:3000/')
})

//Send user's data if login with discord auth
router.post('/discordUser', async(req, res) => {
    try {
        if(req.user){
            //If email of the user is admin add this property to profile
            if(req.user.email === process.env.adminEmail){
                req.user.admin = true
                const result = await db.put(req.user, 1)
                if(!result){
                    req.user.admin = false
                }
                return res.json({
                    user: req.user
                })
            }
            //send user data in given format
            res.json({
                user: req.user
            })
        }else{
            res.json(null)
        }
    } catch (err) {
        res.json({
            error: 'SERVER ERROR',
            message: err.message
        })
    }  
})

//Register new user to be able to log in without discord account
router.post('/register', async(req, res) => {
  try {
    const {nickname, email, password} = req.body //get user properties from request

    //Check if user isn't already registered
    let uniqueEmail = true
    const results = await db.list(0)
    if(!results){// request to db failed ... not possible verify email is unique
        
        return res.json({
            error: 'NOT SAVED',
            message: 'Login details not saved'
        })
    }

    const emailExist = results.find(obj => obj.email === email)
    if(emailExist){
        uniqueEmail = false
    }

    //If it is new user then create profile
    if(uniqueEmail === true){
        let user = {
            id: (results.length <= 0) ? 'jwt' + 0 : 'jwt' + (results[results.length - 1].id + 1), // unique id
            nickname: nickname
        }
        //Hash user's password and safe it's auth. properties
        bcrypt.hash(password, 10, async(err, hash) => {
            if(err){ 
                // if hashed failed then do not save login properties
                return res.json({
                    error: 'NOT SAVED',
                    message: 'Login details not saved'
                })
            }
            let login = {
                id: (results.length <= 0) ? 0 : results[results.length - 1].id + 1,
                email: email,
                password: hash
            }
            const data = await db.put(login, 0)
            if(!data){
                
                return res.json({
                    error: 'NOT SAVED',
                    message: 'Login details not saved'
                })
            }
        })
        //Check if user is admin and add admin properties
        if(email === process.env.adminEmail){
            user.admin = true
        }
        const data = await db.put(user, 1)
            if(!data){
                return res.json({
                    error: 'NOT SAVED',
                    message: 'User details not saved'
                })
            }
        res.json(true)
    }else{
        res.json({
            error: '!EMAIL EXIST!',
            message: 'User with email ' + email + ' is already registered. \nChoose different email or log in.'
        })
    }
  } catch (err) {
      res.json({
          error: 'SERVER ERROR',
          message: err.message
      })
  }

})

//Log in via email
router.post('/login', async(req, res) => {
 try {
    const {email, password} = req.body //Get properties from request

    let emailOK = false
    let login
    let user
    
    //Find user and login properties via email
    const results = await db.get({property: 'email', value: email}, 0)
    if(!results){
        return res.json({
            error: 'LOGIN FAILED',
            message: 'Login action failed, try it again'
        })
    }else if(results.length === 0){
        return res.json({
            error: 'INCORRECT EMAIL',
            message: 'Your email is incorrect'
        })
    }
        if(results[0].email === email){
            emailOK = true
            login = results[0]
            const userObject = await db.find('jwt' + login.id, 1)
            if(!userObject[0]){
                
                return res.json({
                    error: 'LOGIN FAILED',
                    message: 'Login action failed, try it again'
                })
            }
            user = userObject[0]
        }

    //If email confirmed compare hashed password with typed password
    if(emailOK){
        
        bcrypt.compare(password, login.password, async(err, result) => {
            if(err){
                
                return res.json({
                    error: 'LOGIN FAILED',
                    message: 'Login action failed, try it again'
                })
            }
            
            if(result){ //If passwords are same save/send user details
                const accessToken = createAccessToken(user.id)
                const refreshToken = createRefreshToken(user.id)
                // save refreshToken in db
                user.refreshToken = refreshToken
                const result1 = await db.put(user, 1)
                if(!result1){ // if saving failed
                    
                    return res.json({
                        error: 'LOGIN FAILED',
                        message: 'Login action failed, try it again'
                    })
                }
                // save refreshToken in cookies
                res.cookie('refreshToken', refreshToken, {
                 httpOnly: true,
                 path: '/refresh_token'   
                })
                // save accessToken in client
                user.refreshToken = true
                res.json({
                    accessToken: accessToken,
                    user: user
                })

            }else{ //If not same then send given error message
                res.json({
                    error: 'INCORRECT PASSWORD',
                    message: 'Your password is incorrect'
                })
            }
        })
    }else{ //If email is not registered send given error
        res.json({
            error: 'INCORRECT EMAIL',
            message: 'Your email is incorrect'
        })
    }
 } catch (err) {
     res.json({
         error: 'SERVER ERROR',
         message: err.message
     })
 }

})

//Log out user
router.post('/logout', (req, res) => {
    try{
        //Clear cookies
        if(req.cookies['connect.sid']){ 
            res.clearCookie('connect.sid', {path: '/'})
        }else{
            res.clearCookie('refreshToken', {path: '/refresh_token'})
        }
        
    
        res.json(true) //If success send true otherwise send error
    }catch (err){
        res.json({
            error: 'LOGOUT FAILED',
            message: err.message
        })
    }
})

//Refresh token when login via email
router.post('/refresh_token', async(req, res) => {
  try {
    const token = req.cookies.refreshToken //get token from cookies

    if(!token){ // if not token return null
    
       return res.json(null)
    }
    let info = null 

    try{ 
        info = verify(token, process.env.REFRESH_TOKEN_SECRET) // get user info from token
    } catch (err){
        
        return res.json(null)
    }

    if(!info){
        
        return res.json(null)
    }

    const user = await db.find(info.userId, 1) //Find user by it's id from user info
    if(!user[0]){
        
        return res.json(null)
    }

    if(user[0].refreshToken !== token){ //Compare user's refresh token and token from cookies
        
        return res.json(null)
    }

    //Create new tokens and send these to client
    const accessToken = createAccessToken(user[0].id)
    const refreshToken = createRefreshToken(user[0].id)
    // save refreshToken in db
    user[0].refreshToken = refreshToken
    const result = await db.put(user[0], 1)
    if(!result){ // if saving failed
        
        return res.json({
            error: 'LOGIN FAILED',
            message: 'Login action failed, try it again'
        })
    }
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        path: '/refresh_token'   
    })       
    user[0].refreshToken = true
    res.json({
        accessToken: accessToken,
        user: user[0]
    })
           

  }catch (err) {
    
      res.json({
          error: 'SERVER ERROR',
          message: err.message
      })
  }
})

module.exports = router;