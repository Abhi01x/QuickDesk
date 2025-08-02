"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ArrowUpDown, MessageSquare, User, Clock, HelpCircle, TrendingUp, CheckCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function AgentDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [tickets, setTickets] = useState([])
  const [myTickets, setMyTickets] = useState([])
  const [categories, setCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== "support_agent") {
      router.push("/")
      return
    }

    loadData()
  }, [user, router])

  const loadData = async () => {
    try {
      // Mock data for demo
      const mockTickets = [
        {
          _id: "1",
          subject: "Login Issues",
          description: "User having trouble logging into account. Password reset not working.",
          status: "open",
          priority: "high",
          category: { _id: "1", name: "Account Issues" },
          createdBy: { name: "John Doe", email: "john@example.com" },
          assignedTo: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: "2",
          subject: "Feature Request - Dark Mode",
          description: "Customer requesting dark mode support in the application.",
          status: "in_progress",
          priority: "medium",
          category: { _id: "2", name: "Feature Request" },
          createdBy: { name: "Jane Smith", email: "jane@example.com" },
          assignedTo: { _id: user?.id, name: user?.name },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          _id: "3",
          subject: "Mobile Dashboard Bug",
          description: "Dashboard not loading properly on mobile devices. Need urgent fix.",
          status: "resolved",
          priority: "urgent",
          category: { _id: "3", name: "Bug Report" },
          createdBy: { name: "Mike Johnson", email: "mike@example.com" },
          assignedTo: { _id: user?.id, name: user?.name },
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]

      const mockCategories = [
        { _id: "1", name: "Account Issues" },
        { _id: "2", name: "Feature Request" },
        { _id: "3", name: "Bug Report" },
        { _id: "4", name: "Technical Support" },
      ]

      setTickets(mockTickets)
      setMyTickets(mockTickets.filter((ticket: any) => ticket.assignedTo?._id === user?.id))
      setCategories(mockCategories)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToMe = async (ticketId: string) => {
    try {
      // Mock assignment
      await new Promise((resolve) => setTimeout(resolve, 500))

      setTickets((prev) =>
        prev.map((ticket: any) =>
          ticket._id === ticketId
            ? { ...ticket, assignedTo: { _id: user?.id, name: user?.name }, status: "in_progress" }
            : ticket,
        ),
      )

      loadData()
      toast({
        title: "Question Assigned",
        description: "The question has been assigned to you.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign question. Please try again.",
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

  const filteredTickets = tickets
    .filter((ticket: any) => {
      if (searchTerm && !ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (selectedCategory !== "all" && ticket.category._id !== selectedCategory) return false
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false
      return true
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "priority":
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          return (
            priorityOrder[b.priority as keyof typeof priorityOrder] -
            priorityOrder[a.priority as keyof typeof priorityOrder]
          )
        default:
          return 0
      }
    })

  const TicketCard = ({ ticket }: { ticket: any }) => (
    <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{ticket.subject}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ticket.description}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={`${getStatusColor(ticket.status)} border`}>{ticket.status.replace("_", " ")}</Badge>
              <Badge className={`${getPriorityColor(ticket.priority)} border`}>{ticket.priority}</Badge>
              <Badge variant="outline" className="border-gray-200">
                {ticket.category?.name || "Uncategorized"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{ticket.createdBy?.name || "Unknown User"}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-4 w-4" />
              <span>0 replies</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => router.push(`/agent/ticket/${ticket._id}`)}>
              View & Reply
            </Button>
            {ticket.status === "open" && !ticket.assignedTo && (
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => handleAssignToMe(ticket._id)}
              >
                Assign to Me
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Support Dashboard</h2>
            <p className="text-gray-600">Manage and resolve customer support questions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">My Questions</CardTitle>
              <User className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myTickets.length}</div>
              <p className="text-xs opacity-80">Assigned to you</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Open Questions</CardTitle>
              <HelpCircle className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.filter((t: any) => t.status === "open").length}</div>
              <p className="text-xs opacity-80">Awaiting assignment</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">In Progress</CardTitle>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.filter((t: any) => t.status === "in_progress").length}</div>
              <p className="text-xs opacity-80">Being worked on</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Resolved Today</CardTitle>
              <CheckCircle className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.filter((t: any) => t.status === "resolved").length}</div>
              <p className="text-xs opacity-80">Completed questions</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border shadow-sm">
            <TabsTrigger value="all">All Questions</TabsTrigger>
            <TabsTrigger value="my">My Questions ({myTickets.length})</TabsTrigger>
          </TabsList>

          {/* Filters and Search */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-32 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48 border-gray-200 focus:border-blue-500">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="all" className="space-y-4">
            {filteredTickets.length === 0 ? (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-gray-500">No questions found matching your criteria.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredTickets.map((ticket: any) => <TicketCard key={ticket._id} ticket={ticket} />)
            )}
          </TabsContent>

          <TabsContent value="my" className="space-y-4">
            {myTickets.length === 0 ? (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-gray-500">No questions assigned to you yet.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              myTickets.map((ticket: any) => <TicketCard key={ticket._id} ticket={ticket} />)
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
