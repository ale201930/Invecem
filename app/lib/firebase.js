
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDDwbu6jA8o_9UKZUPQWPNCVElMJ-EQFtg",
  authDomain: "invecem-d8972.firebaseapp.com",
  projectId: "invecem-d8972",
  storageBucket: "invecem-d8972.firebasestorage.app",
  messagingSenderId: "726612092652",
  appId: "1:726612092652:web:81f4356532156e07a4e7c9",
  measurementId: "G-0YYJYX3T4D"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- FUNCIÓN PARA EL MONITOREO Y AUDITORÍA ---
// Esta función guardará quién hizo qué, en qué módulo y a qué hora.
export const registrarAccion = async (usuario, rol, accion, modulo) => {
  try {
    await addDoc(collection(db, "auditoria"), {
      usuario: usuario,
      rol: rol,
      accion: accion,
      modulo: modulo,
      fecha: serverTimestamp(), // Esto pone la hora exacta del servidor
    });
    console.log("Evento registrado con éxito en INVECEM");
  } catch (error) {
    console.error("Error al registrar en auditoría:", error);
  }
};