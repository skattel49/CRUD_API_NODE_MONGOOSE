const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    body:{
        type: String,
        required: true
    },
    checked:{
        type: Boolean,
        required: true,
        default: false
    }
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
    items: [ItemSchema]
});


const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    lists: [ListSchema]
});


module.exports = User = mongoose.model('users', UserSchema);