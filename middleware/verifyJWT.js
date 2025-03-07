const { ApiError } = require("./ApiError.js")
const { User } = require("../routes/user.js")
const jwt = require("jsonwebtoken")
const { ApiResponse } = require("./ApiResponse.js")
const {asyncHandler} = require("./asyncHandler.js")

 const verifyJWT = async (req,res,next)=>{

  try {
     console.log("verify JWT : ")
     const token = req.cookies?.accessToken || req.header 
      ("Authorization")?.replace("Bearer ","");

      console.log(req.cookies)

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
      return res.status(401).json(new ApiResponse(401, error?.message || "Invalid access token"));
  }

}

module.exports = { verifyJWT };

//added auth middeware to get the info of the user using cookies 
// it creates a req.user that contains the whole database user
