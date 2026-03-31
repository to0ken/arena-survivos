// Базовый класс для всех сущностей на арене
class ArenaEntity {
    constructor(worldX, worldY, radius, color = '#ffffff') {
        this.worldX = worldX;          // Координаты в мире
        this.worldY = worldY;
        this.radius = radius || 20;     // Радиус для коллизий
        this.vx = 0;                    // Скорость по X
        this.vy = 0;                    // Скорость по Y
        this.speed = 0;                  // Базовая скорость
        this.color = color;
        this.isActive = true;

        // Для анимации
        this.animationTimer = 0;
        this.animationFrame = 0;
        this.hitEffect = 0;              // Эффект получения урона (0-1)
        this.bobOffset = 0;               // Смещение для подпрыгивания
        this.bobSpeed = 8;                 // Скорость подпрыгивания

        // Спрайт менеджер
        this.spriteManager = window.spriteManager;
    }

    // Получить X на экране с учётом камеры
    getScreenX(cameraX) {
        return this.worldX - cameraX;
    }

    // Получить Y на экране с учётом камеры
    getScreenY(cameraY) {
        return this.worldY - cameraY;
    }

    // Обновление позиции и анимации
    update(deltaTime, worldWidth, worldHeight) {
        // Двигаем сущность
        this.worldX += this.vx * this.speed * deltaTime * 60;
        this.worldY += this.vy * this.speed * deltaTime * 60;

        // Не даём выйти за границы мира
        this.worldX = Math.max(this.radius, Math.min(worldWidth - this.radius, this.worldX));
        this.worldY = Math.max(this.radius, Math.min(worldHeight - this.radius, this.worldY));

        // Анимация подпрыгивания при движении
        if (this.vx !== 0 || this.vy !== 0) {
            this.animationTimer += deltaTime * this.bobSpeed;
            this.bobOffset = Math.sin(this.animationTimer) * 3; // Подпрыгивание на 3 пикселя
        } else {
            this.bobOffset = 0;
        }

        // Уменьшаем эффект получения урона
        if (this.hitEffect > 0) {
            this.hitEffect -= deltaTime;
        }
    }

    draw(ctx, cameraX, cameraY) {
        // Будет переопределено в наследниках
    }
}


// В js/arena/GameEntity.js обновляем класс ArenaHero

class ArenaHero extends ArenaEntity {
    constructor(worldX, worldY, heroData) {
        super(worldX, worldY, 24, '#4aff4a');

        this.heroData = heroData;

        // ИСПРАВЛЕНИЕ: Используем правильные поля из heroData
        this.hp = heroData.currentStats.hp;
        this.maxHp = heroData.maxHp || heroData.rawStats.hp;
        this.level = heroData.level;
        this.exp = heroData.exp;
        this.speed = heroData.rawStats.speed || 5;

        this.attack = heroData.rawStats.attack || 10;
        this.defense = heroData.rawStats.defense || 5;

        this.expMagnet = 150;
        this.weapons = [];
        this.skillEffects = [];

        // Тип героя
        this.heroType = heroData.type;

        // Ключ спрайта для героя
        this.spriteKey = this.heroType;

        // Загружаем оружие
        this.loadWeapons();

        // Для анимации
        this.animationFrame = 0;
        this.lastAttackTime = 0;
        this.bobSpeed = 10;

        // Специальные способности
        this.traps = [];
        this.trapCooldown = 0;
        this.trapInterval = 5;

        // Для мага
        this.magicBeam = null;
        this.magicCooldown = 0;
        this.magicInterval = 8;

        // Расходники в бою
        this.battleConsumables = [];
        this.loadConsumables();

        // Убеждаемся что у heroData есть массив для навыков
        if (!this.heroData.learnedSkills) {
            this.heroData.learnedSkills = [];
        }
    }

    loadWeapons() {
        // Проверяем наличие оружия в экипировке
        if (this.heroData.equipment) {
            // Ищем оружие в слотах
            const weaponSlot = this.heroData.equipment.weapon1 || this.heroData.equipment.weapon;
            if (weaponSlot) {
                this.weapons.push(new ArenaWeapon(this, weaponSlot, this.heroType));
                return;
            }
        }

        // Если оружия нет, используем стартовое из конфига
        const classConfig = window.HeroClassConfig[this.heroType];
        if (classConfig && classConfig.startingWeapon) {
            this.weapons.push(new ArenaWeapon(this, classConfig.startingWeapon, this.heroType));
        } else {
            // Базовое оружие по умолчанию
            this.weapons.push(new ArenaWeapon(this, {
                name: 'Кулаки',
                damage: 5,
                range: 60,
                cooldown: 1.0,
                type: 'melee',
                icon: '👊'
            }, this.heroType));
        }
    }

