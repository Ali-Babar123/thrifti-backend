const Follow = require('../Models/Followers');
const mongoose = require('mongoose');

/* ================= FOLLOW USER ================= */
exports.followNow = async (req, res) => {
    try {
        const { followerId } = req.body; // jis ko follow karna hai

        if (!followerId) {
            return res.status(400).json({ message: "followerId is required" });
        }

        if (followerId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const alreadyFollowed = await Follow.findOne({
            follower: req.user._id,
            following: followerId
        });

        if (alreadyFollowed) {
            return res.status(400).json({ message: "Already following this user" });
        }

        const follow = await Follow.create({
            follower: req.user._id,
            following: followerId
        });

        res.status(201).json({
            success: true,
            message: "User followed successfully",
            data: follow
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* ================= UNFOLLOW USER ================= */
exports.unFollow = async (req, res) => {
    try {
        const { unFollowerId } = req.params;

        if (!unFollowerId) {
            return res.status(400).json({ message: "unFollowerId is required" });
        }

        const unfollow = await Follow.findOneAndDelete({
            follower: req.user._id,
            following: unFollowerId
        });

        if (!unfollow) {
            return res.status(400).json({ message: "You are not following this user" });
        }

        res.json({
            success: true,
            message: "User unfollowed successfully"
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* ================= GET FOLLOWERS ================= */
exports.getFollowers = async (req, res) => {
    try {
        const followers = await Follow.find({ following: req.params.userId })
            .populate('follower', 'name avatar');

        res.json({
            success: true,
            count: followers.length,
            followers
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ================= GET FOLLOWING ================= */
exports.getFollowing = async (req, res) => {
    try {
        const following = await Follow.find({ follower: req.params.userId })
            .populate('following', 'name avatar');

        res.json({
            success: true,
            count: following.length,
            following
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ================= CHECK FOLLOWING ================= */
exports.isFollowing = async (req, res) => {
    try {
        const exists = await Follow.exists({
            follower: req.user._id,
            following: req.params.userId
        });

        res.json({
            success: true,
            following: !!exists
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
