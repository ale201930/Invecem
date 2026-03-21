"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// RUTA MANUAL: sube desde asistencia-del-dia -> recursos-humanos -> app y entra a lib
import { db } from "../../lib/firebase"; 
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function ControlAsistencia() {
  const router = useRouter();
  const [personal, setPersonal] = useState([]);
  const [asistenciaHoy, setAsistenciaHoy] = useState([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    // Obtenemos la fecha actual en el mismo formato que se guarda al marcar
    const fechaHoy = new Date().toLocaleDateString();

    // 1. Escuchar Maestro de Personal
    const unsubPersonal = onSnapshot(collection(db, "personal"), (snap) => {
      setPersonal(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Escuchar Asistencia de Hoy
    const qAsistencia = query(collection(db, "asistencia"), where("fecha", "==", fechaHoy));
    const unsubAsist = onSnapshot(qAsistencia, (snap) => {
      setAsistenciaHoy(snap.docs.map(doc => doc.data()));
    });

    return () => { unsubPersonal(); unsubAsist(); };
  }, []);

  // Lógica de filtrado
  const personalFiltrado = personal.filter(p => 
    `${p.nombres} ${p.apellidos}`.toLowerCase().includes(filtro.toLowerCase()) ||
    p.area.toLowerCase().includes(filtro.toLowerCase())
  );

  // Cálculos de las tarjetas
  const totalNomina = personal.length;
  const presentes = personal.filter(p => asistenciaHoy.some(a => a.ficha === p.ficha && a.tipo === "Entrada")).length;
  const enVacaciones = personal.filter(p => p.estatus === "Vacaciones").length;
  const inasistencias = totalNomina - presentes - enVacaciones;

  return (
    <div className="dashboard">
      <div className="header">
        <div className="header-left">
          <h1>Control de Asistencia Diaria</h1>
          <p>viernes, 6 de febrero de 2026</p>
        </div>
        <div className="days-nav">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <span key={d} className={d === 'Vie' ? 'active' : ''}>{d}</span>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card green">
          <span className="label">PRESENTES</span>
          <span className="number">{presentes}</span>
        </div>
        <div className="stat-card red">
          <span className="label">INASISTENCIAS</span>
          <span className="number">{inasistencias < 0 ? 0 : inasistencias}</span>
        </div>
        <div className="stat-card blue">
          <span className="label">EN VACACIONES</span>
          <span className="number">{enVacaciones}</span>
        </div>
        <div className="stat-card">
          <span className="label">TOTAL NÓMINA</span>
          <span className="number">{totalNomina}</span>
        </div>
      </div>

      <div className="main-card">
        <div className="table-controls">
          <input 
            type="text" 
            placeholder="Filtrar por nombre o área..." 
            onChange={(e) => setFiltro(e.target.value)}
          />
          <button className="btn-print" onClick={() => window.print()}>Imprimir Listado</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>FICHA</th>
              <th>COLABORADOR</th>
              <th>ÁREA</th>
              <th>ENTRADA</th>
              <th>SALIDA</th>
              <th>ESTATUS</th>
            </tr>
          </thead>
          <tbody>
            {personalFiltrado.map(emp => {
              const entrada = asistenciaHoy.find(a => a.ficha === emp.ficha && a.tipo === "Entrada");
              const salida = asistenciaHoy.find(a => a.ficha === emp.ficha && a.tipo === "Salida");
              
              return (
                <tr key={emp.id}>
                  <td className="ficha">{emp.ficha}</td>
                  <td className="nombre">{emp.nombres} {emp.apellidos}</td>
                  <td>{emp.area}</td>
                  <td>{entrada?.hora || "--:-- --"}</td>
                  <td>{salida?.hora || "--:-- --"}</td>
                  <td>
                    <Badge empleado={emp} entrada={entrada} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .dashboard { padding: 40px; background: #f8fafc; min-height: 100vh; font-family: sans-serif; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
        h1 { font-size: 24px; color: #0f172a; margin: 0; }
        .header p { color: #64748b; margin: 5px 0 0; }
        
        .days-nav { display: flex; gap: 5px; }
        .days-nav span { padding: 8px 12px; background: white; border-radius: 8px; font-size: 12px; color: #94a3b8; border: 1px solid #e2e8f0; }
        .days-nav span.active { background: #0f172a; color: white; border-color: #0f172a; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .stat-card.green { border-left: 4px solid #10b981; }
        .stat-card.red { border-left: 4px solid #ef4444; }
        .stat-card.blue { border-left: 4px solid #3b82f6; }
        .label { font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 10px; }
        .number { font-size: 32px; font-weight: 800; color: #0f172a; }

        .main-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .table-controls { display: flex; justify-content: space-between; margin-bottom: 25px; }
        .table-controls input { padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 8px; width: 300px; }
        .btn-print { background: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }

        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-size: 11px; color: #94a3b8; padding: 15px; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; }
        td { padding: 15px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; }
        .ficha { font-weight: 700; color: #0f172a; }
        .nombre { font-weight: 500; }

        /* Estilos de los Badges según tu imagen */
        :global(.badge) { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        :global(.puntual) { background: #dcfce7; color: #166534; }
        :global(.retraso) { background: #fef9c3; color: #854d0e; }
        :global(.vacaciones) { background: #dbeafe; color: #1e40af; }
        :global(.falta) { background: #fee2e2; color: #991b1b; }
      `}</style>
    </div>
  );
}

function Badge({ empleado, entrada }) {
  if (empleado.estatus === "Vacaciones") return <span className="badge vacaciones">Vacaciones</span>;
  if (!entrada) return <span className="badge falta">Falta</span>;
  
  // Lógica de puntualidad (ejemplo: después de las 07:10 AM es retraso)
  const [hora, minutos] = entrada.hora.split(':');
  const h = parseInt(hora);
  const m = parseInt(minutos);
  
  if (h > 7 || (h === 7 && m > 10)) return <span className="badge retraso">Retraso</span>;
  return <span className="badge puntual">Puntual</span>;
}