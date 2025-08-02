import { request } from "express";
import mongoose from "mongoose";

const useSchema = new mongoose.Schema({
    userId: {type:String,required:true},
    question:{type: String , required:true},
    discription:{type: String },
    category:{type: String , default:"technical support"},
    status: {type:String, required:true, default:''},
    answer:{type:String, default:""},
    date: {type:Number,required:true}
},{minimize:false})



const ticketsModel = mongoose.models.tickets || mongoose.model('tickets', useSchema);

export default ticketsModel

