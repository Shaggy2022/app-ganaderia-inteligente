import { useState } from "react";
import AnimalForm from "../components/AnimalForm";
import AnimalList from "../components/AnimalList";

export default function Animals() {
  const [showForm, setShowForm] = useState(false); // Toggle registro
  const [editingAnimal, setEditingAnimal] = useState(null); // Animal a editar

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Animales</h1>

      {/* Botón para registrar */}
      {!editingAnimal && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg mb-6"
        >
          {showForm ? "Cerrar Formulario" : "+ Registrar Animal"}
        </button>
      )}

      {/* Formulario de registro */}
      {showForm && !editingAnimal && <AnimalForm onClose={() => setShowForm(false)} />}

      {/* Formulario de edición */}
      {editingAnimal && (
        <AnimalForm
          animalToEdit={editingAnimal}
          onClose={() => setEditingAnimal(null)}
        />
      )}

      {/* Lista de animales */}
      <AnimalList setEditingAnimal={setEditingAnimal} />
    </div>
  );
}