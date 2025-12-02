// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 40;
const OPPONENT_SIZE = 35;
const BOSS_SIZE = 50;
const BULLET_SIZE = 8;
const PLAYER_SPEED = 5;
const OPPONENT_SPEED = 2;
const BOSS_SPEED = 4; // Double speed
const BULLET_SPEED = 7;
const PLAYER_INITIAL_LIVES = 3;
const DEATH_DURATION = 2000; // 2 seconds

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// UI Elements
const scoreLi = document.getElementById('scoreli');
const livesLi = document.getElementById('livesli');
const gameOverScreen = document.getElementById('game-over-screen');
const gameOverImg = document.getElementById('game-over-img');

// Game State
let score = 0;
let gameRunning = true;
let player;
let opponents = [];
let bosses = [];
let playerBullets = [];
let enemyBullets = [];
let keys = {};
let firstOpponentKilled = false;

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        if (gameRunning && player && !player.isDead) {
            player.shoot();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls
function setupTouchControls() {
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnShoot = document.getElementById('btn-shoot');

    const handleTouchStart = (key) => (e) => {
        e.preventDefault();
        keys[key] = true;
    };

    const handleTouchEnd = (key) => (e) => {
        e.preventDefault();
        keys[key] = false;
    };

    btnUp.addEventListener('touchstart', handleTouchStart('ArrowUp'));
    btnUp.addEventListener('touchend', handleTouchEnd('ArrowUp'));
    btnDown.addEventListener('touchstart', handleTouchStart('ArrowDown'));
    btnDown.addEventListener('touchend', handleTouchEnd('ArrowDown'));
    btnLeft.addEventListener('touchstart', handleTouchStart('ArrowLeft'));
    btnLeft.addEventListener('touchend', handleTouchEnd('ArrowLeft'));
    btnRight.addEventListener('touchstart', handleTouchStart('ArrowRight'));
    btnRight.addEventListener('touchend', handleTouchEnd('ArrowRight'));
    
    btnShoot.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning && player && !player.isDead) {
            player.shoot();
        }
    });
}

// Base Entity Class
class Entity {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }

    getBounds() {
        return {
            left: this.x - this.size / 2,
            right: this.x + this.size / 2,
            top: this.y - this.size / 2,
            bottom: this.y + this.size / 2
        };
    }

    collidesWith(other) {
        const a = this.getBounds();
        const b = other.getBounds();
        return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    }
}

// Player Class (Square)
class Player extends Entity {
    constructor(x, y) {
        super(x, y, PLAYER_SIZE, '#4ecca3');
        this.lives = PLAYER_INITIAL_LIVES;
        this.isDead = false;
        this.lastShot = 0;
        this.shootCooldown = 300; // ms
    }

    update() {
        if (this.isDead) return;

        if (keys['ArrowUp'] || keys['w'] || keys['W']) {
            this.y = Math.max(this.size / 2, this.y - PLAYER_SPEED);
        }
        if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            this.y = Math.min(CANVAS_HEIGHT - this.size / 2, this.y + PLAYER_SPEED);
        }
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.x = Math.max(this.size / 2, this.x - PLAYER_SPEED);
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.x = Math.min(CANVAS_WIDTH - this.size / 2, this.x + PLAYER_SPEED);
        }
    }

    draw() {
        if (this.isDead) {
            // Draw dead player (faded)
            ctx.globalAlpha = 0.3;
        }
        
        // Draw square player
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        
        // Draw eyes
        ctx.fillStyle = '#16213e';
        ctx.fillRect(this.x - 10, this.y - 8, 6, 6);
        ctx.fillRect(this.x + 4, this.y - 8, 6, 6);
        
        // Draw mouth
        ctx.fillRect(this.x - 8, this.y + 5, 16, 4);
        
        ctx.globalAlpha = 1;
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot > this.shootCooldown) {
            playerBullets.push(new Bullet(this.x, this.y - this.size / 2, 0, -BULLET_SPEED, '#4ecca3'));
            this.lastShot = now;
        }
    }

    hit() {
        if (this.isDead) return;
        
        this.lives--;
        updateUI();
        
        if (this.lives <= 0) {
            this.die(true); // permanent death
        } else {
            this.die(false); // temporary death
        }
    }

    die(permanent) {
        this.isDead = true;
        
        if (permanent) {
            gameOver(false);
        } else {
            // Resurrect after 2 seconds
            setTimeout(() => {
                this.isDead = false;
                // Reset position to center bottom
                this.x = CANVAS_WIDTH / 2;
                this.y = CANVAS_HEIGHT - 50;
            }, DEATH_DURATION);
        }
    }
}

