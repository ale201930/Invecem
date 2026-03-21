"use client";

import Image from "next/image";

export default function Dashboard() {
  return (
    <div className="layout">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2 className="logo">System-Control</h2>
        <nav>
          <a className="active">Inicio</a>
          <a>Inspector</a>
          <a>Recursos Humanos</a>
          <a>Protección Física</a>
          <a>Usuarios</a>
          <a>Reportes</a>
          <button className="logout">Cerrar sesión</button>
        </nav>
      </aside>

      {/* CONTENIDO */}
      <main className="content">

        {/* HEADER */}
        <header className="header">
          <div className="userInfo">
            <Image 
              src="/img/logo.jpg" 
              alt="Usuario"
              width={50}
              height={50}
              className="avatar"  // 🔥 AQUÍ ESTÁ EL CAMBIO
            />
            <div>
              <strong>Bienvenido Administrador</strong>
             
            </div>
          </div>

          
        </header>

        
        

      </main>

      {/* CSS */}
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', sans-serif;
        }

        .layout {
          display: flex;
          min-height: 100vh;
        }

        /* Sidebar */
        .sidebar {
          width: 240px;
          background-color: #2f2f2f;
          color: #fff;
          padding: 15px;
        }

        .logo {
          text-align: center;
          color: #e30613;
          margin-bottom: 30px;
          font-size: 1.8rem;
          font-weight: bold;
        }

        .sidebar nav a {
          display: block;
          padding: 12px;
          margin-bottom: 10px;
          color: #ddd;
          text-decoration: none;
          border-radius: 6px;
          transition: 0.3s;
        }

        .sidebar nav a:hover,
        .sidebar nav .active {
          background-color: #e30613;
          color: #fff;
        }

        /* Content */
        .content {
          flex: 1;
          padding: 20px;
          background-image: url('/img/fondoA.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
          padding: 15px 25px;
          border-radius: 10px;
          margin-bottom: 25px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        .userInfo {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        /* 🔥 LOGO REDONDO */
        .avatar {
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e30613;
          padding: 2px;
        }

        .userInfo span {
          font-size: 13px;
          color: #666;
        }

        /* Logout */
        .logout {
          background-color: #e30613;
          color: #fff;
          border: none;
          padding: 10px 18px;
          border-radius: 6px;
          cursor: pointer;
          transition: 0.3s;
        }

        .logout:hover {
          background-color: #b8040f;
        }

        .dashboard h1 {
         margin-bottom: 25px;
         color: #000;        /* negro */
         font-size: 2.5rem;  /* más grande */
         font-weight: bold;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .card {
          background: #fff;
          padding: 30px;
          text-align: center;
          border-radius: 12px;
          font-weight: bold;
          color: #444;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          transition: transform 0.3s;
        }

        .card:hover {
          transform: translateY(-5px);
          border-top: 5px solid #e30613;
        }
      `}</style>

    </div>
  );
}