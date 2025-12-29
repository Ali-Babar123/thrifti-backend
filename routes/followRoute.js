const express = require('express');
const router = express.Router();
const {
    followNow,
    unFollow,
    getFollowers,
    getFollowing,
    isFollowing
} = require('../Controller/FollowController');

const { verifyToken } = require('../middleware/authmiddleware');

router.post('/follow', verifyToken, followNow);
router.delete('/unfollow/:unFollowerId', verifyToken, unFollow);

router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);

router.get('/is-following/:userId', verifyToken, isFollowing);

module.exports = router;
