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

//To save players' score after question
router.post('/bot/leaderBoards', cors(), async(req, res) => {
    try {
        //Get data from request
        const { scoreTable, quiz } = req.body
        //Get leaderBoard by given quiz topic
        const topicTable = await db.get({property: 'topic', value: parseInt(quiz.topic)}, 4)
        //If error when saving then send false response
        if(!topicTable){
            return res.json({
                error: 'NO ACCESS TO DATABASE',
                message: 'Connection with database has been lost and score of the players was not saved!'
            })
        }

        //Filter data from array by server
        const serverAndTopicTable = topicTable.filter(obj => obj.server === quiz.server)

        //Otherwise assign points to players in the topic table
        //Set resulted boolean for saving
        let savingSuccessful = true
        //Save every player to the table
        scoreTable.forEach(async(player) => {
            //Find if player is already inside the serverAndTopicTable array
            const prevPlayer = serverAndTopicTable.find(prevPlayer => prevPlayer.userId === player.id)
            //If player is not inside the array
            if(!prevPlayer){
                const result = await db.put({
                    id: quiz.topic + player.id + quiz.server,
                    userId: player.id,
                    username: player.username,
                    points: player.points * parseInt(quiz.difficulty), //Points multiplied by quiz difficulty
                    topic: parseInt(quiz.topic),
                    server: quiz.server
                }, 4)

                savingSuccessful = savingSuccessful && (result) ? true : false //Compute final boolean

            }else{ //If player is already inside

                const result = await db.put({
                    id: quiz.topic + player.id + quiz.server,
                    userId: player.id,
                    username: player.username,
                    points: prevPlayer.points + (player.points * parseInt(quiz.difficulty)), //Points multiplied by quiz difficulty
                    topic: parseInt(quiz.topic),
                    server: quiz.server
                }, 4)

                savingSuccessful = savingSuccessful && (result) ? true : false //Compute final boolean

            }
        })

        //If saving not successful
        if(!savingSuccessful){
            return res.json({
                error: 'SCORE NOT SAVED',
                message: 'Score of the players was not saved correctly'
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

//To send to the bot the leaderBoard of the server
router.post('/bot/serverLeaderBoard', cors(), async(req, res) => {
    try {
        
        const { serverMembers, server } = req.body //get data from request body
        //Get leaderBoard by given server
        const serverTable = await db.get({property: 'server', value: server}, 4)

        if(!serverTable){
            return res.json({
                error: 'NOT ANY LEADERS',
                message: 'Leaders could not be found'
            })
        }

        //If no records from server
        if(serverTable.length === 0){
            return res.json([])
        }

        //final array to send
        let completeLeaderBoard = []
        //loop to work with data
        serverMembers.forEach(member => {
            //Find all records that are assigned with member id
            let allMemberRecords = serverTable.filter(obj => obj.userId === member)
            //Sum the member points and push to final array
            completeLeaderBoard.push({
                id: allMemberRecords[0].userId,
                username: allMemberRecords[0].username,
                points: (allMemberRecords.length > 1) ? allMemberRecords.map((prev, index) => prev.points).reduce((prev, curr) => prev + curr) : allMemberRecords[0].points
            })

        })
        //Sort players by points
        completeLeaderBoard = completeLeaderBoard.sort((a, b) => b.points - a.points)

        //Send data to the bot
        res.json(completeLeaderBoard)

    } catch (err) {
        
        res.json({
            error: 'SERVER ERROR',
            message: err.message
        })
    }
})

//To send leaderBoards to leaderBoard section
router.post('/getLeaderBoard', async(req, res) => {
    try {

        const { topic, username } = req.body // get filter data from request

        let allLeaderBoardsData = await db.list(4) // get all data from leaderBoard kind in database

        if(!allLeaderBoardsData){
            return res.json({
                error: 'NOT ANY LEADERS',
                message: 'Leaders could not be found'
            })
        }

        if(topic !== -1){ // if has to be filtered by topic
            allLeaderBoardsData = allLeaderBoardsData.filter(object => parseInt(object.topic) === parseInt(topic))
        }

        if(username !== ''){ // if has to be filtered by name
            allLeaderBoardsData = allLeaderBoardsData.filter(object => object.username.toUpperCase().includes(username.toUpperCase()))
        }

        //Create completeLeaderBoard array
        let completeLeaderBoard = []
        //Loop to work with data
        allLeaderBoardsData.forEach(player => {
            //Find if player is already in completeLeaderBoard array
            let oldPlayer = completeLeaderBoard.find(obj => obj.id === player.userId)
            //if player is not in the array
            if(!oldPlayer){
                //Push new player into the array
                completeLeaderBoard.push({
                    id: player.userId,
                    username: player.username,
                    points: player.points
                })
            }else{ //If player is already in the array
                //Edit player in the array
                completeLeaderBoard = completeLeaderBoard.map((obj, index) => {
                    if(obj.id === player.userId){
                        obj.points = obj.points + player.points
                    }
                    return obj
                })
            }
        })
        //Sort players by points
        completeLeaderBoard = completeLeaderBoard.sort((a, b) => b.points - a.points)

        res.json(completeLeaderBoard)
        
    } catch (err) {
        
        res.json({
            error: 'SERVER ERROR',
            message: err.message
        })
    }
})


module.exports = router;