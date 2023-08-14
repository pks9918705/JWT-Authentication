const express=require('express')
const app = express()
const jwt= require('jsonwebtoken')

app.use(express.json())


const users=[
    {
        id:"1",
        username:"babu",
        password:"123123",
        isAdmin: false
    },
    {
        id:"2",
        username:"babu2",
        password:"123123",
        isAdmin: true
    },
    {
        id:"3",
        username:"babu3",
        password:"123123",
        isAdmin: false
    },
]

let refreshTokens=[]

//generate access token
const generateAccessToken =(user) => {

    return jwt.sign(
        {id:user.id,  isAdmin:user.isAdmin},"mySecretKey",{
            expiresIn:"1h"
        }
    )


}
const generateRefreshToken =(user) => {

    return jwt.sign(
        {id:user.id,  isAdmin:user.isAdmin},"myRefreshSecretKey" 
    )


}


app.post("/api/login", (req,res)=>{
     const {username,password}=req.body;
     console.log(req.body)
     const user= users.find((u)=>{
        return u.username===username && u.password===password
     });
     if(user){
        //generate a access token
       const accessToken= generateAccessToken(user)
       const refreshToken= generateRefreshToken(user)

       refreshTokens.push(refreshToken)
        //returing the user
        res.json({
            username:user.username,
            isAdmin:user.isAdmin,
            accessToken,
            refreshToken
        })
     }else
     {
        res.status(404).json("Username and password need to be checked")
     }
})



// creating a middleware to verify the token
const verify=(req,res,next)=>{
    const authHeader=req.headers.authorization;
    if(authHeader){
        const token=authHeader.split(" ")[1];

        jwt.verify(token,"mySecretKey",(err,user)=>{
            if(err){
                return res.status(403).json("token is not valid")
            }

            req.user=user
            console.log("verify",req.user)
            next()

        })

    }
    else {
        res.status(403).json("you are not authorized")
    }
}

app.post("/api/refresh",(req, res) => {
    //take the refresh token from the user
    const refreshToken = req.body.token

    //send error if there is no  token or invalid token
    if(!refreshToken){
        res.status(403).json("you are not authenticated")
    }
    if(!refreshTokens.includes(refreshToken)){
        return res.status(403).json("refresh token is invalid")
    }
    jwt.verify(refreshToken, "myRefreshSecretKey",(err,user)=>{
        err && console.log(err)
        refreshTokens=refreshTokens.filter((token)=>token!= refreshToken);

        const newAccessToken =generateAccessToken(user)
        const newRefreshToken = generateRefreshToken(user)

        refreshTokens.push(newRefreshToken)
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken:newRefreshToken
        })
    })

})

app.delete("/api/users/:userId",verify,(req,res)=>{
     
   
    if(req.user.isAdmin ){
        console.log('Admin hai bro')
    }
    if(req.user.id === req.params.userId || req.user.isAdmin){
        res.status(200).json("User has been deleted")
    }
    else{
        res.status(403).json("you are not allowed to delete")
    }
})

//logout
app.post("/api/logout",verify,(req, res)=>{

    const refreshToken=req.body.token 
    refreshTokens=refreshTokens.filter(token=>token!== refreshToken)
    res.status(200).json("you logged out successfully")

})
  


app.listen(8000,()=>{
    console.log('listening on port 8000')
})