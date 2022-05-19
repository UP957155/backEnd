//Get dependencies
const { verify } = require('jsonwebtoken');

//Function to authenticate access token
const auth = req => {
  const authorization = req.headers['authorization'] //Get token from req headers
  if (!authorization) throw new Error('You need to login.')
  const token = authorization.split(' ')[1] //Get token from req headers
  const { userId } = verify(token, process.env.ACCESS_TOKEN_SECRET) //verify token
  return userId
}

module.exports = {
  auth,
}