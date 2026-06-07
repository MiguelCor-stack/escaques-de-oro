// 1. Referencias de los elementos del HTML
const tournamentForm = document.getElementById('tournament-form');
const tournamentList = document.getElementById('tournament-list');
const playersTableBody = document.getElementById('players-table-body');
const pairingsList = document.getElementById('pairings-list');
const currentRoundLabel = document.getElementById('current-round-label');

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

// Inscribir Jugador con control de colores y progresivo
if (playerForm) {
    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!idTorneoActivo) return;

        const name = document.getElementById('player-name').value;
        const elo = parseInt(document.getElementById('player-elo').value) || 0;

        const currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
        const torneoIndex = currentTournaments.findIndex(t => t.id === idTorneoActivo);

        if (torneoIndex !== -1) {
            if (!currentTournaments[torneoIndex].jugadores) {
                currentTournaments[torneoIndex].jugadores = [];
            }

            currentTournaments[torneoIndex].jugadores.push({
                idJugador: Date.now(),
                name,
                elo,
                puntos: 0,
                historialRivales: [],
                historialColores: [],       // Para controlar la alternancia
                historialPuntosRonda: [],   // Para el desempate Progresivo
                colorObligatorio: null      // Para evitar que repitan piezas
            });

            localStorage.setItem('torneos', JSON.stringify(currentTournaments));
            renderJugadores(currentTournaments[torneoIndex].jugadores);
            renderTournaments(currentTournaments);
            playerForm.reset();
            document.getElementById('player-name').focus();
        }
    });
}

// Marcar resultado y guardar historial de colores y puntos para Progresivo
window.marcarResultado = function(mesa, resultado) {
    if (!idTorneoActivo) return;
    const currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    const torneo = currentTournaments.find(t => t.id === idTorneoActivo);

    if (!torneo) return;

    const partida = torneo.partidasRonda.find(p => p.mesa === mesa);
    if (partida && !partida.terminada) {
        partida.resultado = resultado;
        partida.terminada = true;

        const jBlancas = torneo.jugadores.find(j => j.idJugador === partida.blancas.idJugador);
        const jNegras = torneo.jugadores.find(j => j.idJugador === partida.negras.idJugador);

        // 1. Asignar los puntos de la partida actual
        if (resultado === '1-0') {
            if (jBlancas) jBlancas.puntos += 1;
        } else if (resultado === '0-1') {
            if (jNegras) jNegras.puntos += 1;
        } else if (resultado === '0.5-0.5') {
            if (jBlancas) jBlancas.puntos += 0.5;
            if (jNegras) jNegras.puntos += 0.5;
        }

        // 2. Guardar el historial de rivales, colores y capturar puntos para el Progresivo
        if (jBlancas && jNegras) {
            jBlancas.historialRivales.push(jNegras.idJugador);
            jNegras.historialRivales.push(jBlancas.idJugador);

            jBlancas.historialColores.push('B');
            jNegras.historialColores.push('N');

            // Guardamos la foto del puntaje acumulado en esta ronda
            jBlancas.historialPuntosRonda.push(jBlancas.puntos);
            jNegras.historialPuntosRonda.push(jNegras.puntos);
        }

        // Si la mesa es un BYE (jugador que descansó)
        if (partida.mesa === 'BYE' && jBlancas) {
            jBlancas.historialColores.push('BYE');
            jBlancas.historialPuntosRonda.push(jBlancas.puntos);
        }

        // Verificar si terminó la ronda entera
        const pendientes = torneo.partidasRonda.filter(p => !p.terminada);
        if (pendientes.length === 0) {
            torneo.partidasRonda = []; 
            alert("¡Ronda completada! Los puntos y colores han sido registrados con éxito.");
        }

        // Guardar todo en LocalStorage
        const idx = currentTournaments.findIndex(t => t.id === idTorneoActivo);
        currentTournaments[idx] = torneo;
        localStorage.setItem('torneos', JSON.stringify(currentTournaments));

        // Refrescar las tablas visuales
        if (typeof renderJugadores === 'function') renderJugadores(torneo.jugadores);
        if (typeof renderPairings === 'function') renderPairings(torneo.partidasRonda);
    }
};

