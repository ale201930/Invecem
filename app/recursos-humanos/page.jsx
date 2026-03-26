"use client";

import React, { useState, useEffect } from "react"; // 1. Agregamos useEffect
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { auth } from "../lib/firebase"; 
import { signOut } from "firebase/auth";

export default function PanelRecursosHumanos() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // 2. Estado para controlar la visibilidad
  const router = useRouter();

  // 3. Efecto para leer la cookie al cargar el componente
  useEffect(() => {
    const role = Cookies.get("user_role");
    // Validamos tanto "admin" como "administrador"
    if (role === "admin" || role === "administrador") {
      setIsAdmin(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      Cookies.remove("user_session");
      Cookies.remove("user_role");
      localStorage.removeItem("rol");
      localStorage.removeItem("user");
      await signOut(auth);
      window.location.href = "/login";
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  return (
    <div className="admin-layout">
      <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 className="title">INVECEM</h2>
          <small>Gestión de RRHH</small>
        </div>

        <nav className="nav-menu">
          <li className="nav-item active" onClick={() => router.push("/recursos-humanos")}>
            🏠 Inicio
          </li>

          <li className="nav-item" onClick={() => router.push("/recursos-humanos/registro-personal")}>
            📝 Registrar Personal
          </li>

          <li className="nav-item" onClick={() => router.push("/recursos-humanos/usuarios-registrados")}>
            👥 Usuarios Registrados
          </li>

          <li className="nav-item" onClick={() => router.push("/recursos-humanos/asistencia-del-dia")}>
            📅 Asistencia del Día
          </li>

          <li className="nav-item" onClick={() => router.push("/recursos-humanos/reporte-general")}>
            📊 Reportes General
          </li>

          {/* ↩️ BOTÓN CORREGIDO USANDO EL ESTADO isAdmin */}
          {isAdmin && (
            <li 
              className="nav-item return-admin-btn" 
              onClick={() => router.push("/administrador")}
            >
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

      <main className="main-view">
        <div className="header">
          <div className="welcome-card">
            <h1>¡Bienvenido al Panel de Control! 👋</h1>
            <p>Sistema de gestión de talento humano y control de asistencia.</p>
          </div>
        </div>
      </main>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-image: url("/img/recursos1.jpg");
          background-position: 120% center; 
          background-repeat: no-repeat;
          background-size: cover; 
          background-attachment: fixed;
          background-color: #ffffff;
        }
        .sidebar {
          width: 260px;
          background: #1a1a1a;
          color: white;
          display: flex;
          flex-direction: column;
          transition: 0.3s;
          z-index: 10;
          box-shadow: 4px 0 10px rgba(0,0,0,0.3);
        }
        .sidebar-header {
          text-align: center;
          padding: 30px 0;
          border-bottom: 1px solid #333;
        }
        .title {
          color: #e30613;
          margin: 0;
          font-size: 1.8rem;
          font-weight: 800;
        }
        .nav-menu {
          list-style: none;
          padding: 20px 0;
          flex-grow: 1;
        }
        .nav-item {
          margin: 5px 15px;
          padding: 12px 15px;
          border-radius: 10px;
          cursor: pointer;
          color: #aaa;
          font-weight: 500;
          transition: 0.2s;
        }
        .nav-item:hover, .active {
          background: #e30613;
          color: white;
        }
        .return-admin-btn {
          margin-top: 20px !important;
          border: 1px dashed #e30613 !important;
          color: #e30613 !important;
          font-weight: bold;
          text-align: center;
        }
        .return-admin-btn:hover {
          background: #e30613 !important;
          color: white !important;
        }
        .logout { padding: 20px; }
        .btn-logout {
          border: 2px solid #e30613;
          color: #e30613;
          background: transparent;
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: bold;
          transition: 0.3s;
        }
        .btn-logout:hover {
          background: #e30613;
          color: white;
        }
        .main-view {
          flex: 1;
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .welcome-card {
          background: #e30613;
          padding: 12px 30px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 900px;
        }
        .welcome-card h1 {
          color: #000000 !important;
          font-size: 18px;
          margin: 0 0 4px 0;
          font-weight: 800;
        }
        .welcome-card p {
          color: #000000 !important;
          margin: 0;
          font-size: 13px;
          font-weight: 500;
        }
        .menu-btn {
          display: none;
          position: fixed;
          top: 15px;
          left: 15px;
          z-index: 1000;
          background: #1a1a1a;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 8px;
        }
        @media (max-width: 768px) {
          .menu-btn { display: block; }
          .sidebar { position: fixed; left: -100%; height: 100%; }
          .sidebar.open { left: 0; }
          .main-view { padding: 20px; margin-top: 60px; }
        }
      `}</style>
    </div>
  );
}