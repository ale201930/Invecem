"use client";

import React, { useState, useEffect, Suspense } from "react";
import { db } from "@/app/lib/firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";

function RegistroFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [formData, setFormData] = useState({
    cedula: "",
    idAcceso: "", // Los 5 dígitos para la "ficha" de contrata
    nombreContrata: "",
    nombres: "",
    apellidos: "",
    areaTrabajo: "Mantenimiento",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      const cargarDatos = async () => {
        try {
          const docRef = doc(db, "contratistas", editId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormData(docSnap.data());
          }
        } catch (error) {
          console.error("Error al cargar:", error);
        }
      };
      cargarDatos();
    }
  }, [editId]);

  // Función para manejar la cédula y auto-completar el ID
  const handleCedulaChange = (e) => {
    const val = e.target.value;
    const ultimosCinco = val.slice(-5);
    setFormData({
      ...formData,
      cedula: val,
      idAcceso: editId ? formData.idAcceso : ultimosCinco // Solo auto-completa si es registro nuevo
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.idAcceso.length !== 5) {
      alert("⚠️ El ID de acceso debe ser de exactamente 5 dígitos.");
      return;
    }

    setLoading(true);

    try {
      const contratasRef = collection(db, "contratistas");

      if (editId) {
        const docRef = doc(db, "contratistas", editId);
        await updateDoc(docRef, {
          ...formData,
          ultimaActualizacion: serverTimestamp()
        });
        alert("✅ Datos actualizados con éxito");
        router.push("/proteccion-fisica/usuarios-de-contratas"); 
      } else {
        // VALIDACIÓN: Cédula duplicada
        const qCedula = query(contratasRef, where("cedula", "==", formData.cedula));
        const snapCedula = await getDocs(qCedula);
        
        if (!snapCedula.empty) {
          alert("⚠️ Esta cédula ya está registrada en el sistema de contratas.");
          setLoading(false);
          return;
        }

        // VALIDACIÓN: ID duplicado
        const qId = query(contratasRef, where("idAcceso", "==", formData.idAcceso));
        const snapId = await getDocs(qId);
        
        if (!snapId.empty) {
          alert(`⚠️ El ID ${formData.idAcceso} ya está asignado. Verifique los últimos 5 dígitos.`);
          setLoading(false);
          return;
        }

        await addDoc(contratasRef, {
          ...formData,
          tipoPersonal: "CONTRATISTA",
          estadoNominal: "Activo (Acceso Permitido)",
          fechaRegistro: serverTimestamp(),
        });
        
        alert("✅ Contratista registrado exitosamente");

        setFormData({
          cedula: "",
          idAcceso: "",
          nombreContrata: "",
          nombres: "",
          apellidos: "",
          areaTrabajo: "Mantenimiento",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un error al procesar el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="top-actions">
        <button className="btn-nav" onClick={() => router.push("/proteccion-fisica")}>
          ← Volver al Panel
        </button>
        <button className="btn-database" onClick={() => router.push("/proteccion-fisica/usuarios-de-contratas")}>
          📋 Ver Usuarios Registrados
        </button>
      </div>

      <header className="form-header" style={{ background: editId ? '#008b8b' : '#1a1a1a' }}>
        <h1>{editId ? "📝 Editando Información" : "👷 Registro de Contratas"}</h1>
        <p>Sistema de Control de Acceso - Protección Física</p>
      </header>

      <form onSubmit={handleSubmit} className="main-form">
        <div className="form-grid">
          <div className="input-group">
            <label>Cédula de Identidad</label>
            <input
              type="text"
              required
              placeholder="Ej: 25123456"
              value={formData.cedula}
              onChange={handleCedulaChange}
              disabled={!!editId}
            />
          </div>

          <div className="input-group">
            <label style={{ color: '#008b8b' }}>ID Acceso (Últimos 5)</label>
            <input
              type="text"
              required
              maxLength={5}
              placeholder="00000"
              style={{ border: '2px solid #008b8b', fontWeight: 'bold' }}
              value={formData.idAcceso}
              onChange={(e) => setFormData({...formData, idAcceso: e.target.value.slice(0, 5)})}
            />
          </div>

          <div className="input-group">
            <label>Empresa / Contrata</label>
            <input
              type="text"
              required
              value={formData.nombreContrata}
              onChange={(e) => setFormData({...formData, nombreContrata: e.target.value.toUpperCase()})}
            />
          </div>
          
          <div className="input-group">
            <label>Nombres</label>
            <input
              type="text"
              required
              value={formData.nombres}
              onChange={(e) => setFormData({...formData, nombres: e.target.value.toUpperCase()})}
            />
          </div>

          <div className="input-group">
            <label>Apellidos</label>
            <input
              type="text"
              required
              value={formData.apellidos}
              onChange={(e) => setFormData({...formData, apellidos: e.target.value.toUpperCase()})}
            />
          </div>

          <div className="input-group">
            <label>Área de Trabajo</label>
            <select 
              value={formData.areaTrabajo}
              onChange={(e) => setFormData({...formData, areaTrabajo: e.target.value})}
            >
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Obras Civiles">Obras Civiles</option>
              <option value="Servicios Generales">Servicios Generales</option>
              <option value="Seguridad / Prevención">Seguridad / Prevención</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn-save shadow-relief-btn" 
          disabled={loading}
          style={{ background: editId ? '#008b8b' : '#e30613' }}
        >
          {loading ? "PROCESANDO..." : editId ? "ACTUALIZAR REGISTRO" : "GUARDAR EN SISTEMA"}
        </button>
      </form>

      <style jsx>{`
        .container { max-width: 850px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; border: 1px solid #eee; font-family: sans-serif; }
        .top-actions { padding: 20px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
        .btn-nav { background: none; border: none; color: #64748b; font-weight: 800; cursor: pointer; font-size: 14px; }
        .btn-database { background: #008b8b; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.3s; }
        .btn-database:hover { background: #007070; transform: scale(1.05); }
        .form-header { color: white; padding: 25px; text-align: center; }
        .main-form { padding: 40px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
        .input-group label { display: block; font-size: 11px; font-weight: 900; margin-bottom: 8px; color: #1e293b; text-transform: uppercase; }
        .input-group input, .input-group select { width: 100%; padding: 12px; border: 2px solid #f1f5f9; border-radius: 10px; outline: none; font-size: 14px; }
        .input-group input:focus { border-color: #cbd5e1; }
        .btn-save { width: 100%; color: white; border: none; padding: 18px; border-radius: 12px; font-weight: 900; cursor: pointer; margin-top: 30px; transition: 0.2s; }
        .shadow-relief-btn { box-shadow: 0 6px 0 #990000; }
        .btn-save:active { transform: translateY(3px); box-shadow: 0 2px 0 #990000; }
      `}</style>
    </div>
  );
}

export default function RegistroContratista() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RegistroFormContent />
    </Suspense>
  );
}