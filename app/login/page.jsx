"use client";

import { useState } from "react";
import { auth, db } from "../../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const manejarLogin = async (e) => {
    e.preventDefault();

    try {
      const correo = usuario + "@gmail.com";

      const userCredential = await signInWithEmailAndPassword(auth, correo, clave);
      const user = userCredential.user;

      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError("Usuario sin rol");
        return;
      }

      const rol = docSnap.data().rol.toLowerCase();

      const rutas = {
        administrador: "/administrador",
        inspector: "/inspector",
        "recursos humanos": "/recursos-humanos",
        "protección fisica": "/proteccion-fisica"
      };

      const ruta = rutas[rol];

      if (ruta) {
        router.push(ruta);
      } else {
        setError("Rol no válido");
      }

    } catch (error) {
      console.error(error);
      setError("Usuario o contraseña incorrectos");
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
              placeholder="Ingrese su usuario"
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

      {/* 🔥 CSS IGUAL AL MODELO */}
      <style jsx>{`
        .container {
          margin: 0;
          padding: 0;
          font-family: "Segoe UI", sans-serif;
          background: url("/img/fondo.jpg") no-repeat center center/cover;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .login-box {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          padding: 40px;
          border-radius: 18px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
          color: #0e0d0d;
          text-align: center;
          width: 380px;
        }

        .login-box h2 {
          margin-bottom: 25px;
          font-size: 26px;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .input-group {
          text-align: left;
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .input-group input {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          outline: none;
          background: rgba(255, 255, 255, 0.8);
          font-size: 15px;
        }

        button {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: #00aaff;
          color: #fff;
          font-size: 16px;
          cursor: pointer;
          transition: 0.3s;
        }

        button:hover {
          background: #0088cc;
        }

        .footer-text {
          margin-top: 20px;
          font-size: 13px;
          opacity: 0.85;
        }

        .error-msg {
          color: #ff8080;
          margin-top: 10px;
          font-size: 14px;
        }
      `}</style>

    </div>
  );
}