const { default: mongoose } = require("mongoose");
const chatModel = require("../Models/Chat.js");
const { onlineUsers } = require("../services/socket.services.js");


async function HandleCreateChat(req,res){
    const {userId} = req?.body;
    
    /** Check userId is Exist */
    if(!userId){
        return res.status(404).json({
            message:"Error: userId does not exist",
            statusCode:404
        })
    }

    const currentUserId = req.user._id;
    const otherUserId = new mongoose.Types.ObjectId(userId);

    // Don't allow creating chat with yourself
    if (currentUserId.toString() === userId) {
        return res.status(400).json({
            message:"Error: Cannot create chat with yourself",
            statusCode:400
        });
    }

    /** Check if chat room already exists between these two users */
    const existingChat = await chatModel.findOne({
        members: { $all: [currentUserId, otherUserId] },
        $expr: { $eq: [{ $size: "$members" }, 2] }
    });

    if(existingChat){
        // Return existing chat instead of error
        const chat = await chatModel.aggregate([
            { $match: { _id: existingChat._id } },
            {
                $lookup: {
                    from: "users",
                    let: { members: "$members" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$_id", "$$members"]
                                }
                            }
                        }
                    ],
                    as: "members"
                }
            },
            {
                $lookup: {
                    from: "messages",
                    localField: "lastMessage",
                    foreignField: "_id",
                    as: "lastMessage"
                }
            },
            {
                $addFields: {
                    member: {
                        $first: {
                            $filter: {
                                input: "$members",
                                as: "m",
                                cond: {
                                    $ne: ["$$m._id", currentUserId]
                                }
                            }
                        }
                    },
                    lastMessage: {
                        $first: "$lastMessage"
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    "member._id": 1,
                    "member.email": 1,
                    "member.fullname": 1,
                    "member.username": 1,
                    "member.profileImage": 1,
                    "member.lastSeen": 1,
                    "member.createdAt": 1,
                    lastMessage: 1,
                }
            }
        ]);

        // Add online status
        const chatWithStatus = chat.map(c => {
            if (c.member && c.member._id) {
                const memberId = c.member._id.toString();
                const isOnline = onlineUsers.has(memberId);
                const lastSeen = c.member.lastSeen ? new Date(c.member.lastSeen) : null;
                const now = new Date();
                const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
                const isRecentlyActive = lastSeen && lastSeen > fiveMinutesAgo;

                return {
                    ...c,
                    member: {
                        ...c.member,
                        isOnline: isOnline || isRecentlyActive,
                        lastSeen: c.member.lastSeen
                    }
                };
            }
            return c;
        });

        return res.status(200).json({
            data: chatWithStatus[0] || existingChat,
            message:"Success: Existing chat found.",
            statusCode:200,
            isExisting: true
        });
    }

    /** Creating new chat room */
    const newChatRoom = await chatModel.create({
        members:[currentUserId, otherUserId],
    });

    // Fetch the created chat with populated data
    const createdChat = await chatModel.aggregate([
        { $match: { _id: newChatRoom._id } },
        {
            $lookup: {
                from: "users",
                let: { members: "$members" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ["$_id", "$$members"]
                            }
                        }
                    }
                ],
                as: "members"
            }
        },
        {
            $addFields: {
                member: {
                    $first: {
                        $filter: {
                            input: "$members",
                            as: "m",
                            cond: {
                                $ne: ["$$m._id", currentUserId]
                            }
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                "member._id": 1,
                "member.email": 1,
                "member.fullname": 1,
                "member.username": 1,
                "member.profileImage": 1,
                "member.lastSeen": 1,
                "member.createdAt": 1,
                lastMessage: null,
            }
        }
    ]);

    // Add online status to created chat
    const chatWithStatus = createdChat.map(c => {
        if (c.member && c.member._id) {
            const memberId = c.member._id.toString();
            const isOnline = onlineUsers.has(memberId);
            const lastSeen = c.member.lastSeen ? new Date(c.member.lastSeen) : null;
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            const isRecentlyActive = lastSeen && lastSeen > fiveMinutesAgo;

            return {
                ...c,
                member: {
                    ...c.member,
                    isOnline: isOnline || isRecentlyActive,
                    lastSeen: c.member.lastSeen
                }
            };
        }
        return c;
    });

    return res.status(200).json({
        data: chatWithStatus[0] || newChatRoom,
        message:"Success: Chat created.",
        statusCode:200,
        isExisting: false
    });
}



async function HandleDeleteChat(req,res) {
    const {chatId} = req.params;
    if(!chatId){
        return res.status(404).json({
            messgae:"Error: chatId is missing",
            statusCode:404
        });
    }

    /** check chatroom is exist */
    const chatRoom = await chatModel.findById(new mongoose.Types.ObjectId(chatId));
    if(!chatRoom){
        return res.status(404).json({
            message:"Error: chat room is not defind.",
            statusCode:404
        })
    }

    await chatRoom.deleteOne();
    return res.status(200).json({
        message:"Success: Chat room is deleted.",
        statusCode:200
    });
}

async function HandleGetUserChats(req,res){
    
    const chats = await chatModel.aggregate([
        {
            $match : {
                $expr : {
                    $in : [new mongoose.Types.ObjectId(req.user._id),"$members"]
                }
            }
        },
        {
            $lookup : {
                from : "users",
                let:{members:"$members"},
                pipeline:[
                    {
                        $match : {
                            $expr : {
                                $in : ["$_id","$$members"]
                            }
                        }
                    }
                ],
                as:"members"
            }
        },
        {
            $lookup : {
                from : "messages",
                localField:"lastMessage",
                foreignField:"_id",
                as:"lastMessage"
            }
        },
        {
            $addFields : {
                member : {
                    $first : {
                        $filter : {
                            input:"$members",
                            as:"m",
                            cond : {
                                $ne : ["$$m._id", new mongoose.Types.ObjectId(req?.user?._id)]
                            }
                        }
                    }
                },
                lastMessage : {
                    $first : "$lastMessage"
                }
            }
        },
        {
            $project : {
                _id:1,
                "member._id":1,
                "member.email":1,
                "member.fullname":1,
                "member.username":1,
                "member.profileImage":1,
                "member.lastSeen":1,
                "member.createdAt":1,
                lastMessage:1,
            }
        }
    ]);

    // Add online status to each chat's member
    const chatsWithOnlineStatus = chats.map(chat => {
        if (chat.member && chat.member._id) {
            const memberId = chat.member._id.toString();
            const isOnline = onlineUsers.has(memberId);
            
            // Calculate if user was recently active (within last 5 minutes)
            const lastSeen = chat.member.lastSeen ? new Date(chat.member.lastSeen) : null;
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            const isRecentlyActive = lastSeen && lastSeen > fiveMinutesAgo;

            return {
                ...chat,
                member: {
                    ...chat.member,
                    isOnline: isOnline || isRecentlyActive,
                    lastSeen: chat.member.lastSeen
                }
            };
        }
        return chat;
    });

    return res.status(200).json({
        data: chatsWithOnlineStatus,
        message:"Success: Chats successfully fetched.",
        statusCode:200
    });
}

module.exports = {
    HandleCreateChat,
    HandleDeleteChat,
    HandleGetUserChats
}