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
          <Image src="/img/logo.jpg" alt="Logo" width={50} height={50} className="avatar" />
          <div>
            <h1>INVECEM</h1>
            <p>Gestión de Personal y Control de Asistencia</p>
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
        .container-usuarios { min-height: 100vh; background: #f8fafc; }
        .header-top { background: #fff; padding: 15px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #e30613; }
        .header-info h1 { margin: 0; color: #1e3a8a; font-size: 1.3rem; font-weight: 800; }
        
        .action-bar { display: flex; justify-content: space-between; gap: 20px; margin-top: 30px; max-width: 1200px; margin-left: auto; margin-right: auto; padding: 0 20px; }
        .search-container { position: relative; flex: 1; }
        .search-icon { position: absolute; left: 15px; top: 12px; color: #94a3b8; }
        .search-container input { width: 100%; padding: 12px 12px 12px 45px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; }
        
        .btn-registrar { background: #1e3a8a; color: white; border: none; padding: 0 25px; border-radius: 10px; font-weight: bold; cursor: pointer; transition: 0.3s; }
        .btn-registrar:hover { background: #172554; }

        .main-content { max-width: 1240px; margin: 0 auto; padding: 20px; }
        .card { background: white; border-radius: 15px; overflow: hidden; }
        
        .user-table { width: 100%; border-collapse: collapse; text-align: left; }
        .user-table th { background: #f8fafc; padding: 15px; font-size: 0.75rem; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #edf2f7; }
        .user-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; vertical-align: middle; }

        .status-pill { padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
        .active { background: #dcfce7; color: #166534; }
        .inactive { background: #fee2e2; color: #991b1b; }

        .bold-blue { color: #1e3a8a; font-weight: 800; font-family: 'monospace'; font-size: 1rem; }
        .cargo-main { font-weight: bold; color: #1e293b; }
        .unidad-sub { font-size: 0.75rem; color: #94a3b8; }
        
        .role-tag { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; }

        .actions-cell { display: flex; gap: 8px; }
        .btn-icon { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; min-width: 35px; }
        .btn-icon:hover { transform: scale(1.1); background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        
        .view { color: #64748b; }
        .edit { color: #f59e0b; }
        .block { color: #ef4444; }
        .delete { color: #94a3b8; }
        
        .shadow { box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .mt-20 { margin-top: 20px; }
      `}</style>
    </div>
  );
}