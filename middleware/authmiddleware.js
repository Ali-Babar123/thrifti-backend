const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../Models/User");
const {Server} = require("socket.io");

// Required authentication middleware - returns 401 if no valid token
const verifyToken = async (req, res, next) => {
  try {
    let token;
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Optional authentication middleware - sets req.user if token is valid, but doesn't return 401 if missing
const optionalVerifyToken = async (req, res, next) => {
  try {
    let token;
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token, continue without setting req.user
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded._id).select("-password");
      
      if (user) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (error) {
      // Invalid token, but allow request to continue
      req.user = null;
    }
    
    next();
  } catch (error) {
    // Any other error, allow request to continue without auth
    req.user = null;
    next();
  }
};



async function socketAuthMiddleware(socket, next) {
    try {
        // Extract token from cookies
        const cookies = socket.handshake.headers.cookie;
        
        // If no cookies, allow connection as guest (unauthenticated)
        if (!cookies) {
            socket.user = null;
            socket.isAuthenticated = false;
            return next();
        }

        const token = cookies
            .split("; ")
            .find((row) => row.startsWith("accessToken="))
            ?.split("=")[1];

        // If no token, allow connection as guest (unauthenticated)
        if (!token) {
            socket.user = null;
            socket.isAuthenticated = false;
            return next();
        }

        try {
            // Verify JWT token
            const verifyJwt = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find user in database
            const checkTheUserInDb = await User.findById(verifyJwt._id).select("-password");
            
            if (checkTheUserInDb) {
                // Attach user to socket
                socket.user = checkTheUserInDb;
                socket.isAuthenticated = true;
            } else {
                // User not found, allow as guest
                socket.user = null;
                socket.isAuthenticated = false;
            }
        } catch (error) {
            // Invalid token, but allow connection as guest
            socket.user = null;
            socket.isAuthenticated = false;
        }

        // Always allow connection, but mark authentication status
        next();
    } catch (error) {
        // Any error, allow connection as guest
        socket.user = null;
        socket.isAuthenticated = false;
        next();
    }
}
module.exports = { verifyToken, optionalVerifyToken, socketAuthMiddleware };
