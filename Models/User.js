const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
//we will be adding User Schema
const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:true,
},
createdAt:{
    type:Date,
    default:Date.now
},
role: { 
    type: String,
     enum: ['user', 'admin'], 
     default: 'user' }
});
//Now we will be convert normal password to hashed password
userSchema.pre('save',async function (next){
const user=this;
//this will be hashing password if it is modified or is new
if (!user.isModified('password')) return next();
try{
//Now we will be creating a salt
const salt= await bcrypt.genSalt(10);
//now we will hash password
const hashedPassword=await bcrypt.hash(user.password,salt);
//now we will override plain password with hashed password 
user.password=hashedPassword;
next();
}catch(err){
    console.error(err);
    next(err);
}
})

//Now we will be comparing the hash password with saved hash password
userSchema.methods.comparePassword=async function (candidatePassword){
try{
const isMatch=await bcrypt.compare(candidatePassword,this.password);
return isMatch;
}catch(err){
    console.log(err);
}
};

//Now we will be exporting the UserSchema
module.exports=mongoose.model('User',userSchema);