const express = require("express");
const { HandleGetCurrentUser, registerUser, loginUser, logoutUser, getProfile, getAllUsers, deleteUser, getLocation } = require("../Controller/authController");
const { verifyToken, optionalVerifyToken } = require("../middleware/authmiddleware.js");

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get('/getAllUsers', getAllUsers);
router.delete('/deleteUser/:id', deleteUser );
router.get('/location', getLocation);
// Use optional auth middleware - allows unauthenticated access
router.get('/current-user', optionalVerifyToken, HandleGetCurrentUser);

router.get('/member', getProfile);


module.exports = router;
