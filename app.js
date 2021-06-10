require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const {User, Item, List} = require('./models/users');
const createToken = require('./authentication/authentication');

const app = express();

const port = process.env.PORT || 3005;

mongoose.connect(process.env.MONGO_URI, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true})
.then(()=>{
    console.log("connected to the database");
    app.listen(port, ()=>{
        console.log(`Up and running on port ${port}`)
    });
}).catch(err=>{
    console.log(err);
});

app.use(cookieParser());
app.use(cors());
app.use(express.json());

//for all get requests check if they are authorized
const authMiddleware = (req, res, next)=>{
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
        res.end('Unauthorized Access');
    }
};
//default route
app.route('/').all(authMiddleware).get((req, res)=>{
    User.find().then((data)=>{
        res.json(data);
    }).catch((err)=>{console.log(err)});
});
//signup route
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
    }).catch((err)=>{console.log(err)});
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
})

//logout
app.route('/logout').all(authMiddleware).get((req, res)=>{
    console.log("Cleared cookie");
    res.cookie('jwt', '', {
        maxAge: 1
    })
    res.json({"token": null});
});

//CRUD TODO Lists
app.route('/lists/:id?').all(authMiddleware)
    .get((req, res)=>{
        List.findOne({_id: id}).then((data)=>{
            if(data == null){
                res.json({"error": "List not found"});
            }
            res.json(data);
        }).catch((err)=>{console.log(err)});
    })
    .post((req, res)=>{
        const newLst = new List(req.body);
        newLst.save().then((data)=>{
            res.status(201).json(data);
        }).catch((err)=>{
            console.error(err);
            res.json({err});
        });
    })
    .patch((req, res)=>{
        List.findOneAndUpdate({_id:req.body.id}, req.body, {new: true})
        .then((data=>{
            res.json(data);
        })).catch((err)=>{console.log(err)});
    })
    .delete((req, res)=>{
        List.findOneAndDelete({_id: req.body.id})
        .then((data)=>{
            res.json(data);
        }).catch((err)=>{console.log(err)});
    });

//CRUD TODO Items
app.route('/items/:id?').all(authMiddleware)
    .get((req, res)=>{
        Item.findOne({_id: id}).then((data)=>{
            if(data == null){
                res.json({"error": "Item not found"});
            }
            res.json(data);
        }).catch((err)=>{console.log(err)});
    })
    .post((req, res)=>{
        const newItem = new Item(req.body);
        newItem.save().then((data)=>{
            res.status(201).json(data);
        }).catch((err)=>{
            console.error(err);
            res.json({err});
        });
    })
    .patch((req, res)=>{
        Item.findOneAndUpdate({_id:req.body.id}, req.body, {new: true})
        .then((data=>{
            res.json(data);
        })).catch((err)=>{console.log(err)});
    })
    .delete((req, res)=>{
        Item.findOneAndDelete({_id: req.body.id})
        .then((data)=>{
            res.json(data);
        }).catch((err)=>{console.log(err)});
    });