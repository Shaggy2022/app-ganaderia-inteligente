function AnimalProfile() {
  return (
    <div>
      <h1>Ficha del Animal</h1>

      <div className="card">
        <p>ID: 001</p>
        <p>Especie: Res</p>
        <p>Raza: Angus</p>
        <p>Peso actual: 230kg</p>
      </div>

      <h2>Historial</h2>

      <ul>
        <li>Pesaje - 220kg</li>
        <li>Vacuna aplicada</li>
        <li>Desparasitación</li>
      </ul>
    </div>
  );
}

export default AnimalProfile;