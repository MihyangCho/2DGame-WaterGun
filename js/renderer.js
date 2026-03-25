// ============================================================
// 描画ロジック
// ============================================================

function renderBackground() {
    // 空（グラデーション）
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(0.5, '#B0E0F6');
    skyGrad.addColorStop(1, '#E0F0FF');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 400);

    // 太陽
    ctx.beginPath();
    ctx.arc(650, 80, 40, 0, Math.PI * 2);
    const sunGrad = ctx.createRadialGradient(650, 80, 5, 650, 80, 40);
    sunGrad.addColorStop(0, '#FFFDE0');
    sunGrad.addColorStop(0.5, '#FFE866');
    sunGrad.addColorStop(1, 'rgba(255, 232, 102, 0.0)');
    ctx.fillStyle = sunGrad;
    ctx.fill();

    // 雲
    function drawCloud(x, y, s) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, 15 * s, 0, Math.PI * 2);
        ctx.arc(x + 18 * s, y - 5 * s, 12 * s, 0, Math.PI * 2);
        ctx.arc(x + 32 * s, y, 14 * s, 0, Math.PI * 2);
        ctx.arc(x + 16 * s, y + 5 * s, 10 * s, 0, Math.PI * 2);
        ctx.fill();
    }
    drawCloud(100, 60, 1.0);
    drawCloud(350, 90, 0.7);
    drawCloud(550, 50, 0.8);

    // 富士山 - 山体
    ctx.beginPath();
    ctx.moveTo(250, 300);
    ctx.lineTo(400, 130);
    ctx.lineTo(550, 300);
    ctx.closePath();
    const mtGrad = ctx.createLinearGradient(400, 130, 400, 300);
    mtGrad.addColorStop(0, '#5566AA');
    mtGrad.addColorStop(0.4, '#6677BB');
    mtGrad.addColorStop(1, '#556699');
    ctx.fillStyle = mtGrad;
    ctx.fill();

    // 富士山 - 雪冠
    ctx.beginPath();
    ctx.moveTo(365, 170);
    ctx.lineTo(400, 130);
    ctx.lineTo(435, 170);
    ctx.quadraticCurveTo(420, 165, 410, 175);
    ctx.quadraticCurveTo(400, 160, 390, 175);
    ctx.quadraticCurveTo(380, 165, 365, 170);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // 海（グラデーション）
    const seaGrad = ctx.createLinearGradient(0, 300, 0, CANVAS_HEIGHT);
    seaGrad.addColorStop(0, '#2288BB');
    seaGrad.addColorStop(0.3, '#1A6E99');
    seaGrad.addColorStop(0.7, '#155E85');
    seaGrad.addColorStop(1, '#0E4466');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, 300, CANVAS_WIDTH, CANVAS_HEIGHT - 300);

    // 海面の波キラキラ
    const t = Date.now() / 1000;
    ctx.strokeStyle = 'rgba(150, 220, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
        const wy = 310 + i * 35;
        ctx.beginPath();
        for (let x = 0; x < CANVAS_WIDTH; x += 4) {
            const y = wy + Math.sin((x + t * 40 + i * 50) * 0.03) * 3;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // 富士山の海面反射（薄く）
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.moveTo(280, 300);
    ctx.lineTo(400, 420);
    ctx.lineTo(520, 300);
    ctx.closePath();
    ctx.fillStyle = '#5566AA';
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // 砂浜（プレイエリアの床）
    const sandGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT - 20, 0, CANVAS_HEIGHT);
    sandGrad.addColorStop(0, '#D4B877');
    sandGrad.addColorStop(1, '#C4A060');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, CANVAS_HEIGHT - 8, CANVAS_WIDTH, 8);
}

function render() {
    renderBackground();

    if (state === 'start') {
        renderStartScreen();
        return;
    }

    // 水ビーム描画（キャラの後ろに描画）
    if (shooting && state === 'playing') {
        renderWater();
    }

    // キャラクター描画
    if (character) renderCharacter();

    // ボール描画
    for (const b of balls) {
        renderBall(b);
    }

    // パーティクル描画
    renderParticles();

    // UI
    renderUI();

    // ゲームオーバー画面
    if (state === 'gameover') {
        renderGameOver();
    }
}

