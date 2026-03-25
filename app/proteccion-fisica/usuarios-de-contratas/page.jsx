"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase"; 
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";

const ESTADOS_ACCESO = [
  "Activo (Acceso Permitido)",
  "Suspendido",
  "Inactivo"
];

export default function UsuariosContratas() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const q = query(collection(db, "contratistas"), orderBy("fechaRegistro", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsuarios(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEliminar = async (id, nombre) => {
    if (window.confirm(`¿Eliminar a ${nombre} de la base de datos de contratas?`)) {
      try {
        await deleteDoc(doc(db, "contratistas", id));
      } catch (error) {
        alert("Error: " + error.message);
      }
    }
  };

  const cambiarEstatus = async (id, nuevoEstatus) => {
    try {
      await updateDoc(doc(db, "contratistas", id), { estadoNominal: nuevoEstatus });
    } catch (error) {
      alert("No se pudo actualizar el estatus.");
    }
  };

  // FUNCIÓN PARA REDIRIGIR AL REGISTRO EN MODO EDICIÓN
  const irAEditar = (id) => {
    if (!id) return;
    router.push(`/proteccion-fisica/registro-de-contratas?edit=${id}`);
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const texto = busqueda.toLowerCase();
    return (
      u.nombres?.toLowerCase().includes(texto) ||
      u.apellidos?.toLowerCase().includes(texto) ||
      u.cedula?.includes(texto) ||
      u.nombreContrata?.toLowerCase().includes(texto)
    );
  });

  if (!isClient) return null;

  return (
    <div className="container">
      <div className="header-section no-print">
        <button className="btn-back" onClick={() => router.push("/proteccion-fisica")}>
          ← Volver al Panel
        </button>
        <div className="title-wrapper">
          <h1 className="title">Base de Datos de Contratas</h1>
          <div className="total-badge">Personal Externo: {usuariosFiltrados.length}</div>
        </div>
      </div>

      <div className="filters-bar no-print">
        <input 
          type="text" 
          placeholder="Buscar por nombre, cédula o empresa contrata..." 
          className="search-input"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button className="btn-print" onClick={() => window.print()}>Imprimir Lista</button>
      </div>

      <div className="table-card shadow-relief">
        {loading ? (
          <div className="loader">Cargando base de datos...</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre y Apellido</th>
                  <th>Contrata</th>
                  <th>Área</th> 
                  <th>Estatus Acceso</th>
                  <th className="text-center no-print">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((user) => (
                  <tr key={user.id}>
                    <td className="font-bold">{user.cedula}</td>
                    <td className="name-text">{user.nombres} {user.apellidos}</td>
                    <td><span className="badge-contrata">{user.nombreContrata}</span></td>
                    <td className="area-text">{user.areaTrabajo}</td> 
                    <td>
                      <select 
                        className={`status-select ${user.estadoNominal?.includes('Activo') ? 'border-turquesa' : 'border-rojo'}`}
                        value={user.estadoNominal || "Activo (Acceso Permitido)"}
                        onChange={(e) => cambiarEstatus(user.id, e.target.value)}
                      >
                        {ESTADOS_ACCESO.map((est) => (
                          <option key={est} value={est}>{est}</option>
                        ))}
                      </select>
                    </td>
                    <td className="actions-cell no-print">
                      {/* BOTÓN EDITAR AGREGADO */}
                      <button className="btn-edit" onClick={() => irAEditar(user.id)}>Editar</button>
                      <button className="btn-delete" onClick={() => handleEliminar(user.id, user.nombres)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .container { padding: 20px; max-width: 1400px; margin: 0 auto; min-height: 100vh; font-family: sans-serif; }
        .header-section { margin-bottom: 20px; border-left: 5px solid #008b8b; padding-left: 15px; }
        .btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-weight: 700; margin-bottom: 10px; }
        .title { color: #0f172a; font-size: 24px; font-weight: 900; margin: 0; }
        .total-badge { color: #008b8b; background: #ccf2f2; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 5px; }
        .filters-bar { display: flex; gap: 15px; margin-bottom: 20px; background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .search-input { flex-grow: 1; padding: 12px; border: 2px solid #f1f5f9; border-radius: 10px; outline: none; }
        .btn-print { background: #e30613; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 800; cursor: pointer; }
        .table-card { background: white; border-radius: 15px; border: 1px solid #e2e8f0; }
        .shadow-relief { box-shadow: 8px 8px 0px #008b8b; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8fafc; padding: 15px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 3px solid #008b8b; }
        td { padding: 14px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .font-bold { font-weight: 800; color: #0f172a; }
        .name-text { font-weight: 700; text-transform: uppercase; }
        .badge-contrata { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid #cbd5e1; }
        .area-text { color: #008b8b; font-weight: 700; }
        .status-select { padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 700; width: 100%; }
        .border-turquesa { border-left: 4px solid #008b8b; }
        .border-rojo { border-left: 4px solid #e30613; }
        
        .actions-cell { display: flex; gap: 8px; }
        .btn-edit { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 6px; font-weight: 800; cursor: pointer; }
        .btn-delete { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; padding: 6px 12px; border-radius: 6px; font-weight: 800; cursor: pointer; }
        
        @media print { .no-print { display: none; } .shadow-relief { box-shadow: none; border: 1px solid #000; } }
      `}</style>
    </div>
  );
}