// Calcular Desempates Automáticos: Buchholz y Progresivo
window.calcularDesempates = function() {
    if (!idTorneoActivo) return;
    const currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    const torneo = currentTournaments.find(t => t.id === idTorneoActivo);

    if (!torneo) return;

    // 1. Procesar los desempates matemáticos para cada jugador
    torneo.jugadores.forEach(jugador => {
        // --- Cálculo del Buchholz ---
        let sumaBuchholz = 0;
        jugador.historialRivales.forEach(idRival => {
            const rival = torneo.jugadores.find(j => j.idJugador === idRival);
            if (rival) {
                sumaBuchholz += rival.puntos;
            }
        });
        jugador.buchholz = sumaBuchholz;

        // --- Cálculo del Progresivo ---
        let sumaProgresivo = 0;
        if (jugador.historialPuntosRonda && jugador.historialPuntosRonda.length > 0) {
            sumaProgresivo = jugador.historialPuntosRonda.reduce((total, pts) => total + pts, 0);
        }
        jugador.progresivo = sumaProgresivo;
    });

    // Guardar los cálculos en el LocalStorage
    const idx = currentTournaments.findIndex(t => t.id === idTorneoActivo);
    currentTournaments[idx] = torneo;
    localStorage.setItem('torneos', JSON.stringify(currentTournaments));

    // 2. Ordenar bajo el criterio estricto del torneo
    const ordenFinal = [...torneo.jugadores].sort((a, b) => {
        return b.puntos - a.puntos || 
               (b.buchholz || 0) - (a.buchholz || 0) || 
               (b.progresivo || 0) - (a.progresivo || 0) || 
               b.elo - a.elo;
    });
    
    // 3. Pintar los resultados ordenados en la tabla del HTML
    if (playersTableBody) {
        playersTableBody.innerHTML = '';
        ordenFinal.forEach((j, index) => {
            let medalla = "";
            if (index === 0) medalla = "🥇 ";
            if (index === 1) medalla = "🥈 ";
            if (index === 2) medalla = "🥉 ";

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${medalla}${j.name}</strong></td>
                <td>${j.elo || '---'}</td>
                <td><span style="background: #2ecc71; color: #fff; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold;">${j.puntos}</span></td>
                <td><span style="background: #f1c40f; color: #1a1a1a; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold;">BH: ${j.buchholz || 0} | PROG: ${j.progresivo || 0}</span></td>
            `;
            playersTableBody.appendChild(row);
        });
    }

    alert("🏆 ¡Torneo Finalizado! Tabla ordenada por Puntos, Buchholz y Progresivo.");
};

// Motor de Emparejamiento Suizo Inteligente con control de colores y rivales
window.generarRonda = function() {
    if (!idTorneoActivo) return;
    const currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    const torneo = currentTournaments.find(t => t.id === idTorneoActivo);

    if (!torneo || torneo.jugadores.length < 2) {
        alert("Necesitas al menos 2 jugadores para generar emparejamientos.");
        return;
    }

    if (torneo.partidasRonda && torneo.partidasRonda.length > 0) {
        alert("Debes terminar y marcar todos los resultados de la ronda actual antes de generar la siguiente.");
        return;
    }

    torneo.rondaActual = (torneo.rondaActual || 0) + 1;
    
    // 1. Ordenar jugadores por puntuación acumulada, y luego por Elo
    let disponibles = [...torneo.jugadores].sort((a, b) => b.puntos - a.puntos || b.elo - a.elo);
    let partidas = [];
    let mesa = 1;

    // 2. Control de BYE (Si son impares, el de menor puntaje descansa y gana 1 punto automático)
    if (disponibles.length % 2 !== 0) {
        const jugadorBye = disponibles.pop(); 
        partidas.push({
            mesa: 'BYE',
            blancas: jugadorBye,
            negras: { idJugador: 'BYE', name: 'DESCANSA (BYE)', elo: 0, puntos: 0 },
            resultado: '1-0', 
            terminada: true
        });
        
        const jReal = torneo.jugadores.find(j => j.idJugador === jugadorBye.idJugador);
        if (jReal) {
            jReal.puntos += 1;
            jReal.historialColores.push('BYE');
            jReal.historialPuntosRonda.push(jReal.puntos);
        }
    }

    // 3. Bucle de emparejamiento con validación de rivales y colores
    while (disponibles.length > 0) {
        let jugadorA = disponibles.shift(); 
        let mejorRivalIndex = -1;

        // Buscar un rival que no haya jugado antes con jugadorA
        for (let i = 0; i < disponibles.length; i++) {
            if (!jugadorA.historialRivales.includes(disponibles[i].idJugador)) {
                mejorRivalIndex = i;
                break; // Encontramos al rival ideal en su mismo grupo de puntos
            }
        }

        // Si ya jugó con todos los que quedan, rompemos la regla para no trabar el torneo
        if (mejorRivalIndex === -1) {
            mejorRivalIndex = 0;
        }

        let jugadorB = disponibles.splice(mejorRivalIndex, 1)[0];

        // 4. Decidir quién va con Blancas y quién con Negras (Alternancia)
        let ultimoColorA = jugadorA.historialColores[jugadorA.historialColores.length - 1] || null;
        let ultimoColorB = jugadorB.historialColores[jugadorB.historialColores.length - 1] || null;
        
        let blancas = jugadorA;
        let negras = jugadorB;

        // Si el jugador A jugó con blancas la ronda anterior, ahora le toca negras
        if (ultimoColorA === 'B' || ultimoColorB === 'N') {
            blancas = jugadorB;
            negras = jugadorA;
        }

        partidas.push({
            mesa: mesa++,
            blancas: blancas,
            negras: negras,
            resultado: null,
            terminada: false
        });
    }

    torneo.partidasRonda = partidas;
    
    // Guardar cambios en el localStorage
    const idx = currentTournaments.findIndex(t => t.id === idTorneoActivo);
    currentTournaments[idx] = torneo;
    localStorage.setItem('torneos', JSON.stringify(currentTournaments));

    // Refrescar interfaz
    if (currentRoundLabel) currentRoundLabel.innerText = `Ronda Actual: Ronda ${torneo.rondaActual}`;
    if (typeof renderPairings === 'function') renderPairings(torneo.partidasRonda);
};