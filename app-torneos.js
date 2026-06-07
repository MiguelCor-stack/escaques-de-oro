const tournamentForm = document.getElementById('tournament-form');
const tournamentList = document.getElementById('tournament-list');
const playersTableBody = document.getElementById('players-table-body');
const pairingsList = document.getElementById('pairings-list');
const currentRoundLabel = document.getElementById('current-round-label');
const playerForm = document.getElementById('form-alumnos');

// Variable global para controlar qué torneo estamos arbitrando en esta pantalla
let idTorneoActivo = null;

// 2. Cargar torneos guardados al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    const savedTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    renderTournaments(savedTournaments);
    
    // Si hay al menos un torneo, seleccionamos el primero automáticamente para las pruebas
    if (savedTournaments.length > 0) {
        idTorneoActivo = savedTournaments[0].id;
        actualizarTablaPosiciones();
    }
});

// 3. Capturar el evento de enviar el formulario de Torneos
tournamentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const type = document.getElementById('type').value;
    const venue = document.getElementById('venue').value;
    const price = document.getElementById('price').value;

    const newTournament = {
        id: Date.now(),
        title,
        date,
        type,
        venue,
        price,
        jugadores: [],
        partidasRonda: [],
        rondaActual: 0
    };

    const currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    currentTournaments.push(newTournament);
    localStorage.setItem('torneos', JSON.stringify(currentTournaments));

    // Activar el torneo recién creado
    idTorneoActivo = newTournament.id;

    renderTournaments(currentTournaments);
    actualizarTablaPosiciones();
    tournamentForm.reset();
});

// 4. Función para dibujar las tarjetas de los torneos en el HTML
function renderTournaments(tournaments) {
    tournamentList.innerHTML = '';

    if (tournaments.length === 0) {
        tournamentList.innerHTML = `<p style="color: #718096; grid-column: 1/-1; text-align: center;">No hay torneos programados. ¡Registra el primero!</p>`;
        return;
    }

    tournaments.forEach(tournament => {
        const card = document.createElement('div');
        card.classList.add('tournament-card');
        
        // Resaltar visualmente si es el torneo que estamos gestionando activo
        if (tournament.id === idTorneoActivo) {
            card.style.border = "2px solid #2ecc71";
        }

        const badgeClass = tournament.type === 'Blitz' ? 'badge-blitz' : 'badge-rapid';

        card.innerHTML = `
            <span class="badge ${badgeClass}">${tournament.type}</span>
            <h3>${tournament.title}</h3>
            <p><strong>Fecha:</strong> ${tournament.date}</p>
            <p><strong>Local:</strong> ${tournament.venue}</p>
            <p><strong>Inscripción:</strong> S/. ${tournament.price}</p>
            <div class="card-actions">
                <button class="btn-primary" style="background: #3498db; margin-right: 5px;" onclick="seleccionarTorneo(${tournament.id})">Arbitrar</button>
                <button class="btn-danger" onclick="deleteTournament(${tournament.id})">Eliminar</button>
            </div>
        `;
        tournamentList.appendChild(card);
    });
}

// Cambiar de torneo activo en la administración
window.seleccionarTorneo = function(id) {
    idTorneoActivo = id;
    const currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    renderTournaments(currentTournaments);
    actualizarTablaPosiciones();
    
    const torneo = currentTournaments.find(t => t.id === idTorneoActivo);
    if (torneo && currentRoundLabel) {
        currentRoundLabel.innerText = torneo.rondaActual > 0 ? `Ronda Actual: Ronda ${torneo.rondaActual}` : "Ronda Actual: Esperando Inicio";
        if (typeof renderPairings === 'function') renderPairings(torneo.partidasRonda || []);
    }
};

// 5. Función para eliminar un torneo
window.deleteTournament = function(id) {
    let currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    currentTournaments = currentTournaments.filter(t => t.id !== id);
    localStorage.setItem('torneos', JSON.stringify(currentTournaments));
    
    if (idTorneoActivo === id) {
        idTorneoActivo = currentTournaments.length > 0 ? currentTournaments[0].id : null;
    }
    
    renderTournaments(currentTournaments);
    actualizarTablaPosiciones();
};

// 6. Inscribir Alumno al Torneo Activo Seleccionado
if (playerForm) {
    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
        
        // Si no hay ningún torneo creado, le avisamos al usuario
        if (!idTorneoActivo || currentTournaments.length === 0) {
            alert("Por favor, registra o selecciona un torneo arriba primero antes de inscribir alumnos.");
            return;
        }

        const nameInput = document.getElementById('player-name');
        const eloInput = document.getElementById('player-elo');
        
        const name = nameInput.value.trim();
        const elo = parseInt(eloInput.value) || 0;

        if (!name) return;

        const torneoIndex = currentTournaments.findIndex(t => t.id === idTorneoActivo);

        if (torneoIndex !== -1) {
            if (!currentTournaments[torneoIndex].jugadores) {
                currentTournaments[torneoIndex].jugadores = [];
            }

            // Insertamos el jugador con la estructura exacta que pide tu motor Suizo
            currentTournaments[torneoIndex].jugadores.push({
                idJugador: Date.now(),
                name: name,
                elo: elo,
                puntos: 0,
                historialRivales: [],
                historialColores: [],       
                historialPuntosRonda: [],   
                colorObligatorio: null,
                buchholz: 0,
                progresivo: 0
            });

            localStorage.setItem('torneos', JSON.stringify(currentTournaments));
            
            // Limpiar inputs
            nameInput.value = '';
            eloInput.value = '';
            nameInput.focus();

            // Refrescar vistas
            actualizarTablaPosiciones();
        }
    });
}

