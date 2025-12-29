const mongoose = require("mongoose");
const messageModel = require("../Models/Message.js");
const chatModel = require("../Models/Chat.js");

async function HandleSendMessage(req,res){
    try {
        // return console.log("requested")
        const {content,chatId} = req.body;
        let createdMessage = await messageModel.create({
        content,
        sender: req.user._id,
        chatId
        });

        createdMessage = createdMessage.toObject();

        createdMessage.sender = {
        _id: req.user._id,
        fullname: req.user.fullname,
        email: req.user.email,
        profileImage: req.user.profileImage
        };
        const socketService = global.server;
        
        socketService.to(chatId.toString()).emit("event:new-message",createdMessage);
        
        /** Update chat last message */
        const updateChat = await chatModel.findByIdAndUpdate(new mongoose.Types.ObjectId(createdMessage.chatId),{lastMessage:new mongoose.Types.ObjectId(createdMessage?._id)});
        return res.status(200).json({message:createdMessage});
    } catch (e) {
        console.log(e);
        return res.status(e?.status || 500).json({
            error:e,
            message:e?.message
        })
    }
}

async function HandleDeleteMessage(req,res){
    try {
        const {messageId} = req.body;
        /** Check message is exist in mongodb --> */
        const message = await messageModel.findById(new mongoose.Types.ObjectId(messageId));
        if(!message){
            return res.status(404).json({
                message:"Error: message not found.",
                statusCode:404
            })
        };
        /** if message is exit */
        await message.deleteOne();
        return res.status(200).json({
            message:"Success: message successfully deleted.",
            statusCode:200
        })
    } catch (error) {
        return res.status(error?.status || 500).json({
            error:e,
            message:e?.message
        })   
    }
}

async function HandleUpdateMessageSeenStatus(req,res){
    try {
        
        const {messageId,seen} = req.body;
        /** Note: check message is exist */
        const message = await messageModel.findById(new mongoose.Types.ObjectId(messageId));
        if(!message){
            return res.status(404).json({
                message:"Error: message not found.",
                statusCode:404
            })
        }
        /** if exist message update the message seen status */
        if(!["SENT","DELIVIERD","SEEN"].includes(seen)){
            return res.status(400).json({
                message:"Error: Invalid seen value does not matched."
            });
        }

        /** if all is ok assign the seen value */
        message.seen = seen;
        await message.save();
        return res.status(200).json({
            message:"Success: message successfully updated.",
            statusCode:200
        })
    } catch (error) {
        return res.status(error?.status || 500).json({
            error:e,
            message:e?.message
        })
    }
};

async function HandleGetChatMessages(req,res){
    try {
        const {chatId} = req.query;
        
        if(!chatId){
            return res.status(400).json({
                message:"Error: chatId field is missing.",
                statusCode:400
            })
        }
        const chat = await chatModel.findById(new mongoose.Types.ObjectId(chatId));
        if(!chat){
            return res.status(404).json({
                message:"Error: chat is not defind.",
                statusCode:404
            });
        }
        const [receiver] = chat.members.filter( (m) => m.toString() !== req.user._id.toString());
        
        const chatMessages = await messageModel.aggregate([
            {
                 
                $match: {
                    $expr: {
                        $or: [
                            // Normal messages (sender ↔ receiver)
                            {
                                $and: [
                                    { $eq: ["$sender", new mongoose.Types.ObjectId(req.user?._id)] },
                                    { $eq: ["$chatId", new mongoose.Types.ObjectId(chat?._id)] }
                                ]
                            },
                            {
                                $and: [
                                    { $eq: ["$sender", new mongoose.Types.ObjectId(receiver)] },
                                    { $eq: ["$chatId", new mongoose.Types.ObjectId(chat?._id)] }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $lookup : {
                    from:"users",
                    localField:"sender",
                    foreignField:"_id",
                    as:"sender"
                }
            },
            {
                $sort : {
                    createdAt:1
                }
            },
            {
                $unwind : "$sender"
            },
            {
                $project : {
                    _id:1,
                    chatId:1,
                    "sender._id":1,
                    "sender.fullname":1,
                    "sender.email":1,
                    "sender.profileImage":1,
                    content:1,
                    seen:1,
                    status:1,
                    createdAt:1,
                }
            }
        ]);
        
        return res.status(200).json({
            data:chatMessages,
            message:"Success: chat messages successfully fetched.",
            statusCode:200
        })
    } catch (e) {
        console.log(e)
        return res.status(e?.status || 500).json({
            error:e,
            message:e?.message
        })          
    }
}

module.exports = {
    HandleDeleteMessage,
    HandleSendMessage,
    HandleUpdateMessageSeenStatus,
    HandleGetChatMessages
}

