const mongoose = require("mongoose");


/** Message Schema */
const messageSchema = new mongoose.Schema({
    sender : {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    chatId : {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Chat",
        min:24,
        max:24,
        required:true,
    },
    content : {
        type:String,
    },
    seen : {
        type:String,
        enum:["SENT","DELIVIERD","SEEN"],
        default:"SENT"
    },
    status:{
        type:String,
        enum:["DELETED","DISABLED","ENABLED"],
        default:"ENABLED"
    }
},{timestamps:true});

/** Message Model */
const messageModel = mongoose.model("Message",messageSchema);
module.exports = messageModel;