// 7. Función auxiliar unificada para dibujar la tabla de posiciones en vivo
function actualizarTablaPosiciones() {
    if (!playersTableBody) return;
    playersTableBody.innerHTML = '';

    if (!idTorneoActivo) {
        playersTableBody.innerHTML = `<tr><td colspan="4" style="padding: 0.75rem; text-align: center; color: #718096;">Crea o selecciona un torneo para ver su tabla.</td></tr>`;
        return;
    }

    const currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    const torneo = currentTournaments.find(t => t.id === idTorneoActivo);

    if (!torneo || !torneo.jugadores || torneo.jugadores.length === 0) {
        playersTableBody.innerHTML = `<tr><td colspan="4" style="padding: 0.75rem; text-align: center; color: #718096;">No hay alumnos inscritos en este torneo aún.</td></tr>`;
        return;
    }

    // Ordenar dinámicamente para la visualización en vivo
    const jugadoresOrdenados = [...torneo.jugadores].sort((a, b) => b.puntos - a.puntos || b.elo - a.elo);

    jugadoresOrdenados.forEach((jugador, index) => {
        let medalla = "";
        if (index === 0 && torneo.rondaActual > 0) medalla = "🥇 ";
        if (index === 1 && torneo.rondaActual > 0) medalla = "🥈 ";
        if (index === 2 && torneo.rondaActual > 0) medalla = "🥉 ";

        const fila = document.createElement('tr');
        fila.style.borderBottom = '1px solid #edf2f7';
        fila.innerHTML = `
            <td style="padding: 0.75rem; color: #2d3748; font-weight: bold;">${medalla}${jugador.name}</td>
            <td style="padding: 0.75rem; color: #4a5568;">${jugador.elo || '---'}</td>
            <td style="padding: 0.75rem; color: #2d3748; font-weight: bold;"><span style="background: #2ecc71; color: #fff; padding: 0.2rem 0.5rem; border-radius: 4px;">${jugador.puntos}</span></td>
            <td style="padding: 0.75rem; color: #718096;"><span style="background: #f1c40f; color: #1a1a1a; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">BH: ${jugador.buchholz || 0} | PROG: ${jugador.progresivo || 0}</span></td>
        `;
        playersTableBody.appendChild(fila);
    });
}

// Función para compatibilidad con las llamadas del HTML de rondas anteriores
window.renderJugadores = function(listaJugadores) {
    actualizarTablaPosiciones();
};

// 8. Marcar resultado de partidas
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

        if (resultado === '1-0') {
            if (jBlancas) jBlancas.puntos += 1;
        } else if (resultado === '0-1') {
            if (jNegras) jNegras.puntos += 1;
        } else if (resultado === '0.5-0.5') {
            if (jBlancas) jBlancas.puntos += 0.5;
            if (jNegras) jNegras.puntos += 0.5;
        }

        if (jBlancas && jNegras) {
            jBlancas.historialRivales.push(jNegras.idJugador);
            jNegras.historialRivales.push(jBlancas.idJugador);

            jBlancas.historialColores.push('B');
            jNegras.historialColores.push('N');

            jBlancas.historialPuntosRonda.push(jBlancas.puntos);
            jNegras.historialPuntosRonda.push(jNegras.puntos);
        }

        if (partida.mesa === 'BYE' && jBlancas) {
            jBlancas.historialColores.push('BYE');
            jBlancas.historialPuntosRonda.push(jBlancas.puntos);
        }

        const pendientes = torneo.partidasRonda.filter(p => !p.terminada);
        if (pendientes.length === 0) {
            torneo.partidasRonda = []; 
            alert("¡Ronda completada! Los puntos y colores han sido registrados con éxito.");
        }

        const idx = currentTournaments.findIndex(t => t.id === idTorneoActivo);
        currentTournaments[idx] = torneo;
        localStorage.setItem('torneos', JSON.stringify(currentTournaments));

        actualizarTablaPosiciones();
        if (typeof renderPairings === 'function') renderPairings(torneo.partidasRonda);
    }
};

