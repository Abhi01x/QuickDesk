"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Send, User, Shield, Crown, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api"

export default function AgentTicketDetail() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [ticket, setTicket] = useState<any>(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ticketStatus, setTicketStatus] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== "support_agent") {
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
        setTicketStatus(response.data.ticket.status)
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
          description: "Your reply has been sent to the user.",
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiClient.updateTicketStatus(params.id as string, newStatus)
      setTicketStatus(newStatus)
      loadTicket()
      toast({
        title: "Status Updated",
        description: `Question status changed to ${newStatus.replace("_", " ")}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAssignToMe = async () => {
    try {
      await apiClient.assignTicket(params.id as string)
      loadTicket()
      toast({
        title: "Question Assigned",
        description: "This question has been assigned to you.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign question. Please try again.",
        variant: "destructive",
      })
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
            <Button onClick={() => router.push("/agent")}>Back to Dashboard</Button>
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
                <CardTitle className="text-xl mb-2">{ticket.subject}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
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
                {ticketStatus !== "closed" && (
                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Type your reply to help the user..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={4}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Status:</span>
                          <Select value={ticketStatus} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
                    <Select value={ticketStatus} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned To</label>
                  <p className="text-sm text-gray-700 mt-1">
                    {ticket.assignedTo ? ticket.assignedTo.name : "Unassigned"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!ticket.assignedTo && (
                  <Button onClick={handleAssignToMe} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Assign to Me
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
