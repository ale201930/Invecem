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
  getCountFromServer 
} from "firebase/firestore";

export default function AsistenciaDiariaRRHH() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [asistencias, setAsistencias] = useState([]);
  const [fechaHoyStr, setFechaHoyStr] = useState("");
  const [diaActualSemana, setDiaActualSemana] = useState("");
  const [resumen, setResumen] = useState({ presentes: 0, inasistencias: 0, vacaciones: 0, total: 0 });

  useEffect(() => {
    setMounted(true);
    
    const ahora = new Date();
    const opcionesFecha = { day: 'numeric', month: 'long', year: 'numeric' };
    setFechaHoyStr(ahora.toLocaleDateString('es-ES', opcionesFecha).toUpperCase());
    
    const diasRepo = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    setDiaActualSemana(diasRepo[ahora.getDay()]);

    const obtenerTotalNomina = async () => {
      try {
        const coll = collection(db, "personal");
        const snapshot = await getCountFromServer(coll);
        setResumen(prev => ({ ...prev, total: snapshot.data().count }));
      } catch (error) {
        console.error("Error obteniendo nómina:", error);
      }
    };
    obtenerTotalNomina();

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "asistencias"),
      where("fechaHora", ">=", inicioHoy),
      orderBy("fechaHora", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAsistencias(lista);

      const presentesReales = lista.filter(a => a.entrada && !a.salida).length;
      
      setResumen(prev => ({
        ...prev,
        presentes: presentesReales,
        inasistencias: (prev.total - presentesReales) > 0 ? (prev.total - presentesReales) : 0
      }));
    });

    return () => unsubscribe();
  }, []);

  const getEstadoEstilo = (entrada, turno) => {
    if (!entrada) return { texto: "Falta", clase: "falta" };
    
    let horaTope = 7; 
    if (turno?.includes("07:00 PM")) horaTope = 19; 
    if (turno?.includes("08:00 AM")) horaTope = 8;  

    const [horaStr, minutosStr] = entrada.split(':');
    let hora = parseInt(horaStr);
    const minutos = parseInt(minutosStr);
    const esPM = entrada.toLowerCase().includes('pm');

    if (esPM && hora !== 12) hora += 12;
    if (!esPM && hora === 12) hora = 0;

    if (hora < horaTope || (hora === horaTope && minutos <= 15)) {
      return { texto: "Puntual", clase: "puntual" };
    }
    return { texto: "Retraso", clase: "retraso" };
  };

  const listaFiltrada = asistencias.filter(a =>
    (a.nombreCompleto?.toLowerCase() || "").includes(filtro.toLowerCase()) ||
    (a.ficha?.toLowerCase() || "").includes(filtro.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div className="container">
      <div className="top-nav no-print">
        <button className="btn-back" onClick={() => router.push("/recursos-humanos")}>
          ← Volver al Panel
        </button>
        
        <button 
          className="btn-record" 
          onClick={() => router.push("/recursos-humanos/asistencia-del-dia/record-asistencia")}
        >
          🏆 Ver Récord de Asistencia
        </button>
      </div>

      <header className="main-header">
        <div className="header-left">
          <h1 className="main-title">INVECEM Asistencia Diaria</h1>
          <p className="subtitle">Monitoreo de Personal en Tiempo Real</p>
        </div>
        <div className="date-box no-print">
          {fechaHoyStr || "CARGANDO..."}
        </div>
      </header>

      <div className="dias-selector no-print">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
          <button key={dia} className={dia === diaActualSemana ? 'active' : ''}>
            {dia}
          </button>
        ))}
      </div>

      <section className="resumen-grid">
        <div className="card card-presentes">
          <small>PRESENTES</small>
          <h2>{resumen.presentes}</h2>
        </div>
        <div className="card card-inasistencias">
          <small>INASISTENCIAS</small>
          <h2>{resumen.inasistencias}</h2>
        </div>
        <div className="card card-vacaciones">
          <small>EN VACACIONES</small>
          <h2>{resumen.vacaciones}</h2>
        </div>
        <div className="card card-total">
          <small>TOTAL NÓMINA</small>
          <h2>{resumen.total}</h2>
        </div>
      </section>

      <div className="table-container">
        <div className="table-actions no-print">
          <input 
            type="text" 
            placeholder="Buscar por nombre o ficha..." 
            className="search-input"
            onChange={(e) => setFiltro(e.target.value)}
          />
          <button onClick={() => window.print()} className="btn-print">Imprimir Reporte</button>
        </div>

        <table className="asistencia-table">
          <thead>
            <tr>
              <th>FICHA</th>
              <th>COLABORADOR</th>
              <th>CARGO</th>
              <th>ÁREA</th>
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
                    {/* APLICACIÓN DE "NO ASIGNADO" SI ESTÁ VACÍO */}
                    <td className="cargo-text-table">{reg.cargo || "No asignado"}</td>
                    <td className="area-text-table">{reg.area || "No asignado"}</td>
                    <td className="hora-cell">{reg.entrada || "--:--"}</td>
                    <td className="hora-cell">{reg.salida || "--:--"}</td>
                    <td>
                      <span className={`badge ${estadoData.clase}`}>
                        {estadoData.texto}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                  No hay registros detectados el día de hoy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .container { padding: 20px; max-width: 1200px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-weight: 500; }
        .btn-record { background: #008b8b; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: transform 0.2s, background 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .btn-record:hover { background: #007373; transform: translateY(-2px); }
        .main-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .main-title { color: #0f172a; font-size: 24px; margin: 0; font-weight: 800; }
        .subtitle { color: #64748b; font-size: 14px; margin: 5px 0 0; }
        .date-box { background: #0f172a; color: white; padding: 8px 15px; border-radius: 8px; font-size: 12px; font-weight: bold; }
        .dias-selector { display: flex; gap: 5px; margin-bottom: 25px; }
        .dias-selector button { background: white; border: 1px solid #e2e8f0; padding: 8px 15px; color: #64748b; font-size: 12px; border-radius: 6px; cursor: pointer; }
        .dias-selector button.active { background: #e30613; color: white; border-color: #e30613; font-weight: bold; }
        .resumen-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 20px; border-radius: 12px; border-left: 5px solid; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .card small { color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .card h2 { font-size: 32px; color: #0f172a; margin: 5px 0 0; font-weight: 800; }
        .card-presentes { border-left-color: #22c55e; }
        .card-inasistencias { border-left-color: #ef4444; }
        .card-vacaciones { border-left-color: #3b82f6; }
        .card-total { border-left-color: #0f172a; }
        .table-container { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .table-actions { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .search-input { width: 300px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; }
        .btn-print { background: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
        .btn-print:hover { background: #e30613; }
        .asistencia-table { width: 100%; border-collapse: collapse; }
        .asistencia-table th { text-align: left; padding: 12px; color: #475569; font-size: 12px; border-bottom: 2px solid #f1f5f9; text-transform: uppercase; }
        .asistencia-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; }
        .ficha-cell { font-weight: bold; color: #0f172a; }
        .nombre-cell { font-weight: 500; text-transform: uppercase; }
        .cargo-text-table { font-weight: 700; color: #008b8b; }
        .area-text-table { font-weight: 600; color: #64748b; }
        .badge { padding: 5px 12px; border-radius: 20px; font-weight: 700; font-size: 11px; }
        .puntual { background: #dcfce7; color: #166534; }
        .retraso { background: #fef3c7; color: #92400e; }
        .falta { background: #fee2e2; color: #991b1b; }
        @media print {
          .no-print { display: none !important; }
          .container { max-width: 100%; padding: 0; }
          .table-container { box-shadow: none; }
        }
      `}</style>
    </div>
  );
}