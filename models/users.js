const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = require('mongoose');

const ItemSchema = new mongoose.Schema({
    body:{
        type: String,
        required: true
    },
    checked:{
        type: Boolean,
        required: true,
        default: false
    },
});


const ListSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    checked: {
        type: Boolean,
        required: true,
        default: false
    },
    items:{
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'items'
    }
});

//unique did not work for me
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "Password too short"]
    },
    lists: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "lists"
    }
});

UserSchema.pre('save', async function(req, res, next){
    const salt = await bcrypt.genSalt();
    const pwd = this.password;
    this.password = await bcrypt.hash(pwd, salt);
    next();
});


UserSchema.statics.login = async function ({username, password}){
    const user = await this.findOne({username});

    if(user){
        const auth = await bcrypt.compare(password, user.password);
        if(auth){
            return user;
        }
        else{
            throw Error("Incorrect password");
        }
    }
    else{
        throw Error("User not found");
    }
}

module.exports = {
    User: mongoose.model('users', UserSchema),
    List: mongoose.model('lists', ListSchema),
    Item: mongoose.model('items', ItemSchema),
}