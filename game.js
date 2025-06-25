// === INÍCIO DO ARQUIVO ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Imagens
const backgroundImg = new Image();
backgroundImg.src = "img/1.png";

const monsterImgRight = new Image();
monsterImgRight.src = "img/monstro andando.png";
const monsterImgLeft = new Image();
monsterImgLeft.src = "img/monstro_andando.png";

const dragonImg = new Image();
dragonImg.src = "img/Dragão.png";

const ichigoImg = new Image();
ichigoImg.src = "img/Ichigo.png";
const attackImg = new Image();
attackImg.src = "img/ataque.png";
const specialImg = new Image();
specialImg.src = "img/especial.png";
const paradoImg = new Image();
paradoImg.src = "img/parado.png";
const jumpImg = new Image();
jumpImg.src = "img/pulo.png";
const jumpImgLeft = new Image();
jumpImgLeft.src = "img/pula.png";

// Constantes dos sprites
const MONSTER_FRAME_WIDTH = 300;
const MONSTER_FRAME_HEIGHT = 300;
const MONSTER_DRAW_WIDTH = 200;
const MONSTER_DRAW_HEIGHT = 200;

const ICHIGO_FRAME_WIDTH = 250;
const ICHIGO_FRAME_HEIGHT = 250;
const ICHIGO_DRAW_WIDTH = 180;
const ICHIGO_DRAW_HEIGHT = 180;

const ATTACK_FRAME_WIDTH = 250;
const ATTACK_FRAME_HEIGHT = 250;

const SPECIAL_FRAME_WIDTH = 250;
const SPECIAL_FRAME_HEIGHT = 250;

const JUMP_FRAME_WIDTH = 250;
const JUMP_FRAME_HEIGHT = 250;

// ===== Variáveis para câmera, fundo e escala =====
let bgOffsetX = 0;
let BG_REAL_WIDTH = 6000;
let BG_REAL_HEIGHT = 1280;
let bgScale = 1;

function updateBgScaleAndPositions() {
    bgScale = canvas.height / BG_REAL_HEIGHT;
    ichigo.y = canvas.height - ICHIGO_DRAW_HEIGHT - 80;
    monsters.forEach(monster => {
        if (!monster.isDragon) {
            monster.y = canvas.height - MONSTER_DRAW_HEIGHT - 80;
        }
    });
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateBgScaleAndPositions();
});

backgroundImg.onload = function() {
    BG_REAL_HEIGHT = backgroundImg.height;
    updateBgScaleAndPositions();
    checkLoaded();
};

// Ichigo
let ichigo = {
    x: 200,
    y: canvas.height - ICHIGO_DRAW_HEIGHT - 80,
    width: ICHIGO_DRAW_WIDTH,
    height: ICHIGO_DRAW_HEIGHT,
    speed: 14,
    direction: "right",
    isMoving: false,
    isAttacking: false,
    isJumping: false,
    isSpecial: false,
    frameIndex: 0,
    frameCount: 6,
    frameDelay: 0,
    maxFrameDelay: 6,
    attackFrameIndex: 0,
    attackFrameCount: 4,
    attackFrameDelay: 0,
    maxAttackFrameDelay: 6,
    jumpFrameIndex: 0,
    jumpFrameCount: 8,
    jumpFrameDelay: 0,
    maxJumpFrameDelay: 4,
    jumpY: 0,
    jumpVelocity: 0,
    hasHit: false,
    life: 10
};

// Monstros (array)
let monsters = [
    {
        x: canvas.width - MONSTER_DRAW_WIDTH - 100,
        y: canvas.height - MONSTER_DRAW_HEIGHT - 80,
        width: MONSTER_DRAW_WIDTH,
        height: MONSTER_DRAW_HEIGHT,
        speed: 3,
        direction: "left",
        frameIndex: 0,
        frameCount: 6,
        frameDelay: 0,
        maxFrameDelay: 8,
        life: 6,
        alive: true,
        cured: false
    }
];

// Função para spawnar monstros e dragão
function spawnMultipleMonsters(qtd) {
    let limite = BG_REAL_WIDTH * bgScale > 0 ? BG_REAL_WIDTH * bgScale : canvas.width;
    // Sempre adiciona 1 dragão
    let dragonX = ichigo.x < limite / 2 ? limite - MONSTER_DRAW_WIDTH - 50 : 50;
    monsters.push({
        x: dragonX,
        y: canvas.height / 2,
        width: MONSTER_DRAW_WIDTH,
        height: MONSTER_DRAW_HEIGHT,
        speed: 4,
        direction: dragonX < ichigo.x ? "right" : "left",
        frameIndex: 0,
        frameCount: 4,
        frameDelay: 0,
        maxFrameDelay: 8,
        life: 8,
        alive: true,
        cured: false,
        isDragon: true,
        vy: 0
    });

    // Só adiciona monstros normais se qtd > 0
    for (let i = 0; i < qtd; i++) {
        let fromLeft = i % 2 === 0;
        monsters.push({
            x: fromLeft ? 50 : limite - MONSTER_DRAW_WIDTH - 50,
            y: canvas.height - MONSTER_DRAW_HEIGHT - 80,
            width: MONSTER_DRAW_WIDTH,
            height: MONSTER_DRAW_HEIGHT,
            speed: 3,
            direction: fromLeft ? "right" : "left",
            frameIndex: 0,
            frameCount: 6,
            frameDelay: 0,
            maxFrameDelay: 8,
            life: 6,
            alive: true,
            cured: false
        });
    }
}

