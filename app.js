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
app.use(cors({
    "origin": "http://localhost:2001",
    credentials: true
}));
app.use(express.json());

//for all get requests check if they are authorized
const authMiddleware = (req, res, next)=>{
    //splits bearer token_value from authorization header and gets token_value
    let token = req.headers.authorization.split(" ")[1];
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
    console.log("login route");
    console.log(req.body);
    User.login(req.body).then((data)=>{
        const token = createToken(data._id);
        res.cookie("jwt", token);
        res.json({token});
    }).catch((err)=>{
        console.log(err);
        res.json({"err":"Invalid username/password"});
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
        //if parameter is not specified send all lists
        if(!req.params.id){
            User.find({"username": req.query.username}, ["user_lists"])
            .populate("user_lists")
            .then(data => {
                console.log(data);
                res.json(data);
            }).catch(err=>console.error(err));
        }
        else{
            List.findOne({_id: req.params.id}).then((data)=>{
                if(!data){
                    res.json({"error": "List not found"});
                }
                res.json(data);
            }).catch((err)=>{
                console.log(err)
                res.json(err);
                console.log("haha");
            });
        }
    })
    .post((req, res)=>{
        const newLst = new List({
            title: req.body.title
        });
        newLst.save().then((list_data)=>{
            /* after the creation of the list
               update the user's array of lists
            */
            User.findOneAndUpdate({"username": req.body.username},
            {
                "$push": {
                    "user_lists": list_data._id
                }
            },
            {
                new: true
            })
            .then( user_data => {
                console.log(user_data);
                res.status(201).json(list_data);
            })
            .catch(err => {
                console.error(err);
                res.json({err});
            })
        })
        .catch((err)=>{
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
        if(!req.params.id){
            List.findOne({_id: req.query.id}, ["list_items"])
            .populate("list_items")
            .then( list_data => {
                res.json(list_data);
            }).catch(err => console.error(err));
        }
        else{
            Item.findOne({_id: id}).then((data)=>{
                if(data == null){
                    res.json({"error": "Item not found"});
                }
                res.json(data);
            }).catch((err)=>{console.log(err)});
        }
    })
    .post((req, res)=>{
        const newItem = new Item({body: req.body.body});
        newItem.save().then((item_data)=>{
            List.findOneAndUpdate({_id: req.body.id}, {
                $push: {
                    "list_items": item_data._id
                }
            },
            {
                new: true
            }).then(list_data => {
                console.log(list_data);
                res.status(201).json(item_data);
            }).catch(err => {
                console.error(err);
                res.json(err);
            });
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