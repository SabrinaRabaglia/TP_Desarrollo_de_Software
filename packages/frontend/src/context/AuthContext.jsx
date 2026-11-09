import { createContext, useContext, useEffect, useState } from "react"
import {
  guardarSesion,
  leerSesionGuardada,
  registrarAlPerderSesion,
} from "../service/api"
import { iniciarSesion } from "../service/authService"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [sesion, setSesion] = useState(leerSesionGuardada)

  const cambiarSesion = (nuevaSesion) => {
    guardarSesion(nuevaSesion)
    setSesion(nuevaSesion)
  }

  useEffect(() => {
    registrarAlPerderSesion(() => {
      guardarSesion(null)
      setSesion(null)
    })
  }, [])

  const login = async (email, contrasena) => {
    cambiarSesion(await iniciarSesion(email, contrasena))
  }

  const logout = () => {
    cambiarSesion(null)
  }

  return (
    <AuthContext.Provider value={{ usuario: sesion?.usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
