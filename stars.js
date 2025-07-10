const starCanvas = document.getElementById('star-background');
const starCtx = starCanvas.getContext('2d');

function resizeStarCanvas() {
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
}
resizeStarCanvas();
window.addEventListener('resize', resizeStarCanvas);

// Draw stars
function drawStars(count = 300) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * starCanvas.width;
    const y = Math.random() * starCanvas.height;
    const r = Math.random() * 1.5;
    starCtx.beginPath();
    starCtx.arc(x, y, r, 0, Math.PI * 2);
    starCtx.fillStyle = 'white';
    starCtx.fill();
  }
}

// Draw gradient planet
function drawPlanet(x, y, radius, color) {
  if (!isFinite(x) || !isFinite(y) || !isFinite(radius)) return;

  const grad = starCtx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'black');

  starCtx.beginPath();
  starCtx.arc(x, y, radius, 0, Math.PI * 2);
  starCtx.fillStyle = grad;
  starCtx.fill();
}

// Draw the entire background
function drawBackground() {
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  drawStars(400);

  // Draw random planets
  const planetColors = ['#3366ff', '#ffaa00', '#aa88ff', '#33ffaa', '#ff66cc'];
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * starCanvas.width * 2;
    const y = Math.random() * starCanvas.height;
    const r = Math.random() * 60 + 40;
    const color = planetColors[Math.floor(Math.random() * planetColors.length)];
    drawPlanet(x, y, r, color);
  }
}
drawBackground();
