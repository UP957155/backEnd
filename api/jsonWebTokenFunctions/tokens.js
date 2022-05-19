//Get dependencies
const {sign} = require('jsonwebtoken');

//Create refresh token
const createRefreshToken = userId => {
    return sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d',
      })
}

//Create access token
const createAccessToken = userId => {
    return sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '12h',
      })
}

module.exports = {
    createAccessToken,
    createRefreshToken
}