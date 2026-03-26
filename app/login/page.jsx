"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase"; // Importamos auth de nuevo
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "unauthorized") {
      setError("⚠️ Debe iniciar sesión para acceder a este módulo.");
    }
  }, []);

  const manejarLogin = async (e) => {
    e.preventDefault();
    setError(""); 

    try {
      // --- INTENTO 1: BUSCAR EN TU COLECCIÓN MANUAL (USUARIOS NUEVOS) ---
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("usuario", "==", usuario.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        
        if (userData.password === clave.trim()) {
          if (userData.estado === "Inactivo") {
            setError("🚫 Usuario desactivado.");
            return;
          }
          iniciarSesionExitosa(userData.rol, userData.usuario);
          return;
        }
      }

      // --- INTENTO 2: BUSCAR EN FIREBASE AUTH (USUARIOS VIEJOS/CORREOS) ---
      try {
        // Si el usuario viejo no tiene @gmail.com, se lo agregamos para probar
        const correoParaAuth = usuario.includes("@") ? usuario : `${usuario}@gmail.com`;
        const userCredential = await signInWithEmailAndPassword(auth, correoParaAuth, clave);
        const user = userCredential.user;

        // Buscamos su rol en Firestore usando su UID (como lo tenías antes)
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          iniciarSesionExitosa(data.rol, usuario);
        } else {
          // Si existe en Auth pero no tiene documento de rol, le damos uno por defecto o error
          setError("Usuario autenticado pero sin rol asignado.");
        }
        return;
      } catch (authError) {
        console.log("Fallo en el segundo intento (Auth):", authError.message);
      }

      // Si llegó aquí, fallaron ambos métodos
      setError("Usuario o contraseña incorrectos");

    } catch (error) {
      console.error(error);
      setError("Error al conectar con el sistema");
    }
  };

  // Función auxiliar para no repetir código de redirección
  const iniciarSesionExitosa = (rolRaw, nombre) => {
    const rol = rolRaw.toLowerCase();
    Cookies.set("user_session", "active", { expires: 1 }); 
    Cookies.set("user_role", rol, { expires: 1 });
    Cookies.set("user_name", nombre, { expires: 1 });

    const rutas = {
      administrador: "/administrador",
      inspector: "/inspector",
      "recursos humanos": "/recursos-humanos",
      "proteccion fisica": "/proteccion-fisica"
    };

    const ruta = rutas[rol];
    if (ruta) {
      router.push(ruta);
    } else {
      setError("Rol no válido");
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <h2>Login del sistema</h2>
        <form onSubmit={manejarLogin}>
          <div className="input-group">
            <label>Usuario</label>
            <input
              type="text"
              placeholder="Ingrese su usuario o correo"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Ingrese su contraseña"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
            />
          </div>

          <button type="submit">Iniciar Sesión</button>
          
          {error && <p className="error-msg">{error}</p>}
          
          <p className="footer-text">
            © 2026 Planta INVECEM – Sistema de control de asistencia
          </p>
        </form>
      </div>

      <style jsx global>{`
        /* Se mantienen tus estilos originales intactos */
        .container {
          width: 100vw; height: 100vh; position: fixed; top: 0; left: 0;
          display: flex; justify-content: center; align-items: center;
          background-image: url("/img/fondo.jpg");
          background-size: cover; background-position: center; 
        }
        .login-box {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          padding: 40px; border-radius: 18px; width: 380px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4); text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .login-box h2 { margin-bottom: 25px; font-size: 26px; font-weight: 800; }
        .input-group { text-align: left; margin-bottom: 20px; }
        .input-group label { display: block; font-size: 14px; margin-bottom: 5px; font-weight: 700; }
        .input-group input { width: 100%; padding: 12px; border: none; border-radius: 8px; background: rgba(255, 255, 255, 0.95); }
        button { width: 100%; padding: 12px; border: none; border-radius: 8px; background: #e30613; color: #fff; font-weight: bold; cursor: pointer; transition: 0.3s; }
        button:hover { background: #ff0000; transform: scale(1.02); }
        .error-msg { background: rgba(255, 255, 255, 0.8); padding: 10px; border-radius: 5px; color: #e30613; font-size: 13px; font-weight: bold; margin-top: 15px; border: 1px solid #e30613; }
        .footer-text { margin-top: 20px; font-size: 12px; font-weight: 600; }
      `}</style>
    </div>
  );
}