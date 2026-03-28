"use client";

import React, { useState, useEffect, Suspense } from "react"; 
import { useRouter, useSearchParams } from "next/navigation";
import { db, registrarAccion } from "@/app/lib/firebase"; // Importamos registrarAccion
import Cookies from "js-cookie"; // Importamos para saber quién registra
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
const HORARIO_PASANTE = "Pasantías (08:00 AM - 04:00 PM)";

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
  universidadPasante: "", 
  carreraPasante: "",      
  turno: HORARIOS_PLANTA.DIURNO,
  estatus: "Activo (En funciones)",
  fechaIngreso: "",
  telefono: "",
  correo: "",
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
    if (!editId) {
      if (formData.tipoPersonal === "Estudiante INCESS") {
        setFormData(prev => ({ ...prev, turno: HORARIO_INCES }));
      } else if (formData.tipoPersonal === "Pasante") {
        setFormData(prev => ({ ...prev, turno: HORARIO_PASANTE }));
      } else if (formData.tipoPersonal === "INVECEM") {
        setFormData(prev => ({ ...prev, turno: HORARIOS_PLANTA.DIURNO }));
      }
    }
  }, [formData.tipoPersonal, editId]);

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
            alert("No se encontró el registro.");
            router.push("/recursos-humanos/usuarios-registrados");
          }
        } catch (error) { console.error("Error:", error); }
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
    // Permitimos escribir hasta 5, pero validaremos 4 o 5 al enviar
    if (value.length <= 5) {
      setFormData({ ...formData, ficha: value.toUpperCase() });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // VALIDACIÓN DE LONGITUD: 4 o 5 dígitos
    if (formData.ficha.length < 4 || formData.ficha.length > 5) {
        alert("⚠️ El número de ficha debe tener 4 o 5 dígitos (Personal antiguo o nuevo).");
        return;
    }

    setLoading(true);
    try {
      const personalRef = collection(db, "personal");

      if (editId) {
        await updateDoc(doc(db, "personal", editId), { ...formData, ultimaActualizacion: serverTimestamp() });
        alert("✅ Registro actualizado.");
        router.push("/recursos-humanos/usuarios-registrados");
      } else {
        // --- VALIDACIÓN DE DUPLICADOS (Cédula y Ficha) ---
        
        // 1. Check Cédula
        const qCedula = query(personalRef, where("cedula", "==", formData.cedula));
        const queryCedula = await getDocs(qCedula);
        if (!queryCedula.empty) { 
            alert("⚠️ Error: Esta Cédula ya está registrada en el sistema."); 
            setLoading(false); 
            return; 
        }

        // 2. Check Ficha
        const qFicha = query(personalRef, where("ficha", "==", formData.ficha));
        const queryFicha = await getDocs(qFicha);
        if (!queryFicha.empty) { 
            alert(`⚠️ Error: El número de ficha ${formData.ficha} ya pertenece a otro trabajador.`); 
            setLoading(false); 
            return; 
        }

        // Si pasa ambas validaciones, guardamos
        await addDoc(personalRef, { ...formData, fechaRegistro: serverTimestamp() });
        
        // REGISTRO EN MONITOREO
        const userSession = Cookies.get("user_session") || "Usuario";
        const userRole = Cookies.get("user_role") || "RRHH";
        await registrarAccion(
            userSession, 
            userRole, 
            `Registró al personal: ${formData.nombres} ${formData.apellidos} (Ficha: ${formData.ficha})`, 
            "Recursos Humanos"
        );

        alert("✅ Personal registrado exitosamente.");
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
                <option value="Pasante">PASANTE (UNIVERSITARIO)</option>
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
                <label>Número de Ficha (4 o 5 dígitos)</label>
                <input 
                    type="text" 
                    name="ficha" 
                    value={formData.ficha} 
                    onChange={handleFichaChange} 
                    placeholder="Ej: 1234 o 12345"
                    required 
                    disabled={!!editId} 
                />
              </div>

              {formData.tipoPersonal === "INVECEM" && (
                <>
                  <div className="input-group"><label>Cargo</label><input type="text" name="cargo" value={formData.cargo} onChange={handleChange} required /></div>
                  <div className="input-group">
                    <label>Área</label>
                    <select name="area" value={formData.area} onChange={handleChange} required>
                      <option value="">Seleccione Área...</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Almacen">Almacen</option>
                      <option value="Recursos Humanos">Recursos Humanos</option>
                      <option value="Administración">Administración</option>
                      <option value="Logística">Logística</option>
                    </select>
                  </div>
                </>
              )}

              {formData.tipoPersonal === "Estudiante INCESS" && (
                <>
                  <div className="input-group"><label>Programa de Formación</label><input type="text" name="programaInces" value={formData.programaInces} onChange={handleChange} required /></div>
                  <div className="input-group"><label>Fase / Cohorte</label><input type="text" name="cohorteInces" value={formData.cohorteInces} onChange={handleChange} required /></div>
                </>
              )}
              {formData.tipoPersonal === "Pasante" && (
                <>
                  <div className="input-group"><label>Universidad</label><input type="text" name="universidadPasante" value={formData.universidadPasante} onChange={handleChange} required /></div>
                  <div className="input-group"><label>Carrera</label><input type="text" name="carreraPasante" value={formData.carreraPasante} onChange={handleChange} required /></div>
                </>
              )}
            </div>

            <div className="grid-2 mt-20">
              <div className="input-group">
                <label>Turno Asignado (Editable)</label>
                <input 
                  list="horarios-sugeridos" 
                  name="turno" 
                  value={formData.turno} 
                  onChange={handleChange} 
                  className="border-yellow"
                  placeholder="Escribe o selecciona un horario..."
                  required
                />
                <datalist id="horarios-sugeridos">
                  <option value={HORARIOS_PLANTA.DIURNO} />
                  <option value={HORARIOS_PLANTA.NOCTURNO} />
                  <option value={HORARIO_INCES} />
                  <option value={HORARIO_PASANTE} />
                </datalist>
                <small style={{ fontSize: '10px', color: '#008b8b' }}>Doble clic para ver sugerencias.</small>
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
            <h3 className="section-title"><span>3</span> Contacto e Ingreso</h3>
            <div className="grid-3">
              <div className="input-group">
                <label>Fecha de Ingreso</label>
                <input type="date" name="fechaIngreso" value={formData.fechaIngreso} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Teléfono Celular</label>
                <input type="tel" name="telefono" value={formData.telefono} placeholder="0412-0000000" onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Correo Institucional/Personal</label>
                <input type="email" name="correo" value={formData.correo} placeholder="ejemplo@invecem.com" onChange={handleChange} required />
              </div>
            </div>
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
        /* Tus mismos estilos se mantienen intactos */
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

        @media (max-width: 768px) {
          .grid-3, .grid-2 { grid-template-columns: 1fr; }
        }
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