// Especial
let special = {
    active: false,
    x: 0,
    y: 0,
    width: SPECIAL_FRAME_WIDTH,
    height: SPECIAL_FRAME_HEIGHT,
    speed: 18,
    direction: "right",
    frameIndex: 0,
    frameCount: 2,
    frameDelay: 0,
    maxFrameDelay: 4
};

let specialCooldown = false;
let specialCooldownTime = 3000;

// Controle de ataque do monstro
let monsterAttackCooldown = 0;
const monsterAttackDelay = 30;

let leftPressed = false;
let rightPressed = false;
let gameOver = false;
let paused = false;

// ======= CONTADOR DE MORTES E BOSS =======
let monstersKilled = 0;
let bossSpawned = false;
let dragonBossSpawned = false; // NOVO: controle do boss dragão

// Poderes do boss
let bossPowers = [];
let bossRainPowers = [];


// ===== VITÓRIA =====
let victory = false;
let victoryShown = false;
let victoryTimer = 0;

// ====== PULO CONTÍNUO ======
let wPressed = false;

// ===== DASH DO BOSS =====
let bossDashWarning = false;
let bossDashWarningTimer = 0;
let bossDashing = false;
let bossDashTimer = 0;
let bossDashDirection = "left";

// ===== FUNÇÕES DE DESENHO E ATUALIZAÇÃO =====

function drawBackground() {
    const visibleBgWidth = canvas.width / bgScale;
    ctx.drawImage(
        backgroundImg,
        bgOffsetX / bgScale, 0,
        visibleBgWidth, BG_REAL_HEIGHT,
        -140, 0,
        1850, canvas.height
    );
}

function updateBackground() {
    let limite = 12000;
    const visibleBgWidth = canvas.width / bgScale;
    const ichigoCenter = (ichigo.x + ichigo.width / 2) / bgScale;

    if (limite > visibleBgWidth) {
        if (ichigoCenter > visibleBgWidth / 2 && ichigoCenter < limite / bgScale - visibleBgWidth / 2) {
            bgOffsetX = (ichigoCenter - visibleBgWidth / 2) * bgScale;
        } else if (ichigoCenter <= visibleBgWidth / 2) {
            bgOffsetX = 0;
        } else if (ichigoCenter >= limite / bgScale - visibleBgWidth / 2) {
            bgOffsetX = (limite / bgScale - visibleBgWidth) * bgScale;
        }
        bgOffsetX = Math.max(0, Math.min(bgOffsetX, (limite / bgScale - visibleBgWidth) * bgScale));
    } else {
        bgOffsetX = 0;
    }
}

function drawIchigo() {
    if (ichigo.life <= 0) return;
    let drawY = ichigo.y + ichigo.jumpY;
    let drawX = ichigo.x - bgOffsetX;
    if (ichigo.isJumping) {
        let sx = ichigo.jumpFrameIndex * JUMP_FRAME_WIDTH;
        if (ichigo.direction === "right") {
            ctx.drawImage(
                jumpImg,
                sx, 0, JUMP_FRAME_WIDTH, JUMP_FRAME_HEIGHT,
                drawX, drawY, ichigo.width, ichigo.height
            );
        } else {
            ctx.drawImage(
                jumpImgLeft,
                sx, 0, JUMP_FRAME_WIDTH, JUMP_FRAME_HEIGHT,
                drawX, drawY, ichigo.width, ichigo.height
            );
        }
    } else if (ichigo.isAttacking) {
        let sy = ichigo.direction === "right" ? 0 : ATTACK_FRAME_HEIGHT;
        let sx = ichigo.attackFrameIndex * ATTACK_FRAME_WIDTH;
        ctx.drawImage(
            attackImg,
            sx, sy, ATTACK_FRAME_WIDTH, ATTACK_FRAME_HEIGHT,
            drawX, drawY, ichigo.width, ichigo.height
        );
    } else if (!ichigo.isMoving) {
        ctx.drawImage(
            paradoImg,
            0, 0, ICHIGO_FRAME_WIDTH, ICHIGO_FRAME_HEIGHT,
            drawX, drawY, ichigo.width, ichigo.height
        );
    } else {
        let sy = ichigo.direction === "right" ? 0 : ICHIGO_FRAME_HEIGHT;
        let sx = ichigo.frameIndex * ICHIGO_FRAME_WIDTH;
        ctx.drawImage(
            ichigoImg,
            sx, sy, ICHIGO_FRAME_WIDTH, ICHIGO_FRAME_HEIGHT,
            drawX, drawY, ichigo.width, ichigo.height
        );
    }
}

