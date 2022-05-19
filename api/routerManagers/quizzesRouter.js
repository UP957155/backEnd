"use strict"
//Get dependencies
const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const { auth } = require('../jsonWebTokenFunctions/auth');
const db = require('../datastore/db-datastore');
require('dotenv').config();
const cors = require('cors');

router.use(cookieParser())
router.use(express.json())
router.use(express.urlencoded({extends: false}))


//Create new quiz
router.post('/createQuiz', async(req, res) => {
    try {
      let userID = null
      //Get user from cookies or request
      if(req.cookies['connect.sid']){
          userID = req.user.id
      }else{
          try{
              userID = auth(req)
          }catch(err){
              return res.json({
                  error: 'NOT ANY USER',
                  message: 'User was not found'
              })
          }
      }
  
      const { quiz } = req.body //Get quiz object from request
      const quizzes = await db.list(2) //Get list of quizzes
      
      if(!quizzes){
          return res.json({
              error: 'QUIZ NOT CREATED',
              message: 'Quiz was not created, try it again later'
          })
      }
  
      //Add next quiz properties and save quiz
      quiz.id = (quizzes.length > 0) ? quizzes[quizzes.length - 1].id + 1 : 0,
      quiz.name = 'Quiz default name ...'
      quiz.description = ''
      quiz.topic = 0
      quiz.author = userID
      quiz.status = 'default'
      quiz.difficulty = null
      quiz.questionIDs = []
      quiz.date = Date.now()
      const data = await db.put(quiz, 2)
      if(!data){
          return res.json({
              error: 'QUIZ NOT CREATED',
              message: 'Quiz was not created, try it again later'
          })
      }
      res.json(quiz.id)
  
      } catch (err) {
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
      }
  
  })
  
//Get user quizzes
router.post('/userQuizzes', async(req, res) => {
      try {
          let userID = null
      //Get user from cookies or request
      if(req.cookies['connect.sid']){
          userID = req.user.id
      }else{
          try{
              userID = auth(req)
          }catch(err){
              
              return res.json({
                  error: 'NOT ANY USER',
                  message: 'User was not found'
              })
          }
      }
  
      const quizzes = await db.get({property: 'author', value: userID}, 2) //Find quizzes that user created
      if(!quizzes){
          return res.json({
              error: 'DATABASE ERROR',
              message: 'Not possible to get user quizzes, try again later'
          })
      }
      
      res.json(quizzes.sort((a, b) => b.date - a.date)) //Send quizzes
  
      } catch (err) {
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
      }
})
  
//Delete quiz
router.delete('/deleteQuiz', async(req, res) => {
      try{
          
          let userID = null
          const { id } = req.body //Get quiz id from request
          //Get user from cookies or request
          if(req.cookies['connect.sid']){
              userID = req.user.id
          }else{
              try{
                  userID = auth(req)
              }catch(err){
                  return res.json({
                      error: 'NOT ANY USER',
                      message: 'User was not found'
                  })
              }
          }
  
          //Confirm that user is quiz author
          const quizObject = await db.find(id, 2) //Find quiz
          if(!quizObject || !quizObject[0]){
              return res.json({
                  error: 'NOT QUIZ',
                  message: 'Quiz does not exist'
              })
          }else if(quizObject[0].author !== userID){
              return res.json({
                  error: 'NOT Access',
                  message: 'User is not author of the quiz'
              })
          }
          //Get quiz questions
          const quizQuestions = await db.get({property: 'quiz', value: quizObject[0].id}, 3)
          if(!quizQuestions){
              return res.json({
                  error: 'PROCESS FAILED',
                  message: 'Quiz was not deleted, try it again later'
              })
          }
          //Delete all questions
          let boolean = true
          quizQuestions.forEach(async(q) => {
              const result = await db.delete(q.id, 3)
              if(!result){
                  boolean = boolean && result
              }
          })
          //If deleting fail
          if(!boolean){
              return res.json({
                  error: 'PROCESS FAILED',
                  message: 'Quiz was not deleted, try it again later'
              })
          }
  
          const result = await db.delete(id, 2) //Delete quiz from DB
          if(!result){
              return res.json({
                  error: 'PROCESS FAILED',
                  message: 'Quiz was not deleted, try it again later'
              })
          }
  
          res.json(true)
  
      }catch(err){
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
      }
})
  
