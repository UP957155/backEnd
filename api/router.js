"use strict"
//Get dependencies
const express = require('express');
const router = express.Router();
const authRouter = require('./routerManagers/authRouter');
const quizzesRouter = require('./routerManagers/quizzesRouter');
const leaderBoardsRouter = require('./routerManagers/leaderBoardsRouter')
const cors = require('cors');

//Set up cors policy
router.use(
  cors({
      origin: 'http://localhost:3000',
    credentials: true,
  }),
)
//Use given routers
router.use(authRouter)
router.use(quizzesRouter)
router.use(leaderBoardsRouter)

module.exports = router;