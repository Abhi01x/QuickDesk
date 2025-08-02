"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, HelpCircle, MessageSquare, CheckCircle, TrendingUp } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== "end_user") {
      router.push("/")
      return
    }

    loadData()

    // Listen for real-time updates
    const handleTicketCreated = (event: any) => {
      if (event.detail.payload.createdBy === user.id) {
        loadData()
        toast({
          title: "Question Created",
          description: "Your question has been submitted successfully!",
        })
      }
    }

    const handleCommentAdded = (event: any) => {
      loadData()
      toast({
        title: "New Reply",
        description: "You have received a new reply to your question.",
      })
    }

    const handleTicketUpdated = (event: any) => {
      loadData()
      toast({
        title: "Question Updated",
        description: "Your question status has been updated.",
      })
    }

    window.addEventListener("ticketCreated", handleTicketCreated)
    window.addEventListener("commentAdded", handleCommentAdded)
    window.addEventListener("ticketUpdated", handleTicketUpdated)

    return () => {
      window.removeEventListener("ticketCreated", handleTicketCreated)
      window.removeEventListener("commentAdded", handleCommentAdded)
      window.removeEventListener("ticketUpdated", handleTicketUpdated)
    }
  }, [user, router, toast])

  const loadData = async () => {
    try {
      // Mock data for demo
      const mockTickets = [
        {
          _id: "1",
          subject: "Login Issues",
          description: "I'm having trouble logging into my account. The password reset doesn't seem to work.",
          status: "open",
          priority: "high",
          category: { name: "Account Issues" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: "2",
          subject: "Feature Request",
          description: "Would love to see dark mode support in the application.",
          status: "in_progress",
          priority: "medium",
          category: { name: "Feature Request" },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          _id: "3",
          subject: "Bug Report",
          description: "The dashboard doesn't load properly on mobile devices.",
          status: "resolved",
          priority: "urgent",
          category: { name: "Bug Report" },
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]

      setTickets(mockTickets)
      setStats({
        totalTickets: mockTickets.length,
        openTickets: mockTickets.filter((t: any) => t.status === "open").length,
        inProgressTickets: mockTickets.filter((t: any) => t.status === "in_progress").length,
        resolvedTickets: mockTickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length,
      })
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Questions</h2>
            <p className="text-gray-600">Track your questions and get help from our support team</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/ask")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ask Question
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Questions</CardTitle>
              <HelpCircle className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
              <p className="text-xs opacity-80">Questions asked</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Open</CardTitle>
              <MessageSquare className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openTickets}</div>
              <p className="text-xs opacity-80">Awaiting response</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">In Progress</CardTitle>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgressTickets}</div>
              <p className="text-xs opacity-80">Being worked on</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Resolved</CardTitle>
              <CheckCircle className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolvedTickets}</div>
              <p className="text-xs opacity-80">Questions resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No questions found. Ask your first question!</p>
                  <Button
                    onClick={() => router.push("/dashboard/ask")}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Ask Your First Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket: any) => (
              <Card
                key={ticket._id}
                className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm"
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{ticket.subject}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ticket.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
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

                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/ticket/${ticket._id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