//Get quiz details
router.post('/quizDetails', async(req, res) => {
      try {
  
          let userID = null
          let isAdmin = false
          const { id } = req.body //Get id from request
          //Get user from cookies or request
          if(req.cookies['connect.sid']){
              userID = req.user.id
          }else{
              try{
                  userID = auth(req)
              }catch(err){
                  return res.json({
                      error: 'NOT ANY USER',
                      message: 'User was not found'
                  })
              }
          }
  
          //Confirm that user is quiz author and is admin
          const user = await db.find(userID, 1)
          if(user){
              isAdmin = (user[0]) ? user[0].admin === true : false
          }
          const quizObject = await db.find(id, 2) //Find quiz
          if(!quizObject || !quizObject[0]){
              return res.json({
                  error: 'NOT QUIZ',
                  message: 'Quiz does not exist'
              })
          }else if(quizObject[0].author !== userID && !isAdmin){
              return res.json({
                  error: 'NOT Access',
                  message: 'User is not author/admin of the quiz'
              })
          }
  
          res.json(quizObject[0]) //Send quiz object
  
      } catch (err) {
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
      }
})
  
//Edit quiz
router.put('/editQuiz', async(req, res) => {
      try {
  
          let userID = null
          const { quiz } = req.body //Get quiz from request
          //Get user from cookies or request
          if(req.cookies['connect.sid']){
              userID = req.user.id
          }else{
              try{
                  userID = auth(req)
              }catch(err){
                  return res.json({
                      error: 'NOT ANY USER',
                      message: 'User was not found'
                  })
              }
          }
  
          //Confirm that user is quiz author
          const quizObject = await db.find(quiz.id, 2) //Find quiz
          if(!quizObject || !quizObject[0]){
              return res.json({
                  error: 'NOT QUIZ',
                  message: 'Quiz does not exist'
              })
          }else if(quizObject[0].author !== userID){
              return res.json({
                  error: 'NOT Access',
                  message: 'User is not author of the quiz'
              })
          }
  
          //Edit quiz and save in DB
          quizObject[0].name = quiz.name
          quizObject[0].description = quiz.description
          quizObject[0].topic = quiz.topic
          quizObject[0].status = 'waiting'
          quizObject[0].date = Date.now()
   
          const data = await db.put(quizObject[0], 2)
          if(!data){
              return res.json({
                  error: 'NOT EDITED',
                  message: 'Quiz was not edited, try again later'
              })
          }
  
          res.json(true) 
  
      } catch (err) {
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
      }
})
  
//Create question
router.post('/createQuestion', async(req, res) => {
      try {
          let userID = null
      //Get user from cookies or request 
      if(req.cookies['connect.sid']){
          userID = req.user.id
      }else{
          try{
              userID = auth(req)
          }catch(err){
              
              return res.json({
                  error: 'NOT ANY USER',
                  message: 'User was not found'
              })
          }
      }
  
      const { question, quizID } = req.body //Get question from request
      const questions = await db.list(3) //Get all questions
      if(!questions){
          return res.json({
              error: 'NOT CREATED',
              message: 'Question was not created, try again later'
          })
      }

      //Confirm that user is quiz author
      const quizObject = await db.find(quizID, 2) //Find quiz
      if(!quizObject || !quizObject[0]){
          return res.json({
              error: 'NOT QUIZ',
              message: 'Quiz does not exist'
          })
      }else if(quizObject[0].author !== userID){
          return res.json({
              error: 'NOT Access',
              message: 'User is not author of the quiz'
          })
      }

      //Check if max number of questions is not exceed
      if(quizObject[0].questionIDs.length >= 25){
          return res.json({
              error: 'TOO MANY QUESTIONS',
              message: 'Max number of questions for one quiz game is 25!'
          })
      }
  
      //Add next properties to question
      question.id = (questions.length > 0) ? questions[questions.length - 1].id + 1 : 0,
      question.author = userID
      question.quiz = quizID
      // save question to db
      const data = await db.put(question, 3)
      if(!data){
          return res.json({
              error: 'NOT CREATED',
              message: 'Question was not created, try again later'
          })
      }
      
      //Add question id to the quiz game
      quizObject[0].questionIDs.push(question.id)
      //Change quiz game status
      quizObject[0].status = 'waiting'
      const result = await db.put(quizObject[0], 2)
          if(!result){
              return res.json({
                  error: 'NOT CREATED',
                  message: 'Question was not created, try again later'
              })
          }
  
      res.json(question.id) //Send question id
  
      } catch (err) {
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
      }
})
  
