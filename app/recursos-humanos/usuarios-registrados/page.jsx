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

// Clave de acceso para datos privados (Cámbiala según tu preferencia)
const PIN_RRHH = "1234";

export default function UsuariosRegistrados() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("TODOS");

  // --- ESTADOS PARA EL MODAL DE FECHAS ---
  const [showModal, setShowModal] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [usuarioParaEstado, setUsuarioParaEstado] = useState(null);
  const [fechas, setFechas] = useState({ inicio: "", fin: "" });

  // --- ESTADOS PARA EXPEDIENTE (HISTORIAL) ---
  const [showExpediente, setShowExpediente] = useState(false);
  const [usuarioExpediente, setUsuarioExpediente] = useState(null);

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

  // --- FUNCIÓN PARA VER HISTORIAL CON PROTECCIÓN ---
  const manejarAccesoExpediente = (user) => {
    const pin = prompt("🔐 SEGURIDAD INVECEM: Ingrese clave de Recursos Humanos para ver datos privados:");
    if (pin === PIN_RRHH) {
      setUsuarioExpediente(user);
      setShowExpediente(true);
    } else if (pin !== null) {
      alert("❌ Clave incorrecta. Acceso denegado.");
    }
  };

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

  const handleCambioEstatus = (user, nuevoEstatus) => {
    if (nuevoEstatus === "Vacaciones" || nuevoEstatus === "Reposo Médico") {
      setUsuarioParaEstado(user);
      setTipoSeleccionado(nuevoEstatus);
      setShowModal(true);
    } else {
      cambiarEstatusFirebase(user.id, nuevoEstatus, null, null);
    }
  };

  const guardarEstadoEspecial = async () => {
    if (!fechas.inicio || !fechas.fin) {
      alert("Por favor, selecciona ambas fechas.");
      return;
    }
    await cambiarEstatusFirebase(usuarioParaEstado.id, tipoSeleccionado, fechas.inicio, fechas.fin);
    setShowModal(false);
    setFechas({ inicio: "", fin: "" });
  };

  const cambiarEstatusFirebase = async (id, nuevoEstatus, inicio, fin) => {
    try {
      await updateDoc(doc(db, "personal", id), { 
        estatus: nuevoEstatus, 
        estado: nuevoEstatus.includes("Activo") ? "Activo" : nuevoEstatus,
        fechaSalida: inicio || null,
        fechaRegreso: fin || null
      });
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
    } else if (filtroTipo === "PASANTES") {
      coincideTipo = tipoUser === "PASANTE";
    }

    return coincideBusqueda && coincideTipo;
  });

  const generarPDF = async () => {
    if (typeof window === "undefined") return;
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const docPdf = new jsPDF('l', 'mm', 'a4');
      docPdf.setFontSize(18);
      docPdf.setTextColor(0, 139, 139); 
      const subTitulo = filtroTipo === "TODOS" ? "GENERAL" : filtroTipo;
      docPdf.text(`REPORTE DE PERSONAL ${subTitulo} - INVECEM`, 14, 20);
      docPdf.setFontSize(10);
      docPdf.setTextColor(100);
      docPdf.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 28);

      const tableRows = usuariosFiltrados.map(u => [
        u.ficha || "---", 
        u.cedula || "N/A", 
        `${u.nombres} ${u.apellidos}`.toUpperCase(), 
        u.tipoPersonal || "INVECEM",
        u.cargo || "No asignado", 
        u.area || "No asignado",
        u.estatus || "Activo"
      ]);

      autoTable(docPdf, {
        head: [['Ficha', 'Cédula', 'Nombre Completo', 'ID', 'Cargo', 'Área', 'Estado']],
        body: tableRows,
        startY: 35,
        headStyles: { fillColor: [0, 139, 139], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 247, 250] }
      });

      docPdf.save(`Reporte_Personal_${filtroTipo}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Error al generar el documento PDF.");
    }
  };

  if (!isClient) return null;

  return (
    <div className="container">
      
      {/* --- MODAL EXPEDIENTE (HISTORIAL) --- */}
      {showExpediente && usuarioExpediente && (
        <div className="modal-overlay">
          <div className="modal-content shadow-relief border-turquesa-full">
            <div className="modal-header-exp">
               <h2 className="modal-title">Expediente de Personal</h2>
               <span className="badge-id">{usuarioExpediente.tipoPersonal}</span>
            </div>
            
            <div className="expediente-body">
              <div className="exp-section">
                <p className="exp-label">Nombre Completo</p>
                <p className="exp-value">{usuarioExpediente.nombres} {usuarioExpediente.apellidos}</p>
              </div>

              <div className="exp-grid">
                <div>
                  <p className="exp-label">Fecha de Ingreso</p>
                  <p className="exp-value-highlight">{usuarioExpediente.fechaIngreso || "No registrada"}</p>
                </div>
                <div>
                  <p className="exp-label">Teléfono de Contacto</p>
                  <p className="exp-value-highlight">{usuarioExpediente.telefono || "No registrado"}</p>
                </div>
              </div>

              <div className="exp-section">
                <p className="exp-label">Correo Electrónico</p>
                <p className="exp-value">{usuarioExpediente.correo || "Sin correo asignado"}</p>
              </div>

              <div className="exp-info-box">
                <p>⚠️ Estos datos son de carácter confidencial para el uso exclusivo de Recursos Humanos INVECEM.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-confirm" onClick={() => setShowExpediente(false)}>Cerrar Expediente</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE FECHAS (UI) --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content shadow-relief">
            <h2 className="modal-title">Registrar {tipoSeleccionado}</h2>
            <p className="modal-subtitle">Personal: <strong>{usuarioParaEstado?.nombres} {usuarioParaEstado?.apellidos}</strong></p>
            
            <div className="modal-body">
              <div className="input-group">
                <label>Fecha de Inicio:</label>
                <input type="date" value={fechas.inicio} onChange={(e) => setFechas({...fechas, inicio: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Fecha de {tipoSeleccionado === "Vacaciones" ? "Retorno" : "Fin de Reposo"}:</label>
                <input type="date" value={fechas.fin} onChange={(e) => setFechas({...fechas, fin: e.target.value})} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-confirm" onClick={guardarEstadoEspecial}>Guardar Registro</button>
              <button className="btn-cancel-modal" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

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
          <button className={`btn-toggle ${filtroTipo === "TODOS" ? "active" : ""}`} onClick={() => setFiltroTipo("TODOS")}>TODOS</button>
          <button className={`btn-toggle ${filtroTipo === "INVECEM" ? "active" : ""}`} onClick={() => setFiltroTipo("INVECEM")}>INVECEM</button>
          <button className={`btn-toggle ${filtroTipo === "INCES" ? "active" : ""}`} onClick={() => setFiltroTipo("INCES")}>INCES</button>
          <button className={`btn-toggle ${filtroTipo === "PASANTES" ? "active" : ""}`} onClick={() => setFiltroTipo("PASANTES")}>PASANTES</button>
        </div>

        <input 
          type="text" 
          placeholder="Buscar por nombre, ficha o cédula..." 
          className="search-input"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        
        <div className="actions-buttons">
            <button className="btn-pdf" onClick={generarPDF}>Descargar PDF</button>
            <button className="btn-print" onClick={() => window.print()}>Imprimir Reporte</button>
        </div>
      </div>

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
                        onChange={(e) => handleCambioEstatus(user, e.target.value)}
                      >
                        {ESTADOS_NOMINALES.map((estado) => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                      {user.fechaRegreso && (
                        <div style={{fontSize: '9px', marginTop: '4px', color: '#64748b'}}>Regreso: {user.fechaRegreso}</div>
                      )}
                    </td>
                    <td className="actions-cell no-print">
                      <button className="btn-historial" onClick={() => manejarAccesoExpediente(user)}>Historial</button>
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
        /* --- ESTILOS DEL MODAL --- */
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(15, 23, 42, 0.85); display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content {
          background: white; padding: 30px; border-radius: 15px; width: 450px;
          border: 1px solid #e2e8f0;
        }
        .border-turquesa-full { border: 2px solid #008b8b; }
        .modal-header-exp { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
        .modal-title { color: #0f172a; margin: 0; font-weight: 900; }
        .modal-subtitle { color: #64748b; margin-bottom: 25px; }
        
        /* Estilos Expediente */
        .expediente-body { display: flex; flex-direction: column; gap: 20px; }
        .exp-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin: 0; }
        .exp-value { font-size: 16px; font-weight: 700; color: #0f172a; margin: 5px 0 0; }
        .exp-value-highlight { font-size: 16px; font-weight: 800; color: #008b8b; margin: 5px 0 0; }
        .exp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .exp-info-box { background: #fff7ed; border: 1px dashed #fb923c; padding: 15px; border-radius: 8px; font-size: 11px; color: #9a3412; font-weight: 600; line-height: 1.4; }

        .input-group { margin-bottom: 15px; display: flex; flex-direction: column; }
        .input-group label { font-weight: 800; font-size: 12px; margin-bottom: 5px; color: #0f172a; }
        .input-group input { padding: 12px; border: 2px solid #f1f5f9; border-radius: 8px; font-weight: 700; }
        .modal-footer { display: flex; gap: 10px; margin-top: 25px; }
        .btn-confirm { background: #008b8b; color: white; border: none; padding: 12px; border-radius: 8px; flex: 1; font-weight: 800; cursor: pointer; }
        .btn-cancel-modal { background: #f1f5f9; color: #64748b; border: none; padding: 12px; border-radius: 8px; flex: 1; font-weight: 800; cursor: pointer; }

        /* --- TUS ESTILOS ORIGINALES --- */
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
        .table-card { background: white; border-radius: 15px; border: 1px solid #e2e8f0; }
        .shadow-relief { box-shadow: 10px 10px 0px #008b8b; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8fafc; padding: 18px 15px; text-align: left; color: #1e293b; font-size: 11px; text-transform: uppercase; border-bottom: 3px solid #008b8b; }
        td { padding: 16px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .name-text { font-weight: 700; text-transform: uppercase; }
        .cargo-text { font-weight: 700; color: #008b8b; }
        .badge-id { padding: 5px 10px; border-radius: 6px; font-size: 10px; font-weight: 900; background: #f8fafc; border: 1px solid #e2e8f0; }
        .status-select { padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer; width: 180px; }
        .border-turquesa { border-left: 6px solid #008b8b; }
        .border-rojo { border-left: 6px solid #e30613; }
        .actions-cell { display: flex; gap: 10px; }
        
        .btn-historial { background: #f0fdfa; color: #008b8b; border: 1px solid #99f6e4; padding: 6px 12px; border-radius: 8px; font-weight: 800; cursor: pointer; }
        .btn-edit { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 8px; font-weight: 800; cursor: pointer; }
        .btn-delete { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; padding: 6px 12px; border-radius: 8px; font-weight: 800; cursor: pointer; }
        
        .print-only-header, .print-status { display: none; }
        @media print {
          .no-print { display: none !important; }
          .container { background: white; padding: 0; }
          .shadow-relief { box-shadow: none; border: 1px solid #000; }
          .print-only-header { display: block; text-align: center; margin-bottom: 20px; color: #008b8b; }
          .print-status { display: block; font-weight: bold; }
        }
      `}</style>
    </div>
  );
}