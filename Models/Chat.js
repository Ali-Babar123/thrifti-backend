const mongoose = require("mongoose")

/** Chat schema */
const chatSchema = new mongoose.Schema({
    members : [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        }
    ],
    lastMessage : {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Message"
    }
},{timestamps:true});

/** Chat model */
module.exports = mongoose.model("Chat",chatSchema);;