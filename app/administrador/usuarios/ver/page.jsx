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
        .form-container { background: #f1f5f9; min-height: 100vh; padding: 40px; display: flex; justify-content: center; }
        .sislexi-card { background: white; padding: 40px; border-radius: 15px; width: 100%; max-width: 800px; border-top: 5px solid #1e3a8a; }
        .form-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; }
        h2 { color: #1e3a8a; font-size: 1.2rem; }
        .grid-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .detail-section h3 { font-size: 0.8rem; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px; }
        p { margin-bottom: 10px; color: #334155; }
        .status-badge { padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 0.8rem; }
        .active { background: #dcfce7; color: #166534; }
        .inactive { background: #fee2e2; color: #991b1b; }
        .btn-volver { background: none; border: none; color: #1e3a8a; cursor: pointer; font-weight: bold; }
      `}</style>
    </div>
  );
}