function drawMonsters() {
    monsters.forEach(monster => {
        if (!monster.alive) return;
        let img;
        let frameCount = monster.frameCount || 6;
        let sy = 0;
        if (monster.isDragon) {
            img = dragonImg;
            frameCount = 4; // Dragão tem 4 frames
            // INVERTIDO: agora linha 2 para direita, linha 1 para esquerda
            sy = monster.direction === "right" ? MONSTER_FRAME_HEIGHT : 0;
        } else {
            img = monster.direction === "right" ? monsterImgRight : monsterImgLeft;
        }
        let sx = (monster.frameIndex % frameCount) * MONSTER_FRAME_WIDTH;
        let drawX = monster.x - bgOffsetX;
        ctx.drawImage(
            img,
            sx, sy, MONSTER_FRAME_WIDTH, MONSTER_FRAME_HEIGHT,
            drawX, monster.y, monster.width, monster.height
        );
        ctx.fillStyle = monster.isBoss ? "purple" : monster.isDragon ? "#00bfff" : "red";
        let maxLife = monster.isBoss ? 30 : monster.isDragon && monster.isDragonBoss ? 50 : monster.isDragon ? 8 : 6;
        ctx.fillRect(drawX, monster.y - 15, (monster.width) * (monster.life / maxLife), 10);
        ctx.strokeStyle = "black";
        ctx.strokeRect(drawX, monster.y - 15, monster.width, 10);
        if (monster.isBoss) {
            ctx.fillStyle = "yellow";
            ctx.font = "bold 22px Arial";
            ctx.fillText("BOSS", drawX + monster.width / 2 - 30, monster.y - 25);

            // AVISO DO DASH
            if (bossDashWarning) {
                ctx.save();
                ctx.globalAlpha = 0.7;
                ctx.strokeStyle = "#ff0000";
                ctx.lineWidth = 8;
                ctx.beginPath();
                if (bossDashDirection === "left") {
                    ctx.moveTo(drawX + monster.width / 2, monster.y + monster.height / 2);
                    ctx.lineTo(drawX - 300, monster.y + monster.height / 2);
                } else {
                    ctx.moveTo(drawX + monster.width / 2, monster.y + monster.height / 2);
                    ctx.lineTo(drawX + monster.width + 300, monster.y + monster.height / 2);
                }
                ctx.stroke();
                ctx.restore();
            }
        }
        if (monster.isDragon && monster.isDragonBoss) {
            ctx.fillStyle = "#ff6600";
            ctx.font = "bold 22px Arial";
            ctx.fillText("BOSS DRAGÃO", drawX + monster.width / 2 - 80, monster.y - 25);
        } else if (monster.isDragon) {
            ctx.fillStyle = "#00bfff";
            ctx.font = "bold 18px Arial";
            ctx.fillText("DRAGÃO", drawX + monster.width / 2 - 40, monster.y - 25);
        }
    });
}

