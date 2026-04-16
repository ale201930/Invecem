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
        .form-container { background: #f1f5f9; min-height: 100vh; padding: 40px 20px; display: flex; justify-content: center; }
        .sislexi-card { background: white; padding: 40px; border-radius: 15px; width: 100%; max-width: 850px; border-top: 5px solid #f59e0b; }
        .form-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
        .btn-volver { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 15px; border-radius: 8px; cursor: pointer; color: #64748b; font-weight: 600; }
        h2 { color: #1e3a8a; font-size: 1.4rem; margin: 0; }
        .section-title { color: #1e3a8a; font-size: 0.85rem; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin: 30px 0 20px; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 15px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        label { font-size: 0.7rem; font-weight: 800; color: #475569; }
        input, select { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
        .disabled-input { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
        .btn-submit { width: 100%; background: #f59e0b; color: white; padding: 16px; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 40px; }
        .shadow { box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .cargando { display: flex; justify-content: center; align-items: center; height: 100vh; font-weight: bold; color: #1e3a8a; }
      `}</style>
    </div>
  );
}