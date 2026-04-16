"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../../lib/firebase"; 
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function NuevoUsuario() {
  const [formData, setFormData] = useState({
    correo: "", 
    clave: "",
    nombres: "", 
    cedula: "", 
    telefono: "", 
    fechaNac: "", 
    nacionalidad: "Venezolana", 
    direccion: "",
    ficha: "", 
    rol: "Inspector", 
    cargo: "", 
    departamento: "", 
    fechaIngreso: "" // Nuevo campo inicializado
  });
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (formData.clave.length < 6) return alert("La clave debe tener al menos 6 caracteres.");
    
    setCargando(true);
    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.correo, formData.clave);
      const uid = userCredential.user.uid;

      // 2. Preparar datos para Firestore (sin la contraseña por seguridad)
      const { clave, ...datosParaGuardar } = formData;

      // 3. Guardar en la colección de usuarios
      await setDoc(doc(db, "usuarios", uid), {
        uid,
        ...datosParaGuardar,
        estado: "Activo",
        fechaRegistro: new Date().toISOString()
      });

      alert("✅ Personal registrado exitosamente");
      router.push("/administrador/usuarios"); 
    } catch (error) {
      console.error("Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("Error: Este correo ya está registrado en el sistema.");
      } else {
        alert("Error al registrar: " + error.message);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleGuardar} className="sislexi-card shadow">
        <div className="form-header">
          <button 
            type="button" 
            onClick={() => router.push("/administrador/usuarios")} 
            className="btn-volver"
          >
            ← Volver
          </button>
          <h2>Registro de Nuevo Personal</h2>
        </div>

        {/* SECCIÓN 1: CREDENCIALES */}
        <section className="form-section">
          <h3 className="section-title">Credenciales de Acceso</h3>
          <div className="row">
            <div className="field">
              <label>CORREO INSTITUCIONAL</label>
              <input name="correo" type="email" placeholder="ejemplo@invecem.com" onChange={handleChange} required />
            </div>
            <div className="field">
              <label>CONTRASEÑA TEMPORAL</label>
              <input name="clave" type="password" placeholder="********" onChange={handleChange} required />
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: INFO PERSONAL */}
        <section className="form-section">
          <h3 className="section-title">Información Personal</h3>
          <div className="row">
            <div className="field">
              <label>NOMBRES Y APELLIDOS</label>
              <input name="nombres" type="text" onChange={handleChange} required />
            </div>
            <div className="field">
              <label>CÉDULA DE IDENTIDAD</label>
              <input name="cedula" type="text" onChange={handleChange} required />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>TELÉFONO</label>
              <input name="telefono" type="text" onChange={handleChange} />
            </div>
            <div className="field">
              <label>FECHA NACIMIENTO</label>
              <input name="fechaNac" type="date" onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* SECCIÓN 3: FICHA LABORAL */}
        <section className="form-section">
          <h3 className="section-title">Ficha Laboral</h3>
          <div className="row">
            <div className="field">
              <label>N° DE FICHA</label>
              <input name="ficha" type="text" placeholder="Ej: 554433" onChange={handleChange} required />
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
              <input name="cargo" type="text" onChange={handleChange} />
            </div>
            <div className="field">
              <label>DEPARTAMENTO</label>
              <input name="departamento" type="text" onChange={handleChange} />
            </div>
          </div>
          
          {/* NUEVO CAMPO: FECHA DE INGRESO */}
          <div className="row">
            <div className="field">
              <label>FECHA DE INGRESO A LA EMPRESA</label>
              <input 
                name="fechaIngreso" 
                type="date" 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
        </section>

        <button type="submit" className="btn-submit" disabled={cargando}>
          {cargando ? "Registrando..." : "Registrar en el Sistema"}
        </button>
      </form>

      <style jsx>{`
        .form-container { background: #f1f5f9; min-height: 100vh; padding: 40px 20px; display: flex; justify-content: center; }
        .sislexi-card { background: white; padding: 40px; border-radius: 15px; width: 100%; max-width: 850px; border-top: 5px solid #1e3a8a; }
        .form-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
        .btn-volver { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 15px; border-radius: 8px; cursor: pointer; color: #64748b; font-weight: 600; }
        h2 { color: #1e3a8a; font-size: 1.4rem; margin: 0; }
        .section-title { color: #1e3a8a; font-size: 0.85rem; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin: 30px 0 20px; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 15px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        label { font-size: 0.7rem; font-weight: 800; color: #475569; }
        input, select { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
        .btn-submit { width: 100%; background: #1e3a8a; color: white; padding: 16px; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 40px; }
        .shadow { box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
      `}</style>
    </div>
  );
}