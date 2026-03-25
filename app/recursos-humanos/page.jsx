"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function PanelRecursosHumanos() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // 🚪 CERRAR SESIÓN (SIMPLE Y SEGURO)
  const handleLogout = () => {
    localStorage.removeItem("rol");
    localStorage.removeItem("user");
    router.push("/login");
  };

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
          <li
            className="nav-item active"
            onClick={() => router.push("/recursos-humanos")}
          >
            🏠 Inicio
          </li>

          <li
            className="nav-item"
            onClick={() =>
              router.push("/recursos-humanos/registro-personal")
            }
          >
            📝 Registrar Personal
          </li>

          <li
            className="nav-item"
            onClick={() =>
              router.push("/recursos-humanos/usuarios-registrados")
            }
          >
            👥 Usuarios Registrados
          </li>

          <li
            className="nav-item"
            onClick={() =>
              router.push("/recursos-humanos/asistencia-del-dia")
            }
          >
            📅 Asistencia del Día
          </li>

          <li
            className="nav-item"
            onClick={() =>
              router.push("/recursos-humanos/reporte-general")
            }
          >
            📊 Reportes General
          </li>
        </nav>

        {/* 🔥 LOGOUT FUNCIONANDO */}
        <div className="logout">
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-view">
        <div className="header">
          <div className="welcome-card">
            <h1>¡Bienvenido al Panel de Control! 👋</h1>
            <p>
              Sistema de gestión de talento humano y control de asistencia.
            </p>
          </div>
        </div>
      </main>

      {/* CSS */}
    <style jsx>{`
  .admin-layout {
    display: flex;
    min-height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-image: url("/img/recursos1.jpg");
    
    /* --- MOVIMIENTO A LA DERECHA --- */
    background-position: 120% center; /* 120% empuja el logo más a la derecha */
    background-repeat: no-repeat;
    background-size: cover; 
    background-attachment: fixed;
    background-color: #ffffff; /* Evita huecos si la imagen se mueve mucho */
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

  .logout {
    padding: 20px;
  }

  .btn-logout {
    border: 2px solid #e30613;
    color: #e30613;
    background: transparent;
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
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
    align-items: flex-start; /* Alinea el contenido a la izquierda */
  }

  /* TARJETA BIENVENIDO: LARGA, FINITA Y ELEGANTE */
  .welcome-card {
    background: #e30613; /* Rojo corporativo */
    padding: 12px 30px; /* Finite vertical, Ancho horizontal */
    border-radius: 15px; /* Bordes redondeados pero elegantes */
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    width: 100%; /* Ocupa todo el ancho disponible */
    max-width: 900px; /* Tamaño máximo largo */
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .welcome-card h1 {
    color: #000000 !important; /* Letras negras */
    font-size: 18px; /* Texto más pequeño y fino */
    margin: 0 0 4px 0;
    font-weight: 800;
  }

  .welcome-card p {
    color: #000000 !important; /* Letras negras */
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
    .menu-btn {
      display: block;
    }

    .sidebar {
      position: fixed;
      left: -100%;
      height: 100%;
    }

    .sidebar.open {
      left: 0;
    }

    .main-view {
      padding: 20px;
      margin-top: 60px;
    }

    .welcome-card {
      width: calc(100% - 20px);
      margin: 0 auto;
    }
  }
`}</style>
    </div>
  );
}