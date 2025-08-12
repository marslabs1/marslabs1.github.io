/*=====================
PERFORMANCE OPTIMIZED FOR MOBILE
=====================*/

/*--- CONSTANTS ---*/
const MOUSE_HISTORY_LENGTH = 10;
const SHIP_FOLLOW_DELAY = 0.7;
const ASTEROID_TYPES = 5; // Number of different asteroid images

let MAX_ASTEROIDS;
let STAR_COUNT;
let EXPLOSION_PARTICLES;
let SMOKE_FADE;

let currentPage = "main";
let launchInitiated = false;
let isMobile;
let asteroidImages = [];
let flashAlpha = 0;
let flashActive = false;
let welcomeY;
let buttonPanelY;
let launchButton;

let stars = [];
let asteroids = [];
let bullets = [];
let smokeParticles = [];
let explosions = [];
let shipPosition = { x: 0, y: 0 };
let mouseHistory = [];
let angle = 0;
let targetAngle = 0;

let font, spaceship;

function preload() {
  font = loadFont("assets/PressStart2P-Regular.ttf");
  spaceship = loadImage("assets/spaceship.png");
  // Load asteroid images
  for (let i = 1; i <= ASTEROID_TYPES; i++) {
    asteroidImages.push(loadImage(`assets/asteroid${i}.png`));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  isMobile = windowWidth < 600;
  textFont(font);
  textAlign(CENTER, CENTER);

  // MOBILE: reduce object count and particle complexity
  if (isMobile) {
    MAX_ASTEROIDS = 6;
    STAR_COUNT = 30;
    EXPLOSION_PARTICLES = 8;
    SMOKE_FADE = 10;
    frameRate(30);
  } else {
    MAX_ASTEROIDS = 20;
    STAR_COUNT = 100;
    EXPLOSION_PARTICLES = 20;
    SMOKE_FADE = 5;
    frameRate(60);
  }

  // Initialize positions
  welcomeY = height / 2 - 50;
  buttonPanelY = height;
  shipPosition = { x: width / 2, y: height / 2 };

  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) stars.push(new Star());

  createButtons();
  asteroids = [];
  for (let i = 0; i < min(3, MAX_ASTEROIDS); i++) {
    asteroids.push(new Asteroid());
  }
}

function createButtons() {
  launchButton = {
    label: "LAUNCH",
    x: width / 2,
    y: height / 2 + 15,
    w: isMobile ? 140 : 200,
    h: isMobile ? 40 : 50,
    color: "#ff0000"
  };
}

function draw() {
  background(10);
  drawStars();
  if (currentPage !== "main") {
    drawSubPage(currentPage);
    return;
  }

  updateSmokeParticles();
  updateSpaceshipPosition();
  drawUI();
  handleFlashEffect();
  handleAsteroids();
  handleBullets();
  handleExplosions();
  drawSpaceship();
}

/*--- DRAW OBJECTS ---*/
function drawStars() {
  for (let star of stars) star.update(), star.show();
}

function updateSmokeParticles() {
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    smokeParticles[i].update();
    smokeParticles[i].show();
    if (smokeParticles[i].isFinished()) smokeParticles.splice(i, 1);
  }
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
  // Asteroid spawning controlled for mobile
  if (asteroids.length < MAX_ASTEROIDS && random(1) < (isMobile ? 0.005 : 0.01) && !launchInitiated) {
    asteroids.push(new Asteroid());
  }
  for (let i = asteroids.length - 1; i >= 0; i--) {
    asteroids[i].update();
    asteroids[i].show();
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (asteroids[i].hits(bullets[j])) {
        explosions.push(new Explosion(
          asteroids[i].x, asteroids[i].y, asteroids[i].size
        ));
        asteroids.splice(i, 1);
        bullets.splice(j, 1);
        break;
      }
    }
  }
}

function handleBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].show();
    if (bullets[i].offScreen()) bullets.splice(i, 1);
  }
}

function handleExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].show();
    if (explosions[i].update()) explosions.splice(i, 1);
  }
}

/*--- SPACESHIP MOVEMENT ---*/
function updateSpaceshipPosition() {
  if (frameCount % 2 === 0) {
    mouseHistory.push({x: mouseX, y: mouseY});
    if (mouseHistory.length > MOUSE_HISTORY_LENGTH) mouseHistory.shift();
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

/*--- UI COMPONENTS ---*/
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

/*--- EVENT HANDLERS (debounced resize) ---*/
let lastResize = 0;
function windowResized() {
  // Prevent rapid resize on mobile
  if (millis() - lastResize < 1000) return;
  resizeCanvas(windowWidth, windowHeight);
  setup();
  lastResize = millis();
}

function mousePressed() {
  if (!launchInitiated && overButton(launchButton)) {
    startGame();
    //window.location.href = "main.html";
    return;
  }
  if (currentPage === "main") bullets.push(new Bullet(shipPosition.x, shipPosition.y, angle));
}

function mouseClicked() {
  if (currentPage !== "main") currentPage = "main";
}

/*--- GAME FUNCTIONS ---*/
function startGame() {
  flashAlpha = 255;
  flashActive = true;
  asteroids = [];
  launchInitiated = true;
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

/*--- GAME CLASSES (mobile-optimized) ---*/
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
    this.alpha -= SMOKE_FADE;
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
    this.size = random(isMobile ? 30 : 30, isMobile ? 40 : 60); // Smaller for mobile
    this.img = random(asteroidImages);
  }
  reset() {
    let edge = floor(random(4));
    this.speedX = random(-1.5, 1.5);
    this.speedY = random(-1.5, 1.5);
    switch(edge) {
      case 0: this.x = random(width); this.y = -50; break;
      case 1: this.x = width + 50; this.y = random(height); break;
      case 2: this.x = random(width); this.y = height + 50; break;
      case 3: this.x = -50; this.y = random(height); break;
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
    for (let i = 0; i < EXPLOSION_PARTICLES; i++) {
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
