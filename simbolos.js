// Código exclusivo para los símbolos (+ , ○ , -)
document.addEventListener('click', function(evento) {
    const casilla = evento.target.closest('.square-55d63'); 
    
    if (casilla) {
        if (!casilla.classList.contains('indicador-mas') && 
            !casilla.classList.contains('indicador-circulo') && 
            !casilla.classList.contains('indicador-menos')) {
            casilla.classList.add('indicador-mas');
        } 
        else if (casilla.classList.contains('indicador-mas')) {
            casilla.classList.remove('indicador-mas');
            casilla.classList.add('indicador-circulo');
        } 
        else if (casilla.classList.contains('indicador-circulo')) {
            casilla.classList.remove('indicador-circulo');
            casilla.classList.add('indicador-menos');
        } 
        else if (casilla.classList.contains('indicador-menos')) {
            casilla.classList.remove('indicador-menos');
        }
    }
});
