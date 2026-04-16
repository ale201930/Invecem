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
        .perfil-wrapper { background: #f1f5f9; min-height: 100vh; display: flex; justify-content: center; padding: 40px 20px; }
        .perfil-card { background: white; padding: 40px; border-radius: 15px; width: 100%; max-width: 550px; border-top: 5px solid #1e3a8a; }
        .perfil-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
        .btn-atras { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 15px; border-radius: 8px; cursor: pointer; color: #64748b; font-weight: 600; }
        h2 { color: #1e3a8a; font-size: 1.4rem; margin: 0; }
        
        .user-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-item label { display: block; font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px; }
        .info-item p { margin: 0; color: #1e293b; font-weight: 600; font-size: 1rem; }
        .ficha-tag { color: #e30613; }
        .role-text { color: #1e3a8a; }

        .divider { border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0; }

        .clave-form h3 { margin: 0; color: #1e3a8a; font-size: 1.1rem; }
        .subtitle { font-size: 0.8rem; color: #64748b; margin-bottom: 20px; }
        .input-group { margin-bottom: 15px; display: flex; flex-direction: column; gap: 5px; }
        .input-group label { font-size: 0.75rem; font-weight: 700; color: #475569; }
        input { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; }

        /* 🔥 SOLO AGREGADO */
        .validaciones p { font-size: 0.8rem; color: #64748b; margin: 3px 0; }
        .ok { color: green; font-weight: bold; }

        .btn-update { 
          width: 100%; background: #1e3a8a; color: white; padding: 14px; 
          border: none; border-radius: 10px; font-weight: bold; cursor: pointer; 
          margin-top: 20px; transition: 0.3s;
        }
        .btn-update:hover { background: #172554; }
        .btn-update:disabled { background: #94a3b8; cursor: not-allowed; }

        .shadow { box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .loading { padding: 50px; text-align: center; font-weight: bold; color: #1e3a8a; }
      `}</style>
    </div>
  );
}