"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function ProteccionFisica() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("");

  const router = useRouter();
  const pathname = usePathname();

  // 🔥 CARGA DE DATOS DE USUARIO (IGUAL QUE LOS OTROS)
  useEffect(() => {
    const obtenerDatos = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNombreUsuario(docSnap.data().nombres);
        }
      }
    };
    obtenerDatos();

    const role = Cookies.get("user_role");
    if (role === "admin" || role === "administrador") {
      setIsAdmin(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      Cookies.remove("user_session");
      Cookies.remove("user_role");
      localStorage.clear();
      await signOut(auth);
      window.location.href = "/login";
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  return (
    <div className="admin-layout">
      {/* BOTÓN MÓVIL */}
      <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      {/* SIDEBAR NEGRO */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 className="title">INVECEM</h2>
          <small>Protección Física</small>
          </div>

        <nav className="nav-menu">
          <li className={`nav-item ${pathname === "/proteccion-fisica" ? "active" : ""}`} onClick={() => router.push("/proteccion-fisica")}>
            🏠 Inicio
          </li>

          <li className="nav-item perfil-item" onClick={() => router.push("/perfil")}>
            ⚙️ Mi Perfil
          </li>

          <li className={`nav-item ${pathname === "/proteccion-fisica/registro-de-contratas" ? "active" : ""}`} onClick={() => router.push("/proteccion-fisica/registro-de-contratas")}>
            📝 Registro de contratas
          </li>

          <li className={`nav-item ${pathname === "/proteccion-fisica/usuarios-de-contratas" ? "active" : ""}`} onClick={() => router.push("/proteccion-fisica/usuarios-de-contratas")}>
            👥 Usuarios de contratas
          </li>

          <li className={`nav-item ${pathname === "/proteccion-fisica/asistencia-del-dia" ? "active" : ""}`} onClick={() => router.push("/proteccion-fisica/asistencia-del-dia")}>
            📅 Asistencia del Día
          </li>

          {isAdmin && (
            <li className="nav-item return-admin-btn" onClick={() => router.push("/administrador")}>
              ⬅ Volver al Panel Admin
            </li>
          )}
        </nav>

        <div className="logout">
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="main-view">
        <div className="welcome-card">
          <div className="userInfo">
            <Image 
              src="/img/logo.jpg" 
              alt="Logo"
              width={45}
              height={45}
              className="avatar"
            />
            <div>
              <h1>Bienvenido, {nombreUsuario || "Usuario"} 👋</h1>
              <p>
                Has ingresado al Panel del sistema INVECEM como{" "}
                <strong>Protección Física</strong>
              </p>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: url("/img/ins.jpg") no-repeat center center fixed;
          background-size: cover;
          font-family: 'Segoe UI', sans-serif;
        }

        .sidebar {
          width: 260px; 
          background: #1a1a1a; 
          color: white; 
          display: flex; 
          flex-direction: column; 
          transition: 0.3s; 
          flex-shrink: 0;
          padding-top: 20px; 
        }

        .sidebar-header { text-align: center; padding: 20px 0; border-bottom: 1px solid #333; }
        .title { color: #e30613; margin: 0; font-size: 1.8rem; font-weight: bold; }
        
        .user-badge {
          margin: 15px 20px 0;
          background: rgba(227, 6, 19, 0.1);
          padding: 8px;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #eee;
          border-left: 3px solid #e30613;
        }

        .nav-menu { list-style: none; padding: 20px 0; flex-grow: 1; }
        .nav-item { margin: 5px 15px; padding: 12px 15px; border-radius: 10px; cursor: pointer; color: #aaa; transition: 0.3s; }
        .nav-item:hover { background: #e30613; color: white; }
        .active { background: #e30613; color: white; font-weight: bold; }
        
        .perfil-item { border: 1px dashed #e30613; margin-bottom: 15px; color: #fff; }

        .logout { padding: 20px; }
        .btn-logout { border: 1px solid #e30613; color: #e30613; background: transparent; width: 100%; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-logout:hover { background: #e30613; color: white; }

        .main-view { flex: 1; padding: 40px; display: flex; flex-direction: column; align-items: flex-start; }

        .welcome-card {
          background: white;
          padding: 20px 30px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 800px;
          margin-top: 10px;
        }

        .welcome-card h1 { color: #e30613; margin: 0; font-size: 1.6rem; }
        .welcome-card p { color: #444; margin: 5px 0 0 0; font-size: 0.95rem; }
        .userInfo { display: flex; align-items: center; gap: 20px; }
        .avatar { border-radius: 8px; border: 1px solid #ddd; }

        .menu-btn { display: none; position: fixed; top: 15px; left: 15px; z-index: 1000; background: #1a1a1a; color: white; border: none; padding: 10px; border-radius: 8px; }

        @media (max-width: 768px) {
          .menu-btn { display: block; }
          .sidebar { position: fixed; left: -100%; height: 100%; z-index: 999; }
          .sidebar.open { left: 0; }
          .main-view { padding: 20px; margin-top: 50px; }
        }
      `}</style>
    </div>
  );
}