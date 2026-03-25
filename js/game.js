// ============================================================
// 定数
// ============================================================
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.15;
const BALL_SIZES = [26, 16, 9];       // 半径: 大, 中, 小
const BALL_COLORS = ['#ff3344', '#ff8833', '#ffcc22'];
const BALL_HIGHLIGHT = ['#ff8899', '#ffbb77', '#ffee88'];
const BALL_SPEEDS = [
    { vx: 1.3, vyBounce: -9.0 },   // 大
    { vx: 1.6, vyBounce: -7.5 },   // 中
    { vx: 2.0, vyBounce: -5.5 },   // 小
];
const CHAR_WIDTH = 28;
const CHAR_HEIGHT = 24;
const CHAR_SPEED = 4;
const WATER_WIDTH = 4;
const INVULN_FRAMES = 15;
const SCORE_PER_LEVEL = [100, 200, 400]; // 大, 中, 小を倒した時のスコア

// ============================================================
// Canvas セットアップ
// ============================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ============================================================
// ゲーム状態
// ============================================================
const keys = { left: false, right: false, space: false };
let state = 'start'; // 'start' | 'playing' | 'gameover'
let character = null;
let balls = [];
let shooting = false;
let waterTopY = 0;
let score = 0;
let wave = 0;
let gameOverTimer = 0;
let particles = [];

// ============================================================
// 入力ハンドリング
// ============================================================
document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft')  { keys.left = true;  e.preventDefault(); }
    if (e.code === 'ArrowRight') { keys.right = true; e.preventDefault(); }
    if (e.code === 'Space') {
        keys.space = true;
        e.preventDefault();
        if (state === 'start') startGame();
        else if (state === 'gameover' && gameOverTimer > 60) startGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft')  keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space')      keys.space = false;
});

// ============================================================
// エンティティ生成
// ============================================================
function createCharacter() {
    return {
        x: CANVAS_WIDTH / 2 - CHAR_WIDTH / 2,
        y: CANVAS_HEIGHT - CHAR_HEIGHT - 4,
        width: CHAR_WIDTH,
        height: CHAR_HEIGHT,
    };
}

function createBall(x, y, sizeLevel, vxDir) {
    const speed = BALL_SPEEDS[sizeLevel];
    return {
        x: x,
        y: y,
        radius: BALL_SIZES[sizeLevel],
        sizeLevel: sizeLevel,
        vx: speed.vx * vxDir,
        vy: -Math.abs(speed.vyBounce) * 0.5,
        invulnerable: 0,
    };
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 20 + Math.random() * 20,
            color: color,
            radius: 2 + Math.random() * 3,
        });
    }
}

// ============================================================
// ゲーム管理
// ============================================================
function startGame() {
    state = 'playing';
    score = 0;
    wave = 0;
    character = createCharacter();
    balls = [];
    particles = [];
    shooting = false;
    nextWave();
}

function nextWave() {
    wave++;
    const numBalls = Math.min(wave, 6); // Stage1=1個, Stage2=2個, ...最大6個
    for (let i = 0; i < numBalls; i++) {
        const x = 100 + Math.random() * (CANVAS_WIDTH - 200);
        const dir = Math.random() < 0.5 ? -1 : 1;
        balls.push(createBall(x, 80 + Math.random() * 60, 0, dir));
    }
}

// ============================================================
// 衝突判定
// ============================================================
function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (cr * cr);
}

// ============================================================
// 更新ロジック
// ============================================================
function update() {
    if (state !== 'playing') {
        if (state === 'gameover') gameOverTimer++;
        updateParticles();
        return;
    }

    // キャラクター移動
    if (keys.left)  character.x -= CHAR_SPEED;
    if (keys.right) character.x += CHAR_SPEED;
    character.x = Math.max(0, Math.min(CANVAS_WIDTH - CHAR_WIDTH, character.x));

    // 水鉄砲
    shooting = keys.space;
    const gunTipX = character.x + CHAR_WIDTH / 2;
    const gunTipY = character.y + CHAR_HEIGHT - 34;

    if (shooting) {
        waterTopY = 0;
        let hitBallIndex = -1;
        let hitBallY = -Infinity;

        for (let i = 0; i < balls.length; i++) {
            const b = balls[i];
            if (b.invulnerable > 0) continue;

            const horizontalDist = Math.abs(b.x - gunTipX);
            if (horizontalDist < WATER_WIDTH / 2 + b.radius) {
                if (b.y + b.radius > waterTopY && b.y - b.radius < gunTipY) {
                    if (b.y > hitBallY) {
                        hitBallY = b.y;
                        hitBallIndex = i;
                    }
                }
            }
        }

        if (hitBallIndex >= 0) {
            const hitBall = balls[hitBallIndex];
            waterTopY = hitBall.y - hitBall.radius;

            score += SCORE_PER_LEVEL[hitBall.sizeLevel];
            spawnParticles(hitBall.x, hitBall.y, BALL_COLORS[hitBall.sizeLevel], 12);

            if (hitBall.sizeLevel < 2) {
                const newLevel = hitBall.sizeLevel + 1;
                const b1 = createBall(hitBall.x, hitBall.y, newLevel, -1);
                const b2 = createBall(hitBall.x, hitBall.y, newLevel, 1);
                b1.vy = -3;
                b2.vy = -3;
                b1.invulnerable = INVULN_FRAMES;
                b2.invulnerable = INVULN_FRAMES;
                balls.push(b1, b2);
            }
            balls.splice(hitBallIndex, 1);
        }
    }

    // ボール物理
    for (const b of balls) {
        b.vy += GRAVITY;
        b.x += b.vx;
        b.y += b.vy;

        if (b.invulnerable > 0) b.invulnerable--;

        // 左右の壁反射
        if (b.x - b.radius < 0) {
            b.x = b.radius;
            b.vx = Math.abs(b.vx);
        }
        if (b.x + b.radius > CANVAS_WIDTH) {
            b.x = CANVAS_WIDTH - b.radius;
            b.vx = -Math.abs(b.vx);
        }

        // 天井反射
        if (b.y - b.radius < 0) {
            b.y = b.radius;
            b.vy = Math.abs(b.vy);
        }

        // 床バウンス（固定バウンス速度）
        if (b.y + b.radius > CANVAS_HEIGHT) {
            b.y = CANVAS_HEIGHT - b.radius;
            b.vy = BALL_SPEEDS[b.sizeLevel].vyBounce;
        }
    }

    // ボール→キャラ衝突
    for (const b of balls) {
        if (circleRectCollision(b.x, b.y, b.radius,
            character.x, character.y, character.width, character.height)) {
            state = 'gameover';
            gameOverTimer = 0;
            spawnParticles(character.x + CHAR_WIDTH / 2, character.y + CHAR_HEIGHT / 2, '#fff', 20);
            return;
        }
    }

    // 全ボール消滅→次Wave
    if (balls.length === 0) {
        nextWave();
    }

    updateParticles();
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}
