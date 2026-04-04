// js/arena/SurvivorsArena.js (обновленная версия)


class SurvivorsArena {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.screenWidth = 800;
        this.screenHeight = 600;

        this.worldWidth = 2400;
        this.worldHeight = 1800;

        this.cameraX = 0;
        this.cameraY = 0;

        this.isRunning = false;
        this.isPaused = false;
        this.gameTime = 0;

        // Сущности
        this.hero = null;
        this.enemies = [];
        this.expGems = [];

        // НОВОЕ: Сундуки
        this.chests = [];

        // НОВОЕ: Менеджер волн
        this.waveManager = null;

        this.maxEnemies = 40;
        this.skillChoiceShown = false;

        // Управление
        this.keys = {};
        this.joystick = { active: false, dirX: 0, dirY: 0 };

        this.decorations = [];
        this.lastTimestamp = 0;
        this.firstFrame = true;

        window.currentArena = this;

        this.generateDecorations();
        this.initControls();
        this.initResizeHandler();
        this.initOrientationHandler();
        this.initMutationObserver();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        if (containerWidth > 0 && containerHeight > 0) {
            this.screenWidth = containerWidth;
            this.screenHeight = containerHeight;
            this.canvas.width = containerWidth;
            this.canvas.height = containerHeight;

            if (this.hero) {
                this.updateCamera();
            }
        }
    }

    initResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.isRunning) {
                    this.resizeCanvas();
                }
            }, 100);
        });
    }

    initOrientationHandler() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.isRunning) {
                    this.resizeCanvas();
                }
            }, 200);
        });
    }

    initMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const screenArena = document.getElementById('screenArena');
                    if (screenArena && screenArena.classList.contains('active') && this.isRunning) {
                        setTimeout(() => {
                            this.resizeCanvas();
                        }, 50);
                    }
                }
            });
        });

        const screenArena = document.getElementById('screenArena');
        if (screenArena) {
            observer.observe(screenArena, { attributes: true });
        }
    }

    generateDecorations() {
        this.decorations = [];
        for (let i = 0; i < 100; i++) {
            this.decorations.push({
                x: Math.random() * this.worldWidth,
                y: Math.random() * this.worldHeight,
                type: Math.floor(Math.random() * 3),
                size: 20 + Math.random() * 30
            });
        }
    }

    updateCamera() {
        if (!this.hero) return;

        this.cameraX = this.hero.worldX - this.screenWidth / 2;
        this.cameraY = this.hero.worldY - this.screenHeight / 2;

        this.cameraX = Math.max(0, Math.min(this.worldWidth - this.screenWidth, this.cameraX));
        this.cameraY = Math.max(0, Math.min(this.worldHeight - this.screenHeight, this.cameraY));
    }

    // В js/arena/SurvivorsArena.js обновляем метод init

    init(heroData, location = 'forest') {
        console.log('Инициализация арены с героем:', heroData);

        // Сохраняем локацию для фона
        this.currentLocation = location;

        this.resizeCanvas();

        setTimeout(() => {
            if (this.isRunning) {
                this.resizeCanvas();
            }
        }, 50);

        // Размещаем героя в центре мира
        this.hero = new ArenaHero(this.worldWidth / 2, this.worldHeight / 2, heroData);
        this.enemies = [];
        this.expGems = [];
        this.chests = [];

        this.gameTime = 0;
        this.skillChoiceShown = false;
        this.firstFrame = true;

        // Создаем менеджер волн
        this.waveManager = new WaveManager(this);

        if (!this.hero.heroData.learnedSkills) {
            this.hero.heroData.learnedSkills = [];
        }

        this.updateCamera();

        // Спавним первый сундук
        this.spawnChest();

        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            pauseMenu.style.display = 'none';
        }
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.lastTimestamp = performance.now();
        this.firstFrame = true;

        this.resizeCanvas();

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastTimestamp = performance.now();
        this.skillChoiceShown = false;
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    stop() {
        this.isRunning = false;
        window.currentArena = null;
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
        this.lastTimestamp = timestamp;

        if (this.firstFrame && this.hero) {
            this.updateCamera();
            this.firstFrame = false;
        }

        if (!this.isPaused && this.hero) {
            this.update(deltaTime);
        }

        this.draw();

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update(deltaTime) {
      this.gameTime += deltaTime;

      this.updateUI();

      // НОВОЕ: Обновляем менеджер волн
      if (this.waveManager) {
        this.waveManager.update(deltaTime);
      }

      if (!this.skillChoiceShown && this.hero && this.hero.heroData) {
        this.checkSkillChoice();
      }

      if (this.isPaused) return;

      this.handleHeroMovement(deltaTime);
      this.hero.update(deltaTime, this.worldWidth, this.worldHeight);

      // НОВОЕ: Регенерация героя
      //this.hero.regen(deltaTime);

      this.updateCamera();

      if (this.hero.hp <= 0) {
        this.gameOver();
        return;
      }

      // НОВОЕ: Спавн врагов через менеджер волн
      if (this.waveManager && this.waveManager.canSpawnEnemy()) {
        this.spawnEnemy();
      }

      // Обновляем врагов
      this.enemies = this.enemies.filter((enemy) => {
        enemy.update(deltaTime, this.hero, this.worldWidth, this.worldHeight);
        this.checkWeaponHits(enemy);
        return enemy.hp > 0;
      });

      // Обновляем кристаллы опыта
      this.expGems = this.expGems.filter((gem) => {
        if (!gem) return false;
        gem.update(deltaTime, this.worldWidth, this.worldHeight);

        if (this.hero) {
          const distance = Math.hypot(
            gem.worldX - this.hero.worldX,
            gem.worldY - this.hero.worldY,
          );
          if (distance < this.hero.radius + gem.radius + this.hero.expMagnet) {
            this.hero.addExp(gem.value);
            return false;
          }
        }
        return true;
      });

      // НОВОЕ: Обновляем сундуки
      this.chests = this.chests.filter((chest) => {
        chest.update(deltaTime, this.hero);
        return !chest.isOpen; // Удаляем открытые сундуки
      });

      // НОВОЕ: Спавним новый сундук с некоторым шансом
      if (this.waveManager && Math.random() < 0.001 * deltaTime * 60) {
        // ~0.1% шанс в секунду
        if (this.chests.length < 3) {
          // Не больше 3 сундуков одновременно
          this.spawnChest();
        }
      }
    }

    checkWeaponHits(enemy) {
        if (!this.hero || !this.hero.weapons) return;

        this.hero.weapons.forEach(weapon => {
            if (weapon && weapon.projectiles) {
                weapon.projectiles.forEach(projectile => {
                    if (projectile && projectile.isActive) {
                        if (weapon.data && weapon.data.type === 'ranged') {
                            const distance = Math.hypot(
                                projectile.worldX - enemy.worldX,
                                projectile.worldY - enemy.worldY
                            );
                            if (distance < enemy.radius + 5) {
                                enemy.takeDamage(projectile.damage);
                                projectile.isActive = false;

                                if (enemy.hp <= 0) {
                                    this.spawnExpGem(enemy.worldX, enemy.worldY, enemy.expValue);
                                }
                            }
                        } else if (projectile.hitEnemies && !projectile.hitEnemies.has(enemy)) {
                            if (this.checkMeleeHit(this.hero, enemy, (projectile.data && projectile.data.range) || 60)) {
                                enemy.takeDamage((projectile.data && projectile.data.damage) || 5);
                                projectile.hitEnemies.add(enemy);

                                if (enemy.hp <= 0) {
                                    this.spawnExpGem(enemy.worldX, enemy.worldY, enemy.expValue);
                                }
                            }
                        }
                    }
                });
            }
        });
    }

    checkMeleeHit(hero, enemy, range) {
        if (!hero || !enemy) return false;
        const distance = Math.hypot(hero.worldX - enemy.worldX, hero.worldY - enemy.worldY);
        return distance < hero.radius + enemy.radius + range;
    }

    handleHeroMovement(deltaTime) {
        let moveX = 0, moveY = 0;

        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) moveY -= 1;
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) moveY += 1;
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) moveX -= 1;
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) moveX += 1;

        if (this.joystick.active) {
            moveX = this.joystick.dirX;
            moveY = this.joystick.dirY;
        }

        if (moveX !== 0 || moveY !== 0 && this.hero) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            this.hero.vx = (moveX / length) * 0.5;
            this.hero.vy = (moveY / length) * 0.5;
        } else if (this.hero) {
            this.hero.vx = 0;
            this.hero.vy = 0;
        }
    }

    spawnEnemy() {
    let x, y;
    const viewMargin = 300;
    const minDistanceFromHero = 300; // 🔹 Минимальная дистанция от героя

    do {
        x = Math.random() * this.worldWidth;
        y = Math.random() * this.worldHeight;
    } while (
        // 🔹 Проверка: не слишком ли близко к герою?
        (this.hero && Math.hypot(x - this.hero.worldX, y - this.hero.worldY) < minDistanceFromHero) ||
        // Проверка: не в зоне видимости камеры?
        (
            x > this.cameraX - viewMargin &&
            x < this.cameraX + this.screenWidth + viewMargin &&
            y > this.cameraY - viewMargin &&
            y < this.cameraY + this.screenHeight + viewMargin
        )
    );

    // Получаем доступных врагов из менеджера волн
    const availableEnemies = this.waveManager ?
        this.waveManager.getAvailableEnemies() :
        ['goblin', 'skeleton'];

    const enemyType = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
    const difficulty = this.waveManager ? this.waveManager.getDifficultyMultiplier() : 1;

    const enemy = new ArenaEnemy(x, y, difficulty, enemyType);
    this.enemies.push(enemy);

    if (this.waveManager) {
        this.waveManager.onEnemySpawned();
    }
}

    // НОВЫЙ МЕТОД: Спавн сундука
    spawnChest() {
        let x, y;
        const viewMargin = 300;

        // Спавним в отдалении от героя
        do {
            x = Math.random() * this.worldWidth;
            y = Math.random() * this.worldHeight;
        } while (
            Math.hypot(x - this.hero.worldX, y - this.hero.worldY) < 300 ||
            (x > this.cameraX - viewMargin &&
                x < this.cameraX + this.screenWidth + viewMargin &&
                y > this.cameraY - viewMargin &&
                y < this.cameraY + this.screenHeight + viewMargin)
        );

        const chest = new Chest(x, y);
        this.chests.push(chest);
    }

    spawnExpGem(x, y, value) {
        this.expGems.push(new ExpGem(x, y, value));
    }

    updateUI() {
        if (!this.hero) return;

        const hpPercent = (this.hero.hp / this.hero.maxHp) * 100;
        const expPercent = ((this.hero.exp % 100) / 100) * 100;

        const hpBar = document.getElementById('arenaHpBar');
        const hpText = document.getElementById('arenaHpText');
        const expBar = document.getElementById('arenaExpBar');
        const expText = document.getElementById('arenaExpText');
        const timer = document.getElementById('arenaTimer');

        // НОВОЕ: Отображение волны
        const waveDisplay = document.getElementById('arenaWave');

        if (hpBar) hpBar.style.width = `${hpPercent}%`;
        if (hpText) hpText.textContent = `${Math.floor(this.hero.hp)}/${this.hero.maxHp}`;

        if (expBar) expBar.style.width = `${expPercent}%`;
        if (expText) expText.textContent = `Ур. ${this.hero.level} (${this.hero.exp % 100}/100)`;

        if (waveDisplay && this.waveManager) {
            waveDisplay.textContent = `🌊 Волна ${this.waveManager.currentWave}`;
        }

        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        if (timer) timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        this.updateSkillSlots();
    }

    updateSkillSlots() {
        const skillSlots = document.querySelectorAll('.skill-slot');
        if (!skillSlots.length || !this.hero || !this.hero.heroData) return;

        const learnedSkills = this.hero.heroData.learnedSkills || [];

        skillSlots.forEach(slot => {
            slot.innerHTML = '';
            slot.classList.remove('active');
        });

        learnedSkills.forEach((skill, index) => {
            if (index < skillSlots.length) {
                skillSlots[index].innerHTML = skill.icon;
                skillSlots[index].classList.add('active');
                skillSlots[index].title = skill.name;
            }
        });
    }

    draw() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.screenWidth, this.screenHeight);

        this.drawBackground();
        this.drawDecorations();

        // НОВОЕ: Рисуем сундуки
        if (this.chests) {
            this.chests.forEach(chest => {
                if (chest) chest.draw(this.ctx, this.cameraX, this.cameraY);
            });
        }

        if (this.expGems) {
            this.expGems.forEach(gem => {
                if (gem) gem.draw(this.ctx, this.cameraX, this.cameraY);
            });
        }

        if (this.enemies) {
            this.enemies.forEach(enemy => {
                if (enemy) enemy.draw(this.ctx, this.cameraX, this.cameraY);
            });
        }

        if (this.hero) {
            this.hero.draw(this.ctx, this.cameraX, this.cameraY);
        }
    }

    drawBackground() {
        // НОВОЕ: Фон зависит от локации
        let gradient;
        if (this.currentLocation === 'desert') {
            gradient = this.ctx.createLinearGradient(0, 0, 0, this.screenHeight);
            gradient.addColorStop(0, '#8B7355');
            gradient.addColorStop(1, '#5D4A36');
        } else if (this.currentLocation === 'factory') {
            gradient = this.ctx.createLinearGradient(0, 0, 0, this.screenHeight);
            gradient.addColorStop(0, '#4a4a4a');
            gradient.addColorStop(1, '#2a2a2a');
        } else {
            gradient = this.ctx.createLinearGradient(0, 0, 0, this.screenHeight);
            gradient.addColorStop(0, '#1a4a1a');
            gradient.addColorStop(1, '#2a5a2a');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    }

    drawDecorations() {
        if (!this.decorations) return;

        this.decorations.forEach(dec => {
            const screenX = dec.x - this.cameraX;
            const screenY = dec.y - this.cameraY;

            if (screenX + dec.size < 0 || screenX - dec.size > this.screenWidth ||
                screenY + dec.size < 0 || screenY - dec.size > this.screenHeight) {
                return;
            }

            if (dec.type === 0) { // Дерево
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(screenX - 5, screenY - dec.size / 2, 10, dec.size);
                this.ctx.fillStyle = '#0a8a0a';
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY - dec.size / 2 - 10, dec.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (dec.type === 1) { // Камень
                this.ctx.fillStyle = '#888';
                this.ctx.beginPath();
                this.ctx.ellipse(screenX, screenY, dec.size / 2, dec.size / 3, 0, 0, Math.PI * 2);
                this.ctx.fill();
            } else { // Куст
                this.ctx.fillStyle = '#2a8a2a';
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, dec.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    togglePause() {
        const pauseMenu = document.getElementById('pauseMenu');
        if (!pauseMenu) return;

        if (this.isPaused) {
            this.resume();
            pauseMenu.style.display = 'none';
        } else {
            this.pause();
            pauseMenu.style.display = 'block';
        }
    }

    gameOver() {
        this.isRunning = false;

        if (window.ui) {
            window.ui.showBattleResults(this);
        }

        setTimeout(() => {
            this.exitArena();
        }, 3000);
    }

    exitArena() {
        this.stop();

        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screenLobby').classList.add('active');
        document.querySelector('.game-nav').style.display = 'flex';

        const gameHeader = document.querySelector('.game-header');
        if (gameHeader) {
            gameHeader.style.display = 'flex';
            gameHeader.style.visibility = 'visible';
        }

        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            pauseMenu.style.display = 'none';
        }

        if (this.hero && this.hero.heroData) {
            this.hero.heroData.currentStats.hp = this.hero.hp;
            this.hero.heroData.level = this.hero.level;
            this.hero.heroData.exp = this.hero.exp;
            window.GameState.notify();
        }

        window.currentArena = null;
    }

    initControls() {
        window.addEventListener('keydown', (e) => {
            if (e.key.startsWith('Arrow') || ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
                e.preventDefault();
                this.keys[e.key] = true;
            }

            if (e.key === 'Escape' && this.isRunning) {
                this.togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key.startsWith('Arrow') || ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
                e.preventDefault();
                this.keys[e.key] = false;
            }
        });

        const joystickBase = document.querySelector('.joystick-base');
        const joystickThumb = document.getElementById('joystickThumb');

        if (joystickBase && joystickThumb) {
            let joystickActive = false;

            const touchStartHandler = (e) => {
                e.preventDefault();
                joystickActive = true;
                this.joystick.active = true;
            };

            const touchMoveHandler = (e) => {
                e.preventDefault();
                if (!joystickActive) return;

                const touch = e.touches[0];
                const rect = joystickBase.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                let dx = touch.clientX - centerX;
                let dy = touch.clientY - centerY;

                const maxRadius = rect.width / 2;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > maxRadius) {
                    dx = (dx / distance) * maxRadius;
                    dy = (dy / distance) * maxRadius;
                }

                joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;

                this.joystick.dirX = (dx / maxRadius) * 0.5;
                this.joystick.dirY = (dy / maxRadius) * 0.5;
            };

            const touchEndHandler = (e) => {
                e.preventDefault();
                joystickActive = false;
                this.joystick.active = false;
                joystickThumb.style.transform = 'translate(0, 0)';
            };

            joystickBase.addEventListener('touchstart', touchStartHandler, { passive: false });
            joystickBase.addEventListener('touchmove', touchMoveHandler, { passive: false });
            joystickBase.addEventListener('touchend', touchEndHandler, { passive: false });
            joystickBase.addEventListener('touchcancel', touchEndHandler, { passive: false });
        }
    }

    checkSkillChoice() {
        if (!this.hero || !this.hero.heroData || this.skillChoiceShown) {
            return;
        }

        const hasPending = this.hero.heroData.pendingSkillLevel > 0;

        if (hasPending) {
            this.skillChoiceShown = true;
            this.pause();

            const skills = window.GameState.skillManager.getRandomSkillsForHero(
                this.hero.heroData,
                this.hero.heroData.pendingSkillLevel
            );

            setTimeout(() => {
                if (window.ui) {
                    window.ui.showSkillChoice(this.hero.heroData, skills);
                } else {
                    this.skillChoiceShown = false;
                    this.hero.heroData.pendingSkillLevel = 0;
                    this.resume();
                }
            }, 500);
        }
    }

    // НОВЫЙ МЕТОД: Показать сообщение на экране
    showMessage(text) {
        if (window.ui) {
            window.ui.showNotification(text, 'info');
        }
    }
}

window.SurvivorsArena = SurvivorsArena;
