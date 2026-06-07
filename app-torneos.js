// 1. Referencias de los elementos del HTML
const tournamentForm = document.getElementById('tournament-form');
const tournamentList = document.getElementById('tournament-list');

// 2. Cargar torneos guardados al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    const savedTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    renderTournaments(savedTournaments);
});

// 3. Capturar el evento de enviar el formulario
tournamentForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Evita que la página se recargue

    // Obtener los valores de los inputs
    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const type = document.getElementById('type').value;
    const venue = document.getElementById('venue').value;
    const price = document.getElementById('price').value;

    // Crear un objeto único para el nuevo torneo
    const newTournament = {
        id: Date.now(), // ID único usando la hora exacta
        title,
        date,
        type,
        venue,
        price
    };

    // Obtener la lista actual, meter el nuevo y guardar en localStorage
    const currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    currentTournaments.push(newTournament);
    localStorage.setItem('torneos', JSON.stringify(currentTournaments));

    // Volver a dibujar la lista en pantalla y limpiar el formulario
    renderTournaments(currentTournaments);
    tournamentForm.reset();
});

// 4. Función para dibujar las tarjetas en el HTML
function renderTournaments(tournaments) {
    // Limpiamos el contenedor para que no se dupliquen
    tournamentList.innerHTML = '';

    // Si no hay torneos, podemos dejar un mensaje limpio
    if (tournaments.length === 0) {
        tournamentList.innerHTML = `<p style="color: #718096; grid-column: 1/-1; text-align: center;">No hay torneos programados. ¡Registra el primero!</p>`;
        return;
    }

    // Recorrer cada torneo y crear su estructura visual
    tournaments.forEach(tournament => {
        const card = document.createElement('div');
        card.classList.add('tournament-card');
        
        // Elegir el color del badge según el ritmo de juego
        const badgeClass = tournament.type === 'Blitz' ? 'badge-blitz' : 'badge-rapid';

        card.innerHTML = `
            <span class="badge ${badgeClass}">${tournament.type}</span>
            <h3>${tournament.title}</h3>
            <p><strong>Fecha:</strong> ${tournament.date}</p>
            <p><strong>Local:</strong> ${tournament.venue}</p>
            <p><strong>Inscripción:</strong> S/. ${tournament.price}</p>
            <div class="card-actions">
                <button class="btn-danger" onclick="deleteTournament(${tournament.id})">Eliminar</button>
            </div>
        `;
        tournamentList.appendChild(card);
    });
}

// 5. Función para eliminar un torneo
window.deleteTournament = function(id) {
    let currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    // Filtrar la lista para remover el torneo seleccionado
    currentTournaments = currentTournaments.filter(t => t.id !== id);
    localStorage.setItem('torneos', JSON.stringify(currentTournaments));
    // Refrescar la pantalla
    renderTournaments(currentTournaments);
};