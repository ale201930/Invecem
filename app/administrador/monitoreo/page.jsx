"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase'; 
import { collection, query, onSnapshot, orderBy, limit, getCountFromServer } from 'firebase/firestore';

export default function MonitoreoPage() {
  const router = useRouter();
  
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [alertasSeguridad, setAlertasSeguridad] = useState(0);
  const [eventos, setEventos] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerConteoUsuarios = async () => {
      const coll = collection(db, "usuarios");
      const snapshot = await getCountFromServer(coll);
      setTotalUsuarios(snapshot.data().count);
    };

    const q = query(
      collection(db, "auditoria"), 
      orderBy("fecha", "desc"), 
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map(doc => {
        const data = doc.data();
        // --- AQUÍ EL CAMBIO DE HORA A 12H ---
        const fechaReal = data.fecha?.toDate();
        const fechaFormateada = fechaReal ? fechaReal.toLocaleString('es-VE', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }) : 'Cargando...';

        return {
          id: doc.id,
          ...data,
          fechaFormateada
        };
      });

      // Filtramos para la tabla de Eventos (Logins e Intentos fallidos)
      setEventos(datos.filter(d => 
        d.accion.toLowerCase().includes("fallido") || 
        d.accion.toLowerCase().includes("ingreso") ||
        d.accion.toLowerCase().includes("sesión")
      ));
      
      setAuditoria(datos);

      const fallidos = datos.filter(d => d.accion.toLowerCase().includes("fallido")).length;
      setAlertasSeguridad(fallidos);
      
      setLoading(false);
    });

    obtenerConteoUsuarios();
    return () => unsubscribe();
  }, []);

  const imprimirReporte = () => {
    window.print();
  };

  return (
    <div className="monitoreo-container">
      <header className="monitoreo-header no-print">
        <div className="header-left">
          <button onClick={() => router.back()} className="btn-volver">
            ← Volver al Panel
          </button>
          <h1>Monitoreo del Sistema INVECEM</h1>
        </div>
        <button onClick={imprimirReporte} className="btn-print">
          🖨️ Generar Reporte PDF
        </button>
      </header>

      <div className="widgets-grid">
        <div className="widget-card gray-dark">
          <span>Usuarios Registrados</span>
          <p>{totalUsuarios}</p>
        </div>
        <div className="widget-card red-main">
          <span>Alertas (Intentos Fallidos)</span>
          <p>{alertasSeguridad}</p>
        </div>
        <div className="widget-card gray-light">
          <span>Estado del Servidor</span>
          <p>En Línea</p>
        </div>
      </div>

      <div className="main-grid">
        <section className="card">
          <h3>Eventos Recientes del Sistema</h3>
          <table className="tabla-invecem">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Módulo</th>
                <th>Estado</th>
                <th>Fecha y Hora</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map(ev => (
                <tr key={ev.id}>
                  <td>{ev.accion}</td>
                  <td>{ev.modulo}</td>
                  <td className={ev.accion.toLowerCase().includes("fallido") ? "status-error" : "status-success"}>
                    {ev.accion.toLowerCase().includes("fallido") ? "Advertencia" : "Correcto"}
                  </td>
                  <td>{ev.fechaFormateada}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h3>Auditoría Detallada de Acciones</h3>
          <table className="tabla-invecem">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Acción</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {auditoria.map(audit => (
                <tr key={audit.id}>
                  <td><strong>{audit.usuario}</strong></td>
                  <td>{audit.rol}</td>
                  <td>{audit.accion}</td>
                  <td>{audit.fechaFormateada}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <style jsx>{`
        .monitoreo-container { padding: 30px; background-color: #f4f4f4; min-height: 100vh; }
        .monitoreo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #b30000; padding-bottom: 10px; }
        .header-left { display: flex; align-items: center; gap: 20px; }
        h1 { color: #333; font-size: 24px; }
        
        .btn-volver, .btn-print { border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; transition: 0.3s; font-weight: bold; }
        .btn-volver { background-color: #333; color: white; }
        .btn-print { background-color: #b30000; color: white; }
        .btn-volver:hover, .btn-print:hover { opacity: 0.8; }

        .widgets-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .widget-card { padding: 20px; border-radius: 8px; color: white; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .gray-dark { background-color: #333; }
        .red-main { background-color: #b30000; }
        .gray-light { background-color: #555; }
        .widget-card p { font-size: 32px; font-weight: bold; margin: 5px 0 0; }

        .main-grid { display: grid; grid-template-columns: 1fr; gap: 25px; }
        .card { background: white; padding: 20px; border-radius: 10px; border-top: 5px solid #333; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .tabla-invecem { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .tabla-invecem th { text-align: left; padding: 12px; background: #333; color: white; font-size: 13px; }
        .tabla-invecem td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; }
        
        .status-success { color: #28a745; font-weight: bold; }
        .status-error { color: #b30000; font-weight: bold; }

        @media print {
          .no-print { display: none; }
          .monitoreo-container { background: white; padding: 0; }
          .card { box-shadow: none; border: 1px solid #ccc; }
        }
      `}</style>
    </div>
  );
}