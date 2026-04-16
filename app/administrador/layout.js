"use client";

import React, { useState, useEffect } from "react";
import RoleGuard from "../lib/RoleGuard";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminLayout({ children }) {
  const [nombreUsuario, setNombreUsuario] = useState("");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setNombreUsuario(docSnap.data().nombres);
        }
      }
    });

    return () => unsub();
  }, []);

  return (
    <RoleGuard allowedRole="administrador">
      <div className="admin-container">

        <main className="admin-content">
          {children}
        </main>

        <style jsx>{`
          .admin-content {
            background: #f1f5f9;
            min-height: 100vh;
          }
        `}</style>

      </div>
    </RoleGuard>
  );
}