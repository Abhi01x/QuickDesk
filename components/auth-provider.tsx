"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  role: "end_user" | "support_agent" | "admin"
  token: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem("quickdesk_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        localStorage.removeItem("quickdesk_user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Mock login - replace with actual API call
      let mockUser: User

      if (email === "user@demo.com" && password === "password123") {
        mockUser = {
          id: "1",
          name: "John Doe",
          email: "user@demo.com",
          role: "end_user",
          token: "mock-token-user",
        }
      } else if (email === "agent@demo.com" && password === "password123") {
        mockUser = {
          id: "2",
          name: "Jane Smith",
          email: "agent@demo.com",
          role: "support_agent",
          token: "mock-token-agent",
        }
      } else if (email === "admin@demo.com" && password === "password123") {
        mockUser = {
          id: "3",
          name: "Admin User",
          email: "admin@demo.com",
          role: "admin",
          token: "mock-token-admin",
        }
      } else {
        throw new Error("Invalid credentials")
      }

      setUser(mockUser)
      localStorage.setItem("quickdesk_user", JSON.stringify(mockUser))

      // Redirect based on role
      if (mockUser.role === "end_user") {
        router.push("/dashboard")
      } else if (mockUser.role === "support_agent") {
        router.push("/agent")
      } else if (mockUser.role === "admin") {
        router.push("/admin")
      }
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("quickdesk_user")
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
