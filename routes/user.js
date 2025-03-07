const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { ApiError } = require("../middleware/ApiError");
const { ApiResponse } = require("../middleware/ApiResponse");

const Users = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });

Users.pre("save", async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

Users.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

Users.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

Users.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

const User = mongoose.model("User", Users);

router.post("/register", async (req, res) => {
    try {
        const { username, email, password, image } = req.body;

        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existedUser) {
            throw new ApiError(409, "User with email or username already exists");
        }

        const newUser = new User({ username, email, password, role: "crew", image });
        await newUser.save();

        const userWithoutPassword = newUser.toObject();
        delete userWithoutPassword.password;

        return res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error("Error creating new user", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        
        const { email, password } = req.body;
        console.log(email, password)

        const user = await User.findOne({ email });

        console.log(user)

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: true
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser, accessToken, refreshToken
                    },
                    "User logged In Successfully"
                )
            );

    } catch (error) {
        console.error("Error logging in user", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

const logoutUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1 // this removes the field from document
                }
            },
            {
                new: true
            }
        );

        const options = {
            httpOnly: true,
            secure: true
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged Out"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Internal server error"));
    }
};

const verifyJWT = async (req,res,next)=>{

    try {
       console.log("verify JWT : ")
       const token = req.cookies?.accessToken || req.header 
        ("Authorization")?.replace("Bearer ","");
  
        if(!token){
          return res.status(500).json({message:"unauthorized request"})//throw new ApiError(401,"Unauthorized request");
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
  
        console.log(decodedToken)
  
       const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
       if(!user){
        return res.status(500).json({message:"unauthorized request"})
       }
       console.log(user)
       
       req.user = user;
       console.log(req.user)
       next() //this will run the next funtion after verifyJWT in user route: post(verifyJWT, logoutUser)
  
    } catch (error) {
      return  new ApiResponse(401,error?.message||"invalid access token")
    }
  
  }

const refreshAccessToken = async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        return res.status(401).json(new ApiError(401, "Unauthorized request"));
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            return res.status(401).json(new ApiError(401, "Invalid refresh token"));
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            return res.status(401).json(new ApiError(401, "Refresh token is expired or used"));
        }

        const options = {
            httpOnly: true,
            secure: true
        };

        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        return res.status(401).json(new ApiError(401, error?.message || "Invalid refresh token"));
    }
};

const getCurrentUser = async (req, res) => {
    try {
        return res
            .status(200)
            .json(new ApiResponse(
                200,
                req.user,
                "User fetched successfully"
            ));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Internal server error"));
    }
};

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

router.get("/logout", verifyJWT, logoutUser);

router.get("/users", verifyJWT, async (req, res) => {
    try {
        const user = await User.find().sort({ username: -1 }).select("-password");
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: "Internal server Error" });
    }
});

router.get("/get-user", verifyJWT, getCurrentUser);

router.get("/refresh-token", refreshAccessToken);

router.put("/update", verifyJWT, async (req, res) => {
    try {
        const { _id, ...update } = req.body;
        const user = await User.findByIdAndUpdate(_id, {
            $set: update
        }, { new: true }).select("-password");
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: "Internal server Error" });
    }
});

router.delete("/:userId", verifyJWT, async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ message: `${user.username} deleted successfully` });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = { User, router };