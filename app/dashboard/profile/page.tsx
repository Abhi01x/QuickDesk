"use client"

import { useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Shield, Crown } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== "end_user") {
      router.push("/")
    }
  }, [user, router])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "end_user":
        return <User className="h-5 w-5" />
      case "support_agent":
        return <Shield className="h-5 w-5" />
      case "admin":
        return <Crown className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "end_user":
        return "bg-blue-100 text-blue-800"
      case "support_agent":
        return "bg-green-100 text-green-800"
      case "admin":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <h2 className="text-3xl font-bold text-gray-900">Profile Settings</h2>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={user.name} readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={user.email} readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-role">Current Role</Label>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRoleColor(user.role)}>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role.replace("_", " ")}</span>
                      </div>
                    </Badge>
                  </div>
                </div>

                <div className="pt-4">
                  <Button disabled>Update Profile</Button>
                  <p className="text-xs text-gray-500 mt-2">Profile updates are currently disabled in demo mode</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
