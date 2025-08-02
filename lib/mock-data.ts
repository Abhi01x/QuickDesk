export interface Ticket {
  id: string
  subject: string
  description: string
  category: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  createdBy: string
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  upvotes: number
  downvotes: number
  comments: Comment[]
  isPublic: boolean
  shareableLink?: string
}

export interface Comment {
  id: string
  ticketId: string
  userId: string
  userName: string
  userRole: string
  content: string
  createdAt: Date
  isInternal?: boolean
}

export interface Category {
  id: string
  name: string
  description: string
  color: string
}

export const mockCategories: Category[] = [
  { id: "1", name: "Technical Support", description: "Hardware and software issues", color: "blue" },
  { id: "2", name: "Account Issues", description: "Login and account related problems", color: "green" },
  { id: "3", name: "Billing", description: "Payment and billing inquiries", color: "yellow" },
  { id: "4", name: "Feature Request", description: "New feature suggestions", color: "purple" },
  { id: "5", name: "Bug Report", description: "Software bugs and issues", color: "red" },
]