// Bullet Class
class Bullet extends Entity {
    constructor(x, y, vx, vy, color) {
        super(x, y, BULLET_SIZE, color);
        this.vx = vx;
        this.vy = vy;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    isOffScreen() {
        return this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT;
    }
}

// Opponent Class (Triangle)
class Opponent extends Entity {
    constructor(x, y) {
        super(x, y, OPPONENT_SIZE, '#e94560');
        this.speed = OPPONENT_SPEED;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.lastShot = Date.now() + Math.random() * 2000;
        this.shootInterval = 2000 + Math.random() * 1000;
        this.isDead = false;
        this.deathTime = 0;
    }

    update() {
        if (this.isDead) return;

        // Move horizontally
        this.x += this.speed * this.direction;
        
        // Bounce off walls
        if (this.x <= this.size / 2 || this.x >= CANVAS_WIDTH - this.size / 2) {
            this.direction *= -1;
        }
        
        // Keep in bounds
        this.x = Math.max(this.size / 2, Math.min(CANVAS_WIDTH - this.size / 2, this.x));

        // Shoot at player
        const now = Date.now();
        if (now - this.lastShot > this.shootInterval && player && !player.isDead) {
            this.shoot();
            this.lastShot = now;
        }
    }

    draw() {
        if (this.isDead) {
            // Draw as star when dead
            this.drawStar();
        } else {
            // Draw triangle
            this.drawTriangle();
        }
    }

    drawTriangle() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size / 2);
        ctx.lineTo(this.x - this.size / 2, this.y + this.size / 2);
        ctx.lineTo(this.x + this.size / 2, this.y + this.size / 2);
        ctx.closePath();
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#16213e';
        ctx.fillRect(this.x - 8, this.y, 5, 5);
        ctx.fillRect(this.x + 3, this.y, 5, 5);
    }

    drawStar() {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = this.size / 2;
        const innerRadius = this.size / 4;
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / spikes) * i - Math.PI / 2;
            const x = this.x + Math.cos(angle) * radius;
            const y = this.y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    shoot() {
        if (!player) return;
        
        // Calculate direction to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            const vx = (dx / dist) * BULLET_SPEED * 0.7;
            const vy = (dy / dist) * BULLET_SPEED * 0.7;
            enemyBullets.push(new Bullet(this.x, this.y + this.size / 2, vx, vy, '#ff6b6b'));
        }
    }

    hit() {
        if (this.isDead) return;
        
        this.isDead = true;
        this.deathTime = Date.now();
        score++;
        updateUI();
        
        if (!firstOpponentKilled) {
            firstOpponentKilled = true;
            spawnBoss();
        }
    }
}

// Boss Class (Pentagon) - inherits from Opponent
class Boss extends Opponent {
    constructor(x, y) {
        super(x, y);
        this.size = BOSS_SIZE;
        this.speed = BOSS_SPEED; // Double speed
        this.color = '#9b59b6';
        this.shootInterval = 1500; // Shoots faster
    }

    draw() {
        if (this.isDead) {
            this.drawStar();
        } else {
            this.drawPentagon();
        }
    }