    loadConsumables() {
        // Загружаем расходники из рюкзака (первые 3)
        const backpack = window.GameState.backpack || [];
        const consumables = backpack.filter(item => item && item.type === 'consumable');
        this.battleConsumables = consumables.slice(0, 3).map(item => ({ ...item }));
    }

    takeDamage(amount) {
        // Используем метод calculateDamage героя для учета защиты, критов и блоков
        const reducedDamage = this.heroData.calculateDamage(amount);
        this.hp -= reducedDamage;
        this.hitEffect = 0.2;

        if (this.hp < 0) this.hp = 0;
        return this.hp <= 0;
    }

    update(deltaTime, worldWidth, worldHeight) {
        super.update(deltaTime, worldWidth, worldHeight);

        // Обновляем оружие
        this.weapons.forEach(w => w.update(deltaTime));

        // Обновляем специальные способности
        if (this.heroType === 'rogue') {
            this.updateTraps(deltaTime);
        } else if (this.heroType === 'mage') {
            this.updateMagic(deltaTime);
        }

        // Анимация
        this.animationFrame += deltaTime * 10;
    }

    updateTraps(deltaTime) {
        if (this.trapCooldown > 0) {
            this.trapCooldown -= deltaTime;
        }

        if (this.trapCooldown <= 0) {
            this.traps.push(new ArenaTrap(this.worldX, this.worldY));
            this.trapCooldown = this.trapInterval;
        }

        this.traps = this.traps.filter(trap => trap.isActive);
        this.traps.forEach(trap => trap.update(deltaTime));
    }

    updateMagic(deltaTime) {
        if (this.magicCooldown > 0) {
            this.magicCooldown -= deltaTime;
        }

        if (this.magicCooldown <= 0 && !this.magicBeam) {
            if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
                this.magicBeam = new MagicBeam(this);
                this.magicCooldown = 5.0;
            }
        }

        if (this.magicBeam) {
            this.magicBeam.update(deltaTime);
            if (!this.magicBeam.isActive) {
                this.magicBeam = null;
            }
        }
    }

    useConsumable(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.battleConsumables.length) return false;

        const item = this.battleConsumables[slotIndex];
        if (!item) return false;

        if (item.effect === 'heal') {
            this.hp = Math.min(this.hp + item.value, this.maxHp);
            this.battleConsumables.splice(slotIndex, 1);
            return true;
        } else if (item.effect === 'buff') {
            this.attack += item.value;
            setTimeout(() => {
                this.attack -= item.value;
            }, 10000);
            this.battleConsumables.splice(slotIndex, 1);
            return true;
        }

        return false;
    }

    addExp(amount) {
        this.exp += amount;

        // Передаем опыт в heroData
        if (this.heroData) {
            const leveledUp = this.heroData.addExp(amount);
            if (leveledUp) {
                this.level = this.heroData.level;
                this.maxHp = this.heroData.maxHp;
                this.attack = this.heroData.rawStats.attack;
            }
        }
    }

    levelUp() {
        this.level++;
        this.exp -= 100;

        this.maxHp += 10;
        this.hp = this.maxHp;
        this.attack += 2;

        if (this.heroData) {
            this.heroData.levelUp();
        }

        console.log(`Герой повысил уровень до ${this.level}!`);
    }

    draw(ctx, cameraX, cameraY) {
        const screenX = this.getScreenX(cameraX);
        const screenY = this.getScreenY(cameraY) + this.bobOffset;

        if (screenX + this.radius < 0 || screenX - this.radius > ctx.canvas.width ||
            screenY + this.radius < 0 || screenY - this.radius > ctx.canvas.height) {
            return;
        }

        ctx.save();

        // Эффект получения урона
        if (this.hitEffect > 0) {
            ctx.globalAlpha = 0.7;
            ctx.filter = 'brightness(1.5)';
        }

        // Получаем спрайт героя
        let sprite = this.spriteManager ? this.spriteManager.getSprite(this.spriteKey) : null;

        if (sprite) {
            // Небольшой наклон при движении для эффекта бега
            if (this.vx !== 0 || this.vy !== 0) {
                ctx.translate(screenX, screenY);
                ctx.rotate(Math.sin(this.animationTimer * 2) * 0.03);
                ctx.translate(-screenX, -screenY);
            }

            ctx.drawImage(sprite, screenX - 24, screenY - 24, 48, 48);
        } else {
            // Fallback - цветной круг
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Иконка класса
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let icon = '⚔️';
            if (this.heroType === 'archer') icon = '🏹';
            if (this.heroType === 'mage') icon = '🔮';
            if (this.heroType === 'rogue') icon = '🗡️';

            ctx.fillText(icon, screenX, screenY);
        }

        ctx.restore();

        // Полоска здоровья
        const hpPercent = this.hp / this.maxHp;
        const barWidth = 40;
        const barHeight = 4;

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX - barWidth / 2, screenY - this.radius - 8, barWidth, barHeight);

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX - barWidth / 2, screenY - this.radius - 8, barWidth * hpPercent, barHeight);

        // Уровень
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`Lv.${this.level}`, screenX - 15, screenY - this.radius - 12);

        // Имя героя
        ctx.font = '10px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(this.heroData.name, screenX, screenY - 35);

        // Рисуем расходники
        if (this.battleConsumables.length > 0) {
            ctx.font = '10px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            for (let i = 0; i < this.battleConsumables.length; i++) {
                const item = this.battleConsumables[i];
                if (item) {
                    ctx.fillText(item.icon, screenX - 30 + i * 20, screenY - 45);
                }
            }
        }

        // Рисуем оружие
        this.weapons.forEach(w => w.draw(ctx, cameraX, cameraY));

        // Рисуем ловушки для разбойника
        if (this.heroType === 'rogue') {
            this.traps.forEach(trap => trap.draw(ctx, cameraX, cameraY));
        }

        // Рисуем магию для мага
        if (this.heroType === 'mage' && this.magicBeam) {
            this.magicBeam.draw(ctx, cameraX, cameraY);
        }
    }
}