//Get questions for given quiz
router.post('/quizQuestions', async(req, res) => {
      try {
          let userID = null
          let isAdmin = false
          const { quizID } = req.body
      //Get user from cookies or request 
      if(req.cookies['connect.sid']){
          userID = req.user.id
      }else{
          try{
              userID = auth(req)
          }catch(err){
              
              return res.json({
                  error: 'NOT ANY USER',
                  message: 'User was not found'
              })
          }
      }
  
      let quizQuestions = await db.get({property: 'quiz', value: quizID}, 3) //Get only questions from given quiz
      if(!quizQuestions){
          return res.json({
              error: 'NOT ANY QUESTIONS',
              message: 'Questions could not be found, try again later'
          })
      }

      const user = await db.find(userID, 1)
      
      if(user){
            isAdmin = (user[0]) ? user[0].admin === true : false
      }

      if(!isAdmin){ // User has to be admin or author to have access to questions
          quizQuestions = quizQuestions.filter(q => q.author === userID) //Only question that user created
      }

      //Sort questions by id
      quizQuestions = quizQuestions.sort((a, b) => parseInt(a.id) - parseInt(b.id))
  
      res.json(quizQuestions) //Send questions
  
      } catch (err) {
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
      }
  })
  
//Get question details
router.post('/questionDetails', async(req, res) => {
      try {
  
          let userID = null
          let isAdmin = false
          const { id } = req.body
          //Get user from cookies or request
          if(req.cookies['connect.sid']){
              userID = req.user.id
          }else{
              try{
                  userID = auth(req)
              }catch(err){
                  return res.json({
                      error: 'NOT ANY USER',
                      message: 'User was not found'
                  })
              }
          }
  
          //Confirm that user is quiz author or admin
          const user = await db.find(userID, 1)
          if(user){
            isAdmin = (user[0]) ? user[0].admin === true : false
          }
          const questionObject = await db.find(id, 3) //Find quiz
          if(!questionObject || !questionObject[0]){
              return res.json({
                  error: 'NOT QUESTION',
                  message: 'Question does not exist'
              })
          }else if(questionObject[0].author !== userID && !isAdmin){
              return res.json({
                  error: 'NOT Access',
                  message: 'User is not author of the question'
              })
          }
  
          res.json(questionObject[0]) //Send question object
  
      } catch (err) {
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
      }
})
  
router.put('/editQuestion', async(req, res) => {
      try {
  
          let userID = null
          const { question } = req.body
  
          //Get user from cookies or request
          if(req.cookies['connect.sid']){
              userID = req.user.id
          }else{
              try{
                  userID = auth(req)
              }catch(err){
                  return res.json({
                      error: 'NOT ANY USER',
                      message: 'User was not found'
                  })
              }
          }
  
          //Confirm that user is question author
          const questionObject = await db.find(question.id, 3) //Find question
          if(!questionObject || !questionObject[0]){
              return res.json({
                  error: 'NOT QUESTION',
                  message: 'Question does not exist'
              })
          }else if(questionObject[0].author !== userID){
              return res.json({
                  error: 'NOT Access',
                  message: 'User is not author of the quiz'
              })
          }
  
          //Edit question
          questionObject[0].question = question.question
          questionObject[0].imgURL = question.imgURL
          questionObject[0].type = question.type
          questionObject[0].answers = question.answers
          questionObject[0].correctAnswers = question.correctAnswers
          questionObject[0].time = question.time
          questionObject[0].points = question.points
          questionObject[0].firstHint = question.firstHint
          questionObject[0].secondHint = question.secondHint
  
          //Change quiz status, because was edited
          const quizObject = await db.find(questionObject[0].quiz, 2)
          if(!quizObject[0]){
              return res.json({
                  error: 'NOT EDITED',
                  message: 'Question can not be edited'
              })
          }
  
          quizObject[0].status = 'waiting'
          const data = await db.put(quizObject[0], 2)
          if(!data){
              return res.json({
                  error: 'NOT EDITED',
                  message: 'Question can not be edited'
              })
          }
          //Save question changes
          const result = await db.put(questionObject[0], 3)
          if(!result){
              return res.json({
                  error: 'NOT EDITED',
                  message: 'Question can not be edited'
              })
          }
  
          res.json(true)
  
      } catch (err) {
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
          
      }
})
  
