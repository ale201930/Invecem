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
  doc, 
  updateDoc,
  setDoc,
  getDoc
} from "firebase/firestore";

export default function AsistenciaDiariaRRHH() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [filtroArea, setFiltroArea] = useState("TODAS");
  const [filtroTipo, setFiltroTipo] = useState("TODOS"); 
  const [filtroEstadoClic, setFiltroEstadoClic] = useState("PRESENTES"); 
  
  const [asistencias, setAsistencias] = useState([]);
  const [nominaTotalData, setNominaTotalData] = useState([]); 
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  const [fechaHoyStr, setFechaHoyStr] = useState("");
  const [resumen, setResumen] = useState({ presentes: 0, inasistencias: 0, vacaciones: 0, reposo: 0, total: 0 });

  const [masterPin, setMasterPin] = useState("1234");
  const [haySolicitudPendiente, setHaySolicitudPendiente] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const configRef = doc(db, "configuracion", "seguridad");
      const docSnap = await getDoc(configRef);
      if (docSnap.exists()) {
        setMasterPin(docSnap.data().pinMaestro);
      }
    };
    fetchConfig();
  }, []);

  const handleChangeMasterPin = async () => {
    const oldPin = prompt("SEGURIDAD: Ingrese el código maestro ACTUAL:");
    if (oldPin !== masterPin) {
      alert("❌ Código incorrecto. No puede realizar cambios.");
      return;
    }
    const newPin = prompt("Ingrese el NUEVO código maestro:");
    if (!newPin || newPin.length < 4) {
      alert("❌ El código debe tener al menos 4 dígitos.");
      return;
    }
    const confirmPin = prompt("Confirme el NUEVO código maestro:");
    if (newPin === confirmPin) {
      try {
        setMasterPin(newPin);
        localStorage.setItem("INVECEM_MASTER_PIN", newPin);
        await setDoc(doc(db, "configuracion", "seguridad"), { pinMaestro: newPin });
        alert("✅ Código Maestro actualizado y sincronizado con éxito.");
      } catch (error) {
        alert("❌ Error al sincronizar con la base de datos.");
      }
    } else {
      alert("❌ Los códigos no coinciden.");
    }
  };

  // --- CORRECCIÓN 1: AUTORIZAR Y DAR SALIDA AUTOMÁTICA ---
  const autorizarSalida = async (registroId) => {
    const pin = prompt("AUTORIZACIÓN: Ingrese el Código Maestro para permitir la salida:");
    if (pin === masterPin) {
      const docRef = doc(db, "asistencias", registroId);
      await updateDoc(docRef, { 
        solicitudSalida: "APROBADA",
        enPlanta: false, // Se marca fuera de planta automáticamente
        salida: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) // Registra hora de salida
      });
      alert("✅ Salida autorizada y registrada correctamente.");
    } else {
      alert("❌ Código Maestro inválido.");
    }
  };

  useEffect(() => {
    setMounted(true);
    const ahora = new Date();
    const opcionesFecha = { day: 'numeric', month: 'long', year: 'numeric' };
    setFechaHoyStr(ahora.toLocaleDateString('es-ES', opcionesFecha).toUpperCase());
    
    const qNomina = query(
      collection(db, "personal"), 
      where("tipoPersonal", "in", ["INVECEM", "Estudiante INCES", "Estudiante INCESS", "Pasante"])
    );

    const unsubscribeNomina = onSnapshot(qNomina, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNominaTotalData(data);
      const areasSet = new Set(data.map(a => a.area || "No asignado"));
      setAreasDisponibles(Array.from(areasSet).sort());
    });

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const qAsistencias = query(
      collection(db, "asistencias"),
      where("fechaHora", ">=", inicioHoy),
      where("tipoPersonal", "in", ["INVECEM", "Estudiante INCES", "Estudiante INCESS", "Pasante"]), 
      orderBy("fechaHora", "desc")
    );

    const unsubscribeAsist = onSnapshot(qAsistencias, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAsistencias(lista);
      const pendientes = lista.some(a => a.alertaSalida === "ANTICIPADA" && a.solicitudSalida === "PENDIENTE");
      setHaySolicitudPendiente(pendientes);
    });

    return () => {
      unsubscribeNomina();
      unsubscribeAsist();
    };
  }, []);

  // --- CORRECCIÓN 2: LÓGICA DE AUTO-ACTIVACIÓN MEJORADA ---
  useEffect(() => {
    if (nominaTotalData.length > 0) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      nominaTotalData.forEach(async (persona) => {
        if ((persona.estatus === "Vacaciones" || persona.estatus === "Reposo Médico") && persona.fechaRegreso) {
          const partes = persona.fechaRegreso.split("-");
          const fechaRetorno = new Date(partes[0], partes[1] - 1, partes[2]);
          fechaRetorno.setHours(0, 0, 0, 0);

          if (hoy >= fechaRetorno) {
            const personaRef = doc(db, "personal", persona.id);
            try {
              await updateDoc(personaRef, { 
                estatus: "Activo (En funciones)", 
                fechaSalida: null, 
                fechaRegreso: null 
              });
              console.log(`Auto-activación ejecutada para: ${persona.nombres}`);
            } catch (error) { console.error("Error en auto-activación:", error); }
          }
        }
      });
    }
  }, [nominaTotalData]);

  useEffect(() => {
    const fAsistencias = asistencias.filter(a => {
      if (filtroTipo === "INVECEM") return a.tipoPersonal === "INVECEM";
      if (filtroTipo === "INCES") return a.tipoPersonal?.includes("INCES");
      if (filtroTipo === "PASANTES") return a.tipoPersonal === "Pasante";
      return true;
    });
    const nominaFiltrada = nominaTotalData.filter(p => {
      if (filtroTipo === "INVECEM") return p.tipoPersonal === "INVECEM";
      if (filtroTipo === "INCES") return p.tipoPersonal?.includes("INCES");
      if (filtroTipo === "PASANTES") return p.tipoPersonal === "Pasante";
      return true;
    });
    const presentesEnPlanta = fAsistencias.filter(a => !a.salida).length;
    const vacaciones = nominaFiltrada.filter(p => p.estatus === "Vacaciones").length;
    const reposo = nominaFiltrada.filter(p => p.estatus === "Reposo Médico").length;
    const inasistencias = nominaFiltrada.filter(p => 
      (p.estatus?.includes("Activo") || !p.estatus) && !fAsistencias.some(a => a.ficha === p.ficha)
    ).length;
    setResumen({ total: nominaFiltrada.length, presentes: presentesEnPlanta, inasistencias, vacaciones, reposo });
  }, [filtroTipo, asistencias, nominaTotalData]);

  const obtenerListaFinal = () => {
    let base = nominaTotalData.map(p => {
      const registro = asistencias.find(a => a.ficha === p.ficha);
      return { 
        ...p, 
        entrada: registro?.entrada || null, 
        salida: registro?.salida || null, 
        asistioHoy: !!registro,
        alertaSalida: registro?.alertaSalida || null,
        solicitudSalida: registro?.solicitudSalida || null,
        regId: registro?.id || null
      };
    });
    base = base.filter(p => {
      const cumpleTexto = (p.nombres?.toLowerCase() || "").includes(filtro.toLowerCase()) || 
                          (p.apellidos?.toLowerCase() || "").includes(filtro.toLowerCase()) ||
                          (p.ficha?.toLowerCase() || "").includes(filtro.toLowerCase());
      const cumpleArea = filtroArea === "TODAS" || (p.area || "No asignado") === filtroArea;
      let cumpleTipo = true;
      if (filtroTipo === "INVECEM") cumpleTipo = p.tipoPersonal === "INVECEM";
      if (filtroTipo === "INCES") cumpleTipo = p.tipoPersonal?.includes("INCES");
      if (filtroTipo === "PASANTES") cumpleTipo = p.tipoPersonal === "Pasante";
      return cumpleTexto && cumpleArea && cumpleTipo;
    });
    if (filtroEstadoClic === "PRESENTES" || filtroEstadoClic === "TODOS") return base.filter(p => p.asistioHoy);
    if (filtroEstadoClic === "INASISTENCIAS") return base.filter(p => !p.asistioHoy && (p.estatus?.includes("Activo") || !p.estatus));
    if (filtroEstadoClic === "VACACIONES") return base.filter(p => p.estatus === "Vacaciones");
    if (filtroEstadoClic === "REPOSO") return base.filter(p => p.estatus === "Reposo Médico");
    return base;
  };

  const getEstadoEstilo = (reg) => {
    if (reg.estatus === "Vacaciones") return { texto: "Vacaciones", clase: "vacaciones-status" };
    if (reg.estatus === "Reposo Médico") return { texto: "Reposo Médico", clase: "reposo-status" };
    if (!reg.asistioHoy) return { texto: "Falta", clase: "falta" };
    if (reg.alertaSalida === "ANTICIPADA" && reg.solicitudSalida === "PENDIENTE") {
      return { texto: "ESPERANDO RRHH", clase: "falta blink-alerta" };
    }
    if (reg.solicitudSalida === "APROBADA") return { texto: "AUTORIZADO", clase: "puntual" };
    if (reg.salida) return { texto: "Salió", clase: "card-total" };
    const estatusCalculado = reg.estatus || "Puntual";
    return { texto: estatusCalculado, clase: estatusCalculado === "Puntual" ? "puntual" : "retraso" };
  };

  if (!mounted) return null;

  return (
    <div className="container">
      <div className="top-nav no-print">
        <button className="btn-back" onClick={() => router.push("/recursos-humanos")}>← Volver al Panel</button>
        <div style={{display: 'flex', gap: '10px'}}>
           <button 
             className={`btn-record ${haySolicitudPendiente ? "btn-alert-blink" : ""}`} 
             style={{background: haySolicitudPendiente ? "#e30613" : "#334155"}} 
             onClick={handleChangeMasterPin}
           >
             ⚙️ Código Maestro {haySolicitudPendiente ? "(ALERTA)" : ""}
           </button>
           <button className="btn-record" onClick={() => router.push("/recursos-humanos/asistencia-del-dia/record-asistencia")}>🏆 Ver Récord de Asistencia</button>
        </div>
      </div>

      <header className="main-header">
        <div className="header-left">
          <h1 className={`main-title ${haySolicitudPendiente ? "text-blink-red" : ""}`}>
            INVECEM Asistencia Diaria
          </h1>
          <p className="subtitle">{filtroTipo === "TODOS" ? "Personal Propio, INCES y Pasantes" : `REPORTE: ${filtroTipo}`}</p>
        </div>
        <div className="date-box">{fechaHoyStr}</div>
      </header>

      <div className="filter-tabs no-print">
        <button className={filtroTipo === "TODOS" ? "active" : ""} onClick={() => {setFiltroTipo("TODOS"); setFiltroEstadoClic("PRESENTES");}}>TODOS</button>
        <button className={filtroTipo === "INVECEM" ? "active" : ""} onClick={() => {setFiltroTipo("INVECEM"); setFiltroEstadoClic("PRESENTES");}}>TRABAJADORES INVECEM</button>
        <button className={filtroTipo === "INCES" ? "active" : ""} onClick={() => {setFiltroTipo("INCES"); setFiltroEstadoClic("PRESENTES");}}>ESTUDIANTES INCES</button>
        <button className={filtroTipo === "PASANTES" ? "active" : ""} onClick={() => {setFiltroTipo("PASANTES"); setFiltroEstadoClic("PRESENTES");}}>PASANTES</button>
      </div>

      <section className="resumen-grid no-print">
        <div className={`card card-presentes ${filtroEstadoClic === "PRESENTES" ? "active-card" : ""}`} onClick={() => setFiltroEstadoClic("PRESENTES")}>
          <small>EN PLANTA ACTIVOS</small><h2>{resumen.presentes}</h2>
          <span className="hint">En planta actualmente</span>
        </div>
        <div className={`card card-inasistencias ${filtroEstadoClic === "INASISTENCIAS" ? "active-card" : ""}`} onClick={() => setFiltroEstadoClic("INASISTENCIAS")}>
          <small>INASISTENCIAS</small><h2>{resumen.inasistencias}</h2>
          <span className="hint">Ver faltas</span>
        </div>
        <div className={`card card-vacaciones ${filtroEstadoClic === "VACACIONES" ? "active-card" : ""}`} onClick={() => setFiltroEstadoClic("VACACIONES")}>
          <small>EN VACACIONES</small><h2>{resumen.vacaciones}</h2>
          <span className="hint">Ver quiénes</span>
        </div>
        <div className={`card card-reposo ${filtroEstadoClic === "REPOSO" ? "active-card" : ""}`} onClick={() => setFiltroEstadoClic("REPOSO")}>
          <small>EN REPOSO</small><h2>{resumen.reposo}</h2>
          <span className="hint">Ver quiénes</span>
        </div>
        <div className={`card card-total ${filtroEstadoClic === "TODOS" ? "active-card" : ""}`} onClick={() => setFiltroEstadoClic("TODOS")}>
          <small>TOTAL REGISTROS</small><h2>{asistencias.length}</h2>
          <span className="hint">Asistencias totales hoy</span>
        </div>
      </section>

      <div className="table-container shadow-relief">
        <div className="table-header-info">
          <h3 className="view-title">Filtrado por: <span className="text-turquesa">{filtroEstadoClic}</span></h3>
        </div>
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
              <th>ENTRADA</th>
              <th>SALIDA</th>
              <th>ESTATUS</th>
              <th className="no-print">ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {obtenerListaFinal().map((reg) => {
              const estadoData = getEstadoEstilo(reg);
              const esPendiente = reg.alertaSalida === "ANTICIPADA" && reg.solicitudSalida === "PENDIENTE";
              return (
                <tr key={reg.id || reg.ficha} style={{backgroundColor: esPendiente ? "#fff1f2" : "transparent"}}>
                  <td className="ficha-cell">{reg.ficha || "---"}</td>
                  <td className="nombre-cell">{reg.nombres} {reg.apellidos}</td>
                  <td>
                    <div className="cargo-text-table">{reg.cargo || "No asignado"}</div>
                    <div className="area-text-table">{reg.area || "No asignado"}</div>
                  </td>
                  <td className="hora-cell">{reg.entrada || "--:--"}</td>
                  <td className="hora-cell">{reg.salida || "--:--"}</td>
                  <td>
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                      <span className={`badge ${estadoData.clase}`}>{estadoData.texto}</span>
                      {/* --- CORRECCIÓN 3: MUESTRA DE FECHAS EN TABLA --- */}
                      {(reg.estatus === "Vacaciones" || reg.estatus === "Reposo Médico") && reg.fechaRegreso && (
                        <span style={{fontSize: '9px', fontWeight: '900', color: '#64748b', marginTop: '4px'}}>
                          📅 Regreso: {reg.fechaRegreso}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {esPendiente && (
                      <button className="btn-autorizar" onClick={() => autorizarSalida(reg.regId)}>
                        🔓 AUTORIZAR
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .container { padding: 20px; max-width: 1400px; margin: 0 auto; font-family: sans-serif; background-color: #f8fafc; min-height: 100vh; }
        .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-weight: 800; }
        .btn-record { background: #008b8b; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s; }
        .btn-record:hover { background: #006b6b; transform: scale(1.05); }
        .main-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .main-title { color: #0f172a; font-size: 28px; margin: 0; font-weight: 900; }
        .subtitle { color: #008b8b; font-size: 14px; margin: 5px 0 0; font-weight: 800; }
        .date-box { background: #0f172a; color: white; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 900; box-shadow: 4px 4px 0px #008b8b; }
        .filter-tabs { display: flex; gap: 10px; margin-bottom: 25px; }
        .filter-tabs button { background: white; border: 1px solid #e2e8f0; padding: 12px 20px; border-radius: 10px; font-weight: 800; color: #64748b; cursor: pointer; font-size: 11px; transition: 0.3s; }
        .filter-tabs button.active { background: #0f172a; color: white; border-color: #0f172a; }
        .resumen-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 30px; }
        .card { background: white; padding: 20px; border-radius: 15px; cursor: pointer; transition: 0.3s; border: 1px solid #e2e8f0; position: relative; }
        .card:hover { transform: translateY(-5px); }
        .active-card { border: 2px solid #008b8b; box-shadow: 0 10px 20px rgba(0, 139, 139, 0.1); background: #f0fdfa; }
        .card h2 { font-size: 36px; color: #0f172a; margin: 5px 0 0; font-weight: 900; }
        .card small { font-weight: 900; color: #64748b; font-size: 10px; }
        .hint { font-size: 9px; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-top: 10px; display: block; }
        .card-presentes { border-top: 6px solid #22c55e; }
        .card-inasistencias { border-top: 6px solid #ef4444; }
        .card-vacaciones { border-top: 6px solid #3b82f6; }
        .card-reposo { border-top: 6px solid #f59e0b; }
        .card-total { border-top: 6px solid #0f172a; }
        .table-container { background: white; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; }
        .shadow-relief { box-shadow: 10px 10px 0px #008b8b; }
        .view-title { font-size: 14px; font-weight: 900; margin-bottom: 20px; color: #64748b; text-transform: uppercase; }
        .text-turquesa { color: #008b8b; }
        .table-actions { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px; }
        .filters-group { display: flex; gap: 10px; flex: 1; }
        .search-input, .area-select { padding: 12px; border: 2px solid #f1f5f9; border-radius: 10px; flex: 1; font-weight: 600; outline: none; }
        .btn-print { background: #e30613; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 800; cursor: pointer; transition: 0.3s; }
        .btn-print:hover { background: #c10510; }
        .asistencia-table { width: 100%; border-collapse: collapse; }
        .asistencia-table th { text-align: left; padding: 15px; color: #475569; font-size: 11px; border-bottom: 3px solid #f1f5f9; font-weight: 900; }
        .asistencia-table td { padding: 18px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .ficha-cell { font-weight: 900; color: #0f172a; }
        .nombre-cell { font-weight: 700; text-transform: uppercase; color: #1e293b; }
        .cargo-text-table { font-weight: 800; color: #008b8b; font-size: 12px; }
        .area-text-table { font-weight: 600; color: #94a3b8; font-size: 10px; }
        .hora-cell { font-family: monospace; font-weight: 900; color: #1e293b; font-size: 15px; }
        .badge { padding: 6px 14px; border-radius: 8px; font-weight: 900; font-size: 10px; text-transform: uppercase; }
        .puntual { background: #dcfce7; color: #166534; }
        .retraso { background: #fef3c7; color: #92400e; }
        .falta { background: #fee2e2; color: #991b1b; }
        .vacaciones-status { background: #dbeafe; color: #1e40af; }
        .reposo-status { background: #fef3c7; color: #92400e; }
        .btn-alert-blink { animation: alert-pulse 1s infinite alternate; }
        .text-blink-red { animation: text-pulse 1.5s infinite; }
        .blink-alerta { animation: opacity-pulse 0.8s infinite; }
        .btn-autorizar { background: #e30613; color: white; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 900; cursor: pointer; font-size: 10px; }

        @keyframes alert-pulse {
          from { background: #e30613; transform: scale(1); }
          to { background: #0f172a; transform: scale(1.05); }
        }
        @keyframes text-pulse {
          0% { color: #0f172a; }
          50% { color: #e30613; }
          100% { color: #0f172a; }
        }
        @keyframes opacity-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @media print { .no-print { display: none !important; } .container { background: white; padding: 0; } .shadow-relief { box-shadow: none; border: 1px solid #000; } }
      `}</style>
    </div>
  );
}