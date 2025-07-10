
const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;

const canvas = document.getElementById('canvas');
const score = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
let lives = 3;



const ballColors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#FF8F33',
    '#8F33FF', '#33FFF5', '#F5FF33', '#FF3333', '#33FF8F',
    '#A833FF', '#33A8FF', '#FFA833', '#33FFA8', '#A8FF33',
    '#FF338F', '#338FFF', '#8FFF33', '#FFAF33', '#33FFAF',
    '#AF33FF', '#33AFF5', '#F533FF', '#33F5AF', '#F5AF33',
    '#FF6633', '#33FF66', '#6633FF', '#33FFCC', '#CCFF33',
    '#FF33CC', '#33CCFF', '#66FF33', '#FF9933', '#33FF99',
    '#9933FF', '#33FF66', '#66FF99', '#FF3399', '#3399FF',
    '#99FF33', '#FF7733', '#33FF77', '#7733FF', '#33FFDD',
    '#DDFF33', '#FF33DD', '#33DDFF', '#77FF33', '#FFBB33'
];

const xEffect = 2;
const yEffect = 6;
const ballConfig = {
    r:20,
    x: 20 * 2,
    y: window.innerHeight / 2,
}

// Create engine and world
const engine = Engine.create();
const world = engine.world;

// Create renderer
const render = Render.create({
    element: document.body,
    canvas: document.getElementById('canvas'),
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight - 10,
        wireframes: false,
        background: '#000000FF'
    }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Create boundaries
const ground = Bodies.rectangle(window.innerWidth/2, window.innerHeight, 10000000000, 50, { isStatic: true,  label: 'ground',
});
const ceiling = Bodies.rectangle(window.innerWidth/2, 0, 10000000000, 50, { isStatic: true });
const leftWall = Bodies.rectangle(0, window.innerHeight/2, 50, window.innerHeight, { isStatic: true });
// const rightWall = Bodies.rectangle(window.innerWidth, window.innerHeight/2, 50, window.innerHeight, { isStatic: true });
World.add(world, [ground, ceiling, leftWall]);


const gameBall = Bodies.circle(ballConfig.x, ballConfig.y, ballConfig.r, {
    restitution: 0.9,
    friction: 0.5,
    density: 0.08,
    label: 'ball',
    render: {
        fillStyle: ballColors[Math.floor(Math.random() * ballColors.length)]
    }
});

World.add(world, gameBall);

// create static blade at start
const startBlade = Bodies.rectangle(100, window.innerHeight - 100, 150, 20, {
    isStatic: true,
    angle:0,
    label: 'blade',
    render: { fillStyle: '#1E00FFFF' } // green color
});

World.add(world, startBlade);


const rotatingBlades = new Set(); // Keep track of rotating blade references

function createBladesZone(startX) {
  const rowCount = 3;
  const bladesPerRow = 3;
  const rowSpacing = 220;
  const startY = 200;

  for (let row = 0; row < rowCount; row++) {
    const y = startY + row * rowSpacing;

    for (let i = 0; i < bladesPerRow; i++) {
      const x = startX + Math.random() * 800;

      const shouldRotate = Math.random() < 0.4; // 40% chance to rotate
      const color = shouldRotate ? '#FF0000' : '#00AA00'; // red or green

      const blade = Bodies.rectangle(x, y, 150, 20, {
        isStatic: true,
        angle: 0,
        label: 'blade',
        render: { fillStyle: color }
      });

      if (shouldRotate) {
        rotatingBlades.add(blade);
      }

      World.add(world, blade);
    }
  }
}

function cleanupOffscreenBodies(viewX) {
    Composite.allBodies(world).forEach(body => {
      if (body.label === 'blade' && body.position.x < viewX - 2000) {
        rotatingBlades.delete(body); // clean up tracking set
        World.remove(world, body);
      }
    });
  }
  

  createBladesZone(0)


//   follow ball
let cameraOffsetX = 0;
let lastBladeX = 0;
const bladeSpacing = 1000; // how far apart new blade zones are

Events.on(engine, 'afterUpdate', () => {
    const ballX = gameBall.position.x;
    const screenCenterX = cameraOffsetX + render.options.width * 0.6; // track only past 60% of screen
  
    if (ballX > screenCenterX) {
      // Move camera forward
      const delta = ballX - screenCenterX;
      cameraOffsetX += delta;
    }

    if (ballX > lastBladeX - (window.innerWidth * 0.5)) {
        // Generate blades ahead of current view
        createBladesZone(lastBladeX + bladeSpacing);
        lastBladeX += bladeSpacing;
      }
  
    Render.lookAt(render, {
      min: { x: cameraOffsetX, y: 0 },
      max: {
        x: cameraOffsetX + render.options.width,
        y: render.options.height
      }
    });

    // update score
    const scoreValue = Math.floor((gameBall.position.x ) / 10);
    score.textContent = `${scoreValue}`;
    cleanupOffscreenBodies(cameraOffsetX);
  });
  

const balls = [];


function rotateWorld(angle, origin) {
    const bodies = Composite.allBodies(world);

    bodies.forEach(body => {
        Body.rotate(body, angle);
        const dx = body.position.x - origin.x;
        const dy = body.position.y - origin.y;

        const rotatedX = origin.x + (dx * Math.cos(angle) - dy * Math.sin(angle));
        const rotatedY = origin.y + (dx * Math.sin(angle) + dy * Math.cos(angle));

        Body.setPosition(body, { x: rotatedX, y: rotatedY });
    });
}


  Events.on(engine, 'beforeUpdate', () => {
    rotatingBlades.forEach(blade => {
        Body.rotate(blade, 0.05); // Rotate clockwise
      });
  });



Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
      const labels = [pair.bodyA.label, pair.bodyB.label];
  
      if (labels.includes('ball') && labels.includes('ground')) {
        lives--;
        if (lives < 0) {
            // Game over logic
            alert('Game Over! Restarting...');
            window.location.reload();
        } 
        livesDisplay.textContent = `${lives}`;

      }
    });
  });

let isJumping = false;
// listen up arrow click
document.addEventListener('keydown', (event) => {
    const ball = gameBall; // Use the game ball for movement
    if (isJumping) return; // Prevent multiple jumps
    isJumping = true; // Set jumping state to true
    console.log('Key pressed:', event.key);
    if (event.key === 'ArrowUp') {
            // Body.setVelocity(ball, { x: ball.velocity.x, y: -yEffect });
            Body.applyForce(ball, ball.position, { x: 0, y: -yEffect });
    } else if (event.key === 'ArrowLeft') {
            // Body.setVelocity(ball, { x: -xEffect, y: ball.velocity.x });
            Body.applyForce(ball, ball.position, { x: -xEffect, y:0});
    } else if (event.key === 'ArrowRight') {
            // Body.setVelocity(ball, { x: xEffect, y: ball.velocity.x });
            Body.applyForce(ball, ball.position, { x: xEffect, y: 0 });
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        isJumping = false; // Reset jumping state on key release
    }
})