// В js/arena/GameEntity.js обновляем класс ArenaEnemy

class ArenaEnemy extends ArenaEntity {
    constructor(worldX, worldY, difficulty, enemyType = null) {
        super(worldX, worldY, 20);

        this.difficulty = difficulty;

        // Получаем конфигурацию врага
        let config;
        if (enemyType && window.EnemyTypeConfig[enemyType]) {
            config = window.EnemyTypeConfig[enemyType];
        } else {
            // Случайный враг
            const enemyTypes = Object.keys(window.EnemyTypeConfig);
            const typeKey = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            config = window.EnemyTypeConfig[typeKey];
            enemyType = typeKey;
        }

        this.type = enemyType;
        this.config = config;

        // Характеристики из конфига
        this.hp = config.baseHp * difficulty;
        this.maxHp = this.hp;
        this.attack = config.baseAttack * difficulty;
        this.speed = config.speed;
        this.expValue = config.expValue;
        this.color = config.color;
        this.bobSpeed = config.bobSpeed || 8;
        this.attackInterval = config.attackInterval || 1.0;
        this.radius = config.radius || 20;

        this.spriteKey = config.spriteKey;

        // НОВОЕ: Тип атаки (ближний/дальний)
        this.attackType = config.attackType || 'melee';
        this.range = config.range || 50;
        this.projectileSpeed = config.projectileSpeed || 300;

        // НОВОЕ: Эффекты врага
        this.effects = config.effects || [];
        this.slowAmount = config.slowAmount || 0.5;
        this.slowDuration = config.slowDuration || 2;

        // Для лучников и магов
        this.projectiles = [];
        this.attackCooldown = 0;

        // Особые эффекты
        this.slowed = false;
        this.slowTimer = 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hitEffect = 0.15;

        if (this.hp <= 0) return true;
        return false;
    }

    slowDown() {
        if (!this.slowed) {
            this.slowed = true;
            this.speed /= 2;
            this.slowTimer = this.slowDuration;
            this.bobSpeed /= 2;
        }
    }