//Delete question
router.delete('/deleteQuestion', async(req, res) => {
      try{
  
          let userID = null
          const { id } = req.body
  
          //Get user from cookies or request
          if(req.cookies['connect.sid']){
              userID = req.user.id
          }else{
              try{
                  userID = auth(req)
              }catch(err){
                  return res.json({
                      error: 'NOT ANY USER',
                      message: 'User was not found'
                  })
              }
          }
  
          //Confirm that user is question author
          const questionObject = await db.find(id, 3) //Find question
          if(!questionObject || !questionObject[0]){
              return res.json({
                  error: 'NOT QUESTION',
                  message: 'Question does not exist'
              })
          }else if(questionObject[0].author !== userID){
              return res.json({
                  error: 'NOT Access',
                  message: 'User is not author of the quiz'
              })
          }

          //Change quiz status, because was edited
          const quizObject = await db.find(questionObject[0].quiz, 2)
          if(!quizObject[0]){
              return res.json({
                  error: 'PROCESS FAILED',
                  message: 'Question was not deleted, try it again later'
              })
          }
          //Drop question id from quiz
          quizObject[0].questionIDs = quizObject[0].questionIDs.filter(qId => qId !== id)
          quizObject[0].status = 'waiting'
          const data = await db.put(quizObject[0], 2)
          if(!data){
              return res.json({
                  error: 'NOT EDITED',
                  message: 'Question can not be deleted'
              })
          }
  
          const result = await db.delete(id, 3) //Delete question from DB
          if(!result){
              return res.json({
                  error: 'PROCESS FAILED',
                  message: 'Question was not deleted, try it again later'
              })
          }
  
          res.json(true)
  
      }catch(err){
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
      }
})
  
//Get quizzes for admin
router.post('/adminQuizzes', async(req, res) => {
      try {
  
          let userID = null
          const { status } = req.body //Get data from request
  
          //Get user from cookies or request
          if(req.cookies['connect.sid']){
              userID = req.user.id
          }else{
              try{
                  userID = auth(req)
              }catch(err){
                  return res.json({
                      error: 'NOT ANY USER',
                      message: 'User was not found'
                  })
              }
          }
  
          //Get correct quizzes by status
          const rightQuizzes = await db.get({property: 'status', value: status}, 2) 
          if(!rightQuizzes){
              return res.json({
                  error: 'NOT ANY QUESTIONS',
                  message: 'Questions could not be found, try again later'
              })
          }

          // Confirm that user is admin
          const user = await db.find(userID, 1)
          if(!user || !user[0]){
              return res.json({
                  error: 'NOT USER',
                  message: 'Not user was found'
              })
          }else if(!user[0].admin){
              return res.json({
                  error: 'NOT ACCESS',
                  message: 'User is not admin'
              }) 
          }
  
          //Order quizzes by date
          const orderedRightQuizzes = rightQuizzes.sort((a,b) => b.date - a.date)
          // if rejected or approved then show last 10 quizzes
          if(status === 'rejected' || status === 'approved'){
              const finalQuizzes = orderedRightQuizzes.filter((q, index) => index < 11)
              return res.json(finalQuizzes)
          }
          
          res.json(rightQuizzes) //Send quizzes
  
      } catch (err) {
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
      }
})
  
