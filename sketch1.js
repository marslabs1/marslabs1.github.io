/*=====================

CONSTANTS

=====================*/

const MOUSE_HISTORY_LENGTH = 10;
const SHIP_FOLLOW_DELAY = 0.7;
const MAX_ASTEROIDS = 10;
const ASTEROID_TYPES = 5; // Number of different asteroid images

/*=====================

VARIABLES

=====================*/

// Game state
let currentPage = "main";
let launchInitiated = false;
let isMobile;
let asteroidImages = []; // Array to hold multiple asteroid images

// Visual effects
let flashAlpha = 0;
let flashActive = false;

// UI elements
let welcomeY;
let buttonPanelY;
let launchButton;

// Game objects
let stars = [];
let asteroids = [];
let bullets = [];
let smokeParticles = [];
let explosions = [];

// Spaceship movement
let shipPosition = { x: 0, y: 0 };
let mouseHistory = [];
let angle = 0;
let targetAngle = 0;

// Assets
let font;
let spaceship;

// Score
let score = 0;

/*=====================

INITIALIZATION & SETUP

=====================*/

function preload() {
  font = loadFont("assets/PressStart2P-Regular.ttf");
  spaceship = loadImage("assets/spaceship.png");
  // Load multiple asteroid images
  for (let i = 1; i <= ASTEROID_TYPES; i++) {
    asteroidImages.push(loadImage(`assets/asteroid${i}.png`));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  isMobile = windowWidth < 600;
  textFont(font);
  textAlign(CENTER, CENTER);

  // Initialize positions
  welcomeY = height / 2 - 50;
  buttonPanelY = height;
  shipPosition = { x: width / 2, y: height / 2 };

  // Create stars
  stars = [];
  for (let i = 0; i < (isMobile ? 30 : 100); i++) {
    stars.push(new Star());
  }

  // Create UI buttons
  createButtons();

  // Create initial asteroids
  asteroids = [];
  for (let i = 0; i < 3; i++) {
    asteroids.push(new Asteroid());
  }

  // Reset score each time game starts
  score = 0;
}

function createButtons() {
  // Launch button (main button)
  launchButton = {
    label: "LAUNCH",
    x: width / 2,
    y: height / 2 + 15,
    w: isMobile ? 140 : 200,
    h: isMobile ? 40 : 50,
    color: "#ff0000"
  };
}

/*=====================

MAIN DRAW LOOP

=====================*/

function draw() {
  background(10);
  drawStars();
  if (currentPage !== "main") {
    drawSubPage(currentPage);
    return;
  }
  drawScoreCounter(); // <-- Draws score at top-left
  updateSmokeParticles();
  updateSpaceshipPosition();
  drawUI();
  handleFlashEffect();
  handleAsteroids();
  handleBullets();
  handleExplosions();
  drawSpaceship();
}

/*=====================

GAME OBJECTS DRAWING

=====================*/

function drawStars() {
  for (let star of stars) {
    star.update();
    star.show();
  }
}

function updateSmokeParticles() {
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    smokeParticles[i].update();
    smokeParticles[i].show();
    if (smokeParticles[i].isFinished()) {
      smokeParticles.splice(i, 1);
    }
  }
}

function drawScoreCounter() {
  push();
  textFont(font);
  fill(255);
  textSize(isMobile ? 14 : 20);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);
  pop();
}

function drawUI() {
  fill(255, random(180, 255));
  textSize(isMobile ? 16 : 32);
  text("WELCOME TO M.A.R.S.", width / 2, welcomeY);
  drawButton(launchButton);
}

function handleFlashEffect() {
  if (flashActive) {
    flashAlpha -= 10;
    if (flashAlpha <= 0) {
      flashAlpha = 0;
      flashActive = false;
    }
  }
  fill(255, 255, 255, flashAlpha);
  rectMode(CORNER);
  rect(0, 0, width, height);
}

function handleAsteroids() {
  // Controlled asteroid spawning
  const asteroidSpawnProb = isMobile ? 0.005 : 0.01;
  if (asteroids.length < (isMobile ? 6 : MAX_ASTEROIDS) && random(1) < asteroidSpawnProb && !launchInitiated) {
    asteroids.push(new Asteroid());
  }

  // Update and draw asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    asteroids[i].update();
    asteroids[i].show();

    // Check for bullet collisions
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (asteroids[i].hits(bullets[j])) {
        // Create explosion
        explosions.push(new Explosion(
          asteroids[i].x,
          asteroids[i].y,
          asteroids[i].size
        ));
        asteroids.splice(i, 1);
        bullets.splice(j, 1);
        score++; // <-- increment score when asteroid hit!
        break;
      }
    }
  }
}

function handleBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].show();
    if (bullets[i].offScreen()) {
      bullets.splice(i, 1);
    }
  }
}

function handleExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].show();
    if (explosions[i].update()) {
      explosions.splice(i, 1);
    }
  }
}

/*=====================

SPACESHIP MOVEMENT

=====================*/

function updateSpaceshipPosition() {
  if (frameCount % 2 === 0) {
    mouseHistory.push({x: mouseX, y: mouseY});
    if (mouseHistory.length > MOUSE_HISTORY_LENGTH) {
      mouseHistory.shift();
    }
  }

  let targetIndex = max(0, floor(mouseHistory.length * SHIP_FOLLOW_DELAY));
  let targetPos = mouseHistory[targetIndex] || {x: mouseX, y: mouseY};
  shipPosition.x = lerp(shipPosition.x, targetPos.x, 0.1);
  shipPosition.y = lerp(shipPosition.y, targetPos.y, 0.1);
  if (targetPos) {
    targetAngle = atan2(targetPos.y - shipPosition.y, targetPos.x - shipPosition.x);
    angle = lerpAngle(angle, targetAngle, 0.2);
  }
  smokeParticles.push(new Smoke(shipPosition.x, shipPosition.y));
}

