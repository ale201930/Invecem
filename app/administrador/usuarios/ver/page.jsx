"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function VerUsuario() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id"); // Agarramos el ID de la URL
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      const docRef = doc(db, "usuarios", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUser(docSnap.data());
      } else {
        alert("No se encontró el usuario");
        router.push("/administrador/usuarios");
      }
    };
    fetchUser();
  }, [userId]);

  if (!user) return <div className="loading">Cargando datos del personal...</div>;

  return (
    <div className="form-container">
      <div className="sislexi-card shadow detail-view">
        <div className="form-header">
          <button onClick={() => router.back()} className="btn-volver">← Regresar</button>
          <h2>Expediente Digital: {user.nombres}</h2>
          <span className={`status-badge ${user.estado === "Activo" ? "active" : "inactive"}`}>
            {user.estado}
          </span>
        </div>

        <div className="grid-details">
          <section className="detail-section">
            <h3>Datos Personales</h3>
            <p><strong>Cédula:</strong> {user.cedula}</p>
            <p><strong>Nacionalidad:</strong> {user.nacionalidad}</p>
            <p><strong>Fecha Nacimiento:</strong> {user.fechaNac}</p>
            <p><strong>Teléfono:</strong> {user.telefono}</p>
            <p><strong>Correo:</strong> {user.correo}</p>
          </section>

          <section className="detail-section">
            <h3>Información Laboral</h3>
            <p><strong>N° Ficha:</strong> {user.ficha}</p>
            <p><strong>Rol en Sistema:</strong> {user.rol}</p>
            <p><strong>Cargo:</strong> {user.cargo}</p>
            <p><strong>Departamento:</strong> {user.departamento}</p>
            <p><strong>Fecha Ingreso:</strong> {user.fechaIngreso}</p>
          </section>
        </div>
      </div>

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

  /* --- TARJETA DE DETALLES (ESTILO TABLA CARD) --- */
  .sislexi-card { 
    background: white; 
    padding: 35px; 
    border-radius: 24px; 
    width: 100%; 
    max-width: 800px; 
    border: 1px solid #e2e8f0;
    border-top: 8px solid #e30613; /* Rojo Institucional */
    box-shadow: 12px 12px 0px #0f172a; /* Sombra sólida azul oscuro */
  }

  .form-header { 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    margin-bottom: 30px; 
    border-bottom: 2px solid #f1f5f9;
    padding-bottom: 20px;
  }

  h2 { 
    color: #0f172a; 
    font-size: 1.3rem; 
    font-weight: 900; 
    margin: 0; 
    text-transform: uppercase;
    letter-spacing: -0.5px;
  }

  .btn-volver { 
    background: #f1f5f9; 
    border: 1px solid #e2e8f0; 
    padding: 8px 16px; 
    border-radius: 10px; 
    cursor: pointer; 
    color: #64748b; 
    font-weight: 800; 
    font-size: 11px;
    text-transform: uppercase;
    transition: 0.3s; 
  }
  .btn-volver:hover { 
    background: #e30613; 
    color: white; 
    border-color: #e30613; 
  }

  /* --- CUADRÍCULA DE INFORMACIÓN --- */
  .grid-details { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 30px; 
  }

  .detail-section h3 { 
    font-size: 0.75rem; 
    color: #e30613; 
    text-transform: uppercase; 
    font-weight: 900;
    border-bottom: 2px solid #f8fafc; 
    padding-bottom: 8px; 
    margin-bottom: 15px; 
    letter-spacing: 1px;
  }

  /* --- ETIQUETAS Y VALORES --- */
  .info-group { margin-bottom: 12px; }
  
  .label-text { 
    display: block;
    font-size: 10px; 
    font-weight: 800; 
    color: #94a3b8; 
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .value-text { 
    margin: 0; 
    color: #0f172a; 
    font-weight: 700; 
    font-size: 0.95rem; 
  }

  /* --- BADGES DE ESTADO --- */
  .status-badge { 
    padding: 4px 12px; 
    border-radius: 8px; 
    font-weight: 900; 
    font-size: 10px; 
    text-transform: uppercase;
    display: inline-block;
    margin-top: 5px;
  }
  .active { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .inactive { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

  /* --- RESPONSIVO --- */
  @media (max-width: 650px) {
    .grid-details { grid-template-columns: 1fr; gap: 20px; }
    .sislexi-card { padding: 25px; }
  }
`}</style>
    </div>
  );
}