    update(deltaTime, hero, worldWidth, worldHeight) {
        super.update(deltaTime, worldWidth, worldHeight);

        if (this.slowed) {
            this.slowTimer -= deltaTime;
            if (this.slowTimer <= 0) {
                this.slowed = false;
                this.speed *= 2;
                this.bobSpeed *= 2;
            }
        }

        if (!hero) return;

        // Двигаемся к герою
        const dx = hero.worldX - this.worldX;
        const dy = hero.worldY - this.worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // НОВОЕ: Для дальних врагов - держим дистанцию
        if (this.attackType === 'ranged' && distance < this.range * 0.7) {
            // Слишком близко - отступаем
            this.vx = -dx / distance;
            this.vy = -dy / distance;
        } else if (distance > 10) {
            this.vx = dx / distance;
            this.vy = dy / distance;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        // Атака
        this.attackCooldown -= deltaTime;

        if (this.attackCooldown <= 0) {
            if (this.attackType === 'ranged' || this.attackType === 'magic') {
                // Дальняя атака
                if (distance < this.range) {
                    this.fireProjectile(hero);
                    this.attackCooldown = this.attackInterval;
                }
            } else {
                // Ближняя атака
                if (distance < this.radius + hero.radius + 10) {
                    hero.takeDamage(this.attack);
                    this.attackCooldown = this.attackInterval;
                }
            }
        }

        // Обновляем снаряды
        this.projectiles = this.projectiles.filter(p => p.isActive);
        this.projectiles.forEach(p => p.update(deltaTime, hero));
    }

    // НОВЫЙ МЕТОД: Выстрел снарядом
    fireProjectile(hero) {
        this.projectiles.push(new EnemyProjectile(this, hero, this.attack, this.attackType));
    }

    draw(ctx, cameraX, cameraY) {
        const screenX = this.getScreenX(cameraX);
        const screenY = this.getScreenY(cameraY) + this.bobOffset;

        if (screenX + this.radius < 0 || screenX - this.radius > ctx.canvas.width ||
            screenY + this.radius < 0 || screenY - this.radius > ctx.canvas.height) {
            return;
        }

        ctx.save();

        if (this.hitEffect > 0) {
            ctx.globalAlpha = 0.8;
            ctx.filter = 'brightness(1.8) sepia(1)';
        }

        let sprite = this.spriteManager ? this.spriteManager.getSprite(this.spriteKey) : null;

        if (sprite) {
            if (this.vx !== 0 || this.vy !== 0) {
                ctx.translate(screenX, screenY);
                ctx.rotate(Math.sin(this.animationTimer * 2) * 0.03);
                ctx.translate(-screenX, -screenY);
            }

            ctx.drawImage(sprite, screenX - 20, screenY - 20, 40, 40);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Иконка типа врага
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let icon = '👾';
            if (this.attackType === 'ranged') icon = '🏹';
            if (this.attackType === 'magic') icon = '🔮';
            if (this.type === 'boss') icon = '👑';

            ctx.fillText(icon, screenX, screenY);
        }

        ctx.restore();

        // Рисуем снаряды
        this.projectiles.forEach(p => p.draw(ctx, cameraX, cameraY));

        const hpPercent = this.hp / this.maxHp;
        const barWidth = 30;
        const barHeight = 3;

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX - barWidth / 2, screenY - this.radius - 5, barWidth, barHeight);

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX - barWidth / 2, screenY - this.radius - 5, barWidth * hpPercent, barHeight);

