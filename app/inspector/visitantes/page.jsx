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

  if (!mounted) return null;

  const listaFiltrada = visitantes.filter(v => 
    v.nombre.toLowerCase().includes(busqueda.toLowerCase()) || v.cedula.includes(busqueda)
  );

  return (
    <div className="layout">
      <header className="top-nav">
        <div className="logo">INVECEM <span className="red-text">Seguridad</span></div>
        <button className="btn-panel" onClick={() => router.push("/inspector")}>← VOLVER AL PANEL</button>
      </header>

      <main className="content">
        <div className="stats-grid">
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
          <section className="form-section shadow-relief">
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
            <input type="text" placeholder="🔍 Buscar por nombre o cédula..." className="search-input" onChange={e => setBusqueda(e.target.value)} />
            <div className="table-wrapper">
              <table className="visit-table">
                <thead>
                  <tr>
                    <th>VISITANTE / EMPRESA</th>
                    <th>CÉDULA</th>
                    <th>ÁREA</th>
                    <th>ENTRADA</th>
                    <th>ESTADO</th>
                    <th>GESTIÓN</th>
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
                      <td>
                        {v.estado === "En Planta" ? 
                          <button className="btn-salida" onClick={() => handleSalida(v.id, v.fechaIngreso)}>Marcar Salida</button> : 
                          <span className="time-out">Salió: {v.salida}</span>
                        }
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
        .layout { background: #f0f2f5; min-height: 100vh; font-family: 'Segoe UI', sans-serif; color: #1a1a1a; }
        .top-nav { background: #1a1a1a; color: white; padding: 8px 25px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d32f2f; }
        .logo { font-weight: 800; font-size: 18px; }
        .red-text { color: #d32f2f; }
        .btn-panel { background: #d32f2f; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 800; }

        .content { padding: 20px; max-width: 1450px; margin: 0 auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 12px; border-radius: 8px; text-align: center; }
        .stat-card .label { font-size: 10px; font-weight: 800; color: #666; text-transform: uppercase; }
        .stat-card .value { font-size: 24px; font-weight: 900; color: #1a1a1a; display: block; }
        .border-red { border-left: 5px solid #d32f2f; }

        .main-grid { display: grid; grid-template-columns: 460px 1fr; gap: 20px; }
        .shadow-relief { background: white; border-radius: 8px; padding: 18px; box-shadow: 4px 4px 0px #333; border: 2px solid #333; }

        .section-title { margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #eee; padding-bottom: 4px; font-weight: 900; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field { margin-bottom: 10px; }
        .field label { font-size: 9px; font-weight: 900; color: #444; text-transform: uppercase; display: block; margin-bottom: 3px; }
        input, select { width: 100%; padding: 7px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; font-weight: 600; background: #fafafa; }
        input:focus { border-color: #d32f2f; outline: none; background: #fff; }

        .btn-confirmar { width: 100%; background: #d32f2f; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 900; cursor: pointer; text-transform: uppercase; margin-top: 5px; font-size: 12px; }
        .btn-confirmar:hover { background: #1a1a1a; }

        .search-input { width: 100%; max-width: 300px; margin-bottom: 15px; border: 2px solid #333; padding: 5px 10px; font-size: 13px; }
        .visit-table { width: 100%; border-collapse: collapse; }
        .visit-table th { text-align: left; font-size: 10px; color: #888; border-bottom: 2px solid #333; padding: 6px; }
        .visit-table td { padding: 8px 6px; border-bottom: 1px solid #eee; font-size: 12px; }
        
        .v-info strong { display: block; color: #1a1a1a; line-height: 1.1; font-size: 13px; }
        .v-info small { color: #d32f2f; font-weight: 700; font-size: 9px; }
        .bold { font-weight: 800; }
        .tag { background: #333; color: white; padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: 700; }

        .badge { font-size: 9px; font-weight: 900; text-transform: uppercase; padding: 2px 6px; border-radius: 10px; border: 1px solid transparent; }
        .badge.in { background: #ffebee; color: #d32f2f; border-color: #d32f2f; }
        .badge.out { color: #888; background: #f0f0f0; }

        .btn-salida { background: #1a1a1a; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; font-weight: 800; cursor: pointer; }
        .btn-salida:hover { background: #d32f2f; }
        .time-out { font-size: 10px; color: #666; font-weight: 700; font-style: italic; }
      `}</style>
    </div>
  );
}