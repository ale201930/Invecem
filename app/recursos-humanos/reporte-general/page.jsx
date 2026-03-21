"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/app/lib/firebase"; 
import { collection, onSnapshot, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function ReportesGenerales() {
  const [mounted, setMounted] = useState(false);
  const [fechaDiaria, setFechaDiaria] = useState(new Date().toISOString().split('T')[0]);
  const [indicadores, setIndicadores] = useState({
    asistencia: "94%", retrasos: 0, reposos: 5, inasistencias: 2
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Estadísticas en tiempo real
  useEffect(() => {
    if (!mounted) return;
    const unsub = onSnapshot(collection(db, "asistencia"), (snapshot) => {
      const todos = snapshot.docs.map(doc => doc.data());
      const hoy = new Date().toLocaleDateString('es-ES'); 
      const retardos = todos.filter(a => 
        a.fecha === hoy && a.tipo === "Entrada" && 
        (a.hora && (parseInt(a.hora.split(':')[0]) > 7 || (parseInt(a.hora.split(':')[0]) === 7 && parseInt(a.hora.split(':')[1]) > 10)))
      ).length;
      setIndicadores(prev => ({ ...prev, retrasos: retardos }));
    });
    return () => unsub();
  }, [mounted]);

  // 2. Función para cargar scripts externos dinámicamente
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // 3. Descarga PDF usando CDN
  const handleDownloadPDF = async (tipo, valor) => {
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js");

      const { jsPDF } = window.jspdf;
      const data = await fetchReportData(tipo, valor);
      
      if (data.length === 0) return alert("No hay datos para esta fecha en la base de datos.");

      const docPDF = new jsPDF();
      docPDF.setFontSize(18);
      docPDF.setTextColor(0, 51, 102);
      docPDF.text("INVECEM - REPORTE DE ASISTENCIA", 14, 20);
      
      const rows = data.map(item => [item.ficha, item.nombre, item.fecha, item.hora, item.tipo]);
      
      docPDF.autoTable({
        startY: 30,
        head: [['FICHA', 'NOMBRE', 'FECHA', 'HORA', 'EVENTO']],
        body: rows,
        headStyles: { fillColor: [0, 51, 102] }
      });

      docPDF.save(`Reporte_Invecem_${valor}.pdf`);
    } catch (err) {
      console.error("Error PDF:", err);
      alert("Error al generar el PDF.");
    }
  };

  // 4. Exportar Excel usando CDN
  const handleDownloadExcel = async (tipo, valor) => {
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
      const XLSX = window.XLSX;

      const data = await fetchReportData(tipo, valor);
      if (data.length === 0) return alert("No hay datos para exportar.");

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Asistencia");
      XLSX.writeFile(wb, `Reporte_Invecem_${valor}.xlsx`);
    } catch (err) {
      console.error("Error Excel:", err);
    }
  };

  // --- FUNCIÓN CORREGIDA: UNE ASISTENCIA CON PERSONAL ---
  const fetchReportData = async (tipo, valor) => {
    const colRef = collection(db, "asistencia");
    let q;
    
    // Formatear fecha de YYYY-MM-DD a D/M/YYYY
    const [y, m, d] = valor.split('-');
    const fechaBusqueda = `${parseInt(d)}/${parseInt(m)}/${y}`;
    
    if (tipo === 'diario') {
      q = query(colRef, where("fecha", "==", fechaBusqueda));
    } else {
      q = query(colRef); 
    }

    const snap = await getDocs(q);
    
    // Si no hay asistencias, devolvemos array vacío de una vez
    if (snap.empty) return [];

    // Ahora buscamos los nombres en la tabla 'personal' para cada ficha encontrada
    const resultados = await Promise.all(snap.docs.map(async (docAsis) => {
      const asis = docAsis.data();
      let nombreEncontrado = "No registrado";

      if (asis.ficha) {
        // Buscamos en la colección 'personal' por el campo 'ficha'
        const personalRef = collection(db, "personal");
        const qPersonal = query(personalRef, where("ficha", "==", asis.ficha));
        const pSnap = await getDocs(qPersonal);
        
        if (!pSnap.empty) {
          nombreEncontrado = pSnap.docs[0].data().nombre;
        }
      }

      return {
        ficha: asis.ficha || "S/F",
        nombre: nombreEncontrado,
        fecha: asis.fecha,
        hora: asis.hora || "--:--",
        tipo: asis.tipo || "Registro"
      };
    }));

    return resultados;
  };

  if (!mounted) return null;

  return (
    <div className="container">
      <div className="header">
        <h1 className="main-title">Reportes Generales</h1>
        <p className="subtitle">Generación de documentos oficiales Invecem.</p>
        <div className="divider"></div>
      </div>

      <div className="cards-grid">
        <div className="report-card">
          <div className="icon-circle">📄</div>
          <h3>Reporte Diario</h3>
          <input type="date" className="date-input" value={fechaDiaria} onChange={(e)=>setFechaDiaria(e.target.value)} />
          <button className="btn-pdf" onClick={() => handleDownloadPDF('diario', fechaDiaria)}>Descargar PDF</button>
          <button className="btn-excel" onClick={() => handleDownloadExcel('diario', fechaDiaria)}>Exportar Excel</button>
        </div>

        <div className="report-card">
          <div className="icon-circle">📅</div>
          <h3>Consolidado Semanal</h3>
          <input type="week" className="date-input" defaultValue="2026-W12" id="sInput" />
          <button className="btn-pdf" onClick={() => handleDownloadPDF('semanal', document.getElementById('sInput')?.value)}>Descargar PDF</button>
          <button className="btn-excel" onClick={() => handleDownloadExcel('semanal', document.getElementById('sInput')?.value)}>Exportar Excel</button>
        </div>

        <div className="report-card">
          <div className="icon-circle">📊</div>
          <h3>Cierre Mensual</h3>
          <input type="month" className="date-input" defaultValue="2026-03" id="mInput" />
          <button className="btn-pdf" onClick={() => handleDownloadPDF('mensual', document.getElementById('mInput')?.value)}>Descargar PDF</button>
          <button className="btn-excel" onClick={() => handleDownloadExcel('mensual', document.getElementById('mInput')?.value)}>Exportar Excel</button>
        </div>
      </div>

      <div className="indicators-card">
        <h4 className="indicators-title">Indicadores del Mes Actual</h4>
        <div className="indicators-grid">
          <div className="ind-item">
            <span className="ind-value orange">{indicadores.asistencia}</span>
            <span className="ind-label">ASISTENCIA PROMEDIO</span>
          </div>
          <div className="ind-item border-left">
            <span className="ind-value orange">{indicadores.retrasos}</span>
            <span className="ind-label">RETRASOS</span>
          </div>
          <div className="ind-item border-left">
            <span className="ind-value orange">{indicadores.reposos}</span>
            <span className="ind-label">REPOSOS</span>
          </div>
          <div className="ind-item border-left">
            <span className="ind-value orange">{indicadores.inasistencias}</span>
            <span className="ind-label">FALTAS</span>
          </div>
        </div>
      </div>

     <style jsx>{`
  .container { 
    padding: 20px; 
    max-width: 1200px; 
    margin: 0 auto; 
    background: #f4f7fa; 
    min-height: 100vh; 
    font-family: sans-serif; 
  }

  .main-title { 
    color: #003366; 
    font-size: 24px; 
    font-weight: 800; 
    text-align: center;
  }

  .subtitle {
    text-align: center;
    font-size: 14px;
    color: #64748b;
  }

  .divider { 
    height: 2px; 
    background: #1e3a5f; 
    margin: 20px 0; 
  }

  /* GRID RESPONSIVE */
  .cards-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
    gap: 20px; 
    margin-bottom: 30px; 
  }

  .report-card { 
    background: white; 
    padding: 25px; 
    border-radius: 15px; 
    text-align: center; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
  }

  .icon-circle { 
    width: 50px; 
    height: 50px; 
    background: #f1f5f9; 
    border-radius: 50%; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    margin: 0 auto 15px; 
    font-size: 20px; 
  }

  .date-input { 
    width: 100%; 
    padding: 10px; 
    border: 1px solid #e2e8f0; 
    border-radius: 8px; 
    margin-bottom: 15px; 
    box-sizing: border-box; /* Evita que el input se salga del card */
  }

  button { 
    width: 100%; 
    padding: 12px; 
    border: none; 
    border-radius: 8px; 
    font-weight: 700; 
    cursor: pointer; 
    margin-bottom: 10px; 
    transition: transform 0.1s; 
  }

  button:active { transform: scale(0.98); }

  .btn-pdf { background: #fee2e2; color: #e30613; }
  .btn-excel { background: #dcfce7; color: #16a34a; }

  /* INDICADORES RESPONSIVOS */
  .indicators-card { 
    background: white; 
    padding: 20px; 
    border-radius: 15px; 
  }

  .indicators-title {
    text-align: center;
    margin-bottom: 20px;
    color: #1e293b;
  }

  .indicators-grid { 
    display: grid; 
    grid-template-columns: repeat(2, 1fr); /* 2 columnas en tablets */
    gap: 20px;
  }

  /* Desktop: 4 columnas */
  @media (min-width: 768px) {
    .indicators-grid { grid-template-columns: repeat(4, 1fr); }
    .main-title { font-size: 28px; text-align: left; }
    .subtitle { text-align: left; }
    .container { padding: 40px; }
  }

  /* Mobile: 1 columna */
  @media (max-width: 480px) {
    .indicators-grid { grid-template-columns: 1fr; }
    .border-left { border-left: none; border-top: 1px solid #f1f5f9; padding-top: 15px; }
  }

  .ind-item { display: flex; flex-direction: column; align-items: center; }
  .border-left { border-left: 1px solid #f1f5f9; }
  .ind-value { font-size: 24px; font-weight: 800; color: #f97316; }
  .ind-label { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
`}</style>
    </div>
  );
}