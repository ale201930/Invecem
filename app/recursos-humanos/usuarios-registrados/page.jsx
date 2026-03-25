"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase"; 
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";

const ESTADOS_NOMINALES = [
  "Activo (En funciones)",
  "Reposo Médico",
  "Vacaciones",
  "Inactivo"
];

export default function UsuariosRegistrados() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("TODOS");

  useEffect(() => {
    setIsClient(true);
    const q = query(collection(db, "personal"), orderBy("fechaRegistro", "desc"));
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
    const confirmar = window.confirm(`¿Estás seguro de eliminar a ${nombre}?`);
    if (confirmar) {
      try {
        await deleteDoc(doc(db, "personal", id));
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  const cambiarEstatusDirecto = async (id, nuevoEstatus) => {
    try {
      await updateDoc(doc(db, "personal", id), { estatus: nuevoEstatus });
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("No se pudo actualizar el estatus.");
    }
  };

  const irAEditar = (id) => {
    if (!id) return;
    const rutaConParametro = `/recursos-humanos/registro-personal?edit=${id}`;
    router.push(rutaConParametro);
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const texto = busqueda.toLowerCase();
    const coincideBusqueda = 
      u.nombres?.toLowerCase().includes(texto) ||
      u.apellidos?.toLowerCase().includes(texto) ||
      u.ficha?.toLowerCase().includes(texto) ||
      u.cedula?.includes(texto);

    const tipoUser = (u.tipoPersonal || "INVECEM").toUpperCase();
    
    let coincideTipo = true;
    if (filtroTipo === "INVECEM") {
      coincideTipo = tipoUser === "INVECEM";
    } else if (filtroTipo === "INCES") {
      coincideTipo = tipoUser.includes("INCES");
    }

    return coincideBusqueda && coincideTipo;
  });

  // --- FUNCIÓN 1: GENERAR PDF (DESCARGA) ---
  const generarPDF = async () => {
    if (typeof window === "undefined") return;
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(18);
      doc.setTextColor(0, 139, 139); 
      const subTitulo = filtroTipo === "TODOS" ? "GENERAL" : filtroTipo;
      doc.text(`REPORTE DE PERSONAL ${subTitulo} - INVECEM`, 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 28);

      const tableRows = usuariosFiltrados.map(u => [
        u.ficha || "---", 
        u.cedula || "N/A", 
        `${u.nombres} ${u.apellidos}`.toUpperCase(), 
        u.tipoPersonal || "INVECEM",
        u.cargo || "No asignado", 
        u.area || "No asignado",
        u.estatus || "Activo"
      ]);

      autoTable(doc, {
        head: [['Ficha', 'Cédula', 'Nombre Completo', 'ID', 'Cargo', 'Área', 'Estado']],
        body: tableRows,
        startY: 35,
        headStyles: { fillColor: [0, 139, 139], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 247, 250] }
      });

      doc.save(`Reporte_Personal_${filtroTipo}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Error al generar el documento PDF.");
    }
  };

  if (!isClient) return null;

  return (
    <div className="container">
      <div className="header-section no-print">
        <button className="btn-back" onClick={() => router.push("/recursos-humanos")}>
          ← Volver al Panel
        </button>
        <div className="title-wrapper">
          <h1 className="title">Base de Datos de Personal</h1>
          <div className="total-badge">Registros encontrados: {usuariosFiltrados.length}</div>
        </div>
      </div>

      <div className="filters-bar no-print">
        <div className="btn-group">
          <button 
            className={`btn-toggle ${filtroTipo === "TODOS" ? "active" : ""}`}
            onClick={() => setFiltroTipo("TODOS")}
          >TODOS</button>
          <button 
            className={`btn-toggle ${filtroTipo === "INVECEM" ? "active" : ""}`}
            onClick={() => setFiltroTipo("INVECEM")}
          >INVECEM</button>
          <button 
            className={`btn-toggle ${filtroTipo === "INCES" ? "active" : ""}`}
            onClick={() => setFiltroTipo("INCES")}
          >INCES</button>
        </div>

        <input 
          type="text" 
          placeholder="Buscar por nombre, ficha o cédula..." 
          className="search-input"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        
        <div className="actions-buttons">
            <button className="btn-pdf" onClick={generarPDF}>
                Descargar PDF
            </button>
            {/* BOTÓN DE IMPRESIÓN DIRECTA AGREGADO */}
            <button className="btn-print" onClick={() => window.print()}>
                Imprimir Reporte
            </button>
        </div>
      </div>

      {/* Título solo visible al imprimir */}
      <div className="print-only-header">
          <h1>REPORTE DE PERSONAL {filtroTipo} - INVECEM</h1>
          <p>Generado el: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="table-card shadow-relief">
        {loading ? (
          <div className="loader">Sincronizando con base de datos...</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ficha</th>
                  <th>Cédula</th>
                  <th>Nombre y Apellido</th>
                  <th>ID</th> 
                  <th>Cargo</th>
                  <th>Área</th> 
                  <th>Estatus</th>
                  <th className="text-center no-print">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((user) => (
                  <tr key={user.id}>
                    <td className="font-bold">{user.ficha || "---"}</td>
                    <td className="text-slate-500">{user.cedula}</td>
                    <td className="name-text">{user.nombres} {user.apellidos}</td>
                    <td><span className="badge-id">{user.tipoPersonal || "INVECEM"}</span></td>
                    <td className="cargo-text">{user.cargo || "No asignado"}</td>
                    <td className="area-text">{user.area || "No asignado"}</td> 
                    <td>
                      <span className="print-status">{user.estatus || "Activo"}</span>
                      <select 
                        className={`status-select no-print ${user.estatus?.toLowerCase().includes('activo') ? 'border-turquesa' : 'border-rojo'}`}
                        value={user.estatus || "Activo (En funciones)"}
                        onChange={(e) => cambiarEstatusDirecto(user.id, e.target.value)}
                      >
                        {ESTADOS_NOMINALES.map((estado) => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                    </td>
                    <td className="actions-cell no-print">
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
        .container { padding: 20px; max-width: 1450px; margin: 0 auto; background-color: #f8fafc; min-height: 100vh; font-family: sans-serif; }
        .header-section { margin-bottom: 20px; border-left: 5px solid #008b8b; padding-left: 15px; }
        .btn-back { background: none; border: none; color: #64748b; cursor: pointer; margin-bottom: 10px; font-weight: 700; }
        .title { color: #0f172a; font-size: 26px; font-weight: 900; }
        .total-badge { font-weight: 700; color: #008b8b; background: #ccf2f2; padding: 6px 14px; border-radius: 20px; font-size: 12px; display: inline-block; }
        
        .filters-bar { display: flex; gap: 15px; margin-bottom: 25px; align-items: center; background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .actions-buttons { display: flex; gap: 10px; }
        
        .btn-group { display: flex; background: #f1f5f9; padding: 5px; border-radius: 10px; }
        .btn-toggle { border: none; padding: 10px 22px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 800; color: #64748b; }
        .btn-toggle.active { background: #008b8b; color: white; }
        
        .search-input { flex-grow: 1; padding: 12px; border: 2px solid #f1f5f9; border-radius: 10px; outline: none; }
        
        .btn-pdf { background: #0f172a; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 800; cursor: pointer; transition: 0.3s; }
        .btn-print { background: #e30613; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 800; cursor: pointer; transition: 0.3s; }
        .btn-print:hover { background: #c10510; transform: translateY(-2px); }

        .table-card { background: white; border-radius: 15px; border: 1px solid #e2e8f0; }
        .shadow-relief { box-shadow: 10px 10px 0px #008b8b; }
        
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8fafc; padding: 18px 15px; text-align: left; color: #1e293b; font-size: 11px; text-transform: uppercase; border-bottom: 3px solid #008b8b; }
        td { padding: 16px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        
        .font-bold { color: #0f172a; font-weight: 800; }
        .name-text { font-weight: 700; text-transform: uppercase; }
        .cargo-text { font-weight: 700; color: #008b8b; }
        .badge-id { padding: 5px 10px; border-radius: 6px; font-size: 10px; font-weight: 900; background: #f8fafc; border: 1px solid #e2e8f0; }
        
        .status-select { padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer; width: 180px; }
        .border-turquesa { border-left: 6px solid #008b8b; }
        .border-rojo { border-left: 6px solid #e30613; }

        .actions-cell { display: flex; gap: 10px; }
        .btn-edit { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 8px; font-weight: 800; cursor: pointer; }
        .btn-delete { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; padding: 6px 12px; border-radius: 8px; font-weight: 800; cursor: pointer; }
        
        .print-only-header, .print-status { display: none; }

        @media print {
          .no-print { display: none !important; }
          .container { background: white; padding: 0; }
          .shadow-relief { box-shadow: none; border: 1px solid #000; }
          .print-only-header { display: block; text-align: center; margin-bottom: 20px; color: #008b8b; }
          .print-status { display: block; font-weight: bold; }
          table { width: 100%; border: 1px solid #ccc; }
          th { border-bottom: 2px solid #000; background: #eee !important; color: black; }
          td { border-bottom: 1px solid #eee; }
        }
      `}</style>
    </div>
  );
}