//Change quiz status
router.post('/changeStatus', async(req, res) => {
  
      try {
  
      let userID = null
      let isAdmin = false
      const { id, status, difficulty } = req.body //Get data from request
  
       //Get user from cookies or request
       if(req.cookies['connect.sid']){
          userID = req.user.id
      }else{
          try{
              userID = auth(req)
          }catch(err){
              return res.json({
                  error: 'NOT ANY USER',
                  message: 'User was not found'
              })
          }
      }
  
      //Confirm that user is admin or author of the quiz
      const user = await db.find(userID, 1)
          if(user){
            isAdmin = (user[0]) ? user[0].admin === true : false
          }
  
      //Confirm that user is admin or author of the quiz
      const quizObject = await db.find(id, 2) //Find quiz
      if(!quizObject || !quizObject[0]){
          return res.json({
              error: 'NOT QUIZ',
              message: 'Quiz does not exist'
          })
      }else if(quizObject[0].author !== userID && !isAdmin){
          return res.json({
              error: 'NOT Access',
              message: 'User is not author of the quiz'
          })
      }
          
      //Change quiz status
      if(quizObject[0].id === id && status === 'approved'){
            quizObject[0].difficulty = difficulty
            quizObject[0].status = status
            quizObject[0].date = Date.now()
      }else if(quizObject[0].id === id && status === 'rejected'){
            quizObject[0].status = status
            quizObject[0].date = Date.now()
      }else if(quizObject[0].id === id && status === 'checking'){
            quizObject[0].status = status
            quizObject[0].date = Date.now()
      }
  
      const result = await db.put(quizObject[0], 2)
      if(!result){
          return res.json({
              error: 'NO CHANGES',
              message: 'Quiz status was not changed'
          })
      }
  
      res.json(true)
  
      }catch (err) {
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
      }
  
      
})
  
router.post('/discoverQuizzes', async(req, res) => {
      try {
  
          const { difficulty, topic, name, id } = req.body // get filter data from request
  
          let filteredQuizzes = await db.get({property: 'status', value: 'approved'}, 2) // get list of approved quizzes
          if(!filteredQuizzes){
              return res.json({
                  error: 'NOT ANY QUIZZES',
                  message: 'Quizzes could not be found'
              })
          }
  
          if(difficulty !== 0){ // if has to be filtered by difficulty
              filteredQuizzes = filteredQuizzes.filter(q => parseFloat(q.difficulty) === difficulty)
          }
  
          if(topic !== -1){ // if has to be filtered by topic
              filteredQuizzes = filteredQuizzes.filter(q => parseFloat(q.topic) === topic)
          }
  
          if(name !== ''){ // if has to be filtered by name
              filteredQuizzes = filteredQuizzes.filter(q => q.name.toUpperCase().includes(name.toUpperCase()))
          }
  
          if(id){ // if has to be filtered by id
              filteredQuizzes = filteredQuizzes.filter(q => JSON.stringify(q.id).includes(JSON.stringify(id)))
          }
  
          res.json(filteredQuizzes)
          
      } catch (err) {
          res.json({
              error: 'SERVER ERROR',
              message: err.message
          })
      }
})

// Communication with bot
// Get quiz by id
router.post('/bot/getQuiz', cors(), async(req, res) => {
      try{
          const { quizID } = req.body
  
          let quiz = await db.find(quizID, 2)
          if(!quiz){
            return res.json({
                error: 'LOST CONNECTION',
                message: 'Lost connection with datastore!!'
            })
          }
          quiz = quiz.filter(q => q.status === 'approved')

          res.json(quiz)
  
      }catch(err){
          
          res.json({
            error: 'SERVER ERROR',
            message: err.message
        })
      }
})

// Get question by id
router.post('/bot/getQuestion', cors(), async(req, res) => {
    try{
        const { questionID } = req.body
        //Find question
        const question = await db.find(questionID, 3)
        if(!question){
          return res.json({
              error: 'LOST CONNECTION',
              message: 'Lost connection with datastore!!'
          })
        }
        //Check if the quiz game is still approved
        const quizObject = await db.find(question[0].quiz, 2)
        if(!quizObject){
            return res.json({
                error: 'LOST CONNECTION',
                message: 'Lost connection with datastore!!'
            })
        }

        if(quizObject[0].status !== 'approved'){
            return res.json({
                error: 'NOT APPROVED',
                message: `Quiz[${quizObject[0].id}] is not longer approved!!!`
            })
        }

        res.json(question)

    }catch(err){
        
        res.json({
            error: 'SERVER ERROR',
            message: err.message
        })
    }
})

module.exports = router;