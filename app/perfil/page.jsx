"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function PerfilUsuario() {
  const [userData, setUserData] = useState(null);

  const [claveActual, setClaveActual] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");

  const [cargando, setCargando] = useState(false);

  // 🔥 VALIDACIONES EN TIEMPO REAL
  const [validaciones, setValidaciones] = useState({
    longitud: false,
    mayuscula: false,
    minuscula: false,
    numero: false,
    coincide: false
  });

  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsub();
  }, [router]);

  // 🔥 VALIDACIÓN DINÁMICA
  useEffect(() => {
    setValidaciones({
      longitud: nuevaClave.length >= 8,
      mayuscula: /[A-Z]/.test(nuevaClave),
      minuscula: /[a-z]/.test(nuevaClave),
      numero: /\d/.test(nuevaClave),
      coincide: nuevaClave === confirmarClave && nuevaClave !== ""
    });
  }, [nuevaClave, confirmarClave]);

  const handleCambiarClave = async (e) => {
    e.preventDefault();

    const todasValidas = Object.values(validaciones).every(v => v);

    if (!todasValidas) {
      return alert("❌ Debes cumplir todos los requisitos.");
    }

    setCargando(true);

    try {
      const user = auth.currentUser;

      const credential = EmailAuthProvider.credential(
        user.email,
        claveActual
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, nuevaClave);

      alert("✅ Contraseña actualizada correctamente");

      setClaveActual("");
      setNuevaClave("");
      setConfirmarClave("");

    } catch (error) {
      if (error.code === "auth/wrong-password") {
        alert("❌ La contraseña actual es incorrecta.");
      } else {
        alert("Error: " + error.message);
      }
    } finally {
      setCargando(false);
    }
  };

  if (!userData) return <div className="loading">Cargando perfil...</div>;

  return (
    <div className="perfil-wrapper">
      <div className="perfil-card shadow">
        <div className="perfil-header">
          <button className="btn-atras" onClick={() => router.back()}>← Volver</button>
          <h2>Mi Perfil de Usuario</h2>
        </div>

        <section className="user-info">
          <div className="info-item">
            <label>Nombres y Apellidos</label>
            <p>{userData.nombres}</p>
          </div>
          <div className="info-item">
            <label>Cédula / Ficha</label>
            <p>{userData.cedula} | <span className="ficha-tag">{userData.ficha}</span></p>
          </div>
          <div className="info-item">
            <label>Rol en el Sistema</label>
            <p className="role-text">{userData.rol}</p>
          </div>
          <div className="info-item">
            <label>Correo Electrónico</label>
            <p>{userData.correo}</p>
          </div>
        </section>

        <hr className="divider" />

        <form onSubmit={handleCambiarClave} className="clave-form">
          <h3>Seguridad y Contraseña</h3>
          <p className="subtitle">Actualiza tu clave de acceso al sistema INVECEM</p>

          <div className="input-group">
            <label>Contraseña Actual</label>
            <input 
              type="password" 
              value={claveActual}
              onChange={(e) => setClaveActual(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label>Nueva Contraseña</label>
            <input 
              type="password" 
              value={nuevaClave}
              onChange={(e) => setNuevaClave(e.target.value)}
              required 
            />
          </div>

          {/* 🔥 LISTA VISUAL */}
          <div className="validaciones">
            <p className={validaciones.longitud ? "ok" : ""}>• Mínimo 8 caracteres</p>
            <p className={validaciones.mayuscula ? "ok" : ""}>• Al menos una mayúscula</p>
            <p className={validaciones.minuscula ? "ok" : ""}>• Al menos una minúscula</p>
            <p className={validaciones.numero ? "ok" : ""}>• Al menos un número</p>
          </div>

          <div className="input-group">
            <label>Confirmar Nueva Contraseña</label>
            <input 
              type="password" 
              value={confirmarClave}
              onChange={(e) => setConfirmarClave(e.target.value)}
              required 
            />
          </div>

          <p className={validaciones.coincide ? "ok" : ""}>
            • Las contraseñas coinciden
          </p>

          <button type="submit" className="btn-update" disabled={cargando}>
            {cargando ? "Procesando..." : "Actualizar Contraseña"}
          </button>
        </form>
      </div>

      <style jsx>{`
  /* --- WRAPPER CON PATRÓN DE FONDO --- */
  .perfil-wrapper { 
    background-color: #f0f4f8; 
    background-image: radial-gradient(#d1d5db 0.8px, transparent 0.8px);
    background-size: 24px 24px;
    min-height: 100vh; 
    display: flex; 
    justify-content: center; 
    padding: 40px 20px; 
    font-family: 'Inter', sans-serif;
  }

  /* --- TARJETA DE PERFIL --- */
  .perfil-card { 
    background: white; 
    padding: 30px; /* Reducido de 40px */
    border-radius: 20px; 
    width: 100%; 
    max-width: 500px; 
    border: 1px solid #e2e8f0;
    border-top: 6px solid #e30613; 
    box-shadow: 8px 8px 0px #0f172a; 
  }

  .perfil-header { 
    display: flex; 
    align-items: center; 
    gap: 15px; 
    margin-bottom: 25px; 
    border-bottom: 2px solid #f1f5f9;
    padding-bottom: 15px;
  }

  .btn-atras { 
    background: white; 
    border: 1px solid #e2e8f0; 
    padding: 6px 12px; 
    border-radius: 8px; 
    cursor: pointer; 
    color: #64748b; 
    font-weight: 800; 
    font-size: 11px; /* Letra más pequeña */
    transition: 0.3s;
  }

  h2 { color: #0f172a; font-size: 1.3rem; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
  
  /* --- INFORMACIÓN DEL USUARIO --- */
  .user-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
  
  .info-item label { 
    display: block; 
    font-size: 9px; /* Más pequeño */
    font-weight: 900; 
    color: #94a3b8; 
    text-transform: uppercase; 
    margin-bottom: 3px; 
  }
  
  .info-item p { 
    margin: 0; 
    color: #0f172a; 
    font-weight: 800; 
    font-size: 0.95rem; /* Reducido de 1.1rem */
    text-transform: uppercase;
  }

  .ficha-tag { color: #e30613; } 
  .role-text { 
    background: #f1f5f9; 
    padding: 3px 8px; 
    border-radius: 6px; 
    font-size: 0.8rem; /* Más pequeño */
    color: #0f172a;
  }

  .divider { border: 0; border-top: 2px solid #f1f5f9; margin: 25px 0; }

  /* --- FORMULARIO DE CLAVE --- */
  .clave-form h3 { margin: 0; color: #0f172a; font-size: 1rem; font-weight: 900; }
  .subtitle { font-size: 0.75rem; color: #64748b; margin-bottom: 20px; font-weight: 500; }
  
  .input-group { margin-bottom: 15px; display: flex; flex-direction: column; gap: 6px; }
  .input-group label { font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
  
  input { 
    padding: 12px; 
    border: 2px solid #f1f5f9; 
    border-radius: 10px; 
    font-size: 0.85rem; /* Más pequeño */
    font-weight: 600;
    outline: none;
  }
  input:focus { border-color: #e30613; }

  /* --- VALIDACIONES --- */
  .validaciones { background: #f8fafc; padding: 12px; border-radius: 10px; margin-top: 8px; }
  .validaciones p { font-size: 0.75rem; color: #94a3b8; margin: 3px 0; font-weight: 600; }
  .ok { color: #10b981 !important; }

  /* --- BOTÓN ACTUALIZAR --- */
  .btn-update { 
    width: 100%; 
    background: #e30613; 
    color: white; 
    padding: 14px; 
    border: none; 
    border-radius: 10px; 
    font-weight: 900; 
    font-size: 12px; /* Reducido de 14px */
    text-transform: uppercase;
    cursor: pointer; 
    margin-top: 20px; 
    box-shadow: 0 4px 0px #b8050f;
  }
  
  .btn-update:hover { transform: translateY(2px); box-shadow: 0 2px 0px #8a040b; }
  
  .loading { padding: 40px; text-align: center; font-weight: 900; color: #e30613; font-size: 1rem; }
`}</style>
    </div>
  );
}