function drawBossPowers() {
    bossPowers.forEach(power => {
        ctx.save();
        ctx.fillStyle = power.color || "purple";
        ctx.beginPath();
        ctx.arc(power.x + power.size / 2, power.y + power.size / 2, power.size / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    });
}

function drawBossRainPowers() {
    bossRainPowers.forEach(power => {
        if (power.warning) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = "#ff0000";
            ctx.beginPath();
            ctx.arc(power.x, canvas.height - 40, power.size, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.save();
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = "#ffb300";
            ctx.beginPath();
            ctx.arc(power.x, power.y, power.size / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }
    });
}

function drawSpecial() {
    if (!special.active) return;
    let sy = special.direction === "right" ? 0 : SPECIAL_FRAME_HEIGHT;
    let sx = special.frameIndex * SPECIAL_FRAME_WIDTH;
    let drawX = special.x - bgOffsetX;
    ctx.drawImage(
        specialImg,
        sx, sy, SPECIAL_FRAME_WIDTH, SPECIAL_FRAME_HEIGHT,
        drawX, special.y, special.width, special.height
    );
}

function drawIchigoLife() {
    ctx.fillStyle = "lime";
    ctx.fillRect(20, 20, ichigo.life * 20, 20);
    ctx.strokeStyle = "black";
    ctx.strokeRect(20, 20, 200, 20);
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText("Ichigo: " + ichigo.life.toFixed(1), 25, 35);
}

function isColliding(a, b) {
    const ax = a.x + a.width * 0.1;
    const ay = (a.y + a.height * 0.1) + (a.jumpY !== undefined ? a.jumpY : 0);
    const aw = a.width * 0.8;
    const ah = a.height * 0.8;

    const bx = b.x - b.width * 0.1;
    const by = b.y - b.height * 0.1;
    const bw = b.width * 1.2;
    const bh = b.height * 1.2;

    return (
        ax < bx + bw &&
        ax + aw > bx &&
        ay < by + bh &&
        ay + ah > by
    );
}

function updateIchigo() {
    monsters.forEach(monster => {
    if (
    monster.alive &&
    monsterAttackCooldown <= 0 &&
    ichigo.life > 0
) {
    // Se for dragão, só causa dano se estiver bem perto (distância menor), independente de colisão
    if (monster.isDragon) {
    const dragaoCenterX = monster.x + monster.width / 2;
    const dragaoCenterY = monster.y + monster.height / 2;
    const ichigoCenterX = ichigo.x + ichigo.width / 2;
    const ichigoCenterY = ichigo.y + ichigo.height / 2 + ichigo.jumpY;
    // Área de contato menor para o boss dragão
    const distanciaLimite = monster.isDragonBoss ? 35 : 50;
    const distancia = Math.hypot(dragaoCenterX - ichigoCenterX, dragaoCenterY - ichigoCenterY);
    if (distancia < distanciaLimite) {
        ichigo.life -= 1.5;
        monsterAttackCooldown = monsterAttackDelay;
        if (ichigo.life < 0) ichigo.life = 0;
    }
    // NÃO coloque return aqui!
}

    // Para outros monstros, mantém a lógica antiga
    if (isColliding(monster, ichigo)) {
        const ichigoBottom = ichigo.y + ichigo.height + ichigo.jumpY;
        const monsterTop = monster.y;
        const ichigoCenter = ichigo.x + ichigo.width / 2;
        const monsterCenter = monster.x + monster.width / 2;
        const monsterAttackRange = monster.width * 0.5;

        if (
            ichigoBottom <= monsterTop + monster.height * 0.3 ||
            Math.abs(ichigoCenter - monsterCenter) > monsterAttackRange
        ) {
            return;
        }
        ichigo.life -= 1.5;
        monsterAttackCooldown = monsterAttackDelay;
        if (ichigo.life < 0) ichigo.life = 0;
    }
}
});
    if (monsterAttackCooldown > 0) monsterAttackCooldown--;

    if (ichigo.isJumping) {
        if (ichigo.jumpFrameDelay >= ichigo.maxJumpFrameDelay) {
            ichigo.jumpFrameIndex = (ichigo.jumpFrameIndex + 1) % ichigo.jumpFrameCount;
            ichigo.jumpFrameDelay = 0;
        } else {
            ichigo.jumpFrameDelay++;
        }
        ichigo.jumpY += ichigo.jumpVelocity;
        ichigo.jumpVelocity += 1.5;
        if (ichigo.jumpY >= 0 && ichigo.jumpVelocity > 0) {
            ichigo.jumpY = 0;
            ichigo.isJumping = false;
            ichigo.jumpFrameIndex = 0;
            ichigo.jumpVelocity = 0;
            if (wPressed) {
                ichigo.isJumping = true;
                ichigo.jumpFrameIndex = 0;
                ichigo.jumpFrameDelay = 0;
                ichigo.jumpY = 0;
                ichigo.jumpVelocity = -32;
            }
        }
        return;
    }

    if (ichigo.isAttacking) {
        monsters.forEach(monster => {
            if (!ichigo.hasHit && monster.alive && isColliding(ichigo, monster)) {
                monster.life -= 1;
                ichigo.hasHit = true;
                if (monster.life <= 0) {
                    monster.alive = false;
                    monstersKilled++;
                    if (!monster.cured) {
                        ichigo.life = Math.min(ichigo.life + 0.5, 10);
                        monster.cured = true;
                    }
                }
            }
        });
        if (ichigo.attackFrameDelay >= ichigo.maxAttackFrameDelay) {
            ichigo.attackFrameIndex++;
            ichigo.attackFrameDelay = 0;
            if (ichigo.attackFrameIndex >= ichigo.attackFrameCount) {
                ichigo.isAttacking = false;
                ichigo.attackFrameIndex = 0;
                ichigo.hasHit = false;
            }
        } else {
            ichigo.attackFrameDelay++;
        }
    } else if (ichigo.isMoving) {
        if (ichigo.frameDelay >= ichigo.maxFrameDelay) {
            ichigo.frameIndex = (ichigo.frameIndex + 1) % ichigo.frameCount;
            ichigo.frameDelay = 0;
        } else {
            ichigo.frameDelay++;
        }
    } else {
        ichigo.frameIndex = 0;
    }
}

function updateSpecial() {
    if (!special.active) return;
    if (special.frameDelay >= special.maxFrameDelay) {
        special.frameIndex = (special.frameIndex + 1) % special.frameCount;
        special.frameDelay = 0;
    } else {
        special.frameDelay++;
    }

    if (special.direction === "right") {
        special.x += special.speed;
        if (special.x > canvas.width) {
            special.active = false;
        }
    } else {
        special.x -= special.speed;
        if (special.x + special.width < 0) {
            special.active = false;
        }
    }

    monsters.forEach(monster => {
        if (monster.alive && isColliding(special, monster) && !monster.specialHit) {
            monster.life -= 2;
            monster.specialHit = true;
            if (monster.life <= 0) {
                monster.alive = false;
                monstersKilled++;
                if (!monster.cured) {
                    ichigo.life = Math.min(ichigo.life + 0.5, 10);
                    monster.cured = true;
                }
            }
        }
    });
    if (!special.active) {
        monsters.forEach(monster => { monster.specialHit = false; });
    }
}

function updateBossPowers() {
    bossPowers.forEach(power => {
        power.x += power.vx;
        power.y += power.vy;
    });
    bossPowers = bossPowers.filter(power =>
        power.x + power.size > 0 && power.x < canvas.width &&
        power.y + power.size > 0 && power.y < canvas.height
    );
    
    bossPowers.forEach(power => {
        const px = power.x + power.size * 0.2;
        const py = power.y + power.size * 0.2;
        const psize = power.size * 0.6;
        const ix = ichigo.x + ichigo.width * 0.3;
        const iy = (ichigo.y + ichigo.jumpY) + ichigo.height * 0.3;
        const iwidth = ichigo.width * 0.4;
        const iheight = ichigo.height * 0.4;
        if (
            ichigo.life > 0 &&
            px < ix + iwidth &&
            px + psize > ix &&
            py < iy + iheight &&
            py + psize > iy
        ) {
            ichigo.life -= 2;
            power.hit = true;
        }
    });
    bossPowers = bossPowers.filter(power => !power.hit);
}

function updateBossRainPowers() {
    bossRainPowers.forEach(power => {
        if (power.warning) {
            power.warningTimer--;
            if (power.warningTimer <= 0) {
                power.warning = false;
                power.vy = -5 - Math.random();
            }
        } else {
            power.x += power.vx;
            power.y += power.vy;
            power.vy += 0.4;
        }
        if (!power.warning) {
            const px = power.x + power.size * 0.2;
            const py = power.y + power.size * 0.2;
            const psize = power.size * 0.6;
            const ix = ichigo.x + ichigo.width * 0.3;
            const iy = (ichigo.y + ichigo.jumpY) + ichigo.height * 0.3;
            const iwidth = ichigo.width * 0.4;
            const iheight = ichigo.height * 0.4;
            if (
                !power.hit &&
                ichigo.life > 0 &&
                px < ix + iwidth &&
                px + psize > ix &&
                py < iy + iheight &&
                py + psize > iy
            ) {
                ichigo.life -= 2;
                power.hit = true;
            }
        }
    });
    bossRainPowers = bossRainPowers.filter(power =>
        power.y < canvas.height && !power.hit
    );
}

// NOVO: Função para spawnar o boss dragão
function spawnDragonBoss() {
    let limite = BG_REAL_WIDTH * bgScale > 0 ? BG_REAL_WIDTH * bgScale : canvas.width;
    monsters.push({
        x: limite / 2 - 100, // centralizado
        y: 60, // sempre voando no topo
        width: 350,
        height: 350,
        speed: 3,
        direction: "left",
        frameIndex: 0,
        frameCount: 4,
        frameDelay: 0,
        maxFrameDelay: 8,
        life: 50,
        alive: true,
        cured: false,
        isDragon: true,
        isDragonBoss: true,
        vy: 0,
        dragonPowerCooldown: 0
    });
    dragonBossSpawned = true;
}

function updateMonsters() {
    monsters.forEach(monster => {
        if (!monster.alive) {
            // Quando o boss monstro morre, espera 3 segundos e faz o dragão aparecer voando rápido, tacando fogo até o final da tela
            if (monster.isBoss && !victory && !dragonBossSpawned) {
                // Recupera 5 de vida ao matar o boss monstro
                if (!monster._gaveLife) {
                    ichigo.life = Math.min(ichigo.life + 5, 10);
                    monster._gaveLife = true;
                }
                if (!window._dragonBossTimeout) {
                    window._dragonBossTimeout = true;
                    setTimeout(() => {
                        spawnDragonBoss();
                        // Dragão entra voando rápido da esquerda para a direita, tacando fogo até sair da tela
                        let boss = monsters.find(m => m.isDragonBoss);
                        if (boss) {
                            boss.x = -boss.width;
                            boss.y = 60;
                            boss.speed = 10;
                            boss._entry = true;
                            boss.direction = "right";
                        }
                        setTimeout(() => { window._dragonBossTimeout = false; }, 1000);
                    }, 3000);
                }
                return;
            }
            // Quando o boss dragão morre, ativa vitória e recupera 5 de vida do Ichigo
            if (monster.isDragonBoss && !victory) {
                victory = true;
                victoryTimer = 60;
                ichigo.life = Math.min(ichigo.life + 5, 10);
            }
            return;
        }
        // Boss Dragão
        if (monster.isDragon && monster.isDragonBoss) {
            // Entrada rápida do dragão até o final da tela
            if (monster._entry) {
                monster.x += monster.speed;
                monster.y = 60;
                monster.direction = "right";
                // Enquanto entra, lança fogo para baixo
                if (monster.dragonPowerCooldown === undefined) monster.dragonPowerCooldown = 0;
                monster.dragonPowerCooldown--;
                if (monster.dragonPowerCooldown <= 0) {
                    bossPowers.push({
    x: monster.x + monster.width / 2 - 20,
    y: monster.y + monster.height - 10,
    vx: 0,
    vy: 14,
    size: 40,
    hit: false,
    color: "#ff6600"
});
                    monster.dragonPowerCooldown = 10;
                }
                // Quando sair totalmente da tela pela direita, começa a seguir o Ichigo normalmente
                if (monster.x > canvas.width) {
                    monster.x = canvas.width - monster.width;
                    monster.speed = 3;
                    delete monster._entry;
                    monster.dragonPowerCooldown = 0;
                    monster.fireWalkTimer = 420; // 7 segundos em frames
                    monster.fireWalkActive = false;
                }
                // Animação
                if (monster.frameDelay >= monster.maxFrameDelay) {
                    monster.frameIndex = (monster.frameIndex + 1) % monster.frameCount;
                    monster.frameDelay = 0;
                } else {
                    monster.frameDelay++;
                }
                return;
            }

            // Substitua o bloco do ataque especial do dragão boss em updateMonsters por este:

// --- NOVO: A cada 7 segundos, dragão atravessa a tela soltando fogo na direção do Ichigo ---
if (monster.fireWalkTimer === undefined) {
    monster.fireWalkTimer = 420; // 7 segundos em frames (60fps)
    monster.fireWalkActive = false;
}
monster.fireWalkTimer--;
if (monster.fireWalkTimer <= 0 && !monster.fireWalkActive) {
    monster.fireWalkActive = true;
    // Decide direção baseada na posição do Ichigo
    if ((ichigo.x + ichigo.width / 2) > (monster.x + monster.width / 2)) {
        monster.fireWalkDirection = "right";
        monster.fireWalkFrames = Math.ceil((canvas.width - monster.x - monster.width) / (monster.speed + 4));
        monster.fireWalkTarget = canvas.width - monster.width;
    } else {
        monster.fireWalkDirection = "left";
        monster.fireWalkFrames = Math.ceil((monster.x) / (monster.speed + 4));
        monster.fireWalkTarget = 0;
    }
}

// Se estiver no modo "atravessar soltando fogo"
if (monster.fireWalkActive) {
    monster.direction = monster.fireWalkDirection;
    if (monster.fireWalkDirection === "right") {
        monster.x += monster.speed + 4;
        monster.x = Math.min(monster.x, monster.fireWalkTarget);
    } else {
        monster.x -= monster.speed + 4;
        monster.x = Math.max(monster.x, monster.fireWalkTarget);
    }
    monster.y = 60;
    // Solta fogo para baixo a cada 10 frames
    if (monster.dragonPowerCooldown === undefined) monster.dragonPowerCooldown = 0;
    monster.dragonPowerCooldown--;
    if (monster.dragonPowerCooldown <= 0) {
        bossPowers.push({
            x: monster.x + monster.width / 2 - 20,
            y: monster.y + monster.height - 10,
            vx: 0,
            vy: 14,
            size: 40,
            hit: false,
            color: "#ff6600"
        });
        monster.dragonPowerCooldown = 10;
    }
    monster.fireWalkFrames--;
    // Quando chegar ao fim da tela (começo ou fim), volta a seguir o Ichigo normalmente
    if (
        (monster.fireWalkDirection === "right" && monster.x >= monster.fireWalkTarget) ||
        (monster.fireWalkDirection === "left" && monster.x <= monster.fireWalkTarget) ||
        monster.fireWalkFrames <= 0
    ) {
        monster.fireWalkActive = false;
        monster.fireWalkTimer = 420; // reinicia o timer para 7s
    }
    // Animação
    if (monster.frameDelay >= monster.maxFrameDelay) {
        monster.frameIndex = (monster.frameIndex + 1) % monster.frameCount;
        monster.frameDelay = 0;
    } else {
        monster.frameDelay++;
    }
    return;
}

            // Sempre voando no topo, só movimenta no eixo X seguindo o Ichigo
            let targetX = Math.max(0, Math.min(ichigo.x, canvas.width - monster.width));
            if (monster.x < targetX) {
                monster.x += monster.speed;
                monster.direction = "right";
            } else if (monster.x > targetX) {
                monster.x -= monster.speed;
                monster.direction = "left";
            }
            monster.x = Math.max(0, Math.min(monster.x, canvas.width - monster.width));
            monster.y = 60;

            // Poder de dragão: lança bolas de fogo
            monster.dragonPowerCooldown = (monster.dragonPowerCooldown || 0) - 1;
            if (monster.dragonPowerCooldown <= 0) {
                let dx = (ichigo.x + ichigo.width / 2) - (monster.x + monster.width / 2);
                let dy = (ichigo.y + ichigo.height / 2) - (monster.y + monster.height / 2);
                let dist = Math.sqrt(dx * dx + dy * dy);
                let speed = 12;
                bossPowers.push({
                    x: monster.x + monster.width / 2 - 20,
                    y: monster.y + monster.height / 2 - 20,
                    vx: (dx / dist) * speed,
                    vy: (dy / dist) * speed,
                    size: 40,
                    hit: false,
                    color: "#ff6600"
                });
                monster.dragonPowerCooldown = 70;
            }
            // Animação do dragão boss
            if (monster.frameDelay >= monster.maxFrameDelay) {
                monster.frameIndex = (monster.frameIndex + 1) % monster.frameCount;
                monster.frameDelay = 0;
            } else {
                monster.frameDelay++;
            }
            return;
        }
        // Dragão normal
        if (monster.isDragon) {
            let targetX = Math.max(0, Math.min(ichigo.x, canvas.width - monster.width));
            let targetY = Math.max(40, Math.min(ichigo.y + ichigo.jumpY - 100, canvas.height - MONSTER_DRAW_HEIGHT - 120));
            if (monster.x < targetX) {
                monster.x += monster.speed;
                monster.direction = "right";
            } else if (monster.x > targetX) {
                monster.x -= monster.speed;
                monster.direction = "left";
            }
            monster.x = Math.max(0, Math.min(monster.x, canvas.width - monster.width));
            if (monster.y < targetY) {
                monster.vy += 0.5;
            } else if (monster.y > targetY) {
                monster.vy -= 0.5;
            }
            monster.vy = Math.max(Math.min(monster.vy, 6), -6);
            monster.y += monster.vy;
            monster.y = Math.max(40, Math.min(monster.y, canvas.height - MONSTER_DRAW_HEIGHT - 120));
        } else if (monster.isBoss) {
            if (!bossDashing && !bossDashWarning) {
                if (monster.x + monster.width / 2 < ichigo.x + ichigo.width / 2) {
                    monster.x += monster.speed;
                    monster.direction = "right";
                } else if (monster.x + monster.width / 2 > ichigo.x + ichigo.width / 2) {
                    monster.x -= monster.speed;
                    monster.direction = "left";
                }
                monster.x = Math.max(0, Math.min(monster.x, canvas.width - monster.width));
            }
            if (!bossDashing && !bossDashWarning && Math.random() < 0.005) {
                bossDashWarning = true;
                bossDashWarningTimer = 60;
                bossDashDirection = (ichigo.x + ichigo.width / 2) < (monster.x + monster.width / 2) ? "left" : "right";
            }
            if (bossDashWarning) {
                bossDashWarningTimer--;
                if (bossDashWarningTimer <= 0) {
                    bossDashWarning = false;
                    bossDashing = true;
                    bossDashTimer = 30;
                }
            }
            if (bossDashing) {
                let dashSpeed = 32;
                if (bossDashDirection === "left") {
                    monster.x -= dashSpeed;
                } else {
                    monster.x += dashSpeed;
                }
                bossDashTimer--;
                if (bossDashTimer <= 0) {
                    bossDashing = false;
                }
            }
            monster.bossPowerCooldown = (monster.bossPowerCooldown || 0) - 1;
            if (monster.bossPowerCooldown <= 0) {
                let dx = (ichigo.x + ichigo.width / 2) - (monster.x + monster.width / 2);
                let dy = (ichigo.y + ichigo.height / 2) - (monster.y + monster.height / 2);
                let dist = Math.sqrt(dx * dx + dy * dy);
                let speed = 8;
                bossPowers.push({
                    x: monster.x + monster.width / 2 - 15,
                    y: monster.y + monster.height / 2 - 15,
                    vx: (dx / dist) * speed,
                    vy: (dy / dist) * speed,
                    size: 30,
                    hit: false
                });
                monster.bossPowerCooldown = 140;
            }
            monster.bossRainCooldown = (monster.bossRainCooldown || 0) - 1;
            if (monster.bossRainCooldown <= 0) {
                let quantidade = 8;
                let largura = canvas.width;
                let espacamento = largura / (quantidade + 1);
                for (let i = 0; i < quantidade / 2; i++) {
                    let posX = espacamento * (i + 1) + (Math.random() - 0.5) * 120;
                    bossRainPowers.push({
                        x: posX,
                        y: monster.y,
                        vx: 0,
                        vy: 0,
                        size: 18,
                        gravity: 0.13,
                        hit: false,
                        warning: true,
                        warningTimer: 110
                    });
                }
                setTimeout(() => {
                    for (let i = quantidade / 2; i < quantidade; i++) {
                        let posX = espacamento * (i + 1) + (Math.random() - 0.5) * 120;
                        bossRainPowers.push({
                            x: posX,
                            y: monster.y,
                            vx: 0,
                            vy: 0,
                            size: 18,
                            gravity: 0.13,
                            hit: false,
                            warning: true,
                            warningTimer: 110
                        });
                    }
                }, 1400);
                monster.bossRainCooldown = 230 + Math.floor(Math.random() * 120);
            }
            monster.y = canvas.height - monster.height - 80;
        } else {
            if (monster.x + monster.width / 2 < ichigo.x + ichigo.width / 2) {
                monster.x += monster.speed;
                monster.direction = "right";
            } else if (monster.x + monster.width / 2 > ichigo.x + ichigo.width / 2) {
                monster.x -= monster.speed;
                monster.direction = "left";
            }
        }
        if (monster.frameDelay >= monster.maxFrameDelay) {
            monster.frameIndex = (monster.frameIndex + 1) % monster.frameCount;
            monster.frameDelay = 0;
        } else {
            monster.frameDelay++;
        }
    });
}
function updateMovement() {
    if (leftPressed) {
        ichigo.x -= ichigo.speed;
        ichigo.direction = "left";
    }
    if (rightPressed) {
        ichigo.x += ichigo.speed;
        ichigo.direction = "right";
    }
    ichigo.x = Math.max(0, Math.min(canvas.width - ichigo.width, ichigo.x));
}

window.addEventListener("keydown", (event) => {
    switch (event.key.toLowerCase()) {
        case "a":
            leftPressed = true;
            ichigo.direction = "left";
            ichigo.isMoving = true;
            break;
        case "d":
            rightPressed = true;
            ichigo.direction = "right";
            ichigo.isMoving = true;
            break;
        case "w":
            wPressed = true;
            if (!ichigo.isJumping) {
                ichigo.isJumping = true;
                ichigo.jumpFrameIndex = 0;
                ichigo.jumpFrameDelay = 0;
                ichigo.jumpY = 0;
                ichigo.jumpVelocity = -32;
            }
            break;
                case "e":
            if (!ichigo.isAttacking && !special.active && !specialCooldown) {
                ichigo.isAttacking = true;
                ichigo.attackFrameIndex = 0;
                ichigo.hasHit = false;
                special.active = true;
                special.direction = ichigo.direction;
                special.frameIndex = 0;
                special.frameDelay = 0;
                // Corrigido: especial sai na altura do Ichigo (considerando pulo)
                special.y = ichigo.y + ichigo.jumpY;
                if (ichigo.direction === "right") {
                    special.x = ichigo.x + ichigo.width;
                } else {
                    special.x = ichigo.x - special.width;
                }
                specialCooldown = true;
                setTimeout(() => {
                    specialCooldown = false;
                }, specialCooldownTime);
            }
            break;
        case "q":
            const teleportDistance = 400;
            if (ichigo.direction === "right") {
                ichigo.x = Math.min(ichigo.x + teleportDistance, canvas.width - ichigo.width);
            } else {
                ichigo.x = Math.max(ichigo.x - teleportDistance, 0);
            }
            break;
        case "p":
            paused = !paused;
            if (!paused) {
                requestAnimationFrame(gameLoop);
            }
            break;
    }
});

window.addEventListener("keyup", (event) => {
    switch (event.key.toLowerCase()) {
        case "a":
            leftPressed = false;
            break;
        case "d":
            rightPressed = false;
            break;
        case "w":
            wPressed = false;
            break;
    }
    ichigo.isMoving = leftPressed || rightPressed;
});

canvas.addEventListener("mousedown", () => {
    monsters.forEach(monster => {
        if (monster.alive && isColliding(ichigo, monster)) {
            monster.life -= 1;
            if (monster.life <= 0) {
                monster.alive = false;
                monstersKilled++;
                if (!monster.cured) {
                    ichigo.life = Math.min(ichigo.life + 0.5, 10);
                    monster.cured = true;
                }
            }
        }
    });
    if (!ichigo.isAttacking) {
        ichigo.isAttacking = true;
        ichigo.attackFrameIndex = 0;
        ichigo.hasHit = false;
    }
});

let gameOverShown = false;
let gameOverTimer = 0;

let waitingNextWave = false;
function spawnBoss() {
    let limite = BG_REAL_WIDTH * bgScale > 0 ? BG_REAL_WIDTH * bgScale : canvas.width;
    monsters.push({
        x: limite / 2 - 150,
        y: canvas.height - 300,
        width: 300,
        height: 300,
        speed: 2,
        direction: "left",
        frameIndex: 0,
        frameCount: 6,
        frameDelay: 0,
        maxFrameDelay: 6,
        life: 30,
        alive: true,
        cured: false,
        isBoss: true,
        bossPowerCooldown: 0
    });
    bossSpawned = true;
}

function checkAndSpawnWave() {
    if (!waitingNextWave && monsters.filter(m => m.alive).length === 0) {
        waitingNextWave = true;
        setTimeout(() => {
            const dragoesMortos = monsters.filter(m => m.isDragon && !m.alive).length;
            if (!bossSpawned && dragoesMortos >= 4) {
                spawnBoss();
            } else if (!bossSpawned) {
                // Spawna 1 dragão + 2 monstros normais por wave até matar 4 dragões
                spawnMultipleMonsters(2);
            }
            waitingNextWave = false;
        }, 2000);
    }
}

function gameLoop() {
    if (paused) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "yellow";
        ctx.font = "bold 80px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);
        ctx.restore();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateBackground();
    drawBackground();
    drawIchigoLife();
    updateMovement();
    drawMonsters();
    drawBossPowers();
    drawBossRainPowers();
    drawIchigo();
    drawSpecial();
    updateMonsters();
    updateBossPowers();
    updateBossRainPowers();
    updateIchigo();
    updateSpecial();

    checkAndSpawnWave();

    if (victory && !victoryShown) {
        if (victoryTimer > 0) {
            victoryTimer--;
            requestAnimationFrame(gameLoop);
            return;
        } else {
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
            grad.addColorStop(0, "#fff700");
            grad.addColorStop(0.5, "#fff");
            grad.addColorStop(1, "#fff700");

            ctx.font = "bold 100px Arial";
            ctx.textAlign = "center";
            ctx.shadowColor = "#fff700";
            ctx.shadowBlur = 40;
            ctx.fillStyle = grad;
            ctx.fillText("VITÓRIA!", canvas.width / 2, canvas.height / 2);

            ctx.shadowBlur = 0;
            ctx.font = "bold 40px Arial";
            ctx.fillStyle = "#fff";
            ctx.fillText("Você derrotou o chefão!", canvas.width / 2, canvas.height / 2 + 80);

            ctx.font = "30px Arial";
            ctx.fillStyle = "#fff";
            ctx.fillText("Obrigado por jogar!", canvas.width / 2, canvas.height / 2 + 140);

            ctx.restore();
            victoryShown = true;
            return;
        }
    }

    if (ichigo.life <= 0 && !gameOver) {
        gameOver = true;
        gameOverTimer = 30;
    }

    if (gameOver && !gameOverShown) {
        if (gameOverTimer > 0) {
            gameOverTimer--;
            requestAnimationFrame(gameLoop);
            return;
        } else {
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.font = "bold 80px Arial";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
            ctx.restore();
            gameOverShown = true;
            return;
        }
    }

    if (!gameOver && !victory) {
        requestAnimationFrame(gameLoop);
    }
}

let imagesLoaded = 0;
let allImagesLoaded = false;
function checkLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 9) {
        allImagesLoaded = true;
    }
}
monsterImgRight.onload = checkLoaded;
monsterImgLeft.onload = checkLoaded;
ichigoImg.onload = checkLoaded;
attackImg.onload = checkLoaded;
specialImg.onload = checkLoaded;
paradoImg.onload = checkLoaded;
jumpImg.onload = checkLoaded;
jumpImgLeft.onload = checkLoaded;
dragonImg.onload = checkLoaded;

