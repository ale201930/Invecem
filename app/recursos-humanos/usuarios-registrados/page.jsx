"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Importación corregida según tu estructura
import { db } from "../../lib/firebase"; 
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function UsuariosRegistrados() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leer datos de Firebase en tiempo real
  useEffect(() => {
    const q = query(collection(db, "personal"), orderBy("fechaRegistro", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsuarios(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container">
      <div className="header-section">
        <button className="btn-back" onClick={() => router.push("/recursos-humanos")}>
          ← Volver al Panel
        </button>
        <h1 className="title">Maestro de Personal Registrado</h1>
        <p className="subtitle">Listado oficial de trabajadores en base de datos</p>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loader">Cargando registros...</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ficha</th>
                  <th>Cédula</th>
                  <th>Nombre Completo</th>
                  <th>Cargo / Área</th>
                  <th>Turno</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length > 0 ? (
                  usuarios.map((user) => (
                    <tr key={user.id}>
                      <td className="font-bold">{user.ficha}</td>
                      <td>{user.cedula}</td>
                      <td>{user.nombres} {user.apellidos}</td>
                      <td>
                        <div className="cargo-text">{user.cargo}</div>
                        <div className="area-text">{user.area}</div>
                      </td>
                      <td>{user.turno}</td>
                      <td>
                        <span className={`badge ${user.estatus?.toLowerCase().includes('activo') ? 'bg-green' : 'bg-yellow'}`}>
                          {user.estatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">No hay personal registrado aún.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .container { padding: 30px; max-width: 1200px; margin: 0 auto; }
        .header-section { margin-bottom: 30px; }
        .btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-weight: 600; margin-bottom: 10px; }
        .title { color: #0f172a; font-size: 28px; font-weight: 800; margin: 0; }
        .subtitle { color: #64748b; font-size: 14px; }

        .table-card { 
          background: white; 
          border-radius: 15px; 
          box-shadow: 0 10px 25px rgba(0,0,0,0.05); 
          overflow: hidden;
        }

        .table-wrapper { overflow-x: auto; }
        
        table { width: 100%; border-collapse: collapse; text-align: left; }
        
        th { 
          background: #f8fafc; 
          padding: 15px 20px; 
          color: #475569; 
          font-size: 13px; 
          text-transform: uppercase; 
          border-bottom: 2px solid #f1f5f9;
        }

        td { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; }
        
        .font-bold { font-weight: 700; color: #e30613; }
        .cargo-text { font-weight: 600; }
        .area-text { font-size: 12px; color: #64748b; }

        .badge { 
          padding: 5px 12px; 
          border-radius: 20px; 
          font-size: 11px; 
          font-weight: 700; 
          text-transform: uppercase;
        }

        .bg-green { background: #dcfce7; color: #166534; }
        .bg-yellow { background: #fef9c3; color: #854d0e; }

        .loader { padding: 50px; text-align: center; color: #64748b; }
        tr:hover { background: #f8fafc; }
      `}</style>
    </div>
  );
}