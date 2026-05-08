"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase"; 
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc
} from "firebase/firestore";

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState("");
  const router = useRouter();

  // 1. CARGA EN TIEMPO REAL
  useEffect(() => {
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef); 
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setUsuarios(docs);
    }, (error) => {
      console.error("Error en Snapshot:", error);
    });
    
    return () => unsubscribe();
  }, []);

  // 2. FILTRADO PARA LA BARRA DE BÚSQUEDA
  const usuariosFiltrados = usuarios.filter(u => 
    u.nombres?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.ficha?.includes(filtro) ||
    u.cedula?.includes(filtro) ||
    u.rol?.toLowerCase().includes(filtro.toLowerCase())
  );

  const eliminarUsuario = async (id, nombreUser) => {
    if (confirm(`¿Eliminar a ${nombreUser}?\nEsta acción borrará sus datos de la base de datos.`)) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const toggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";
    try {
      await updateDoc(doc(db, "usuarios", id), { estado: nuevoEstado });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="container-usuarios">
      {/* HEADER SUPERIOR */}
      <header className="header-top shadow">
        <div className="header-info">
          
          <div>
            
            <p>Gestión de Usuarios </p>
          </div>
        </div>
        <button className="btn-volver" onClick={() => router.push("/administrador")}>
          ⬅ Volver
        </button>
      </header>

      <main className="main-content">
        <div className="action-bar">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por Nombre, Ficha, Rol, Departamento..." 
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
          <button className="btn-registrar" onClick={() => router.push("/administrador/usuarios/nuevo-usuario")}>
            + Registrar Nuevo
          </button>
        </div>

        <div className="card shadow mt-20">
          <div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ESTATUS</th>
                  <th>FICHA</th>
                  <th>CÉDULA</th>
                  <th>NOMBRES Y APELLIDOS</th>
                  <th>CARGO / DEPARTAMENTO</th>
                  <th>ROL</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className={`status-pill ${user.estado === "Activo" ? "active" : "inactive"}`}>
                        ● {user.estado || "Activo"}
                      </span>
                    </td>
                    <td className="bold-blue">{user.ficha || "N/A"}</td>
                    <td>{user.cedula}</td>
                    <td>{user.nombres || user.usuario}</td>
                    <td>
                      <div className="cargo-main">{user.cargo || "Sin cargo"}</div>
                      <div className="unidad-sub">{user.departamento || "Sin unidad"}</div>
                    </td>
                    <td>
                      <span className="role-tag">{user.rol}</span>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="btn-icon view" 
                        title="Ver Perfil"
                        onClick={() => router.push(`/administrador/usuarios/ver?id=${user.id}`)}
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-icon edit" 
                        title="Editar"
                        onClick={() => router.push(`/administrador/usuarios/editar?id=${user.id}`)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon block" 
                        onClick={() => toggleEstado(user.id, user.estado)}
                        title="Bloquear/Activar"
                      >
                        🚫
                      </button>
                      <button 
                        className="btn-icon delete" 
                        onClick={() => eliminarUsuario(user.id, user.nombres)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <style jsx>{`
  /* --- WRAPPER Y FONDO (SIN CAMBIOS) --- */
  .container-usuarios { 
    min-height: 100vh; 
    background-color: #f0f4f8; 
    background-image: radial-gradient(#d1d5db 0.8px, transparent 0.8px);
    background-size: 24px 24px;
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center; 
  }

  
  /* 1. El contenedor padre debe ser relativo para anclar el botón */
  .header-top { 
    width: 100%;
    background: #fff; 
    padding: 20px 0; 
    display: flex; 
    justify-content: center; /* Esto mantiene el título centrado */
    align-items: center;
    border-bottom: 4px solid #e30613; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    position: relative; 
  }

  .header-inner {
    width: 100%;
    max-width: 1400px;
    display: flex;
    justify-content: center; /* Centrado absoluto del título */
    align-items: center;
    padding: 0 40px;
    position: relative;
  }

  /* 2. El botón ahora se posiciona de forma independiente */
  .btn-volver {
    position: absolute; /* Lo saca del flujo para que no empuje al título */
    left: 40px;        /* Lo pega a la izquierda */
    background: #f8fafc;
    color: #64748b;
    border: 2px solid #e2e8f0;
    padding: 10px 20px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: 0.3s;
    z-index: 10;
  }

  .btn-volver:hover {
    background: #0f172a;
    color: white;
    border-color: #0f172a;
  }

  /* 3. Título centrado y más imponente */
  .header-info h1 { 
    margin: 0; 
    color: #000000; 
    font-size: 1.8rem; 
    font-weight: 900; 
    text-transform: uppercase;
    letter-spacing: 2px;
    text-align: center;
  }


  /* --- TÍTULO GRANDE Y CENTRADO --- */
  .header-center { 
    text-align: center; 
  }

  .header-info h1 { 
    margin: 0; 
    color: #0f172a; 
    font-size: 1.8rem; /* Más grande y llamativo */
    font-weight: 900; 
    text-transform: uppercase;
    letter-spacing: 2px; /* Letras más separadas y estéticas */
    line-height: 1.2;
    background: linear-gradient(to bottom, #0f172a, #334155);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* --- ESPACIO DERECHO (VACÍO PARA EL LOGO SI LO USAS LUEGO) --- */
  .header-right { 
    position: absolute;
    right: 40px;
  }

  /* --- EL RESTO DE TU CÓDIGO PERMANECE IGUAL (SIN MOVIMIENTOS) --- */
  .action-bar { 
    display: flex; 
    justify-content: space-between; 
    gap: 15px; 
    margin: 40px 0 25px 0; 
    width: 100%;
    max-width: 1100px; 
    padding: 20px; 
    background: white;
    border-radius: 18px;
    border: 1px solid #e2e8f0;
    align-items: center;
    box-sizing: border-box;
  }

  .search-container { position: relative; flex: 1; }
  .search-container input { 
    width: 100%; 
    padding: 12px 12px 12px 45px; 
    border: 2px solid #f1f5f9; 
    border-radius: 12px; 
    font-weight: 600;
    outline: none;
    transition: 0.3s;
  }

  .btn-registrar { 
    background: #e30613; 
    color: white; 
    border: none; 
    padding: 12px 25px; 
    border-radius: 10px; 
    font-weight: 900; 
    font-size: 12px;
    text-transform: uppercase;
    cursor: pointer; 
    box-shadow: 0 4px 0px #b8050f;
  }

  .main-content { 
    width: 100%;
    max-width: 1100px; 
    padding: 0 20px 40px 20px; 
  }

  .card { 
    background: white; 
    border-radius: 24px; 
    border: 1px solid #e2e8f0;
    box-shadow: 10px 10px 0px #0f172a; 
    overflow: hidden;
  }
  
  .user-table { width: 100%; border-collapse: collapse; }
  .user-table th { 
    background: #f8fafc; 
    padding: 18px; 
    font-size: 10px; 
    color: #94a3b8; 
    text-transform: uppercase; 
    font-weight: 900;
    border-bottom: 3px solid #e30613; 
    text-align: center;
  }

  .user-table td { 
    padding: 15px; 
    border-bottom: 1px solid #f1f5f9; 
    font-size: 0.85rem; 
    color: #1e293b;
    text-align: center;
  }

  .status-pill { 
    padding: 4px 10px; 
    border-radius: 8px; 
    font-size: 9px; 
    font-weight: 900; 
    text-transform: uppercase;
    display: inline-block;
  }
  .active { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .inactive { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

  .actions-cell { display: flex; gap: 8px; justify-content: center; }
  .btn-icon { 
    background: white; 
    border: 1px solid #e2e8f0; 
    padding: 7px; 
    border-radius: 8px; 
    cursor: pointer; 
  }
`}</style>
    </div>
  );
}