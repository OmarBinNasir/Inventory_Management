const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

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
    role :{
        type : String,
        required : true
    },
    image : {
        type : String
    }
},{timestamps : true});

const User = mongoose.model("User", Users);

router.post("/register", async (req, res) => {
    try {

        const { username, email, password, image } = req.body;
        const newUser = new User({ username, email, password, role : "crew", image });
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
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        if (user.password !== password) {
            return res.status(400).json({ message: "Invalid Password" });
        }
        const { password: _, ...userData } = user.toObject();
        res.status(200).json({ message: "Login successful", user: userData });
        
    } catch (error) {

        console.error("Error logging in user", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/users", async (req,res)=>{
   try {
     const user =  await User.find().sort({username:-1}).select("-password")
     return res.status(200).json(user)
   } catch (error) {
     return res.status(500).json({message:"Internal server Error"})
   }
})

router.put("/update", async (req, res) => {
    try {
        const {_id, ...update } = req.body
        const user = await User.findByIdAndUpdate(_id,{
            $set : update
        }, {new : true}).select("-password")
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({message:"Internal server Error"})
    }
})

router.delete("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId
        const user = await User.findByIdAndDelete(userId)
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({message : `${user.username} deleted succesfully`})
    } catch (error) {
        return res.status(500).json({message: "internal server error"})
    }
})

module.exports = router;