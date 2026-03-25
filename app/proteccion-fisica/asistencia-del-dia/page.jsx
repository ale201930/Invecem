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

export default function AsistenciaContratas() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("TODAS");
  const [asistencias, setAsistencias] = useState([]);
  const [empresasDisponibles, setEmpresasDisponibles] = useState([]);
  const [fechaHoyStr, setFechaHoyStr] = useState("");
  const [resumen, setResumen] = useState({ presentes: 0, totalNomina: 0 });

  useEffect(() => {
    setMounted(true);
    
    // Configurar fecha actual
    const ahora = new Date();
    const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
    setFechaHoyStr(ahora.toLocaleDateString('es-ES', opciones).toUpperCase());

    // 1. Obtener el total de contratistas registrados en el sistema
    const obtenerTotalContratas = async () => {
      try {
        const coll = collection(db, "contratistas");
        const snapshot = await getCountFromServer(coll);
        setResumen(prev => ({ ...prev, totalNomina: snapshot.data().count }));
      } catch (error) { console.error(error); }
    };
    obtenerTotalContratas();

    // 2. Escuchar asistencias de HOY
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    // Filtramos por tipoPersonal para asegurar que solo vemos contratistas si usas una sola tabla de asistencias
    const q = query(
      collection(db, "asistencias"),
      where("fechaHora", ">=", inicioHoy),
      where("tipoPersonal", "==", "CONTRATISTA"), 
      orderBy("fechaHora", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAsistencias(lista);

      // Extraer empresas únicas para el filtro
      const empresasSet = new Set(lista.map(a => a.nombreContrata || "Sin Empresa"));
      setEmpresasDisponibles(Array.from(empresasSet).sort());

      // Contar quiénes están adentro (marcaron entrada pero no salida)
      const adentro = lista.filter(a => a.entrada && !a.salida).length;
      setResumen(prev => ({ ...prev, presentes: adentro }));
    });

    return () => unsubscribe();
  }, []);

  const listaFiltrada = asistencias.filter(a => {
    const texto = filtro.toLowerCase();
    const cumpleTexto = (a.nombreCompleto?.toLowerCase() || "").includes(texto) ||
                        (a.cedula?.toLowerCase() || "").includes(texto);
    const cumpleEmpresa = filtroEmpresa === "TODAS" || a.nombreContrata === filtroEmpresa;
    return cumpleTexto && cumpleEmpresa;
  });

  if (!mounted) return null;

  return (
    <div className="container">
      <div className="top-nav no-print">
        <button className="btn-back" onClick={() => router.push("/proteccion-fisica")}>← Volver al Panel</button>
        <div className="status-live">● Monitoreo en Vivo</div>
      </div>

      <header className="main-header">
        <div className="header-left">
          <h1 className="main-title">INVECEM | Control de Acceso</h1>
          <p className="subtitle">REPORTE DIARIO DE PERSONAL EXTERNO (CONTRATAS)</p>
        </div>
        <div className="date-box">{fechaHoyStr}</div>
      </header>

      <section className="resumen-grid no-print">
        <div className="card card-presentes">
          <small>PERSONAL EN PLANTA</small>
          <h2>{resumen.presentes}</h2>
        </div>
        <div className="card card-total">
          <small>TOTAL REGISTRADOS</small>
          <h2>{resumen.totalNomina}</h2>
        </div>
      </section>

      <div className="table-container shadow-relief">
        <div className="table-actions no-print">
          <div className="filters-group">
            <input 
              type="text" 
              placeholder="Buscar por nombre o cédula..." 
              className="search-input" 
              onChange={(e) => setFiltro(e.target.value)} 
            />
            <select 
              className="empresa-select" 
              value={filtroEmpresa} 
              onChange={(e) => setFiltroEmpresa(e.target.value)}
            >
              <option value="TODAS">TODAS LAS EMPRESAS</option>
              {empresasDisponibles.map(emp => <option key={emp} value={emp}>{emp}</option>)}
            </select>
          </div>
          <button onClick={() => window.print()} className="btn-print">Generar PDF / Imprimir</button>
        </div>

        <table className="asistencia-table">
          <thead>
            <tr>
              <th>IDENTIFICACIÓN</th>
              <th>PERSONAL EXTERNO</th>
              <th>EMPRESA / CONTRATA</th>
              <th>ÁREA DE TRABAJO</th> 
              <th>ENTRADA</th>
              <th>SALIDA</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {listaFiltrada.length > 0 ? (
              listaFiltrada.map((reg) => (
                <tr key={reg.id}>
                  <td className="cedula-cell">{reg.cedula}</td>
                  <td className="nombre-cell">{reg.nombreCompleto}</td>
                  <td><span className="badge-empresa">{reg.nombreContrata}</span></td>
                  <td className="area-text">{reg.area || "No especificada"}</td>
                  <td className="hora-cell">{reg.entrada || "--:--"}</td>
                  <td className="hora-cell">{reg.salida || "--:--"}</td>
                  <td>
                    <span className={`badge-status ${!reg.salida ? 'en-planta' : 'fuera'}`}>
                      {!reg.salida ? "EN PLANTA" : "RETIRADO"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="empty-state">No se registran movimientos el día de hoy.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .container { padding: 20px; max-width: 1300px; margin: 0 auto; font-family: sans-serif; }
        .top-nav { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-weight: bold; }
        .status-live { color: #22c55e; font-size: 12px; font-weight: 800; animation: blink 2s infinite; }
        
        .main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 3px solid #e30613; padding-bottom: 15px; }
        .main-title { color: #0f172a; font-size: 24px; font-weight: 900; margin: 0; }
        .subtitle { color: #008b8b; font-size: 13px; margin: 5px 0 0; font-weight: 800; }
        .date-box { background: #0f172a; color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; }

        .resumen-grid { display: flex; gap: 20px; margin-bottom: 25px; }
        .card { background: white; padding: 15px 30px; border-radius: 12px; border-left: 6px solid; box-shadow: 0 4px 6px rgba(0,0,0,0.05); flex: 1; }
        .card h2 { font-size: 35px; margin: 0; font-weight: 900; }
        .card-presentes { border-left-color: #008b8b; color: #008b8b; }
        .card-total { border-left-color: #0f172a; }

        .table-container { background: white; padding: 20px; border-radius: 15px; }
        .shadow-relief { border: 1px solid #e2e8f0; box-shadow: 10px 10px 0px #0f172a; }
        
        .table-actions { display: flex; gap: 15px; margin-bottom: 20px; }
        .filters-group { display: flex; gap: 10px; flex: 1; }
        .search-input, .empresa-select { padding: 12px; border: 2px solid #f1f5f9; border-radius: 10px; outline: none; }
        .btn-print { background: #e30613; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: bold; cursor: pointer; }

        .asistencia-table { width: 100%; border-collapse: collapse; }
        .asistencia-table th { text-align: left; padding: 15px; font-size: 11px; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
        .asistencia-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        
        .cedula-cell { font-weight: 800; color: #0f172a; }
        .nombre-cell { font-weight: 700; text-transform: uppercase; }
        .badge-empresa { background: #f1f5f9; padding: 5px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; border: 1px solid #cbd5e1; }
        .area-text { color: #008b8b; font-weight: 700; }
        .hora-cell { font-family: monospace; font-weight: 900; color: #e30613; font-size: 16px; }
        
        .badge-status { padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: 900; }
        .en-planta { background: #ccf2f2; color: #008b8b; }
        .fuera { background: #f1f5f9; color: #94a3b8; }
        
        .empty-state { text-align: center; padding: 50px; color: #94a3b8; font-weight: 600; }

        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

        @media print {
          .no-print { display: none !important; }
          .shadow-relief { box-shadow: none; border: 1px solid #000; }
          .container { max-width: 100%; padding: 0; }
        }
      `}</style>
    </div>
  );
}