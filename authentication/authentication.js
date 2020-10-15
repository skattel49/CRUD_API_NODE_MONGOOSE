const jwt = require("jsonwebtoken");

function createToken(id){
    return jwt.sign({id}, process.env.JWT_SECRET);
}

module.exports = createToken;