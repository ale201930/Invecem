"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase"; 
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp 
} from "firebase/firestore";

export default function ReportesGenerales() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [fechaDiaria, setFechaDiaria] = useState(new Date().toISOString().split('T')[0]);
  const [indicadores, setIndicadores] = useState({
    asistencia: "0 Pers.", retrasos: 0, reposos: 0, vacaciones: 0, inasistencias: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Función para formato 12h
  const formatAMPM = (hora24) => {
    if (!hora24 || hora24 === "--:--") return "--:--";
    let [horas, minutos] = hora24.split(':');
    horas = parseInt(horas);
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12;
    horas = horas ? horas : 12;
    return `${horas.toString().padStart(2, '0')}:${minutos} ${ampm}`;
  };

  useEffect(() => {
    if (!mounted) return;
    
    // 1. Escuchar Personal (Reposos, Vacaciones, Inactivos)
    const unsubPersonal = onSnapshot(collection(db, "personal"), (snapshot) => {
      const personal = snapshot.docs.map(doc => doc.data());
      setIndicadores(prev => ({ 
        ...prev, 
        reposos: personal.filter(p => p.estatus === "Reposo Médico").length,
        vacaciones: personal.filter(p => p.estatus === "Vacaciones").length,
        inasistencias: personal.filter(p => p.estatus === "Inactivo").length 
      }));
    });

    // 2. Escuchar Asistencias del día para "EN PLANTA" y "RETRASOS"
    const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date(); finHoy.setHours(23, 59, 59, 999);

    const qAsis = query(
      collection(db, "asistencias"), 
      where("fechaHora", ">=", Timestamp.fromDate(inicioHoy)),
      where("fechaHora", "<=", Timestamp.fromDate(finHoy))
    );
    
    const unsubAsis = onSnapshot(qAsis, (snapshot) => {
      const asistenciasHoy = snapshot.docs.map(doc => doc.data());
      
      // --- CORRECCIÓN AQUÍ: Solo contamos los que NO tienen salida marcada ---
      const personasEnPlanta = asistenciasHoy.filter(a => !a.salida || a.salida === "--:--");
      const totalEnPlanta = new Set(personasEnPlanta.map(a => a.ficha)).size;

      // Retrasos: Solo de los que entraron hoy por motivo laboral
      const retardos = asistenciasHoy.filter(a => {
        const d = a.fechaHora?.toDate();
        const esLaboral = a.motivo === "LABORAL" || !a.motivo;
        return d && esLaboral && (d.getHours() > 7 || (d.getHours() === 7 && d.getMinutes() > 10));
      }).length;

      setIndicadores(prev => ({ 
        ...prev, 
        retrasos: retardos, 
        asistencia: `${totalEnPlanta} Pers.` 
      }));
    });

    return () => { unsubPersonal(); unsubAsis(); };
  }, [mounted]);

  // (Mantenemos las funciones loadScript, handleDownloadPDF y fetchReportData igual que antes...)
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

  const handleDownloadPDF = async (tipo, valor) => {
    if (!valor) return alert("Seleccione un periodo.");
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js");
      const { jsPDF } = window.jspdf;
      const data = await fetchReportData(tipo, valor);
      if (data.length === 0) return alert("No hay registros finalizados.");

      const docPDF = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
      const pageWidth = docPDF.internal.pageSize.getWidth();
      docPDF.setFillColor(0, 139, 139); 
      docPDF.rect(0, 0, pageWidth, 35, 'F');
      docPDF.setTextColor(255, 255, 255);
      docPDF.setFontSize(20);
      docPDF.text("INVECEM - CONTROL DE ASISTENCIA Y BENEFICIOS", 14, 18);
      docPDF.setFontSize(10);
      docPDF.text(`REPORTE DE JORNADAS | PERIODO: ${valor}`, 14, 28);
      
      const rows = data.map(item => [
        item.ficha, item.nombre, item.area.toUpperCase(), item.cargo.toUpperCase(),
        formatAMPM(item.entrada), formatAMPM(item.salida), item.estado.toUpperCase()
      ]);
      
      docPDF.autoTable({
        startY: 40,
        head: [['FICHA', 'NOMBRE COMPLETO', 'ÁREA TRABAJO', 'CARGO', 'H. ENTRADA', 'H. SALIDA', 'ESTADO / MOTIVO']],
        body: rows,
        headStyles: { fillColor: [0, 139, 139], fontSize: 9, halign: 'center', cellPadding: 3 },
        styles: { fontSize: 8, halign: 'center', cellPadding: 2, valign: 'middle' },
        columnStyles: { 0: { cellWidth: 20 }, 1: { halign: 'left', cellWidth: 48 }, 4: { cellWidth: 28 }, 5: { cellWidth: 28 }, 6: { fontStyle: 'bold', cellWidth: 45 } },
        alternateRowStyles: { fillColor: [240, 252, 252] },
        margin: { left: 10, right: 10 }
      });
      docPDF.save(`Reporte_Invecem_${valor}.pdf`);
    } catch (err) { alert("Error al generar el PDF."); }
  };

  const fetchReportData = async (tipo, valor) => {
    const colRef = collection(db, "asistencias"); 
    let q;
    if (tipo === 'diario') {
      const inicio = new Date(valor + "T00:00:00");
      const fin = new Date(valor + "T23:59:59");
      q = query(colRef, where("fechaHora", ">=", Timestamp.fromDate(inicio)), where("fechaHora", "<=", Timestamp.fromDate(fin)), orderBy("fechaHora", "asc"));
    } else { q = query(colRef, orderBy("fechaHora", "desc")); }

    const snap = await getDocs(q);
    const registros = {};
    snap.docs.forEach(doc => {
      const asis = doc.data();
      const dateJS = asis.fechaHora?.toDate();
      if(!dateJS) return;
      const fechaKey = dateJS.toLocaleDateString('es-ES');
      const id = `${asis.ficha}_${fechaKey}`;
      if (!registros[id]) {
        let estadoFinal = "Puntual";
        if (asis.motivo === "BENEFICIO") {
           const estatusLimpio = asis.estatus_al_entrar?.split(" ")[0] || "ESPECIAL";
           estadoFinal = `${estatusLimpio} (BENEFICIO)`;
        } else {
           if (dateJS.getHours() > 7 || (dateJS.getHours() === 7 && dateJS.getMinutes() > 10)) estadoFinal = "Retraso";
        }
        registros[id] = { ficha: asis.ficha, nombre: asis.nombreCompleto || "S/N", area: asis.area || "GENERAL", cargo: asis.cargo || "OPERARIO", entrada: asis.entrada || "--:--", salida: asis.salida || "--:--", estado: estadoFinal };
      } else {
        if (asis.salida) registros[id].salida = asis.salida;
        if (asis.entrada) registros[id].entrada = asis.entrada;
      }
    });
    return Object.values(registros).filter(r => r.salida !== "--:--");
  };

  if (!mounted) return null;

  return (
    <div className="container">
      <div className="header-section">
        <button className="btn-back" onClick={() => router.push("/recursos-humanos")}>← Volver al Panel</button>
        <h1 className="main-title">Reportes de Personal</h1>
        <p className="subtitle">Indicadores en tiempo real | Formato Carta Horizontal.</p>
      </div>

      <div className="cards-grid">
        <div className="report-card shadow-relief">
          <div className="icon-circle">☀️</div>
          <h3>Reporte Diario</h3>
          <input type="date" className="date-input" value={fechaDiaria} onChange={(e)=>setFechaDiaria(e.target.value)} />
          <button className="btn-pdf" onClick={() => handleDownloadPDF('diario', fechaDiaria)}>Descargar PDF</button>
        </div>
        <div className="report-card shadow-relief">
          <div className="icon-circle">📅</div>
          <h3>Semanal</h3>
          <input type="week" className="date-input" id="sInput" />
          <button className="btn-pdf" onClick={() => handleDownloadPDF('semanal', document.getElementById('sInput')?.value)}>Descargar PDF</button>
        </div>
        <div className="report-card shadow-relief">
          <div className="icon-circle">📊</div>
          <h3>Mensual</h3>
          <input type="month" className="date-input" id="mInput" />
          <button className="btn-pdf" onClick={() => handleDownloadPDF('mensual', document.getElementById('mInput')?.value)}>Descargar PDF</button>
        </div>
      </div>

      <div className="indicators-card shadow-relief">
        <div className="indicators-grid">
          <div className="ind-item"><span className="ind-value turquesa">{indicadores.asistencia}</span><span className="ind-label">EN PLANTA</span></div>
          <div className="ind-item border-left"><span className="ind-value rojo">{indicadores.retrasos}</span><span className="ind-label">RETRASOS HOY</span></div>
          <div className="ind-item border-left"><span className="ind-value">{indicadores.reposos}</span><span className="ind-label">EN REPOSO</span></div>
          <div className="ind-item border-left"><span className="ind-value" style={{color: '#00ced1'}}>{indicadores.vacaciones}</span><span className="ind-label">VACACIONES</span></div>
          <div className="ind-item border-left"><span className="ind-value">{indicadores.inasistencias}</span><span className="ind-label">INACTIVOS</span></div>
        </div>
      </div>

      <style jsx>{`
        .container { padding: 40px; max-width: 1100px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; background: #f8fafc; min-height: 100vh; }
        .header-section { margin-bottom: 30px; border-left: 6px solid #008b8b; padding-left: 20px; }
        .main-title { font-size: 26px; font-weight: 800; color: #1e293b; margin: 0; }
        .subtitle { color: #64748b; font-size: 14px; }
        .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin-bottom: 35px; }
        .report-card { background: white; padding: 25px; border-radius: 15px; text-align: center; border: 1px solid #e2e8f0; }
        .shadow-relief { box-shadow: 7px 7px 0px #008b8b; }
        .date-input { width: 100%; padding: 10px; margin: 10px 0; border: 2px solid #f1f5f9; border-radius: 8px; font-weight: 600; }
        .btn-pdf { width: 100%; padding: 12px; background: #0f172a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 800; transition: 0.3s; }
        .btn-pdf:hover { background: #008b8b; }
        .indicators-card { background: #0f172a; color: white; padding: 25px; border-radius: 20px; }
        .indicators-grid { display: grid; grid-template-columns: repeat(5, 1fr); }
        .ind-item { text-align: center; }
        .ind-value { font-size: 24px; font-weight: 900; display: block; }
        .ind-label { font-size: 9px; color: #94a3b8; font-weight: 700; }
        .turquesa { color: #008b8b; }
        .rojo { color: #ef4444; }
        .border-left { border-left: 1px solid #334155; }
        .btn-back { background: none; border: none; color: #64748b; font-weight: bold; cursor: pointer; margin-bottom: 5px; }
      `}</style>
    </div>
  );
}