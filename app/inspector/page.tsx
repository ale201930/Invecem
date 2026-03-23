"use client";

import Image from "next/image";
import { useState } from "react";

export default function Inspector() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <small>Panel Inspector</small>
        </div>

        <nav className="nav-menu">
          <li className="nav-item active">🏠 Inicio</li>
          <li className="nav-item">📝 Registro del Personal</li>
          <li className="nav-item">👤 Visitantes Nuevos</li>
        </nav>

        <div className="logout">
          <button className="btn-logout">🚪 Cerrar Sesión</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-view">

        {/* HEADER / BIENVENIDA */}
        <div className="welcome-card">
          <div className="userInfo">
            <Image 
              src="/img/logo.jpg" 
              alt="Usuario"
              width={50}
              height={50}
              className="avatar"
            />
            <div>
              <h1>Bienvenido Inspector 👋</h1>
              <p>Gestión de accesos y visitantes</p>
            </div>
          </div>
        </div>

        
      </main>

      {/* CSS UNIFICADO */}
      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Segoe UI', sans-serif;
        }

        /* SIDEBAR */
        .sidebar {
          width: 260px;
          background: #1a1a1a;
          color: white;
          display: flex;
          flex-direction: column;
          transition: 0.3s;
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
          transition: 0.3s;
        }

        .nav-item:hover {
          background: #e30613;
          color: white;
        }

        .active {
          background: #e30613;
          color: white;
          font-weight: bold;
        }

        /* LOGOUT */
        .logout {
          padding: 20px;
        }

        .btn-logout {
          border: 1px solid #e30613;
          color: #e30613;
          background: transparent;
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
        }

        .btn-logout:hover {
          background: #e30613;
          color: white;
        }

        /* MAIN */
        .main-view {
          flex: 1;
          padding: 40px;
        }

        .welcome-card {
          background: white;
          padding: 25px;
          border-radius: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          margin-bottom: 30px;
        }

        .userInfo {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .avatar {
          border-radius: 50%;
          border: 2px solid #e30613;
          padding: 2px;
        }

        .welcome-card h1 {
          margin: 0;
          color: #1a1a1a;
        }

        .welcome-card p {
          margin: 5px 0 0;
          color: #666;
        }

        /* TARJETAS */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 25px;
        }

        .stat-card {
          background: white;
          padding: 30px;
          border-radius: 20px;
          text-align: center;
          font-weight: bold;
          cursor: pointer;
          transition: 0.3s;
          border: 1px solid #eee;
        }

        .stat-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          border-color: #e30613;
        }

        /* MOBILE */
        .menu-btn {
          display: none;
          position: fixed;
          top: 15px;
          left: 15px;
          z-index: 1000;
          background: #1a1a1a;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          .menu-btn {
            display: block;
          }

          .sidebar {
            position: fixed;
            left: -100%;
            height: 100%;
            z-index: 999;
          }

          .sidebar.open {
            left: 0;
          }

          .main-view {
            padding: 20px;
            margin-top: 50px;
          }
        }
      `}</style>
    </div>
  );
}