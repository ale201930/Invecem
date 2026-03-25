"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  getDocs 
} from "firebase/firestore";

export default function AsistenciaDiariaRRHH() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [filtroArea, setFiltroArea] = useState("TODAS");
  const [filtroTipo, setFiltroTipo] = useState("TODOS"); 
  const [asistencias, setAsistencias] = useState([]);
  const [nominaTotalData, setNominaTotalData] = useState([]); // Para cálculo dinámico
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  const [fechaHoyStr, setFechaHoyStr] = useState("");
  const [resumen, setResumen] = useState({ presentes: 0, inasistencias: 0, vacaciones: 0, total: 0 });

  useEffect(() => {
    setMounted(true);
    const ahora = new Date();
    const opcionesFecha = { day: 'numeric', month: 'long', year: 'numeric' };
    setFechaHoyStr(ahora.toLocaleDateString('es-ES', opcionesFecha).toUpperCase());
    
    const obtenerNominaCompleta = async () => {
      try {
        const coll = collection(db, "personal");
        // Se añade "Pasante" a la consulta de nómina
        const qTotal = query(coll, where("tipoPersonal", "in", ["INVECEM", "Estudiante INCES", "Estudiante INCESS", "Pasante"]));
        const snapshot = await getDocs(qTotal);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNominaTotalData(data);
      } catch (error) { console.error(error); }
    };
    obtenerNominaCompleta();

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const qAsistencias = query(
      collection(db, "asistencias"),
      where("fechaHora", ">=", inicioHoy),
      // Se añade "Pasante" a la consulta de asistencias del día
      where("tipoPersonal", "in", ["INVECEM", "Estudiante INCES", "Estudiante INCESS", "Pasante"]), 
      orderBy("fechaHora", "desc")
    );

    const unsubscribe = onSnapshot(qAsistencias, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAsistencias(lista);
      const areasSet = new Set(lista.map(a => a.area || "No asignado"));
      setAreasDisponibles(Array.from(areasSet).sort());
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const nominaFiltrada = nominaTotalData.filter(p => {
      if (filtroTipo === "INVECEM") return p.tipoPersonal === "INVECEM";
      if (filtroTipo === "INCES") return p.tipoPersonal?.includes("INCES");
      if (filtroTipo === "PASANTES") return p.tipoPersonal === "Pasante";
      return true;
    });

    const asistenciasFiltradas = asistencias.filter(a => {
      if (filtroTipo === "INVECEM") return a.tipoPersonal === "INVECEM";
      if (filtroTipo === "INCES") return a.tipoPersonal?.includes("INCES");
      if (filtroTipo === "PASANTES") return a.tipoPersonal === "Pasante";
      return true;
    });

    const total = nominaFiltrada.length;
    const presentes = asistenciasFiltradas.length;

    setResumen(prev => ({
      ...prev,
      total: total,
      presentes: presentes,
      inasistencias: total - presentes > 0 ? total - presentes : 0
    }));
  }, [filtroTipo, asistencias, nominaTotalData]);

  const getEstadoEstilo = (entrada, turno) => {
    if (!entrada) return { texto: "Falta", clase: "falta" };
    let horaTope = 7; 
    let minTope = 15;
    if (turno?.includes("07:00 PM")) horaTope = 19; 
    if (turno?.includes("08:00 AM")) horaTope = 8;  
    
    const [time, modifier] = entrada.split(' ');
    let [horas, minutos] = time.split(':').map(Number);
    if (modifier === 'PM' && horas !== 12) horas += 12;
    if (modifier === 'AM' && horas === 12) horas = 0;

    if (horas < horaTope || (horas === horaTope && minutos <= minTope)) return { texto: "Puntual", clase: "puntual" };
    return { texto: "Retraso", clase: "retraso" };
  };

  const listaFiltrada = asistencias.filter(a => {
    const cumpleTexto = (a.nombreCompleto?.toLowerCase() || "").includes(filtro.toLowerCase()) ||
                        (a.ficha?.toLowerCase() || "").includes(filtro.toLowerCase());
    const cumpleArea = filtroArea === "TODAS" || (a.area || "No asignado") === filtroArea;

    let cumpleTipo = true;
    if (filtroTipo === "INVECEM") cumpleTipo = a.tipoPersonal === "INVECEM";
    if (filtroTipo === "INCES") cumpleTipo = a.tipoPersonal?.includes("INCES");
    if (filtroTipo === "PASANTES") cumpleTipo = a.tipoPersonal === "Pasante";

    return cumpleTexto && cumpleArea && cumpleTipo;
  });

  if (!mounted) return null;

  return (
    <div className="container">
      <div className="top-nav no-print">
        <button className="btn-back" onClick={() => router.push("/recursos-humanos")}>← Volver al Panel</button>
        <button className="btn-record" onClick={() => router.push("/recursos-humanos/asistencia-del-dia/record-asistencia")}>🏆 Ver Récord de Asistencia</button>
      </div>

      <header className="main-header">
        <div className="header-left">
          <h1 className="main-title">INVECEM Asistencia Diaria</h1>
          <p className="subtitle">
            {filtroTipo === "TODOS" ? "Personal Propio, INCES y Pasantes" : `REPORTE: ${filtroTipo}`}
          </p>
        </div>
        <div className="date-box">{fechaHoyStr}</div>
      </header>

      <div className="filter-tabs no-print">
        <button className={filtroTipo === "TODOS" ? "active" : ""} onClick={() => setFiltroTipo("TODOS")}>TODOS</button>
        <button className={filtroTipo === "INVECEM" ? "active" : ""} onClick={() => setFiltroTipo("INVECEM")}>TRABAJADORES INVECEM</button>
        <button className={filtroTipo === "INCES" ? "active" : ""} onClick={() => setFiltroTipo("INCES")}>ESTUDIANTES INCES</button>
        <button className={filtroTipo === "PASANTES" ? "active" : ""} onClick={() => setFiltroTipo("PASANTES")}>PASANTES</button>
      </div>

      <section className="resumen-grid no-print">
        <div className="card card-presentes"><small>PRESENTES</small><h2>{resumen.presentes}</h2></div>
        <div className="card card-inasistencias"><small>INASISTENCIAS</small><h2>{resumen.inasistencias}</h2></div>
        <div className="card card-vacaciones"><small>EN VACACIONES</small><h2>{resumen.vacaciones}</h2></div>
        <div className="card card-total"><small>TOTAL NÓMINA</small><h2>{resumen.total}</h2></div>
      </section>

      <div className="table-container">
        <div className="table-actions no-print">
          <div className="filters-group">
            <input type="text" placeholder="Buscar por nombre o ficha..." className="search-input" onChange={(e) => setFiltro(e.target.value)} />
            <select className="area-select" value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
              <option value="TODAS">TODAS LAS ÁREAS</option>
              {areasDisponibles.map(area => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>
          <button onClick={() => window.print()} className="btn-print">🖨️ Imprimir Selección</button>
        </div>

        <table className="asistencia-table">
          <thead>
            <tr>
              <th>FICHA</th>
              <th>COLABORADOR</th>
              <th>CARGO / ÁREA</th>
              <th>IDENTIFICACIÓN</th> 
              <th>ENTRADA</th>
              <th>SALIDA</th>
              <th>ESTATUS</th>
            </tr>
          </thead>
          <tbody>
            {listaFiltrada.length > 0 ? (
              listaFiltrada.map((reg) => {
                const estadoData = getEstadoEstilo(reg.entrada, reg.turno);
                return (
                  <tr key={reg.id}>
                    <td className="ficha-cell">{reg.ficha || "---"}</td>
                    <td className="nombre-cell">{reg.nombreCompleto}</td>
                    <td>
                      <div className="cargo-text-table">{reg.cargo || "No asignado"}</div>
                      <div className="area-text-table">{reg.area || "No asignado"}</div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        color: reg.tipoPersonal?.includes('INCES') ? '#e30613' : 
                               reg.tipoPersonal === 'Pasante' ? '#3b82f6' : '#334155',
                        background: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        {reg.tipoPersonal}
                      </span>
                    </td>
                    <td className="hora-cell">{reg.entrada || "--:--"}</td>
                    <td className="hora-cell">{reg.salida || "--:--"}</td>
                    <td><span className={`badge ${estadoData.clase}`}>{estadoData.texto}</span></td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="7" style={{textAlign: 'center', padding: '40px'}}>No hay registros que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .container { padding: 20px; max-width: 1200px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-weight: 500; }
        .btn-record { background: #008b8b; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; }
        .main-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .main-title { color: #0f172a; font-size: 24px; margin: 0; font-weight: 800; }
        .subtitle { color: #64748b; font-size: 14px; margin: 5px 0 0; font-weight: 600; text-transform: uppercase; }
        .date-box { background: #0f172a; color: white; padding: 8px 15px; border-radius: 8px; font-size: 12px; font-weight: bold; }
        .filter-tabs { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
        .filter-tabs button { 
          background: #f1f5f9; border: none; padding: 10px 20px; border-radius: 8px; 
          font-weight: 700; color: #64748b; cursor: pointer; transition: 0.3s; font-size: 12px;
        }
        .filter-tabs button.active { background: #0f172a; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .resumen-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 20px; border-radius: 12px; border-left: 5px solid; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .card h2 { font-size: 32px; color: #0f172a; margin: 5px 0 0; font-weight: 800; }
        .card-presentes { border-left-color: #22c55e; }
        .card-inasistencias { border-left-color: #ef4444; }
        .card-vacaciones { border-left-color: #3b82f6; }
        .card-total { border-left-color: #0f172a; }
        .table-container { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .table-actions { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px; }
        .filters-group { display: flex; gap: 10px; flex: 1; }
        .search-input, .area-select { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; flex: 1; }
        .btn-print { background: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
        .asistencia-table { width: 100%; border-collapse: collapse; }
        .asistencia-table th { text-align: left; padding: 12px; color: #475569; font-size: 11px; border-bottom: 2px solid #f1f5f9; text-transform: uppercase; }
        .asistencia-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .cargo-text-table { font-weight: 700; color: #008b8b; }
        .area-text-table { font-weight: 600; color: #64748b; font-size: 11px; }
        .hora-cell { font-family: monospace; font-weight: bold; color: #e30613; font-size: 15px; }
        .badge { padding: 5px 12px; border-radius: 20px; font-weight: 700; font-size: 10px; }
        .puntual { background: #dcfce7; color: #166534; }
        .retraso { background: #fef3c7; color: #92400e; }
        .falta { background: #fee2e2; color: #991b1b; }
        @media print { .no-print { display: none !important; } .container { max-width: 100%; padding: 0; } }
      `}</style>
    </div>
  );
}