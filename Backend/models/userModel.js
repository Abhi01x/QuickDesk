import { request } from "express";
import mongoose from "mongoose";

const useSchema = new mongoose.Schema({
    name:{type: String , required:true},
    email:{type: String , required:true ,unique:true},
    password:{type: String , required:true},
    role:{type:String, required:true , default:"user"},
    TicketData:{type: Object , default:{}}
},{minimize:false})



const userModel = mongoose.models.user || mongoose.model('user', useSchema);

export default userModel

