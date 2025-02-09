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
    list_items:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'items'
    }]
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
    user_lists: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "lists"
        }
    ]
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
/* 
    This is for a query(ie no need to fetch the document first and then delete it)

*/
ListSchema.pre('deleteOne', {document:true, query: false},function (req, res, next) {
    //fetch all the id's of the list_items and join them _id1|_id2 in a string
    //const all_items = this.getQuery()['list_items'];
    console.log("this is pre----------");
    console.log(this.list_items);

    this.model("items").deleteMany(
            {
                _id: 
                {
                    //turn the string into regex
                    //$regex : new RegExp(all_items)
                    $in: this.list_items
                }
            })
    .then((res)=>{
        console.log(res);
        next();
    })
    .catch(err => console.error(err));
});

module.exports = {
    User: mongoose.model('users', UserSchema),
    List: mongoose.model('lists', ListSchema),
    Item: mongoose.model('items', ItemSchema),
}