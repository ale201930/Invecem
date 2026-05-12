"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { 
  collection, addDoc, onSnapshot, query, where, orderBy, 
  serverTimestamp, doc, updateDoc, Timestamp 
} from "firebase/firestore";

export default function RegistroVisitantes() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [visitantes, setVisitantes] = useState([]);
  const [stats, setStats] = useState({ hoy: 0, enPlanta: 0, promedio: "0 min" });

  const [formData, setFormData] = useState({
    cedula: "", nombre: "", empresa: "", autoriza: "", area: "Producción", motivo: ""
  });

  useEffect(() => { setMounted(true); }, []);

  const formatAMPM = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  useEffect(() => {
    if (!mounted) return;
    const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, "visitantes"), 
      where("fechaIngreso", ">=", Timestamp.fromDate(inicioHoy)), 
      orderBy("fechaIngreso", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setVisitantes(docs);
      const enPlanta = docs.filter(v => v.estado === "En Planta").length;
      const finalizados = docs.filter(v => v.estado === "Finalizado" && v.minutosEstancia);
      const promedio = finalizados.length > 0 ? Math.round(finalizados.reduce((acc, v) => acc + v.minutosEstancia, 0) / finalizados.length) : 0;
      setStats({ hoy: docs.length, enPlanta, promedio: `${promedio} min` });
    });
    return () => unsub();
  }, [mounted]);

  const handleIngreso = async (e) => {
    e.preventDefault();
    if (!formData.cedula || !formData.nombre) return alert("Cédula y Nombre requeridos");
    try {
      await addDoc(collection(db, "visitantes"), {
        ...formData, 
        entrada: formatAMPM(new Date()), 
        salida: "--:--", 
        estado: "En Planta", 
        fechaIngreso: serverTimestamp(),
      });
      setFormData({ cedula: "", nombre: "", empresa: "", autoriza: "", area: "Producción", motivo: "" });
    } catch (err) { alert("Error al guardar en la base de datos"); }
  };

  const handleSalida = async (id, fechaIngreso) => {
    try {
      const ahora = new Date();
      const minutos = Math.floor((ahora.getTime() - fechaIngreso.toDate().getTime()) / 60000);
      await updateDoc(doc(db, "visitantes", id), { 
        salida: formatAMPM(ahora), 
        estado: "Finalizado", 
        minutosEstancia: minutos 
      });
    } catch (err) { alert("Error en salida"); }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- FUNCIÓN PDF CORREGIDA (FIX AUTO-TABLE) ---
  const handlePDF = async () => {
    if (typeof window === "undefined") return;

    try {
      // Importamos jsPDF y autoTable de forma dinámica
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const fecha = new Date().toLocaleDateString();

      doc.setFontSize(18);
      doc.setTextColor(33, 33, 33);
      doc.text("INVECEM - CONTROL DE ACCESO", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Reporte generado el: ${fecha}`, 14, 28);

      const columns = ["Visitante", "Empresa", "Cédula", "Área", "Entrada", "Salida", "Estado"];
      const rows = listaFiltrada.map(v => [
        v.nombre,
        v.empresa || "Particular",
        v.cedula,
        v.area,
        v.entrada,
        v.salida,
        v.estado
      ]);

      // Usamos la función autoTable importada directamente sobre el documento
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 'auto' }
        }
      });

      doc.save(`Reporte_INVECEM_${fecha.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al cargar las herramientas de PDF.");
    }
  };

  if (!mounted) return null;

  const listaFiltrada = visitantes.filter(v => 
    v.nombre.toLowerCase().includes(busqueda.toLowerCase()) || v.cedula.includes(busqueda)
  );

  return (
    <div className="layout">
      <header className="top-nav no-print">
        <div className="logo">INVECEM <span className="red-text">Seguridad</span></div>
        <button className="btn-panel" onClick={() => router.push("/inspector")}>← VOLVER AL PANEL</button>
      </header>

      <main className="content">
        <div className="report-header">
  <h1 className="report-title">INVECEM - CONTROL DE ACCESO</h1>
  <p className="report-subtitle">Reporte de Visitantes • Fecha: {new Date().toLocaleDateString()}</p>
</div>

        <div className="stats-grid no-print">
          <div className="stat-card shadow-relief">
            <span className="label">Hoy</span>
            <span className="value">{stats.hoy}</span>
          </div>
          <div className="stat-card border-red shadow-relief">
            <span className="label">En Planta</span>
            <span className="value">{stats.enPlanta}</span>
          </div>
          <div className="stat-card shadow-relief">
            <span className="label">Promedio Estancia</span>
            <span className="value">{stats.promedio}</span>
          </div>
        </div>

        <div className="main-grid">
          <section className="form-section shadow-relief no-print">
            <h3 className="section-title">Registro de Visitante</h3>
            <form onSubmit={handleIngreso} className="visit-form">
              <div className="form-row">
                <div className="field">
                  <label>Cédula / ID</label>
                  <input type="text" placeholder="ID" value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} />
                </div>
                <div className="field">
                  <label>Nombre y Apellido</label>
                  <input type="text" placeholder="Visitante" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Empresa</label>
                  <input type="text" placeholder="Procedencia" value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} />
                </div>
                <div className="field">
                  <label>Autoriza</label>
                  <input type="text" placeholder="¿Quién autoriza?" value={formData.autoriza} onChange={e => setFormData({...formData, autoriza: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Área Destino</label>
                  <select value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})}>
                    <option>Producción</option><option>Administración</option><option>Plantas</option><option>Mantenimiento</option>
                  </select>
                </div>
                <div className="field">
                  <label>Motivo</label>
                  <input type="text" placeholder="Razón de visita" value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn-confirmar">Ingresar a Planta</button>
            </form>
          </section>

          <section className="table-section shadow-relief">
            <div className="table-controls no-print">
                <input type="text" placeholder="🔍 Buscar..." className="search-input" onChange={e => setBusqueda(e.target.value)} />
                <div className="action-buttons">
                    <button className="btn-action btn-pdf" onClick={handlePDF}>📄 DESCARGAR PDF</button>
                    <button className="btn-action btn-print" onClick={handlePrint}>🖨️ IMPRIMIR</button>
                </div>
            </div>
            
            <div className="table-wrapper">
              <table className="visit-table">
                <thead>
                  <tr>
                    <th>VISITANTE / EMPRESA</th>
                    <th>CÉDULA</th>
                    <th>ÁREA</th>
                    <th>ENTRADA</th>
                    <th>ESTADO</th>
                    <th className="no-print">GESTIÓN</th>
                    <th className="only-print">SALIDA</th>
                  </tr>
                </thead>
                <tbody>
                  {listaFiltrada.map((v) => (
                    <tr key={v.id}>
                      <td className="v-info"><strong>{v.nombre}</strong><small>{v.empresa || "Particular"}</small></td>
                      <td className="bold">{v.cedula}</td>
                      <td><span className="tag">{v.area}</span></td>
                      <td className="bold">{v.entrada}</td>
                      <td><span className={`badge ${v.estado === "En Planta" ? "in" : "out"}`}>{v.estado}</span></td>
                      <td className="no-print">
                        {v.estado === "En Planta" ? 
                          <button className="btn-salida" onClick={() => handleSalida(v.id, v.fechaIngreso)}>Marcar Salida</button> : 
                          <span className="time-out">Salió: {v.salida}</span>
                        }
                      </td>
                      <td className="only-print bold">
                          {v.salida !== "--:--" ? v.salida : "EN PLANTA"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
  /* Fondo General con Patrón INVECEM */
  .layout { 
    background-color: #f0f4f8;
    background-image: radial-gradient(#d1d5db 0.8px, transparent 0.8px);
    background-size: 24px 24px;
    min-height: 100vh; 
    font-family: 'Inter', system-ui, -apple-system, sans-serif; 
    color: #0f172a;
    position: relative;
  }

  .report-header {
    margin-bottom: 35px;
    border-left: 6px solid #0f172a;
    padding-left: 20px;
  }
  .report-title {
    font-size: 38px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
    letter-spacing: -2px;
    line-height: 1;
    text-transform: uppercase;
  }
  .report-subtitle {
    font-size: 14px;
    font-weight: 700;
    color: #64748b;
    margin-top: 5px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* Barra de Navegación */
  .top-nav { 
    background: #0f172a; 
    color: white; 
    padding: 12px 25px; 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    border-bottom: 4px solid #e30613; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .logo { font-weight: 900; font-size: 20px; letter-spacing: -1px; }
  .red-text { color: #e30613; }
  .btn-panel { 
    background: #e30613; 
    color: white; 
    border: none; 
    padding: 8px 16px; 
    border-radius: 8px; 
    cursor: pointer; 
    font-size: 11px; 
    font-weight: 800; 
    text-transform: uppercase;
    transition: 0.3s;
  }
  .btn-panel:hover { background: #b8050f; transform: translateY(-2px); }

  .content { padding: 30px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 1; }

  /* Grid de Estadísticas */
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
  .stat-card { 
    background: rgba(255, 255, 255, 0.8); 
    backdrop-filter: blur(5px);
    padding: 20px; 
    border-radius: 16px; 
    text-align: center; 
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 4px 6px rgba(15, 23, 42, 0.05);
  }
  .stat-card .label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-card .value { font-size: 28px; font-weight: 900; color: #0f172a; display: block; margin-top: 5px; }

  /* Layout Principal */
  .main-grid { display: grid; grid-template-columns: 420px 1fr; gap: 25px; }

  /* Tarjetas Estilo Glassmorphism (Reemplaza shadow-relief) */
  .shadow-relief { 
    background: rgba(255, 255, 255, 0.94); 
    backdrop-filter: blur(10px);
    border-radius: 24px; 
    padding: 30px; 
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.12);
    position: relative;
    overflow: hidden;
  }

  .section-title { 
    margin-bottom: 25px; 
    font-size: 14px; 
    text-transform: uppercase; 
    font-weight: 900; 
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section-title::before {
    content: ""; width: 8px; height: 8px; background: #e30613; border-radius: 2px;
  }

  /* Formulario e Inputs */
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
  .field { margin-bottom: 15px; }
  .field label { font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px; display: block; padding-left: 4px; }
  
  input, select { 
    width: 100%; padding: 12px; 
    border: 2px solid #f1f5f9; 
    border-radius: 12px; 
    font-size: 14px; 
    font-weight: 600; 
    background: #f8fafc; 
    transition: all 0.2s ease;
  }
  input:focus, select:focus { 
    border-color: #e30613; 
    outline: none; 
    background: white; 
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(227, 6, 19, 0.08);
  }

  .btn-confirmar { 
    width: 100%; 
    background: #e30613; 
    color: white; 
    border: none; 
    padding: 15px; 
    border-radius: 12px; 
    font-weight: 800; 
    cursor: pointer; 
    text-transform: uppercase; 
    margin-top: 10px; 
    font-size: 12px;
    box-shadow: 0 8px 16px rgba(227, 6, 19, 0.2);
    transition: 0.3s;
  }
  .btn-confirmar:hover { transform: translateY(-3px); box-shadow: 0 12px 20px rgba(227, 6, 19, 0.3); }

  /* Controles de Tabla */
  .table-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 15px; }
  .search-input { 
    flex: 1; max-width: 300px; 
    background: #f8fafc;
    border: 2px solid #f1f5f9;
    padding: 10px 15px; 
  }

  .btn-action { 
    padding: 10px 18px; 
    border-radius: 10px; 
    font-weight: 800; 
    font-size: 11px; 
    text-transform: uppercase; 
    cursor: pointer;
    transition: 0.3s;
  }
  .btn-pdf { background: #e30613; color: white; border: none; }
  .btn-print { background: #0f172a; color: white; border: none; }
  .btn-action:hover { transform: translateY(-2px); opacity: 0.9; }

  /* Tabla de Visitantes */
  .visit-table { width: 100%; border-collapse: collapse; }
  .visit-table th { 
    text-align: left; font-size: 11px; 
    color: #94a3b8; 
    padding: 15px 10px; 
    border-bottom: 2px solid #f1f5f9;
    text-transform: uppercase;
  }
  .visit-table td { padding: 15px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  
  .v-info strong { display: block; color: #0f172a; font-size: 14px; }
  .v-info small { color: #e30613; font-weight: 700; font-size: 10px; text-transform: uppercase; }
  
  .tag { background: #0f172a; color: white; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; }
  
  .badge { font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
  .badge.in { background: #fee2e2; color: #e30613; }
  .badge.out { background: #f1f5f9; color: #64748b; }

  .btn-salida { 
    background: #0f172a; color: white; border: none; padding: 6px 12px; 
    border-radius: 8px; font-size: 10px; font-weight: 800; cursor: pointer; 
    transition: 0.2s;
  }
  .btn-salida:hover { background: #e30613; }

  @media print {
    .no-print { display: none !important; }
    .only-print { display: block !important; }
    .layout { background: white; }
    .content { padding: 0; }
    .main-grid { display: block; }
    .shadow-relief { box-shadow: none; border: 1px solid #eee; padding: 10px; backdrop-filter: none; }
  }

  @media (max-width: 1000px) {
    .main-grid { grid-template-columns: 1fr; }
  }
`}</style>
    </div>
  );
}