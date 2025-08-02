"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Send, Clock, User, Shield, Crown, CheckCircle } from "lucide-react"
import { apiClient } from "@/lib/api"

export default function TicketDetail() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [ticket, setTicket] = useState<any>(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    loadTicket()

    // Listen for real-time updates
    const handleCommentAdded = (event: any) => {
      if (event.detail.payload.ticketId === params.id) {
        loadTicket()
      }
    }

    const handleTicketUpdated = (event: any) => {
      if (event.detail.payload._id === params.id) {
        loadTicket()
      }
    }

    window.addEventListener("commentAdded", handleCommentAdded)
    window.addEventListener("ticketUpdated", handleTicketUpdated)

    return () => {
      window.removeEventListener("commentAdded", handleCommentAdded)
      window.removeEventListener("ticketUpdated", handleTicketUpdated)
    }
  }, [user, router, params.id])

  const loadTicket = async () => {
    try {
      const response = await apiClient.getTicket(params.id as string)
      if (response.success) {
        setTicket(response.data.ticket)
        setComments(response.data.comments)
      }
    } catch (error) {
      console.error("Error loading ticket:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)

    try {
      const response = await apiClient.addComment(params.id as string, newComment)

      if (response.success) {
        setNewComment("")
        loadTicket()
        toast({
          title: "Reply Sent",
          description: "Your reply has been added to the conversation.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseTicket = async () => {
    try {
      await apiClient.updateTicketStatus(params.id as string, "closed")
      toast({
        title: "Question Closed",
        description: "Thank you for your feedback! The question has been marked as resolved.",
      })
      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to close question. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "end_user":
        return <User className="h-4 w-4" />
      case "support_agent":
        return <Shield className="h-4 w-4" />
      case "admin":
        return <Crown className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "end_user":
        return "text-blue-600"
      case "support_agent":
        return "text-green-600"
      case "admin":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Question Not Found</h2>
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 hover:bg-white/50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Details */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{ticket.subject}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className={`${getStatusColor(ticket.status)} border`}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                      <Badge className={`${getPriorityColor(ticket.priority)} border`}>{ticket.priority}</Badge>
                      <Badge variant="outline" className="border-gray-200">
                        {ticket.category?.name || "Uncategorized"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  {(ticket.status === "resolved" || ticket.status === "in_progress") &&
                    user?.id === ticket.createdBy._id && (
                      <Button onClick={handleCloseTicket} className="bg-green-500 hover:bg-green-600 text-white">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Satisfied
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Comments/Replies */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Conversation ({comments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No replies yet. Be the first to respond!</p>
                  </div>
                ) : (
                  comments.map((comment: any) => (
                    <div key={comment._id} className="flex space-x-3 p-4 rounded-lg bg-gray-50/50">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={getRoleColor(comment.userId.role)}>
                          {comment.userId.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{comment.userId.name}</span>
                          <div className={`flex items-center space-x-1 ${getRoleColor(comment.userId.role)}`}>
                            {getRoleIcon(comment.userId.role)}
                            <span className="text-xs capitalize">{comment.userId.role.replace("_", " ")}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()} at{" "}
                            {new Date(comment.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}

                {/* Reply Form */}
                {ticket.status !== "closed" && (
                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Type your reply here..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSubmitComment}
                          disabled={isSubmitting || !newComment.trim()}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {isSubmitting ? "Sending..." : "Send Reply"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Question Info */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Question Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(ticket.status)} border`}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <div className="mt-1">
                    <Badge className={`${getPriorityColor(ticket.priority)} border`}>{ticket.priority}</Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="border-gray-200">
                      {ticket.category?.name || "Uncategorized"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-700 mt-1">
                    {new Date(ticket.createdAt).toLocaleDateString()} at{" "}
                    {new Date(ticket.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-700 mt-1">
                    {new Date(ticket.updatedAt).toLocaleDateString()} at{" "}
                    {new Date(ticket.updatedAt).toLocaleTimeString()}
                  </p>
                </div>

                {ticket.assignedTo && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned To</label>
                    <p className="text-sm text-gray-700 mt-1">{ticket.assignedTo.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(ticket.status === "resolved" || ticket.status === "in_progress") &&
                  user?.id === ticket.createdBy._id && (
                    <Button onClick={handleCloseTicket} className="w-full bg-green-500 hover:bg-green-600 text-white">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Satisfied
                    </Button>
                  )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
