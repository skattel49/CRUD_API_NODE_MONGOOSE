require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/users');
const createToken = require('./authentication/authentication');

const app = express();

const port = process.env.PORT || 3005;

mongoose.connect(process.env.MONGO_URI, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true})
.then(()=>{
    console.log("connected to the database");
    app.listen(port, ()=>{
        console.log(`Up and running on port ${port}`)
    });
});

app.use(cookieParser());
app.use(cors());
app.use(express.json());
//for all get requests check if they are authorized
app.get('*', (req, res, next)=>{
    const token = req.cookies.jwt;
    if(token){
        jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken)=>{
            if(err){
                res.end('Error verifying token');
            }
            else{
                next();
            }
        });
    }
    else{
        res.end('No token');
    }
});

app.route('/').get((req, res)=>{
    User.find(null).then((data)=>{
        res.json(data);
    });
});

app.route('/signup').post((req, res)=>{
    const username = req.body.username;
    //find a user if there is one in the database
    User.findOne({username}).then((data)=>{
        if(data!==null){
            res.json({"error": "username already taken"});
        }
        else{
            const newUser = new User(req.body);
            newUser.save().then((user)=>{
                const token = createToken(user._id);
                res.cookie("jwt", token);
                res.json({token});
            });
        }
    });
});

//login route
app.route('/login').post((req, res)=>{
    User.login(req.body).then((data)=>{

        const token = createToken(data._id);
        res.cookie("jwt", token);
        res.json({token});

    }).catch((err)=>{

        console.log(err);
        res.json({err});

    });
});

//logout
app.route('/logout').get((req, res)=>{
    console.log("Cleared cookie");
    res.cookie('jwt', '', {
        maxAge: 1
    })
    res.json({"token": null});
});