"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function PanelRecursosHumanos() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="admin-layout">
      {/* BOTÓN MÓVIL */}
      <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      {/* SIDEBAR */}
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
        </nav>

        <div className="logout">
          <button className="btn-logout">🚪 Cerrar Sesión</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-view">
        {/* HEADER */}
        <div className="header">
          <div className="welcome-card">
            <h1>¡Bienvenido al Panel de Control! 👋</h1>
            <p>Sistema de gestión de talento humano y control de asistencia.</p>
          </div>
        </div>

        {/* BANNER DE ACCIÓN RÁPIDA */}
      
       
      </main>

      <style jsx>{`
        .admin-layout { display: flex; min-height: 100vh; background: #f8fafc; font-family: 'Segoe UI', sans-serif; }

        /* SIDEBAR */
        .sidebar { width: 260px; background: #1a1a1a; color: white; display: flex; flex-direction: column; transition: 0.3s; }
        .sidebar-header { text-align: center; padding: 30px 0; border-bottom: 1px solid #333; }
        .title { color: #e30613; margin: 0; font-size: 1.8rem; letter-spacing: 1px; }
        
        .nav-menu { list-style: none; padding: 20px 0; flex-grow: 1; }
        .nav-item { margin: 5px 15px; padding: 12px 15px; border-radius: 10px; cursor: pointer; color: #aaa; transition: 0.3s; }
        .nav-item:hover { background: #e30613; color: white; }
        .active { background: #e30613; color: white; font-weight: bold; }

        /* BOTONES */
        .logout { padding: 20px; }
        .btn-logout { border: 1px solid #e30613; color: #e30613; background: transparent; width: 100%; padding: 10px; border-radius: 10px; cursor: pointer; }
        .btn-logout:hover { background: #e30613; color: white; }

        /* MAIN CONTENT */
        .main-view { flex: 1; padding: 40px; }
        .welcome-card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .welcome-card h1 { margin: 0; color: #1a1a1a; }

        .bannerBox { background: linear-gradient(135deg, #1a1a1a, #e30613); color: white; padding: 30px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; }
        .btn-assign { background: white; color: #1a1a1a; border: none; padding: 12px 25px; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.3s; }
        .btn-assign:hover { transform: scale(1.05); }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 25px; margin-top: 30px; }
        .stat-card { background: white; padding: 30px; border-radius: 20px; cursor: pointer; transition: 0.3s; text-align: center; border: 1px solid #eee; }
        .stat-card:hover { transform: translateY(-10px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); border-color: #e30613; }
        .icon { font-size: 2.5rem; margin-bottom: 15px; }

        /* MOBILE */
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