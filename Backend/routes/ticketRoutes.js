import express from "express"


import { createTicket ,getAllTickets,getuserTicket, updateTicketAnswer, updateTicketStatus } from "../controllers/ticketRoutes.js"
import authUser from "../middleware/auth.js";
const ticketRoutes = express.Router()


// for addmine or the soport agent 
ticketRoutes.post('/list', authUser, getAllTickets)
ticketRoutes.post('/updateans', authUser , updateTicketAnswer )
ticketRoutes.post('/updatestatus', authUser , updateTicketStatus )


// for user 

ticketRoutes.post('/add',authUser, createTicket);
ticketRoutes.post('/get',authUser, getuserTicket);



export default ticketRoutes

