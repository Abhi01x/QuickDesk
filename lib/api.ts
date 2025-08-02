// API utility functions for backend integration
const API_BASE_URL = "https://your-backend-name.onrender.com/api"

class ApiClient {
  private getAuthHeaders() {
    if (typeof window === "undefined") return { "Content-Type": "application/json" }

    const user = localStorage.getItem("quickdesk_user")
    if (user) {
      try {
        const userData = JSON.parse(user)
        return {
          Authorization: `Bearer ${userData.token}`,
          "Content-Type": "application/json",
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.removeItem("quickdesk_user")
      }
    }
    return { "Content-Type": "application/json" }
  }

  private async handleResponse(response: Response) {
    try {
      const data = await response.json()
      console.log("API Response:", data) // Add logging to debug
      return data
    } catch (error) {
      console.error("Response parsing error:", error)
      return { success: false, message: "Invalid response format" }
    }
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    try {
      console.log("Making request to:", url, "with options:", options) // Add logging
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      })

      console.log("Response status:", response.status) // Add logging
      const result = await this.handleResponse(response)
      console.log("Parsed result:", result) // Add logging
      return result
    } catch (error) {
      console.error("API request failed:", error)
      throw new Error("Network error - please check your connection")
    }
  }

  // Authentication
  async login(email: string, password: string, role?: string) {
    const result = await this.makeRequest(`${API_BASE_URL}/user/login`, {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    })
    return result
  }

  async register(name: string, email: string, password: string) {
    const result = await this.makeRequest(`${API_BASE_URL}/user/register`, {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
    return result
  }

  // Tickets
  async getTickets(filters: any = {}) {
    const queryParams = new URLSearchParams(filters).toString()
    const result = await this.makeRequest(`${API_BASE_URL}/tickets?${queryParams}`)
    return result
  }

  async getTicket(id: string) {
    const result = await this.makeRequest(`${API_BASE_URL}/tickets/${id}`)
    return result
  }

  async createTicket(ticketData: any) {
    const result = await this.makeRequest(`${API_BASE_URL}/tickets`, {
      method: "POST",
      body: JSON.stringify(ticketData),
    })
    return result
  }

  async addComment(ticketId: string, content: string) {
    const result = await this.makeRequest(`${API_BASE_URL}/tickets/${ticketId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
    return result
  }

  async updateTicketStatus(ticketId: string, status: string) {
    const result = await this.makeRequest(`${API_BASE_URL}/tickets/${ticketId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
    return result
  }

  async assignTicket(ticketId: string, agentId?: string) {
    const result = await this.makeRequest(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
      method: "POST",
      body: JSON.stringify({ agentId }),
    })
    return result
  }

  // Categories
  async getCategories() {
    const result = await this.makeRequest(`${API_BASE_URL}/categories`)
    return result
  }

  async createCategory(categoryData: any) {
    const result = await this.makeRequest(`${API_BASE_URL}/categories`, {
      method: "POST",
      body: JSON.stringify(categoryData),
    })
    return result
  }

  // Dashboard Stats
  async getDashboardStats() {
    const result = await this.makeRequest(`${API_BASE_URL}/dashboard/stats`)
    return result
  }
}

export const apiClient = new ApiClient()
