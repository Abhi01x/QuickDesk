import express from 'express'
import cors from 'cors'
import 'dotenv/config' 
import connectDB from './config/mongodb.js'
import userRouter from './routes/userRoute.js'
import ticketRoutes from './routes/ticketRoutes.js'
import adminrouter from './routes/adminroutes.js'
import requestrouter from './routes/roleRequestRoutes.js'


const app = express()
const port = process.env.PORT || 4000

connectDB()

app.use(express.json())
app.use(cors())


app.use('/api/user', userRouter)
app.use('/api/ticket' , ticketRoutes )
app.use('/api/admin' , adminrouter )
app.use('/api/request', requestrouter)

app.get('/',(req,res)=>{
    res.send("API Working")
})


app.listen(port,()=>console.log('Server started on posrt :'+port))