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
  /* --- WRAPPER CON PATRÓN DE FONDO --- */
  .form-container { 
    background-color: #f0f4f8; 
    background-image: radial-gradient(#d1d5db 0.8px, transparent 0.8px);
    background-size: 24px 24px;
    min-height: 100vh; 
    padding: 40px 20px; 
    display: flex; 
    justify-content: center; 
    font-family: 'Inter', sans-serif;
  }

  /* --- TARJETA PRINCIPAL (ESTILO INVECEM) --- */
  .sislexi-card { 
    background: white; 
    padding: 35px; 
    border-radius: 24px; 
    width: 100%; 
    max-width: 800px; 
    border: 1px solid #e2e8f0;
    border-top: 8px solid #e30613; /* Rojo Institucional */
    box-shadow: 12px 12px 0px #0f172a; /* Sombra sólida */
  }

  .form-header { 
    display: flex; 
    align-items: center; 
    gap: 15px; 
    margin-bottom: 25px; 
    border-bottom: 2px solid #f1f5f9;
    padding-bottom: 15px;
  }

  .btn-volver { 
    background: white; 
    border: 1px solid #e2e8f0; 
    padding: 6px 12px; 
    border-radius: 8px; 
    cursor: pointer; 
    color: #64748b; 
    font-weight: 800; 
    font-size: 11px;
    transition: 0.3s;
  }
  .btn-volver:hover { color: #e30613; border-color: #e30613; }

  h2 { 
    color: #0f172a; 
    font-size: 1.3rem; 
    font-weight: 900; 
    margin: 0; 
    letter-spacing: -0.5px; 
    text-transform: uppercase;
  }

  /* --- TÍTULOS DE SECCIÓN --- */
  .section-title { 
    color: #e30613; 
    font-size: 0.75rem; 
    font-weight: 900;
    text-transform: uppercase; 
    border-bottom: 2px solid #f1f5f9; 
    padding-bottom: 5px; 
    margin: 25px 0 15px; 
    letter-spacing: 1px;
  }

  /* --- DISEÑO DE CAMPOS --- */
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
  
  .field { display: flex; flex-direction: column; gap: 6px; }
  
  label { 
    font-size: 11px; 
    font-weight: 800; 
    color: #0f172a; 
    text-transform: uppercase; 
  }

  input, select { 
    padding: 12px; 
    border: 2px solid #f1f5f9; 
    border-radius: 10px; 
    font-size: 0.85rem;
    font-weight: 600;
    color: #1e293b;
    outline: none;
    transition: 0.3s;
  }
  
  input:focus, select:focus { 
    border-color: #e30613; 
    background: #fffcfc;
  }

  /* --- BOTÓN DE ENVÍO (ESTILO 3D) --- */
  .btn-submit { 
    width: 100%; 
    background: #e30613; 
    color: white; 
    padding: 16px; 
    border: none; 
    border-radius: 12px; 
    font-weight: 900; 
    font-size: 13px;
    text-transform: uppercase;
    cursor: pointer; 
    margin-top: 30px; 
    transition: 0.2s;
    box-shadow: 0 4px 0px #b8050f;
  }
  
  .btn-submit:hover { 
    transform: translateY(2px); 
    box-shadow: 0 2px 0px #8a040b; 
  }

  .btn-submit:active {
    transform: translateY(4px);
    box-shadow: none;
  }

  /* --- RESPONSIVO --- */
  @media (max-width: 600px) {
    .row { grid-template-columns: 1fr; gap: 15px; }
    .sislexi-card { padding: 20px; }
  }
`}</style>
    </div>
  );
}