function drawSpaceship() {
  push();
  translate(shipPosition.x, shipPosition.y);
  rotate(angle + HALF_PI);
  imageMode(CENTER);
  image(spaceship, 0, 0, 20, 40);
  pop();
}

/*=====================

UI COMPONENTS

=====================*/

function drawButton(btn) {
  let isHover = overButton(btn);
  let isPressed = mouseIsPressed && isHover;
  let baseColor = color(btn.color);
  let displayColor = baseColor;
  if (isPressed) {
    displayColor = lerpColor(baseColor, color(0), 0.4);
  } else if (isHover) {
    displayColor = lerpColor(baseColor, color(255), 0.2);
  }

  fill(displayColor);
  stroke(255);
  strokeWeight(3);
  rectMode(CENTER);
  rect(btn.x, btn.y, btn.w, btn.h, 10);
  fill(255);
  noStroke();
  textSize(isMobile ? 10 : 12);
  text(btn.label, btn.x, btn.y);
}

/*=====================

EVENT HANDLERS

=====================*/

function mousePressed() {
  if (!launchInitiated && overButton(launchButton)) {
    startGame();
    //window.location.href = "main.html";
    return;
  }

  if (currentPage === "main") {
    bullets.push(new Bullet(shipPosition.x, shipPosition.y, angle));
  }
}

function mouseClicked() {
  if (currentPage !== "main") {
    currentPage = "main";
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setup();
}

/*=====================

GAME FUNCTIONS

=====================*/

function startGame() {
  flashAlpha = 255;
  flashActive = true;
  asteroids = [];
  launchInitiated = true;
  score = 0;
}

function overButton(btn) {
  return (
    mouseX > btn.x - btn.w / 2 &&
    mouseX < btn.x + btn.w / 2 &&
    mouseY > btn.y - btn.h / 2 &&
    mouseY < btn.y + btn.h / 2
  );
}

function lerpAngle(a, b, t) {
  return a + (((b - a + PI) % (2 * PI)) - PI) * t;
}

/*=====================

GAME CLASSES

=====================*/

class Star {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(1, 4);
    this.brightness = random(150, 255);
  }
  update() {
    this.brightness = random(150, 255);
  }
  show() {
    fill(this.brightness);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }
}

class Smoke {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(5, 10);
    this.alpha = 255;
  }
  update() {
    this.y += random(-1, 1);
    this.x += random(-1, 1);
    this.size *= 0.98;
    this.alpha -= isMobile ? 10 : 5;
  }
  show() {
    noStroke();
    fill(255, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
  isFinished() {
    return this.alpha <= 0;
  }
}

class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 10;
  }
  update() {
    this.x += cos(this.angle) * this.speed;
    this.y += sin(this.angle) * this.speed;
  }
  show() {
    fill(255, 0, 0);
    noStroke();
    ellipse(this.x, this.y, 6, 6);
  }
  offScreen() {
    const buffer = 50;
    return (this.x < -buffer || this.x > width + buffer ||
            this.y < -buffer || this.y > height + buffer);
  }
}

class Asteroid {
  constructor() {
    this.reset();
    this.size = random(isMobile ? 30 : 30, isMobile ? 40 : 60);
    // Randomly select one of the asteroid images
    this.img = random(asteroidImages);
  }
  reset() {
    let edge = floor(random(4));
    this.speedX = random(-1.5, 1.5);
    this.speedY = random(-1.5, 1.5);
    switch(edge) {
      case 0: // top
        this.x = random(width);
        this.y = -50;
        break;
      case 1: // right
        this.x = width + 50;
        this.y = random(height);
        break;
      case 2: // bottom
        this.x = random(width);
        this.y = height + 50;
        break;
      case 3: // left
        this.x = -50;
        this.y = random(height);
        break;
    }
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    const buffer = 100;
    if (this.x < -buffer || this.x > width + buffer ||
        this.y < -buffer || this.y > height + buffer) {
      this.reset();
    }
  }
  show() {
    imageMode(CENTER);
    image(this.img, this.x, this.y, this.size, this.size);
  }
  hits(bullet) {
    let d = dist(this.x, this.y, bullet.x, bullet.y);
    return d < this.size / 2;
  }
}

class Explosion {
  constructor(x, y, size) {
    this.particles = [];
    this.position = createVector(x, y);
    this.size = size;
    let nParticles = isMobile ? 8 : 20;
    for (let i = 0; i < nParticles; i++) {
      this.particles.push({
        pos: createVector(x, y),
        vel: p5.Vector.random2D().mult(random(1, 3)),
        size: random(2, 6),
        life: 255,
        color: color(255, random(150, 255), random(100, 200))
      });
    }
  }
  update() {
    for (let p of this.particles) {
      p.pos.add(p.vel);
      p.life -= 5;
    }
    return this.particles[0].life <= 0;
  }
  show() {
    for (let p of this.particles) {
      p.color.setAlpha(p.life);
      fill(p.color);
      noStroke();
      ellipse(p.pos.x, p.pos.y, p.size);
    }
  }
}