// 9. Calcular Desempates Finales
window.calcularDesempates = function() {
    if (!idTorneoActivo) return;
    const currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    const torneo = currentTournaments.find(t => t.id === idTorneoActivo);

    if (!torneo) return;

    torneo.jugadores.forEach(jugador => {
        let sumaBuchholz = 0;
        jugador.historialRivales.forEach(idRival => {
            const rival = torneo.jugadores.find(j => j.idJugador === idRival);
            if (rival) sumaBuchholz += rival.puntos;
        });
        jugador.buchholz = sumaBuchholz;

        let sumaProgresivo = 0;
        if (jugador.historialPuntosRonda && jugador.historialPuntosRonda.length > 0) {
            sumaProgresivo = jugador.historialPuntosRonda.reduce((total, pts) => total + pts, 0);
        }
        jugador.progresivo = sumaProgresivo;
    });

    const idx = currentTournaments.findIndex(t => t.id === idTorneoActivo);
    currentTournaments[idx] = torneo;
    localStorage.setItem('torneos', JSON.stringify(currentTournaments));

    actualizarTablaPosiciones();
    alert("🏆 ¡Torneo Finalizado! Tabla ordenada con desempates oficiales.");
};

// 10. Motor Suizo Inteligente
window.generarRonda = function() {
    if (!idTorneoActivo) return;
    const currentTournaments = JSON.parse(localStorage.getItem('torneos')) || [];
    const torneo = currentTournaments.find(t => t.id === idTorneoActivo);

    if (!torneo || torneo.jugadores.length < 2) {
        alert("Necesitas al menos 2 jugadores para generar emparejamientos.");
        return;
    }

    if (torneo.partidasRonda && torneo.partidasRonda.length > 0) {
        alert("Debes marcar todos los resultados antes de la siguiente ronda.");
        return;
    }

    torneo.rondaActual = (torneo.rondaActual || 0) + 1;
    let disponibles = [...torneo.jugadores].sort((a, b) => b.puntos - a.puntos || b.elo - a.elo);
    let partidas = [];
    let mesa = 1;

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

    while (disponibles.length > 0) {
        let jugadorA = disponibles.shift(); 
        let mejorRivalIndex = -1;

        for (let i = 0; i < disponibles.length; i++) {
            if (!jugadorA.historialRivales.includes(disponibles[i].idJugador)) {
                mejorRivalIndex = i;
                break;
            }
        }

        if (mejorRivalIndex === -1) mejorRivalIndex = 0;

        let jugadorB = disponibles.splice(mejorRivalIndex, 1)[0];
        let ultimoColorA = jugadorA.historialColores[jugadorA.historialColores.length - 1] || null;
        let ultimoColorB = jugadorB.historialColores[jugadorB.historialColores.length - 1] || null;
        
        let blancas = jugadorA;
        let negras = jugadorB;

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
    
    const idx = currentTournaments.findIndex(t => t.id === idTorneoActivo);
    currentTournaments[idx] = torneo;
    localStorage.setItem('torneos', JSON.stringify(currentTournaments));

    if (currentRoundLabel) currentRoundLabel.innerText = `Ronda Actual: Ronda ${torneo.rondaActual}`;
    if (typeof renderPairings === 'function') renderPairings(torneo.partidasRonda);
};

// 11. Función para dibujar los emparejamientos y botones de resultados en el HTML
function renderPairings(partidas) {
    if (!pairingsList) return;
    pairingsList.innerHTML = '';

    if (partidas.length === 0) {
        pairingsList.innerHTML = `<p style="color: #718096; grid-column: 1/-1; text-align: center;">No hay partidas activas en esta ronda. ¡Genera la siguiente ronda arriba!</p>`;
        return;
    }

    partidas.forEach(partida => {
        const card = document.createElement('div');
        card.style.background = '#fff';
        card.style.padding = '1rem';
        card.style.borderRadius = '8px';
        card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '0.5rem';

        // Estilo si ya terminó la partida
        if (partida.terminada) {
            card.style.background = '#f7fafc';
            card.style.borderLeft = '4px solid #cbd5e0';
        } else {
            card.style.borderLeft = '4px solid #3498db';
        }

        let contenidoAcciones = '';
        if (!partida.terminada && partida.mesa !== 'BYE') {
            contenidoAcciones = `
                <div style="display: flex; gap: 0.25rem; margin-top: 0.5rem;">
                    <button style="flex: 1; padding: 0.4rem; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem;" onclick="marcarResultado(${partida.mesa}, '1-0')">1 - 0</button>
                    <button style="flex: 1; padding: 0.4rem; background: #e67e22; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem;" onclick="marcarResultado(${partida.mesa}, '0.5-0.5')">½ - ½</button>
                    <button style="flex: 1; padding: 0.4rem; background: #34495e; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem;" onclick="marcarResultado(${partida.mesa}, '0-1')">0 - 1</button>
                </div>
            `;
        } else if (partida.mesa === 'BYE') {
            contenidoAcciones = `<span style="background: #edf2f7; color: #4a5568; padding: 0.25rem; text-align: center; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">Punto automático</span>`;
        } else {
            contenidoAcciones = `<span style="background: #2ecc71; color: white; padding: 0.25rem; text-align: center; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">Resultado: ${partida.resultado}</span>`;
        }

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #718096; font-weight: bold; border-bottom: 1px solid #edf2f7; padding-bottom: 0.25rem;">
                <span>Mesa ${partida.mesa}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.25rem;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500; color: #2d3748;">⚪ ${partida.blancas.name}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500; color: #2d3748;">⚫ ${partida.negras.name}</span>
                </div>
            </div>
            ${contenidoAcciones}
        `;
        pairingsList.appendChild(card);
    });
}