    drawPentagon() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const sides = 5;
        
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
            const x = this.x + Math.cos(angle) * this.size / 2;
            const y = this.y + Math.sin(angle) * this.size / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#16213e';
        ctx.fillRect(this.x - 10, this.y - 5, 6, 6);
        ctx.fillRect(this.x + 4, this.y - 5, 6, 6);
        
        // Draw angry mouth
        ctx.fillRect(this.x - 8, this.y + 8, 16, 4);
    }

    hit() {
        if (this.isDead) return;
        
        this.isDead = true;
        this.deathTime = Date.now();
        score++;
        updateUI();
        
        // Check if all bosses are dead
        setTimeout(() => {
            const aliveBosses = bosses.filter(b => !b.isDead);
            if (aliveBosses.length === 0 && player && player.lives > 0) {
                gameOver(true); // Victory!
            }
        }, 100);
    }
}

// Game Functions
function spawnOpponent() {
    const x = Math.random() * (CANVAS_WIDTH - OPPONENT_SIZE) + OPPONENT_SIZE / 2;
    const y = 50 + Math.random() * 100;
    opponents.push(new Opponent(x, y));
}

function spawnBoss() {
    const x = CANVAS_WIDTH / 2;
    const y = 80;
    bosses.push(new Boss(x, y));
}

function updateUI() {
    scoreLi.innerHTML = `Score: ${score}`;
    livesLi.innerHTML = `Lives: ${player ? player.lives : 0}`;
}

function gameOver(victory) {
    gameRunning = false;
    gameOverScreen.classList.remove('hidden');
    
    if (victory) {
        gameOverImg.src = 'assets/you_win.svg';
        gameOverImg.alt = 'You Win!';
    } else {
        gameOverImg.src = 'assets/game_over.svg';
        gameOverImg.alt = 'Game Over';
    }
}

function update() {
    if (!gameRunning) return;

    // Update player
    player.update();

    // Update opponents
    opponents.forEach(opponent => opponent.update());
    
    // Update bosses
    bosses.forEach(boss => boss.update());

    // Update player bullets
    playerBullets.forEach(bullet => bullet.update());
    playerBullets = playerBullets.filter(bullet => !bullet.isOffScreen());

    // Update enemy bullets
    enemyBullets.forEach(bullet => bullet.update());
    enemyBullets = enemyBullets.filter(bullet => !bullet.isOffScreen());

    // Check player bullets hitting opponents
    playerBullets.forEach((bullet, bulletIndex) => {
        opponents.forEach(opponent => {
            if (!opponent.isDead && bullet.collidesWith(opponent)) {
                opponent.hit();
                playerBullets.splice(bulletIndex, 1);
            }
        });
        
        bosses.forEach(boss => {
            if (!boss.isDead && bullet.collidesWith(boss)) {
                boss.hit();
                playerBullets.splice(bulletIndex, 1);
            }
        });
    });

    // Check enemy bullets hitting player
    if (!player.isDead) {
        enemyBullets.forEach((bullet, bulletIndex) => {
            if (bullet.collidesWith(player)) {
                player.hit();
                enemyBullets.splice(bulletIndex, 1);
            }
        });
    }

    // Remove dead entities after some time (they become stars)
    const now = Date.now();
    opponents = opponents.filter(o => !o.isDead || now - o.deathTime < 2000);
    bosses = bosses.filter(b => !b.isDead || now - b.deathTime < 2000);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw player
    player.draw();

    // Draw opponents
    opponents.forEach(opponent => opponent.draw());
    
    // Draw bosses
    bosses.forEach(boss => boss.draw());

    // Draw bullets
    playerBullets.forEach(bullet => bullet.draw());
    enemyBullets.forEach(bullet => bullet.draw());
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize game
function init() {
    player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
    spawnOpponent();
    setupTouchControls();
    updateUI();
    gameLoop();
}

// Start game when page loads
window.onload = init;
