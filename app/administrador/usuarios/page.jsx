"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase"; 
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, // Usamos setDoc para vincular con el UID de Auth
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState(""); 
  const [rol, setRol] = useState("");
  const [estado, setEstado] = useState("Activo");
  
  const router = useRouter();

  // 1. CARGA EN TIEMPO REAL
  useEffect(() => {
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef); 
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setUsuarios(docs);
    }, (error) => {
      console.error("Error al leer la colección 'usuarios':", error);
    });
    
    return () => unsubscribe();
  }, []);

  // 2. GUARDAR NUEVO USUARIO (CORREGIDO: AUTH + FIRESTORE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    const passwordLimpia = password.trim();

    // Generamos un correo ficticio basado en el nombre para Firebase Auth
    const emailFicticio = `${nombreLimpio.toLowerCase().replace(/\s+/g, '')}@invecem.com`;

    if (!nombreLimpio || !passwordLimpia || !rol) {
      return alert("⚠️ Por favor llene todos los campos");
    }

    if (passwordLimpia.length < 6) {
      return alert("⚠️ La contraseña debe tener al menos 6 caracteres por seguridad de Firebase.");
    }

    try {
      // PASO A: Crear el usuario en la pestaña de "Authentication"
      const userCredential = await createUserWithEmailAndPassword(auth, emailFicticio, passwordLimpia);
      const userAuth = userCredential.user;

      // PASO B: Guardar los datos en Firestore usando el UID generado
      // Esto vincula legalmente la cuenta con sus datos de perfil/rol
      await setDoc(doc(db, "usuarios", userAuth.uid), {
        uid: userAuth.uid,
        usuario: nombreLimpio,
        email: emailFicticio,
        password: passwordLimpia, // Guardamos referencia (opcional por ser local)
        rol: rol,
        estado: estado,
        fechaCreacion: new Date().toISOString()
      });

      setNombre(""); setPassword(""); setRol("");
      alert(`✅ Usuario registrado exitosamente.\nID de Acceso: ${emailFicticio}`);
    } catch (error) {
      console.error("Error completo:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("❌ Este nombre de usuario ya existe en el sistema de autenticación.");
      } else {
        alert("❌ Error al registrar: " + error.message);
      }
    }
  };

  const toggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";
    try {
      await updateDoc(doc(db, "usuarios", id), { estado: nuevoEstado });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const eliminarUsuario = async (id, nombreUser) => {
    if (confirm(`¿Eliminar a ${nombreUser}? Ten en cuenta que esto solo borra sus datos de la tabla, no su acceso de autenticación.`)) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <div className="container-usuarios">
      <header className="header-top shadow">
        <div className="header-info">
          <Image src="/img/logo.jpg" alt="Logo" width={50} height={50} className="avatar" />
          <div>
            <h1>INVECEM</h1>
            <p>Panel de Administración de Usuarios (Seguridad Híbrida)</p>
          </div>
        </div>
        <button className="btn-volver" onClick={() => router.push("/administrador")}>
          ⬅ Volver al Panel
        </button>
      </header>

      <main className="main-content">
        <div className="card shadow">
          <h2 className="card-title">Registro de Personal Autorizado</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <input 
              type="text" 
              placeholder="Nombre de usuario (ej. juan_perez)" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="Contraseña (mín. 6 caracteres)" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="">Seleccione rol</option>
              <option value="Administrador">Administrador</option>
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Protección Física">Protección Física</option>
              <option value="Inspector">Inspector</option>
            </select>
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="Activo">Estatus: Activo</option>
              <option value="Inactivo">Estatus: Inactivo</option>
            </select>
            <button type="submit" className="btn-submit">Registrar y Dar Acceso</button>
          </form>
        </div>

        <div className="card shadow mt-30">
          <h2 className="card-title">Usuarios con Acceso al Sistema ({usuarios.length})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="user-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>ID de Login</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length > 0 ? (
                  usuarios.map((user) => (
                    <tr key={user.id}>
                      <td><strong>{user.usuario || "Sin nombre"}</strong></td>
                      <td style={{fontFamily: 'monospace', fontSize: '0.85em'}}>{user.email || "N/A"}</td>
                      <td>{user.rol || "Sin rol"}</td>
                      <td>
                        <span className={`badge ${user.estado === "Activo" ? "active" : "inactive"}`}>
                          {user.estado || "Activo"}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button onClick={() => toggleEstado(user.id, user.estado)} className="btn-action">
                          🔄 Estatus
                        </button>
                        <button onClick={() => eliminarUsuario(user.id, user.usuario)} className="btn-delete">
                          🗑️ Borrar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>
                      No hay usuarios registrados con seguridad vinculada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
  
      <style jsx>{`
        .container-usuarios { min-height: 100vh; background: #f1f5f9; padding-bottom: 50px; }
        .header-top { background: white; padding: 15px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #e30613; }
        .header-info h1 { margin: 0; color: #e30613; font-size: 1.4rem; }
        .btn-volver { background: #0c3d5a; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .main-content { max-width: 1100px; margin: 30px auto; padding: 0 20px; }
        .card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .card-title { font-size: 1.1rem; border-left: 5px solid #e30613; padding-left: 12px; margin-bottom: 20px; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        input, select { padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; }
        .btn-submit { background: #0c3d5a; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; grid-column: 1 / -1; }
        .user-table { width: 100%; border-collapse: collapse; }
        .user-table th { text-align: left; padding: 12px; border-bottom: 2px solid #edf2f7; color: #64748b; font-size: 0.8rem; }
        .user-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
        .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
        .active { background: #dcfce7; color: #166534; }
        .inactive { background: #fee2e2; color: #991b1b; }
        .actions-cell { display: flex; gap: 6px; }
        .btn-action { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 4px; cursor: pointer; }
        .btn-delete { background: #fee2e2; color: #b91c1c; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; }
        .mt-30 { margin-top: 30px; }
      `}</style>
    </div>
  );
}