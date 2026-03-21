"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
// IMPORTACIÓN CORREGIDA: Apuntando a app/lib/firebase.ts
// Prueba con el alias absoluto directo al archivo
import { db } from "@/app/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function RegistrarPersonal() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    cedula: "",
    nombres: "",
    apellidos: "",
    ficha: "",
    cargo: "",
    area: "",
    turno: "Diurno (07:00 AM - 04:00 PM)",
    estatus: "Activo (En funciones)",
    observaciones: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Guardamos en la colección "personal" de Firestore
      await addDoc(collection(db, "personal"), {
        ...formData,
        fechaRegistro: new Date().toLocaleDateString()
      });
      alert("✅ ¡Éxito! Los datos ya están en Firebase.");
      router.push("/recursos-humanos/usuarios-registrados");
    } catch (error) {
      console.error("Error Firebase:", error);
      alert("❌ Error al guardar: " + error.message);
    }
  };

  return (
    <div className="container">
      <button className="btn-back" onClick={() => router.push("/recursos-humanos")}>
        ← Volver al Panel
      </button>

      <div className="form-card">
        <div className="form-header">
          <div className="header-left">
            <h1 className="main-title">INVECEM Registro RRHH</h1>
            <p className="subtitle">Formulario de Ingreso al Maestro de Personal</p>
          </div>
          <div className="date-box">
            6 DE FEBRERO DE 2026
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <section className="form-section">
            <h3 className="section-title"><span>1</span> Identificación del Personal</h3>
            <div className="grid-3">
              <div className="input-group">
                <label>Cédula de Identidad</label>
                <input type="text" name="cedula" placeholder="V-00.000.000" onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Nombres</label>
                <input type="text" name="nombres" placeholder="Ej: Juan" onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Apellidos</label>
                <input type="text" name="apellidos" placeholder="Ej: Pérez" onChange={handleChange} required />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h3 className="section-title"><span>2</span> Información Laboral y Estatus</h3>
            <div className="grid-3">
              <div className="input-group">
                <label>Número de Ficha</label>
                <input type="text" name="ficha" placeholder="INV-0000" onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Cargo</label>
                <input type="text" name="cargo" placeholder="Ej: Operador" onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Área / Departamento</label>
                <select name="area" onChange={handleChange} required>
                  <option value="">Seleccione Área...</option>
                  <option value="produccion">Producción</option>
                  <option value="hse">HSE (Seguridad)</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="administracion">Administración</option>
                </select>
              </div>
            </div>

            <div className="grid-2 mt-20">
              <div className="input-group">
                <label>Turno Asignado</label>
                <select name="turno" className="border-yellow" onChange={handleChange}>
                  <option>Diurno (07:00 AM - 04:00 PM)</option>
                  <option>Nocturno (09:00 PM - 05:00 AM)</option>
                  <option>Mixto</option>
                </select>
              </div>
              <div className="input-group">
                <label>Estatus Actual</label>
                <select name="estatus" className="border-green" onChange={handleChange}>
                  <option>Activo (En funciones)</option>
                  <option>Reposo Médico</option>
                  <option>Vacaciones</option>
                  <option>Inactivo</option>
                </select>
              </div>
            </div>
          </section>

          <section className="form-section">
            <h3 className="section-title"><span>3</span> Observaciones</h3>
            <textarea name="observaciones" placeholder="Indique detalles..." onChange={handleChange}></textarea>
          </section>

          <div className="form-actions">
            <button type="reset" className="btn-secondary">Limpiar Formulario</button>
            <button type="submit" className="btn-primary">Guardar Registro Maestro</button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .container { padding: 20px; max-width: 1000px; margin: 0 auto; }
        .btn-back { background: none; border: none; color: #64748b; cursor: pointer; margin-bottom: 20px; font-weight: 500; }
        .form-card { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .form-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
        .main-title { color: #0f172a; font-size: 24px; margin: 0; font-weight: 800; }
        .date-box { background: #0f172a; color: white; padding: 8px 15px; border-radius: 8px; font-size: 12px; font-weight: bold; }
        .form-section { margin-bottom: 35px; }
        .section-title { display: flex; align-items: center; gap: 10px; font-size: 16px; color: #1e293b; margin-bottom: 20px; }
        .section-title span { background: #e30613; color: white; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 12px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .mt-20 { margin-top: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 13px; font-weight: 600; color: #475569; }
        input, select, textarea { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; }
        .border-yellow { border-left: 5px solid #fbbf24; }
        .border-green { border-left: 5px solid #22c55e; }
        .form-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
        .btn-primary { background: #0f172a; color: white; border: none; padding: 12px 25px; border-radius: 10px; font-weight: bold; cursor: pointer; }
        .btn-secondary { background: #f1f5f9; color: #475569; border: none; padding: 12px 25px; border-radius: 10px; font-weight: bold; cursor: pointer; }
        .btn-primary:hover { background: #e30613; }
      `}</style>
    </div>
  );
}