import { create } from "zustand"
import { api, setTokens, clearTokens } from "../api/client"

const savedUser = () => {
  try { return JSON.parse(localStorage.getItem("fxu_user")) } catch { return null }
}

export const useAuthStore = create((set) => ({
  user: savedUser(),
  role: savedUser()?.is_admin ? "admin" : savedUser() ? "user" : null,
  isAuthenticated: !!localStorage.getItem("fxu_access_token"),
  // Admin impersonation state
  adminToken: localStorage.getItem("fxu_admin_token") || null,
  adminUser: (() => { try { return JSON.parse(localStorage.getItem("fxu_admin_user")) } catch { return null } })(),

  login: async (fxuId, password) => {
    const data = await api.post("/auth/login", { fxu_id: fxuId, password }, false)
    setTokens(data.access_token, data.refresh_token)
    const user = { ...data.user }
    localStorage.setItem("fxu_user", JSON.stringify(user))
    const role = user.is_admin ? "admin" : "user"
    set({ user, role, isAuthenticated: true })
    return { success: true, role }
  },

  loginAsUser: async (userId) => {
    // Save current admin state
    const adminToken = localStorage.getItem("fxu_access_token")
    const adminUser = JSON.parse(localStorage.getItem("fxu_user"))
    localStorage.setItem("fxu_admin_token", adminToken)
    localStorage.setItem("fxu_admin_user", JSON.stringify(adminUser))
    // Get user token
    const data = await api.post(`/auth/admin/login-as-user/${userId}`, {})
    setTokens(data.access_token, null)
    localStorage.setItem("fxu_user", JSON.stringify(data.user))
    set({ user: data.user, role: "user", isAuthenticated: true, adminToken, adminUser })
    return data.user
  },

  returnToAdmin: () => {
    const adminToken = localStorage.getItem("fxu_admin_token")
    const adminUser = JSON.parse(localStorage.getItem("fxu_admin_user"))
    if (adminToken && adminUser) {
      localStorage.setItem("fxu_access_token", adminToken)
      localStorage.setItem("fxu_user", JSON.stringify(adminUser))
      localStorage.removeItem("fxu_admin_token")
      localStorage.removeItem("fxu_admin_user")
      set({ user: adminUser, role: "admin", isAuthenticated: true, adminToken: null, adminUser: null })
    }
  },

  logout: () => {
    clearTokens()
    localStorage.removeItem("fxu_admin_token")
    localStorage.removeItem("fxu_admin_user")
    set({ user: null, role: null, isAuthenticated: false, adminToken: null, adminUser: null })
  },

  refreshUser: async () => {
    try {
      const data = await api.get("/auth/me")
      localStorage.setItem("fxu_user", JSON.stringify(data))
      set({ user: data, role: data.is_admin ? "admin" : "user" })
    } catch {}
  },
}))