backgroundImg.onerror = () => console.error("Erro ao carregar a imagem de fundo.");
monsterImgRight.onerror = () => console.error("Erro ao carregar a imagem do monstro andando direita.");
monsterImgLeft.onerror = () => console.error("Erro ao carregar a imagem do monstro andando esquerda.");
ichigoImg.onerror = () => console.error("Erro ao carregar a imagem do personagem principal.");
attackImg.onerror = () => console.error("Erro ao carregar a imagem de ataque.");
specialImg.onerror = () => console.error("Erro ao carregar a imagem da habilidade especial.");
paradoImg.onerror = () => console.error("Erro ao carregar a imagem parado.png.");
jumpImg.onerror = () => console.error("Erro ao carregar a imagem do pulo.");
jumpImgLeft.onerror = () => console.error("Erro ao carregar a imagem do pulo para a esquerda (pula.png).");
dragonImg.onerror = () => console.error("Erro ao carregar a imagem do dragão.");

window.startGame = function() {
    if (allImagesLoaded) {
        gameLoop();
    } else {
        let interval = setInterval(() => {
            if (allImagesLoaded) {
                clearInterval(interval);
                gameLoop();
            }
        }, 100);
    }
};
// === FIM DO ARQUIVO ===

// ... (após as imagens serem carregadas e antes de qualquer função que use essas variáveis)

