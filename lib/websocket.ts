import { io, type Socket } from "socket.io-client"

class WebSocketClient {
  private socket: Socket | null = null

  connect(userId: string) {
    if (typeof window === "undefined") return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://ecomarce-api-e.onrender.com"

    this.socket = io(wsUrl, {
      query: { userId },
      transports: ["websocket", "polling"],
      timeout: 10000,
      forceNew: true,
    })

    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected")
      this.socket?.emit("join-room", userId)
    })

    this.socket.on("disconnect", () => {
      console.log("❌ WebSocket disconnected")
    })

    this.socket.on("connect_error", (error) => {
      console.log("WebSocket connection error:", error)
    })

    // Listen for real-time events
    this.socket.on("ticket-created", (data) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ticketCreated", { detail: data }))
      }
    })

    this.socket.on("comment-added", (data) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("commentAdded", { detail: data }))
      }
    })

    this.socket.on("ticket-updated", (data) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ticketUpdated", { detail: data }))
      }
    })

    this.socket.on("ticket-assigned", (data) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ticketAssigned", { detail: data }))
      }
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  emit(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data)
    }
  }
}

export const wsClient = new WebSocketClient()
