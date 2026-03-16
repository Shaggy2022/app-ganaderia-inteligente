// Importa Firebase y Firestore
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración real de tu proyecto
const firebaseConfig = {
  apiKey: "AIzaSyDMNj3Y4Hlmj3X9KnJDjJgjdUscMCfe2g8",
  authDomain: "ganaderia-inteligente-624ec.firebaseapp.com",
  projectId: "ganaderia-inteligente-624ec",
  storageBucket: "ganaderia-inteligente-624ec.firebasestorage.app",
  messagingSenderId: "861745951413",
  appId: "1:861745951413:web:df88139a331d749aeb44fc",
  measurementId: "G-TEMXTRL6RT"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta Firestore
export const db = getFirestore(app);