// Referências da tela de história
const telaHistoria = document.getElementById('telaHistoria');
const btnProximoFrame = document.getElementById('btnProximoFrame');
const btnIniciarJogo = document.getElementById('btnIniciarJogo');
const imagemHistoria = document.getElementById('imagemHistoria');
const framesHistoria = [
    './img/Frame 1.png',
    './img/Frame 2.png',
    './img/Frame 3.png',
    './img/Frame 4.png',
    './img/Frame 5.png',
];

let indiceFrame = 0;

// Mostra a tela de história e esconde o canvas
function mostrarTelaHistoria() {
    telaHistoria.style.display = 'flex';
    canvas.style.display = 'none';
    indiceFrame = 0;
    imagemHistoria.src = framesHistoria[indiceFrame];
    btnIniciarJogo.style.display = 'none';
    btnProximoFrame.style.display = 'inline-block';
}

// Avança para o próximo frame da história
btnProximoFrame.addEventListener('click', () => {
    indiceFrame++;
    if (indiceFrame < framesHistoria.length) {
        imagemHistoria.src = framesHistoria[indiceFrame];
        if (indiceFrame === framesHistoria.length - 1) {
            btnProximoFrame.style.display = 'none';
            btnIniciarJogo.style.display = 'inline-block';
        }
    }
});

// Inicia o jogo após a história
btnIniciarJogo.addEventListener('click', () => {
    telaHistoria.style.display = 'none';
    canvas.style.display = 'block';
    window.startGame(); // Chama o início do jogo normalmente
});
