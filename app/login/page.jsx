"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase"; 
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
    Cookies.remove("user_session");
    Cookies.remove("user_role");
    Cookies.remove("user_name");

    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "unauthorized") {
      setError("⚠️ Debe iniciar sesión para acceder a este módulo.");
    }
  }, []);

  const manejarLogin = async (e) => {
    e.preventDefault();
    setError(""); 

    try {
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

      try {
        const correoParaAuth = usuario.includes("@") ? usuario : `${usuario.trim()}@gmail.com`;
        const userCredential = await signInWithEmailAndPassword(auth, correoParaAuth, clave);
        const user = userCredential.user;

        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          iniciarSesionExitosa(data.rol, usuario);
        } else {
          setError("Usuario autenticado pero sin rol asignado.");
        }
        return;
      } catch (authError) {
        console.log("Fallo en el segundo intento (Auth):", authError.message);
      }

      setError("Usuario o contraseña incorrectos");

    } catch (error) {
      console.error(error);
      setError("Error al conectar con el sistema");
    }
  };

  const iniciarSesionExitosa = (rolRaw, nombre) => {
    const rol = rolRaw.toLowerCase().trim();
    
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
      setError("Rol no válido: " + rol);
    }
  };

  return (
    <div className="full-screen-layout">
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
        html, body, #__next, main {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
        }

        .full-screen-layout {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          z-index: 9999;
          background: url("/img/fondo.jpg") no-repeat center center fixed !important;
          background-size: cover !important;
        }

        .login-box {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 40px;
          border-radius: 20px;
          width: 380px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
        }

        .login-box h2 { 
          margin-bottom: 25px; 
          font-size: 26px; 
          font-weight: 800;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }

        .input-group { text-align: left; margin-bottom: 20px; }
        .input-group label { 
          display: block; 
          font-size: 14px; 
          margin-bottom: 5px; 
          font-weight: 700;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }
        
        .input-group input { 
          width: 100%; 
          padding: 12px; 
          border: none; 
          border-radius: 10px; 
          background: rgba(255, 255, 255, 0.95); 
          box-sizing: border-box;
          font-size: 16px;
          color: #333;
        }

        button { 
          width: 100%; 
          padding: 14px; 
          border: none; 
          border-radius: 10px; 
          background: #e30613 !important; 
          color: #fff; 
          font-weight: 800; 
          text-transform: uppercase;
          cursor: pointer; 
          transition: all 0.2s ease;
          box-shadow: 0 5px 0px #b0050f, 0 8px 20px rgba(227, 6, 19, 0.4);
        }

        button:hover { 
          background: #ff0000 !important; 
          transform: translateY(-2px); 
          box-shadow: 0 7px 0px #b0050f, 0 10px 25px rgba(227, 6, 19, 0.5);
        }

        button:active { 
          transform: translateY(3px); 
          box-shadow: 0 2px 0px #b0050f; 
        }

        .error-msg {
          margin-top: 15px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.9);
          border-left: 5px solid #e30613;
          color: #e30613;
          font-weight: bold;
          border-radius: 4px;
        }

        .footer-text { 
          margin-top: 25px; 
          font-size: 11px; 
          font-weight: 600; 
          color: rgba(255,255,255,0.8);
        }
      `}</style>
    </div>
  );
}