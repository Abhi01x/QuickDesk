import ticketsModel from '../models/TicketModel.js'; // Adjust the path if needed
import userModel from '../models/userModel.js'

const createTicket = async (req, res) => {
  try {
    const { userId, question, discription, category, status } = req.body;

    if (!userId || !question) {
      return res.json({ success: false, message: "userId and question are required" });
    }


    const newTicket = new ticketsModel({
      userId,
      question,
      discription: discription || '',
      category: category || 'technical support',
      status: status || 'pending',
      date: Date.now(),
    });

    await newTicket.save();

    res.json({ success: true, message: "Ticket created successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


const getuserTicket = async (req, res) => {
  
    try {
    const { userId } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "userId is required" });
    }

    const tickets = await ticketsModel.find({ userId });

    res.json({
      success: true,
      message: "User tickets fetched successfully",
      data: tickets
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};



const getAllTickets = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "userId is required" });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if the user is admin or support
    if (user.role !== 'admin' && user.role !== 'support') {
      return res.status(403).json({ success: false, message: "Access denied: You are not authorized" });
    }

    const tickets = await ticketsModel.find().sort({ date: -1 });

    res.json({
      success: true,
      message: "Tickets fetched successfully",
      data: tickets
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};





const updateTicketAnswer = async (req, res) => {
  try {
    const { userId, ticketId, answer } = req.body;

    if (!userId || !ticketId || !answer) {
      return res.json({ success: false, message: "userId, ticketId, and answer are required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.role !== 'admin' && user.role !== 'support') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const updatedTicket = await ticketsModel.findByIdAndUpdate(
      ticketId,
      {
        answer,
        status: 'answered' // optional: auto update status
      },
      { new: true }
    );

    if (!updatedTicket) {
      return res.json({ success: false, message: "Ticket not found" });
    }

    res.json({
      success: true,
      message: "Answer updated successfully",
    
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};



const updateTicketStatus = async (req, res) => {
    
  try {
    const { userId, ticketId, status } = req.body;

    if (!userId || !ticketId || !status) {
      return res.json({ success: false, message: "userId, ticketId, and status are required" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.role !== 'admin' && user.role !== 'support') {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const updatedTicket = await ticketsModel.findByIdAndUpdate(
      ticketId,
      { status },
      { new: true }
    );

    if (!updatedTicket) {
      return res.json({ success: false, message: "Ticket not found" });
    }

    res.json({
      success: true,
      message: `Ticket status updated to "${status}"`,
      data: updatedTicket
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export  {createTicket ,getuserTicket , getAllTickets ,updateTicketAnswer ,updateTicketStatus};


