const express = require("express");

/** Controllers */
const messageControllers = require("../Controller/message.controllers.js");

/** Auth middleware */
const authMiddleware = require("../middleware/authmiddleware.js");

const messageRouter = express.Router();

/** secure routes */
messageRouter.route("/send-message").post(authMiddleware.verifyToken,messageControllers.HandleSendMessage);
messageRouter.route("/delete-message").delete(authMiddleware.verifyToken,messageControllers.HandleDeleteMessage);
messageRouter.route("/update-message-seen-status").patch(authMiddleware.verifyToken,messageControllers.HandleUpdateMessageSeenStatus);
messageRouter.route("/chat-messages").get(authMiddleware.verifyToken,messageControllers.HandleGetChatMessages);


module.exports = messageRouter;