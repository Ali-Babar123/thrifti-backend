const express = require("express");

/** Controllers */
const chatControllers = require("../Controller/chat.controller.js");

/** Auth middleware */
const authMiddleware = require("../middleware/authmiddleware.js");

const chatRouter = express.Router();

/** secure routes */
chatRouter.route("/create-chat").post(authMiddleware.verifyToken,chatControllers.HandleCreateChat);
chatRouter.route("/delete-chat/:chatId").delete(authMiddleware.verifyToken,chatControllers.HandleDeleteChat);
chatRouter.route("/chats-history").get(authMiddleware.verifyToken,chatControllers.HandleGetUserChats);


module.exports = chatRouter;