        if (this.slowed) {
            ctx.fillStyle = '#00aaff';
            ctx.beginPath();
            ctx.arc(screenX - 15, screenY - 15, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// НОВЫЙ КЛАСС: Снаряд врага
class EnemyProjectile {
    constructor(enemy, target, damage, type) {
        this.worldX = enemy.worldX;
        this.worldY = enemy.worldY;
        this.target = target;
        this.damage = damage;
        this.type = type;
        this.speed = enemy.projectileSpeed || 200;
        this.radius = 5;
        this.isActive = true;

        const dx = target.worldX - this.worldX;
        const dy = target.worldY - this.worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;

        // Цвет в зависимости от типа
        this.color = type === 'magic' ? '#aa4aff' : '#ffaa00';
    }

    update(deltaTime, hero) {
        this.worldX += this.vx * deltaTime;
        this.worldY += this.vy * deltaTime;

        // Проверка попадания
        const distance = Math.hypot(this.worldX - hero.worldX, this.worldY - hero.worldY);
        if (distance < hero.radius + this.radius) {
            hero.takeDamage(this.damage);

            // Применяем эффекты (для магов)
            if (this.type === 'magic' && hero.slowDown) {
                hero.slowDown();
            }

            this.isActive = false;
        }

        // Проверка выхода за границы мира
        if (this.worldX < 0 || this.worldX > 2000 || this.worldY < 0 || this.worldY > 2000) {
            this.isActive = false;
        }
    }

    draw(ctx, cameraX, cameraY) {
        const screenX = this.worldX - cameraX;
        const screenY = this.worldY - cameraY;

        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}




class ArenaWeapon {
    constructor(owner, weaponData) {
        this.owner = owner;
        this.data = weaponData;
        this.cooldown = 0;
        this.projectiles = [];
    }

    update(deltaTime) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }

        if (this.cooldown <= 0) {
            this.attack();
            this.cooldown = this.data.cooldown || 1.0;
        }

        this.projectiles = this.projectiles.filter(p => p.isActive);
        this.projectiles.forEach(p => p.update(deltaTime));
    }

    attack() {
        if (this.data.type === 'melee' || !this.data.type) {
            this.projectiles.push(new MeleeProjectile(this.owner, this.data));
        } else {
            const arena = window.currentArena;
            if (arena && arena.enemies.length > 0) {
                const target = arena.enemies[Math.floor(Math.random() * arena.enemies.length)];
                if (target && target.isActive) {
                    this.projectiles.push(new RangedProjectile(this.owner, this.data, target));
                }
            }
        }
    }

    draw(ctx, cameraX, cameraY) {
        this.projectiles.forEach(p => p.draw(ctx, cameraX, cameraY));

        // Рисуем кулдаун
        if (this.cooldown > 0) {
            const screenX = this.owner.getScreenX(cameraX);
            const screenY = this.owner.getScreenY(cameraY);

            ctx.beginPath();
            ctx.arc(screenX, screenY, 30, 0, Math.PI * 2 * (1 - this.cooldown / (this.data.cooldown || 1.0)));
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}


class RangedProjectile {
    constructor(owner, data, target) {
        this.owner = owner;
        this.worldX = owner.worldX;
        this.worldY = owner.worldY;
        this.data = data;
        this.target = target;
        this.speed = 300;
        this.radius = 6;
        this.isActive = true;
        this.damage = data.damage || 5;
    }

    update(deltaTime) {
        if (!this.target || !this.target.isActive) {
            this.isActive = false;
            return;
        }

        const dx = this.target.worldX - this.worldX;
        const dy = this.target.worldY - this.worldY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
            this.target.takeDamage(this.damage);
            this.isActive = false;
        } else {
            this.worldX += (dx / distance) * this.speed * deltaTime;
            this.worldY += (dy / distance) * this.speed * deltaTime;
        }
    }

    draw(ctx, cameraX, cameraY) {
        const screenX = this.worldX - cameraX;
        const screenY = this.worldY - cameraY;

        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaa00';
        ctx.fill();
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}


class MeleeProjectile {
    constructor(owner, data) {
        this.owner = owner;
        this.data = data;
        this.lifetime = 0.2;
        this.isActive = true;
        this.hitEnemies = new Set();
    }

    update(deltaTime) {
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.isActive = false;
        }
    }

    draw(ctx, cameraX, cameraY) {
        const screenX = this.owner.getScreenX(cameraX);
        const screenY = this.owner.getScreenY(cameraY);

        ctx.beginPath();
        ctx.arc(screenX, screenY, this.data.range || 60, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}


class ExpGem extends ArenaEntity {
    constructor(x, y, value) {
        super(x, y, 10, '#ffd700');
        this.value = value;
        this.spriteManager = window.spriteManager;
        this.floatOffset = 0;
        this.floatDir = 1;
    }

    update(deltaTime, worldWidth, worldHeight) {
        super.update(deltaTime, worldWidth, worldHeight);

        // Анимация парения
        this.floatOffset += deltaTime * 2 * this.floatDir;
        if (Math.abs(this.floatOffset) > 5) {
            this.floatDir *= -1;
        }
    }

    draw(ctx, cameraX, cameraY) {
        if (!this.isActive) return;

        const screenX = this.getScreenX(cameraX);
        const screenY = this.getScreenY(cameraY) + this.floatOffset;

        const sprite = this.spriteManager.getSprite('expGem');
        ctx.drawImage(sprite, screenX - 10, screenY - 10, 20, 20);
    }
}


window.ArenaEntity = ArenaEntity;
window.ArenaHero = ArenaHero;
window.ArenaEnemy = ArenaEnemy;
window.ArenaWeapon = ArenaWeapon;
window.ExpGem = ExpGem;

window.EnemyProjectile = EnemyProjectile;