function renderStartScreen() {
    // タイトル（影付き）
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillText('メタモンの富士山冒険', CANVAS_WIDTH / 2 + 2, 202);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('メタモンの富士山冒険', CANVAS_WIDTH / 2, 200);

    // サブタイトル
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = '18px monospace';
    ctx.fillText('← → で移動　　SPACE で水発射', CANVAS_WIDTH / 2 + 1, 281);
    ctx.fillStyle = '#FFF8E0';
    ctx.fillText('← → で移動　　SPACE で水発射', CANVAS_WIDTH / 2, 280);

    // ボールのデモ描画
    const demoTime = Date.now() / 1000;
    for (let i = 0; i < 3; i++) {
        const dx = (i - 1) * 80;
        const dy = Math.sin(demoTime * 2 + i) * 20;
        renderBallAt(CANVAS_WIDTH / 2 + dx, 360 + dy, BALL_SIZES[i], i);
    }

    // 点滅するスタートテキスト
    if (Math.floor(demoTime * 2) % 2 === 0) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('SPACE でスタート', CANVAS_WIDTH / 2, 480);
    }
}

function renderCharacter() {
    const midX = character.x + CHAR_WIDTH / 2;
    const baseY = character.y + CHAR_HEIGHT;  // 足元
    const bodyW = CHAR_WIDTH;
    const bodyH = CHAR_HEIGHT;

    // === 暗い紫の足/底部（左右に広がるベース） ===
    ctx.fillStyle = '#6B4C8A';
    ctx.beginPath();
    ctx.ellipse(midX - 8, baseY - 2, 7, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(midX + 8, baseY - 2, 7, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // 中央底
    ctx.beginPath();
    ctx.ellipse(midX, baseY - 1, 10, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#5A3D7A';
    ctx.fill();

    // === メイン本体（もこもこスライム形状） ===
    const bodyGrad = ctx.createRadialGradient(
        midX - 3, baseY - bodyH * 0.6, bodyW * 0.1,
        midX, baseY - bodyH * 0.4, bodyW * 0.7
    );
    bodyGrad.addColorStop(0, '#D4A0E0');   // 明るいラベンダー
    bodyGrad.addColorStop(0.4, '#B480CC');  // メインの紫
    bodyGrad.addColorStop(0.8, '#9A68B8');  // やや暗い紫
    bodyGrad.addColorStop(1, '#7A50A0');    // 縁の暗い紫

    // もこもこした不定形シルエット
    ctx.beginPath();
    ctx.moveTo(midX - 12, baseY - 4);
    ctx.quadraticCurveTo(midX - 16, baseY - 10, midX - 13, baseY - 14);
    ctx.quadraticCurveTo(midX - 15, baseY - 20, midX - 10, baseY - 22);
    ctx.quadraticCurveTo(midX - 8, baseY - 26, midX - 4, baseY - 24);
    // 左の突起
    ctx.quadraticCurveTo(midX - 5, baseY - 28, midX - 3, baseY - 27);
    ctx.quadraticCurveTo(midX - 1, baseY - 26, midX, baseY - 24);
    // 右の突起
    ctx.quadraticCurveTo(midX + 1, baseY - 26, midX + 3, baseY - 27);
    ctx.quadraticCurveTo(midX + 5, baseY - 28, midX + 4, baseY - 24);
    ctx.quadraticCurveTo(midX + 8, baseY - 26, midX + 10, baseY - 22);
    ctx.quadraticCurveTo(midX + 15, baseY - 20, midX + 13, baseY - 14);
    ctx.quadraticCurveTo(midX + 16, baseY - 10, midX + 12, baseY - 4);
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    // 輪郭線
    ctx.strokeStyle = '#4A3068';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // === ハイライト（つやつや感） ===
    ctx.beginPath();
    ctx.ellipse(midX - 4, baseY - 19, 5, 3, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(230, 200, 255, 0.35)';
    ctx.fill();

    // === 顔 ===
    const faceY = baseY - 14;
    // 左目（小さな点）
    ctx.fillStyle = '#2A1A3A';
    ctx.beginPath();
    ctx.arc(midX - 4, faceY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // 右目
    ctx.beginPath();
    ctx.arc(midX + 4, faceY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // 口（短い横線、少しニコッと）
    ctx.strokeStyle = '#2A1A3A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(midX - 3, faceY + 4);
    ctx.quadraticCurveTo(midX, faceY + 5.5, midX + 3, faceY + 4);
    ctx.stroke();

    // === 水鉄砲（頭の上に乗せる） ===
    ctx.fillStyle = '#666';
    ctx.fillRect(midX - 2.5, baseY - 30, 5, 9);
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(midX - 2, baseY - 34, 4, 5);
}

function renderWater() {
    const gunTipX = character.x + CHAR_WIDTH / 2;
    const gunTipY = character.y + CHAR_HEIGHT - 34;

    // 外側のビーム（半透明）
    ctx.fillStyle = 'rgba(68, 136, 255, 0.3)';
    ctx.fillRect(gunTipX - 4, waterTopY, 8, gunTipY - waterTopY);

    // 内側の明るいビーム
    ctx.fillStyle = 'rgba(100, 180, 255, 0.7)';
    ctx.fillRect(gunTipX - 2, waterTopY, 4, gunTipY - waterTopY);

    // 中心線
    ctx.fillStyle = 'rgba(200, 230, 255, 0.9)';
    ctx.fillRect(gunTipX - 1, waterTopY, 2, gunTipY - waterTopY);

    // 先端のしぶき
    for (let i = 0; i < 3; i++) {
        const sx = gunTipX + (Math.random() - 0.5) * 16;
        const sy = waterTopY + Math.random() * 10;
        ctx.fillStyle = 'rgba(150, 200, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function renderBall(b) {
    renderBallAt(b.x, b.y, b.radius, b.sizeLevel);

    // 無敵状態は半透明で表示
    if (b.invulnerable > 0 && Math.floor(b.invulnerable / 3) % 2 === 0) {
        ctx.globalAlpha = 0.4;
        renderBallAt(b.x, b.y, b.radius, b.sizeLevel);
        ctx.globalAlpha = 1.0;
    }
}

function renderBallAt(x, y, radius, level) {
    const gradient = ctx.createRadialGradient(
        x - radius * 0.3, y - radius * 0.3, radius * 0.1,
        x, y, radius
    );
    gradient.addColorStop(0, BALL_HIGHLIGHT[level]);
    gradient.addColorStop(1, BALL_COLORS[level]);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // ハイライト
    ctx.beginPath();
    ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
}

function renderParticles() {
    for (const p of particles) {
        const alpha = p.life / 40;
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (p.life / 40), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

function renderUI() {
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(8, 10, 150, 24);
    ctx.fillRect(CANVAS_WIDTH - 158, 10, 150, 24);
    ctx.fillStyle = '#fff';
    ctx.fillText(`SCORE: ${score}`, 16, 28);
    ctx.textAlign = 'right';
    ctx.fillText(`STAGE: ${wave}`, CANVAS_WIDTH - 16, 28);
    ctx.textAlign = 'left';
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#ff4455';
    ctx.font = 'bold 56px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 260);

    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText(`SCORE: ${score}`, CANVAS_WIDTH / 2, 320);
    ctx.fillText(`STAGE: ${wave}`, CANVAS_WIDTH / 2, 356);

    if (gameOverTimer > 60) {
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = '#aab';
            ctx.font = '20px monospace';
            ctx.fillText('SPACE でリトライ', CANVAS_WIDTH / 2, 430);
        }
    }
    ctx.textAlign = 'left';
}

// ============================================================
// ゲームループ
// ============================================================
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// スタート
requestAnimationFrame(gameLoop);
