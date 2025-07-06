const jwt=require('jsonwebtoken');
 const jwtAuthMiddleware=(req,res,next)=>{
    //first we will be checking request header has authorization

    const authHeader=req.headers.authorization

    if(!authHeader) return res.status(401).json({ error:'Token Not Found'});

    // we will be extracting token Jwt from the request header
    const token =authHeader.split(' ')[1];
    if(!token) return res.status(401).json({error:"unauthorised"});
    try{
      const decoded=jwt.verify(token,process.env.JWT_SECRET);
      req.user=decoded;
      next();
    }
    catch(error){
        return res.status(401).json({error:'Invalid token'});
    }
 }

 //here we will be4 generating jwt token
 const generateToken=(userData)=>{
    return jwt.sign(userData,process.env.JWT_SECRET,{expiresIn:'1h'});
 }

 module.exports={jwtAuthMiddleware,generateToken};