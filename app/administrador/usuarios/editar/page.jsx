"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EditarUsuario() {
  const [formData, setFormData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  // 1. CARGAR LOS DATOS ACTUALES DEL USUARIO
  useEffect(() => {
    if (!userId) return;
    const cargarDatos = async () => {
      try {
        const docRef = doc(db, "usuarios", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data());
        } else {
          alert("No se encontró el expediente del usuario.");
          router.push("/administrador/usuarios");
        }
      } catch (error) {
        console.error("Error al cargar:", error);
      }
    };
    cargarDatos();
  }, [userId, router]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // 2. GUARDAR LOS CAMBIOS EN FIRESTORE
  const handleActualizar = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const docRef = doc(db, "usuarios", userId);
      await updateDoc(docRef, formData);
      alert("✅ Expediente actualizado correctamente");
      router.push("/administrador/usuarios");
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Error al actualizar: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  if (!formData) return <div className="cargando">Cargando datos del personal...</div>;

  return (
    <div className="form-container">
      <form onSubmit={handleActualizar} className="sislexi-card shadow">
        <div className="form-header">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="btn-volver"
          >
            ← Cancelar
          </button>
          <h2>Editar Expediente de Personal</h2>
        </div>

        {/* SECCIÓN 1: CREDENCIALES (Lectura) */}
        <section className="form-section">
          <h3 className="section-title">Credenciales de Acceso</h3>
          <div className="row">
            <div className="field">
              <label>CORREO INSTITUCIONAL</label>
              <input name="correo" type="email" value={formData.correo} disabled className="disabled-input" />
            </div>
            <div className="field">
              <label>UID DE SISTEMA</label>
              <input value={userId} disabled className="disabled-input" />
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: INFO PERSONAL */}
        <section className="form-section">
          <h3 className="section-title">Información Personal</h3>
          <div className="row">
            <div className="field">
              <label>NOMBRES Y APELLIDOS</label>
              <input name="nombres" type="text" value={formData.nombres || ""} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>CÉDULA DE IDENTIDAD</label>
              <input name="cedula" type="text" value={formData.cedula || ""} onChange={handleChange} required />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>TELÉFONO</label>
              <input name="telefono" type="text" value={formData.telefono || ""} onChange={handleChange} />
            </div>
            <div className="field">
              <label>FECHA NACIMIENTO</label>
              <input name="fechaNac" type="date" value={formData.fechaNac || ""} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* SECCIÓN 3: FICHA LABORAL */}
        <section className="form-section">
          <h3 className="section-title">Ficha Laboral</h3>
          <div className="row">
            <div className="field">
              <label>N° DE FICHA</label>
              <input name="ficha" type="text" value={formData.ficha || ""} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>ROL</label>
              <select name="rol" onChange={handleChange} value={formData.rol}>
                <option value="Inspector">Inspector</option>
                <option value="Administrador">Administrador</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Proteccion Fisica">Proteccion Fisica</option>
              </select>
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>CARGO</label>
              <input name="cargo" type="text" value={formData.cargo || ""} onChange={handleChange} />
            </div>
            <div className="field">
              <label>DEPARTAMENTO</label>
              <input name="departamento" type="text" value={formData.departamento || ""} onChange={handleChange} />
            </div>
          </div>

          {/* CAMPO AGREGADO: FECHA DE INGRESO */}
          <div className="row">
            <div className="field">
              <label>FECHA DE INGRESO A LA EMPRESA</label>
              <input 
                name="fechaIngreso" 
                type="date" 
                value={formData.fechaIngreso || ""} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
        </section>

        <button type="submit" className="btn-submit" disabled={cargando}>
          {cargando ? "Actualizando..." : "Guardar Cambios en el Expediente"}
        </button>
      </form>

      <style jsx>{`
  /* --- WRAPPER CON PATRÓN DE FONDO --- */
  .form-container { 
    background-color: #f0f4f8; 
    background-image: radial-gradient(#d1d5db 0.8px, transparent 0.8px);
    background-size: 24px 24px;
    min-height: 100vh; 
    padding: 60px 20px; 
    display: flex; 
    justify-content: center; 
    font-family: 'Inter', sans-serif;
  }

  /* --- TARJETA PRINCIPAL (ESTILO ROBUSTO) --- */
  .sislexi-card { 
    background: white; 
    padding: 45px; 
    border-radius: 24px; 
    width: 100%; 
    max-width: 850px; 
    border: 1px solid #e2e8f0;
    border-top: 8px solid #e30613; /* Rojo INVECEM */
    box-shadow: 12px 12px 0px #0f172a; /* Sombra sólida */
  }

  .form-header { 
    display: flex; 
    align-items: center; 
    gap: 20px; 
    margin-bottom: 35px; 
    border-bottom: 2px solid #f1f5f9;
    padding-bottom: 25px;
  }

  h2 { 
    color: #0f172a; 
    font-size: 1.4rem; 
    font-weight: 900; 
    margin: 0; 
    text-transform: uppercase;
    letter-spacing: 1.5px; /* Título más separado */
  }

  .btn-volver { 
    background: #f1f5f9; 
    border: 1px solid #e2e8f0; 
    padding: 10px 18px; 
    border-radius: 10px; 
    cursor: pointer; 
    color: #64748b; 
    font-weight: 800; 
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    transition: 0.3s;
  }
  .btn-volver:hover { 
    background: #e30613; 
    color: white; 
    border-color: #e30613; 
  }

  /* --- TÍTULOS DE SECCIÓN --- */
  .section-title { 
    color: #e30613; 
    font-size: 0.8rem; 
    font-weight: 900;
    text-transform: uppercase; 
    border-bottom: 2px solid #f1f5f9; 
    padding-bottom: 8px; 
    margin: 35px 0 25px; 
    letter-spacing: 2px; /* Espaciado premium */
  }

  /* --- GRID DE FORMULARIO --- */
  .row { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 30px; 
    margin-bottom: 20px; 
  }
  
  .field { display: flex; flex-direction: column; gap: 8px; }
  
  label { 
    font-size: 10px; 
    font-weight: 800; 
    color: #0f172a; 
    text-transform: uppercase; 
    letter-spacing: 1.2px; /* Etiquetas más separadas */
  }

  input, select { 
    padding: 14px; 
    border: 2px solid #f1f5f9; 
    border-radius: 12px; 
    font-size: 0.9rem;
    font-weight: 600;
    color: #1e293b;
    outline: none;
    transition: 0.3s;
    letter-spacing: 0.5px;
  }
  
  input:focus, select:focus { 
    border-color: #e30613; 
    background: #fffcfc;
  }

  /* ESTADO DESHABILITADO */
  .disabled-input { 
    background: #f8fafc; 
    color: #94a3b8; 
    cursor: not-allowed; 
    border-style: dashed;
  }

  /* --- BOTÓN SUBMIT (3D ROJO) --- */
  .btn-submit { 
    width: 100%; 
    background: #e30613; 
    color: white; 
    padding: 18px; 
    border: none; 
    border-radius: 14px; 
    font-weight: 900; 
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer; 
    margin-top: 40px; 
    transition: 0.2s;
    box-shadow: 0 4px 0px #b8050f;
  }
  
  .btn-submit:hover { 
    transform: translateY(2px); 
    box-shadow: 0 2px 0px #8a040b; 
  }

  /* --- PANTALLA DE CARGA --- */
  .cargando { 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    height: 100vh; 
    font-weight: 900; 
    color: #0f172a; 
    text-transform: uppercase;
    letter-spacing: 3px;
    background: #f0f4f8;
  }

  @media (max-width: 600px) {
    .row { grid-template-columns: 1fr; gap: 20px; }
    .sislexi-card { padding: 30px; }
  }
`}</style>
    </div>
  );
}