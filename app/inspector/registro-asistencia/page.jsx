"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { 
  collection, query, where, getDocs, addDoc, 
  updateDoc, doc, serverTimestamp, onSnapshot, orderBy, deleteDoc 
} from "firebase/firestore";

export default function RegistroAsistencia() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState("");
  const [filtro, setFiltro] = useState("");
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [esperandoAutorizacion, setEsperandoAutorizacion] = useState(false);
  const [fechaHoy, setFechaHoy] = useState("");

  const MASTER_PIN = "1234"; 

  const obtenerHoraAMPM = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const validarSalidaAnticipada = (turnoTexto) => {
    if (!turnoTexto || !turnoTexto.includes("-")) return false;

    const convertirAMinutos = (str) => {
      const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let [ , hrs, mins, meridiano] = match;
      hrs = parseInt(hrs); mins = parseInt(mins);
      if (meridiano.toUpperCase() === "PM" && hrs !== 12) hrs += 12;
      if (meridiano.toUpperCase() === "AM" && hrs === 12) hrs = 0;
      return (hrs * 60) + mins;
    };

    const ahora = new Date();
    const minutosActuales = (ahora.getHours() * 60) + ahora.getMinutes();
    const horaSalidaTurno = turnoTexto.split("-")[1].trim();
    const minutosSalidaTurno = convertirAMinutos(horaSalidaTurno);

    if (minutosSalidaTurno === null) return false;
    return minutosActuales < (minutosSalidaTurno - 5); 
  };

  useEffect(() => {
    const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
    setFechaHoy(new Date().toLocaleDateString('es-ES', opciones).toUpperCase());

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "asistencias"), 
      where("fechaHora", ">=", inicioHoy),
      orderBy("fechaHora", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAsistenciasHoy(lista);
    });

    return () => unsubscribe();
  }, []);

  const calcularEstatus = (horaEntrada, turnoTexto) => {
    if (!turnoTexto) return "Puntual";

    const convertirAMinutos = (str) => {
      const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let [ , hrs, mins, meridiano] = match;
      hrs = parseInt(hrs);
      mins = parseInt(mins);
      if (meridiano.toUpperCase() === "PM" && hrs !== 12) hrs += 12;
      if (meridiano.toUpperCase() === "AM" && hrs === 12) hrs = 0;
      return (hrs * 60) + mins;
    };

    const minutosMarcados = convertirAMinutos(horaEntrada);
    const horaInicioTurno = turnoTexto.split("-")[0].trim();
    const minutosTurno = convertirAMinutos(horaInicioTurno);

    if (minutosMarcados === null || minutosTurno === null) return "Puntual";
    const MARGEN = 5; 

    if (minutosMarcados > (minutosTurno + MARGEN)) {
      return "Retraso";
    }
    return "Puntual";
  };

  const finalizarSalida = async (id, anticipada) => {
    await updateDoc(doc(db, "asistencias", id), {
      salida: obtenerHoraAMPM(),
      estado: "FINALIZADO",
      alertaSalida: anticipada ? "ANTICIPADA" : "NORMAL",
      solicitudSalida: anticipada ? "COMPLETADA" : null
    });
    setEsperandoAutorizacion(false);
    setIdentificador("");
    setCargando(false);
  };

  const handleLimpiarHoy = async () => {
    const pin = prompt("MODO DESARROLLADOR:");
    if (pin === MASTER_PIN) {
      if (confirm("⚠️ ¿BORRAR TODO?")) {
        setCargando(true);
        try {
          const snapshot = await getDocs(collection(db, "asistencias"));
          const borrarPromesas = snapshot.docs.map(d => deleteDoc(doc(db, "asistencias", d.id)));
          await Promise.all(borrarPromesas);
          alert("✅ SISTEMA LIMPIO.");
        } catch (error) {
          console.error(error);
        }
        setCargando(false);
      }
    }
  };

  const procesarRegistro = async (e) => {
    if (e) e.preventDefault();
    const valor = identificador.trim();
    if (!valor || cargando || esperandoAutorizacion) return;
    setCargando(true);

    try {
      let personaEncontrada = null;
      let esContratista = false;

      const personalRef = collection(db, "personal");
      let qFicha = query(personalRef, where("ficha", "==", valor));
      let snap = await getDocs(qFicha);

      if (snap.empty) {
        let qCedula = query(personalRef, where("cedula", "==", valor));
        snap = await getDocs(qCedula);
      }

      if (snap.empty) {
        const contratistasRef = collection(db, "contratistas");
        const allContratas = await getDocs(contratistasRef);
        personaEncontrada = allContratas.docs
          .map(d => ({ ...d.data(), id: d.id }))
          .find(c => c.cedula === valor || c.cedula.endsWith(valor));

        if (personaEncontrada) esContratista = true;
      } else {
        personaEncontrada = snap.docs[0].data();
      }

      if (!personaEncontrada) {
        alert("❌ No registrado.");
        setIdentificador(""); setCargando(false); return;
      }

      const horaActual = obtenerHoraAMPM(); 
      const registroExistente = asistenciasHoy.find(a => 
        (a.cedula === personaEncontrada.cedula || (a.ficha && a.ficha === personaEncontrada.ficha)) && (!a.salida || a.salida === "--:--")
      );

      if (registroExistente) {
        const esAnticipada = validarSalidaAnticipada(personaEncontrada.turno);

        if (esAnticipada) {
          if (confirm("⚠️ ¿Solicitar autorización remota a RRHH?")) {
             setEsperandoAutorizacion(true);
             const docRef = doc(db, "asistencias", registroExistente.id);
             await updateDoc(docRef, { solicitudSalida: "PENDIENTE", alertaSalida: "ANTICIPADA" });

             const unsub = onSnapshot(docRef, (snapshot) => {
               if (snapshot.data()?.solicitudSalida === "APROBADA") {
                 unsub();
                 finalizarSalida(registroExistente.id, true);
               }
             });
             setCargando(false);
             return; 
          } else {
            setIdentificador(""); setCargando(false); return;
          }
        }
        await finalizarSalida(registroExistente.id, false);
        return;
      }

      let esBeneficio = false;
      if (!esContratista && personaEncontrada.estatus !== "Activo (En funciones)") {
        if (window.confirm(`⚠️ PERSONAL EN ${personaEncontrada.estatus?.toUpperCase()}\n¿Autorizar entrada para BENEFICIOS?`)) {
          if (prompt("PIN:") !== MASTER_PIN) { alert("PIN Incorrecto."); setIdentificador(""); setCargando(false); return; }
          esBeneficio = true;
        } else { setIdentificador(""); setCargando(false); return; }
      }

      const estatusCalculado = esContratista ? "PRESENTE" : calcularEstatus(horaActual, personaEncontrada.turno);

      await addDoc(collection(db, "asistencias"), {
        nombreCompleto: `${personaEncontrada.nombres} ${personaEncontrada.apellidos}`.toUpperCase(),
        ficha: personaEncontrada.ficha || "EXTERNO",
        cedula: personaEncontrada.cedula,
        cargo: esContratista ? "CONTRATISTA" : (personaEncontrada.cargo || "No asignado"),
        area: esContratista ? (personaEncontrada.nombreContrata || "CONTRATA") : (personaEncontrada.area || "No asignado"),
        tipoPersonal: esContratista ? "CONTRATISTA" : (personaEncontrada.tipoPersonal || "INVECEM"),
        entrada: horaActual,
        salida: null, 
        estado: "PRESENTE",
        estatus: estatusCalculado,
        estatus_al_entrar: personaEncontrada.estatus || "Activo",
        motivo: esBeneficio ? "BENEFICIO" : "LABORAL",
        fechaHora: serverTimestamp()
      });

      setIdentificador("");
    } catch (error) { 
      console.error(error); 
    }
    setCargando(false);
  };

  const listaFiltrada = asistenciasHoy.filter(a => 
    (a.nombreCompleto?.toLowerCase() || "").includes(filtro.toLowerCase()) || 
    (a.ficha?.toLowerCase() || "").includes(filtro.toLowerCase()) ||
    (a.cedula?.toLowerCase() || "").includes(filtro.toLowerCase())
  );

  return (
    <div className="container">
      {esperandoAutorizacion && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white'
        }}>
          <h2 style={{color: '#e30613'}}>ESPERANDO AUTORIZACIÓN DE RRHH...</h2>
          <p>La solicitud ha sido enviada al panel principal.</p>
          <button onClick={() => setEsperandoAutorizacion(false)} className="btn-clean">Cancelar</button>
        </div>
      )}

      <div className="no-print" style={{marginBottom: '10px'}}>
        <button onClick={() => router.push("/inspector")} className="btn-back">← Volver al Panel</button>
      </div>

      <div className="main-card shadow-relief">
        <header className="card-header">
          <h1>INVECEM: Control de Asistencia</h1>
          <span className="date-tag">{fechaHoy}</span>
        </header>

        <section className="scanner-box no-print">
          <label>Escaneo de Ficha / Cédula</label>
          <form onSubmit={procesarRegistro} className="input-group">
            <input 
              type="text" 
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              placeholder={esperandoAutorizacion ? "BLOQUEADO" : "ESCANEE O ESCRIBA AQUÍ..."}
              autoFocus
              disabled={cargando || esperandoAutorizacion}
            />
            <button type="submit" disabled={cargando || esperandoAutorizacion} className="btn-registrar">
              {cargando ? "..." : "OK"}
            </button>
          </form>
          <p className="help-text">Fichas, Cédulas y Contratistas.</p>
        </section>

        <div className="table-header no-print">
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="filter-bar"
            onChange={(e) => setFiltro(e.target.value)}
          />
          <div style={{display: 'flex', gap: '10px'}}>
            <button onClick={handleLimpiarHoy} className="btn-clean">Limpiar</button>
            <button onClick={() => window.print()} className="btn-print">Imprimir</button>
          </div>
        </div>

        <div className="table-container">
          <table className="asistencia-table">
            <thead>
              <tr>
                <th>Ficha</th>
                <th>Nombre y Apellido</th>
                <th>Cédula</th>
                <th>Cargo / Área</th>
                <th>Identificación</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((reg) => {
                let badgeLabel = reg.salida ? "FINALIZADO" : (reg.estatus || "PRESENTE");
                let badgeClass = reg.salida ? "finished" : (reg.estatus === "Puntual" ? "present" : "retraso-badge");

                if (!reg.salida && reg.motivo === "BENEFICIO") {
                  badgeLabel = "BENEFICIO"; badgeClass = "benefit";
                }

                if (reg.alertaSalida === "ANTICIPADA") {
                    badgeLabel = "SALIDA ANTICIPADA";
                    badgeClass = "retraso-badge";
                }

                return (
                  <tr key={reg.id}>
                    <td>{reg.ficha}</td>
                    <td style={{fontWeight: 'bold', textAlign: 'left'}}>{reg.nombreCompleto}</td>
                    <td>{reg.cedula}</td>
                    <td>
                      <div style={{fontWeight: 'bold', color: '#008b8b'}}>{reg.cargo}</div>
                      <div style={{fontSize: '11px', fontWeight: '600', color: '#64748b'}}>{reg.area}</div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        color: reg.tipoPersonal === 'CONTRATISTA' ? '#008b8b' : (reg.tipoPersonal === 'Estudiante INCES' ? '#e30613' : '#334155')
                      }}>
                        {reg.tipoPersonal}
                      </span>
                    </td>
                    <td className="time-cell">{reg.entrada}</td>
                    <td className="time-cell">{reg.salida || "--:--"}</td>
                    <td><span className={`badge ${badgeClass}`}>{badgeLabel}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .container { padding: 20px; max-width: 1200px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
        .btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-weight: bold; }
        .main-card { background: white; border-radius: 15px; padding: 30px; border: 1px solid #e2e8f0; }
        .shadow-relief { box-shadow: 8px 8px 0px #334155; } 
        .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e30613; padding-bottom: 15px; margin-bottom: 25px; }
        .card-header h1 { font-size: 22px; color: #0f172a; margin: 0; font-weight: 800; }
        .date-tag { background: #e30613; color: white; padding: 6px 15px; border-radius: 6px; font-size: 12px; font-weight: bold; }
        .scanner-box { background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px dashed #334155; }
        .scanner-box label { display: block; font-weight: 800; color: #0f172a; margin-bottom: 10px; font-size: 14px; }
        .input-group { display: flex; gap: 12px; }
        .input-group input { flex: 1; padding: 15px; border: 3px solid #cbd5e1; border-radius: 8px; font-size: 24px; font-weight: 900; color: #e30613; text-align: center; letter-spacing: 2px; }
        .input-group input:focus { border-color: #334155; outline: none; background: #fff; }
        .btn-registrar { background: #334155; color: white; border: none; padding: 0 35px; border-radius: 8px; font-weight: 900; cursor: pointer; transition: 0.2s; }
        .btn-registrar:hover { background: #e30613; }
        .help-text { font-size: 11px; color: #64748b; margin-top: 12px; font-weight: 600; text-transform: uppercase; }
        .table-header { display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center; }
        .filter-bar { width: 320px; padding: 10px 15px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
        .btn-print { background: #0f172a; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-clean { background: white; color: #ef4444; border: 2px solid #ef4444; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s; }
        .btn-clean:hover { background: #ef4444; color: white; }
        .table-container { overflow-x: auto; }
        .asistencia-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .asistencia-table th { background: #f8fafc; text-align: center; padding: 15px; font-size: 12px; color: #475569; border-bottom: 3px solid #334155; font-weight: 800; }
        .asistencia-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; text-align: center; }
        .time-cell { font-family: 'Courier New', monospace; font-weight: 900; font-size: 16px; color: #e30613; }
        .badge { padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: 900; }
        .present { background: #dcfce7; color: #166534; border: 1px solid #166534; }
        .retraso-badge { background: #fef3c7; color: #92400e; border: 1px solid #92400e; }
        .benefit { background: #fff1f2; color: #e30613; border: 1px solid #e30613; }
        .finished { background: #f1f5f9; color: #94a3b8; }
        
        @media print {
          .no-print { display: none !important; }
          .main-card { box-shadow: none; border: none; padding: 0; }
        }
      `}</style>
    </div>
  );
}