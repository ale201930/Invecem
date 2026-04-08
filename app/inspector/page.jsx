"use client";

import Image from "next/image";
import { useState, useEffect } from "react"; // 1. Agregamos useEffect
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import Cookies from "js-cookie"; 
import { auth } from "../lib/firebase"; 
import { signOut } from "firebase/auth";

export default function Inspector() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // 2. Estado para el admin
  const router = useRouter(); 

  // 3. Efecto para validar el rol al entrar al componente
  useEffect(() => {
    const role = Cookies.get("user_role");
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
      console.error("Error al cerrar sesión:", error);
    }
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
          <small>Panel Inspector</small>
        </div>

        <nav className="nav-menu">
          <Link href="/inspector" style={{ textDecoration: 'none' }}>
            <li className="nav-item active">🏠 Inicio</li>
          </Link>

          <Link href="/inspector/registro-asistencia" style={{ textDecoration: 'none' }}>
            <li className="nav-item">📝 Registro Asistencia </li>
          </Link>

          <Link href="/inspector/visitantes" style={{ textDecoration: 'none' }}>
            <li className="nav-item">👤 Visitantes </li>
          </Link>

          {/* ↩️ BOTÓN CORREGIDO PARA EL ADMINISTRADOR */}
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

      {/* MAIN */}
      <main className="main-view">
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

      <style jsx>{`
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: url("/img/ins.jpg") no-repeat center center fixed;
    background-size: cover;
    font-family: 'Segoe UI', sans-serif;
  }

  /* SIDEBAR: Ajustado para eliminar el efecto árbol */
  .sidebar {
    width: 260px;
    background: #1a1a1a;
    color: white;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    position: sticky;
    top: 0;
    z-index: 10;
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

  /* CORRECCIÓN MENÚ: Eliminamos el "árbol" con padding 0 */
  .nav-menu {
    list-style: none;
    padding: 0; /* Esto quita el escalonado */
    margin: 20px 0 0 0;
    flex-grow: 1;
  }

  .nav-item {
    margin: 0; /* Quitamos el margen lateral para que ocupe todo el ancho */
    padding: 15px 25px; /* Más espacio interno para que se vea profesional */
    border-radius: 0; /* Rectos para que encajen en el sidebar */
    cursor: pointer;
    color: #aaa;
    transition: 0.3s;
    font-weight: 600;
    border-left: 4px solid transparent;
  }

  .nav-item:hover {
    background: #252525;
    color: #e30613;
    border-left: 4px solid #e30613;
  }

  .active {
    background: #e30613;
    color: white;
    font-weight: bold;
    border-left: 4px solid white;
  }

  /* BOTÓN CERRAR SESIÓN */
  .logout { padding: 20px; }
  .btn-logout {
    border: none;
    color: white;
    background: #e30613;
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 800;
    transition: 0.2s;
    box-shadow: 0 4px 0px #b0050f;
  }

  .btn-logout:hover {
    background: #ff0000;
    transform: translateY(-2px);
    box-shadow: 0 6px 0px #b0050f;
  }

  .main-view { 
    flex: 1; 
    padding: 0; /* Quitamos el padding aquí para que el banner toque los bordes */
    background: rgba(0, 0, 0, 0.05); 
    display: flex;
    flex-direction: column;
  }

  /* CORRECCIÓN BANNER: Bienvenido Inspector (Rojo, letras blancas, delgado) */
  .welcome-card {
    background: #ff0000;
    padding: 12px 40px; /* Delgado */
    margin: 0; /* Sin margen para que sea total */
    border-radius: 0; /* Totalmente recto para los bordes */
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: none;
    width: 100%;
  }

  .welcome-card h1 { 
    margin: 0; 
    color: white; /* Letras blancas */
    font-size: 1.1rem; 
    font-weight: 800; 
    text-transform: uppercase;
  }

  .welcome-card p { 
    margin: 0; 
    color: rgba(255, 255, 255, 0.8); 
    font-weight: 700;
    font-size: 0.9rem;
  }

  /* ÁREA DE CONTENIDO DEBAJO DEL BANNER */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    padding: 30px; /* El padding que quitamos arriba lo ponemos aquí */
  }

  .stat-card {
    background: white;
    padding: 30px;
    border-radius: 20px;
    text-align: center;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    color: #1a1a1a;
    box-shadow: 0 6px 0px #ddd, 0 10px 20px rgba(0,0,0,0.1);
  }

  .stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 0px #ccc;
  }

  @media (max-width: 768px) {
    .sidebar { position: fixed; left: -100%; height: 100%; z-index: 999; }
    .sidebar.open { left: 0; }
  }
`}</style>
    </div>
  );
}