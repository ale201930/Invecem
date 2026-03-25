"use client";

import React, { useState, useEffect, Suspense } from "react"; 
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc 
} from "firebase/firestore";

const HORARIOS_PLANTA = {
  DIURNO: "Diurno (07:00 AM - 04:00 PM)",
  NOCTURNO: "Nocturno (07:00 PM - 07:00 AM)"
};

const HORARIO_INCES = "Estudiante (08:00 AM - 03:00 PM)";
const HORARIO_PASANTE = "Pasantías (08:00 AM - 04:00 PM)"; // Nuevo horario para pasantes

const estadoInicial = {
  cedula: "",
  nombres: "",
  apellidos: "",
  ficha: "",
  cargo: "",
  area: "",
  tipoPersonal: "INVECEM", 
  programaInces: "", 
  cohorteInces: "",
  universidadPasante: "", // Nuevo campo
  carreraPasante: "",     // Nuevo campo
  turno: HORARIOS_PLANTA.DIURNO,
  estatus: "Activo (En funciones)",
  observaciones: "",
  recordAsistencia: 0 
};

function FormularioRegistro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  
  const [fechaHoy, setFechaHoy] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(estadoInicial);

  useEffect(() => {
    // Control de horarios automáticos según el tipo
    if (formData.tipoPersonal === "Estudiante INCESS") {
      setFormData(prev => ({ ...prev, turno: HORARIO_INCES }));
    } else if (formData.tipoPersonal === "Pasante") {
      setFormData(prev => ({ ...prev, turno: HORARIO_PASANTE }));
    } else if (formData.tipoPersonal === "INVECEM" && (formData.turno === HORARIO_INCES || formData.turno === HORARIO_PASANTE)) {
      setFormData(prev => ({ ...prev, turno: HORARIOS_PLANTA.DIURNO }));
    }
  }, [formData.tipoPersonal]);

  useEffect(() => {
    if (editId) {
      const obtenerDatos = async () => {
        setLoading(true);
        try {
          const docRef = doc(db, "personal", editId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormData(docSnap.data());
          } else {
            alert("No se encontró el registro para editar.");
            router.push("/recursos-humanos/usuarios-registrados");
          }
        } catch (error) { console.error("Error al cargar datos:", error); }
        setLoading(false);
      };
      obtenerDatos();
    }
    const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
    setFechaHoy(new Date().toLocaleDateString('es-ES', opciones).toUpperCase());
  }, [editId, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFichaChange = (e) => {
    const { value } = e.target;
    if (value.length <= 5) {
      setFormData({ ...formData, ficha: value.toUpperCase() });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.ficha.length !== 5) {
        alert("⚠️ La ficha debe tener exactamente 5 dígitos.");
        return;
    }

    setLoading(true);
    try {
      const personalRef = collection(db, "personal");

      if (editId) {
        await updateDoc(doc(db, "personal", editId), {
          ...formData,
          ultimaActualizacion: serverTimestamp()
        });
        alert("✅ Registro actualizado.");
        router.push("/recursos-humanos/usuarios-registrados");
      } else {
        const qCedula = query(personalRef, where("cedula", "==", formData.cedula));
        const queryCedula = await getDocs(qCedula);
        if (!queryCedula.empty) {
          alert("⚠️ La Cédula ya existe.");
          setLoading(false);
          return;
        }

        const qFicha = query(personalRef, where("ficha", "==", formData.ficha));
        const queryFicha = await getDocs(qFicha);
        if (!queryFicha.empty) {
          alert(`⚠️ La Ficha ${formData.ficha} ya está asignada.`);
          setLoading(false);
          return;
        }

        await addDoc(personalRef, { ...formData, fechaRegistro: serverTimestamp() });
        alert("✅ Personal registrado correctamente.");
        setFormData(estadoInicial);
      }
    } catch (error) { alert("Error: " + error.message); }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="top-nav">
        <button className="btn-back" onClick={() => router.push("/recursos-humanos")}>← Volver al Panel</button>
        <button className="btn-link" onClick={() => router.push("/recursos-humanos/usuarios-registrados")}>Ver Base de Datos →</button>
      </div>

      <div className="form-card shadow-relief">
        <div className="form-header">
          <div className="header-left">
            <h1 className="main-title">INVECEM {editId ? "Edición" : "Registro"}</h1>
            <p className="subtitle">{editId ? "Actualizando perfil" : "Nuevo ingreso al sistema"}</p>
          </div>
          <div className="date-box">{fechaHoy || "Cargando..."}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <section className="form-section">
            <h3 className="section-title"><span>1</span> Identificación</h3>
            <div className="input-group mb-20">
              <label>Tipo de Personal</label>
              <select name="tipoPersonal" value={formData.tipoPersonal} onChange={handleChange} className="select-highlight" required>
                <option value="INVECEM">TRABAJADOR INVECEM (FIJO)</option>
                <option value="Estudiante INCESS">ESTUDIANTE INCES</option>
                <option value="Pasante">PASANTE (UNIVERSITARIO)</option> {/* Opción agregada */}
              </select>
            </div>
            <div className="grid-3">
              <div className="input-group">
                <label>Cédula</label>
                <input type="text" name="cedula" value={formData.cedula} placeholder="V-00.000.000" onChange={handleChange} required disabled={!!editId} />
              </div>
              <div className="input-group">
                <label>Nombres</label>
                <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Apellidos</label>
                <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h3 className="section-title"><span>2</span> Ubicación y Horario</h3>
            <div className="grid-3">
              <div className="input-group">
                <label>Número de Ficha (5 dígitos)</label>
                <input 
                    type="text" name="ficha" value={formData.ficha} placeholder="00000" 
                    onChange={handleFichaChange} required disabled={!!editId}
                    style={{ borderColor: formData.ficha.length === 5 ? '#008b8b' : '#cbd5e1' }}
                />
                <small style={{ fontSize: '10px', color: '#64748b' }}>{formData.ficha.length}/5 caracteres</small>
              </div>

              {/* CAMPOS DINÁMICOS SEGÚN TIPO DE PERSONAL */}
              {formData.tipoPersonal === "INVECEM" && (
                <>
                  <div className="input-group">
                    <label>Cargo</label>
                    <input type="text" name="cargo" value={formData.cargo} placeholder="Ej: Operador" onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label>Área</label>
                    <select name="area" value={formData.area} onChange={handleChange} required>
                      <option value="">Seleccione Área...</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Producción">Producción</option>
                      <option value="HSE (Seguridad)">HSE (Seguridad)</option>
                      <option value="Administración">Administración</option>
                      <option value="Logística">Logística</option>
                    </select>
                  </div>
                </>
              )}

              {formData.tipoPersonal === "Estudiante INCESS" && (
                <>
                  <div className="input-group">
                    <label>Programa de Formación</label>
                    <input type="text" name="programaInces" value={formData.programaInces} placeholder="Ej: Mecánica" onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label>Fase / Cohorte</label>
                    <input type="text" name="cohorteInces" value={formData.cohorteInces} placeholder="Ej: 2024-II" onChange={handleChange} required />
                  </div>
                </>
              )}

              {formData.tipoPersonal === "Pasante" && (
                <>
                  <div className="input-group">
                    <label>Universidad / Instituto</label>
                    <input type="text" name="universidadPasante" value={formData.universidadPasante} placeholder="Ej: Unerg / Iut" onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label>Carrera</label>
                    <input type="text" name="carreraPasante" value={formData.carreraPasante} placeholder="Ej: Informática" onChange={handleChange} required />
                  </div>
                </>
              )}
            </div>

            <div className="grid-2 mt-20">
              <div className="input-group">
                <label>Turno Asignado</label>
                <select name="turno" value={formData.turno} className="border-yellow" onChange={handleChange} 
                  disabled={formData.tipoPersonal !== "INVECEM"}>
                  {formData.tipoPersonal === "INVECEM" ? (
                    <>
                      <option value={HORARIOS_PLANTA.DIURNO}>{HORARIOS_PLANTA.DIURNO}</option>
                      <option value={HORARIOS_PLANTA.NOCTURNO}>{HORARIOS_PLANTA.NOCTURNO}</option>
                    </>
                  ) : formData.tipoPersonal === "Pasante" ? (
                    <option value={HORARIO_PASANTE}>{HORARIO_PASANTE}</option>
                  ) : (
                    <option value={HORARIO_INCES}>{HORARIO_INCES}</option>
                  )}
                </select>
              </div>
              <div className="input-group">
                <label>Estatus</label>
                <select name="estatus" value={formData.estatus} className="border-green" onChange={handleChange}>
                  <option>Activo (En funciones)</option>
                  <option>Reposo Médico</option>
                  <option>Vacaciones</option>
                  <option>Inactivo</option>
                </select>
              </div>
            </div>
          </section>

          <section className="form-section">
            <h3 className="section-title"><span>3</span> Notas Adicionales</h3>
            <textarea name="observaciones" value={formData.observaciones} placeholder="Observaciones de ingreso..." onChange={handleChange} style={{ width: '100%', minHeight: '100px' }}></textarea>
          </section>

          <div className="form-actions">
            {!editId && <button type="button" className="btn-secondary" onClick={() => setFormData(estadoInicial)}>Limpiar</button>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Procesando..." : (editId ? "Guardar Cambios" : "Registrar Personal")}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .container { padding: 20px; max-width: 1000px; margin: 0 auto; }
        .top-nav { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-weight: 600; }
        .btn-link { background: none; border: none; color: #008b8b; cursor: pointer; font-weight: 800; }
        .form-card { background: white; padding: 40px; border-radius: 15px; border: 1px solid #e2e8f0; }
        .shadow-relief { box-shadow: 8px 8px 0px #008b8b; }
        .form-header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
        .main-title { color: #0f172a; font-size: 24px; font-weight: 800; margin: 0; }
        .date-box { background: #0f172a; color: white; padding: 8px 15px; border-radius: 8px; font-size: 11px; font-weight: bold; }
        .form-section { margin-bottom: 35px; }
        .section-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 700; margin-bottom: 20px; }
        .section-title span { background: #008b8b; color: white; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 12px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .mb-20 { margin-bottom: 20px; }
        .mt-20 { margin-top: 20px; }
        label { font-size: 13px; font-weight: 700; color: #475569; }
        input, select, textarea { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline-color: #008b8b; }
        .select-highlight { border: 2px solid #008b8b; background: #f0fdfa; font-weight: 700; }
        .border-yellow { border-left: 5px solid #fbbf24; }
        .border-green { border-left: 5px solid #008b8b; }
        .form-actions { display: flex; justify-content: flex-end; gap: 15px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        .btn-primary { background: #0f172a; color: white; border: none; padding: 12px 25px; border-radius: 10px; font-weight: bold; cursor: pointer; transition: 0.3s; }
        .btn-secondary { background: #f1f5f9; color: #475569; border: none; padding: 12px 25px; border-radius: 10px; font-weight: bold; cursor: pointer; }
        .btn-primary:hover { background: #008b8b; transform: translateY(-2px); }
        .loader { text-align: center; padding: 100px; color: #008b8b; font-weight: bold; }
      `}</style>
    </div>
  );
}

export default function RegistrarPersonal() {
  return (
    <Suspense fallback={<div className="loader">Cargando aplicación...</div>}>
      <FormularioRegistro />
    </Suspense>
  );
}