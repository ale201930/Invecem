"use client";

import Image from "next/image";
import { useState, useEffect } from "react"; // Añadido useEffect
import { useRouter } from "next/navigation"; 
import Cookies from "js-cookie";
import { auth } from "../lib/firebase"; 
import { signOut } from "firebase/auth";

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cargando, setCargando] = useState(true); // Estado para evitar parpadeo de contenido
  const router = useRouter();

  // 🛡️ CANDADO DE SEGURIDAD (PROTECCIÓN DE RUTA)
  useEffect(() => {
    const session = Cookies.get("user_session");
    const role = Cookies.get("user_role");

    // Si no hay sesión o el rol NO es administrador, lo mandamos al login
    if (!session || role !== "administrador") {
      router.push("/login?error=unauthorized");
    } else {
      setCargando(false); // Si todo está bien, mostramos el panel
    }
  }, [router]);

  // 🚪 CERRAR SESIÓN FUNCIONAL
  const handleLogout = async () => {
    try {
      Cookies.remove("user_session");
      Cookies.remove("user_role");
      Cookies.remove("user_name"); // Limpiamos también el nombre
      localStorage.removeItem("rol");
      localStorage.removeItem("user");
      await signOut(auth);
      window.location.href = "/login";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Si está validando la seguridad, no mostramos nada para evitar el "salto" de página
  if (cargando) return null;

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
          <small>Panel Administrativo</small>
        </div>

        <nav className="nav-menu">
          <li className="nav-item active" onClick={() => router.push("/administrador")}>🏠 Inicio</li>
          <li className="nav-item" onClick={() => router.push("/inspector")}>🛡 Inspector</li>
          <li className="nav-item" onClick={() => router.push("/recursos-humanos")}>👥 Recursos Humanos</li>
          <li className="nav-item" onClick={() => router.push("/proteccion-fisica")}>🛡 Protección Física</li>
          
          <li className="nav-item" onClick={() => router.push("/administrador/usuarios")}>
            👤 Usuarios
          </li>
          <li className="nav-item" onClick={() => router.push("/administrador/monitoreo")}>📊 Monitoreo del sistema</li>
          
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
              <h1>Bienvenido Administrador 👋</h1>
              <p>Panel principal del sistema INVECEM</p>
            </div>
          </div>
        </div>

        

      </main>

      <style jsx>{`
        .admin-layout { display: flex; min-height: 100vh; background: #f8fafc; font-family: 'Segoe UI', sans-serif; }
        .sidebar { width: 260px; background: #1a1a1a; color: white; display: flex; flex-direction: column; transition: 0.3s; }
        .sidebar-header { text-align: center; padding: 30px 0; border-bottom: 1px solid #333; }
        .title { color: #e30613; margin: 0; font-size: 1.8rem; }
        .nav-menu { list-style: none; padding: 20px 0; flex-grow: 1; }
        .nav-item { margin: 5px 15px; padding: 12px 15px; border-radius: 10px; cursor: pointer; color: #aaa; transition: 0.3s; }
        .nav-item:hover { background: #e30613; color: white; }
        .active { background: #e30613; color: white; font-weight: bold; }
        .logout { padding: 20px; }
        .btn-logout { border: 1px solid #e30613; color: #e30613; background: transparent; width: 100%; padding: 10px; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.3s; }
        .btn-logout:hover { background: #e30613; color: white; }
        .main-view { flex: 1; padding: 40px; }
        .welcome-card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .userInfo { display: flex; align-items: center; gap: 15px; }
        .avatar { border-radius: 50%; border: 2px solid #e30613; padding: 2px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .stat-card { background: white; padding: 30px; border-radius: 20px; text-align: center; cursor: pointer; transition: 0.3s; border: 1px solid #eee; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
        .stat-card h3 { margin: 15px 0 5px; color: #1a1a1a; font-size: 1.1rem; }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); border-color: #e30613; }
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