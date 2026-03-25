"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy 
} from "firebase/firestore";

export default function RecordAsistencia() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [records, setRecords] = useState([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    setMounted(true);

    // Consultamos la colección de asistencias para armar el récord histórico
    const q = query(collection(db, "asistencias"), orderBy("fechaHora", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Agrupamos por ficha para contar puntualidad, retrasos y faltas históricas
      const agrupado = data.reduce((acc, curr) => {
        const ficha = curr.ficha;
        if (!acc[ficha]) {
          acc[ficha] = { 
            ficha, 
            nombre: curr.nombreCompleto, 
            area: curr.area,
            puntuales: 0, 
            retrasos: 0,
            totalAsistencias: 0 
          };
        }
        
        // Lógica simple de conteo basada en el estatus que guardó el inspector
        // (Asumiendo que el inspector guarda el campo 'estatus')
        if (curr.entrada) {
          acc[ficha].totalAsistencias++;
          // Aquí podrías usar la misma lógica de getEstadoEstilo si no guardas el estatus en DB
          // Por ahora simulamos con un campo 'estatus' que debería venir de la DB
          if (curr.estatus === "Puntual") acc[ficha].puntuales++;
          if (curr.estatus === "Retraso") acc[ficha].retrasos++;
        }
        
        return acc;
      }, {});

      setRecords(Object.values(agrupado).sort((a, b) => b.puntuales - a.puntuales));
    });

    return () => unsubscribe();
  }, []);

  const listaFiltrada = records.filter(r => 
    r.nombre?.toLowerCase().includes(filtro.toLowerCase()) || 
    r.ficha?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div className="container">
      <button className="btn-back" onClick={() => router.back()}>
        ← Volver a Asistencia Diaria
      </button>

      <header className="header">
        <h1 className="title">🏆 Récord Histórico de Asistencia</h1>
        <p className="subtitle">Ranking de puntualidad y constancia del personal INVECEM</p>
      </header>

      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Buscar trabajador por ficha o nombre..." 
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="grid-records">
        {listaFiltrada.map((user, index) => (
          <div key={user.ficha} className="record-card">
            <div className="rank-badge">{index + 1}</div>
            <div className="user-info">
              <h3>{user.nombre}</h3>
              <p>Ficha: <strong>{user.ficha}</strong> | {user.area}</p>
            </div>
            <div className="stats">
              <div className="stat-item">
                <span className="val puntual">{user.puntuales}</span>
                <span className="lab">Puntuales</span>
              </div>
              <div className="stat-item">
                <span className="val retraso">{user.retrasos}</span>
                <span className="lab">Retrasos</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .container { padding: 30px; max-width: 1000px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-weight: 600; margin-bottom: 20px; }
        .header { margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
        .title { color: #0f172a; font-size: 28px; font-weight: 800; margin: 0; }
        .subtitle { color: #64748b; margin-top: 5px; }
        
        .search-bar input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; margin-bottom: 25px; outline: none; }
        
        .grid-records { display: flex; flex-direction: column; gap: 15px; }
        .record-card { 
          display: flex; 
          align-items: center; 
          background: white; 
          padding: 20px; 
          border-radius: 15px; 
          box-shadow: 6px 6px 0px #0f172a; 
          border: 1px solid #0f172a;
          position: relative;
        }
        
        .rank-badge { 
          background: #e30613; 
          color: white; 
          width: 35px; 
          height: 35px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border-radius: 50%; 
          font-weight: 900; 
          margin-right: 20px;
        }
        
        .user-info { flex-grow: 1; }
        .user-info h3 { margin: 0; color: #0f172a; font-size: 18px; }
        .user-info p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
        
        .stats { display: flex; gap: 20px; text-align: center; }
        .stat-item { display: flex; flex-direction: column; }
        .val { font-size: 20px; font-weight: 800; }
        .lab { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; }
        
        .puntual { color: #22c55e; }
        .retraso { color: #f59e0b; }
      `}</style>
    </div>
  );
}