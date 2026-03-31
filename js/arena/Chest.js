// js/arena/Chest.js
// Класс сундука на арене

class Chest extends ArenaEntity {
    constructor(worldX, worldY) {
        super(worldX, worldY, 25, '#ffaa00');
        
        this.config = window.ChestLootConfig;
        
        // Состояние сундука
        this.isOpen = false;
        this.openProgress = 0;
        this.requiredTime = this.config.base.openTime;
        this.resetTime = this.config.base.resetTime;
        this.lastPlayerDistance = Infinity;
        this.openingTimer = 0;
        this.resetTimer = 0;
        
        // Визуальные эффекты
        this.glowIntensity = 0;
        this.sparkles = [];
        this.generateSparkles();
        
        // Добыча (генерируется при создании)
        this.loot = this.generateLoot();
        
        // Для анимации
        this.bobSpeed = 3;
        this.color = '#ffaa00';
        this.spriteKey = 'chest';
    }
    
    /**
     * Генерация случайной добычи
     */
    generateLoot() {
        const loot = [];
        const count = Math.floor(
            Math.random() * (this.config.itemCount.max - this.config.itemCount.min + 1)
        ) + this.config.itemCount.min;
        
        // Фильтруем доступную добычу по текущей волне
        const availableLoot = this.config.lootTable.filter(item => {
            if (item.minWave && item.minWave > window.currentArena?.waveManager?.currentWave) {
                return false;
            }
            if (item.maxWave && item.maxWave < window.currentArena?.waveManager?.currentWave) {
                return false;
            }
            return true;
        });
        
        // Выбираем случайные предметы с учетом весов
        for (let i = 0; i < count; i++) {
            const totalWeight = availableLoot.reduce((sum, item) => sum + item.weight, 0);
            let random = Math.random() * totalWeight;
            
            for (const item of availableLoot) {
                if (random < item.weight) {
                    loot.push({ ...item }); // Копируем, чтобы не изменять оригинал
                    break;
                }
                random -= item.weight;
            }
        }
        
        return loot;
    }
    
    /**
     * Генерация искр для визуального эффекта
     */
    generateSparkles() {
        for (let i = 0; i < 5; i++) {
            this.sparkles.push({
                angle: Math.random() * Math.PI * 2,
                distance: 15 + Math.random() * 20,
                speed: 0.5 + Math.random() * 1,
                offset: Math.random() * Math.PI * 2
            });
        }
    }
    
    /**
     * Обновление состояния сундука
     */
    update(deltaTime, hero) {
        super.update(deltaTime);
        
        if (this.isOpen) return;
        
        // Проверяем расстояние до героя
        const distance = hero ? Math.hypot(
            hero.worldX - this.worldX,
            hero.worldY - this.worldY
        ) : Infinity;
        
        // Обновляем прогресс открытия
        if (distance < this.config.base.maxDistance) {
            // Герой рядом - увеличиваем прогресс
            this.openingTimer += deltaTime;
            this.openProgress = Math.min(
                1,
                this.openingTimer / this.requiredTime
            );
            
            // Сбрасываем таймер сброса
            this.resetTimer = 0;
            
            // Визуальный эффект - свечение
            this.glowIntensity = Math.min(1, this.glowIntensity + deltaTime * 2);
            
            // Если прогресс достиг 100% - открываем сундук
            if (this.openProgress >= 1) {
                this.open();
            }
        } else {
            // Герой ушел - начинаем сбрасывать прогресс
            this.resetTimer += deltaTime;
            this.glowIntensity = Math.max(0, this.glowIntensity - deltaTime);
            
            if (this.resetTimer >= this.resetTime) {
                this.openingTimer = 0;
                this.openProgress = 0;
            }
        }
        
        this.lastPlayerDistance = distance;
        
        // Анимация искр
        this.updateSparkles(deltaTime);
    }
    
    /**
     * Обновление анимации искр
     */
    updateSparkles(deltaTime) {
        this.sparkles.forEach(sparkle => {
            sparkle.angle += sparkle.speed * deltaTime;
        });
    }
    
    /**
     * Открытие сундука
     */
    open() {
        this.isOpen = true;
        console.log('🎁 Сундук открыт! Добыча:', this.loot);
        
        // Применяем добычу
        this.applyLoot();
        
        // Визуальный эффект открытия
        this.color = '#aaaaaa';
        
        // Уведомление игрока
        if (window.ui) {
            window.ui.showNotification('🎁 Сундук открыт!', 'success');
        }
    }
    
    /**
     * Применение добычи к игре
     */
    applyLoot() {
        this.loot.forEach(item => {
            switch(item.type) {
                case 'consumable':
                    // Добавляем в рюкзак
                    window.GameState.addToBackpack({
                        id: item.id,
                        name: item.name,
                        icon: item.icon,
                        type: 'consumable',
                        effect: item.effect,
                        value: item.value
                    });
                    break;
                    
                case 'material':
                    // Добавляем на склад материалов
                    window.GameState.addMaterial(item.id, item.amount || 1);
                    break;
                    
                case 'exp':
                    // Добавляем опыт герою
                    if (window.currentArena?.hero) {
                        window.currentArena.hero.addExp(item.amount);
                    }
                    break;
                    
                case 'weapon':
                case 'accessory':
                    // Добавляем в рюкзак
                    window.GameState.addToBackpack({
                        id: item.id,
                        name: item.name,
                        icon: item.icon,
                        type: item.type,
                        stats: item.stats || {}
                    });
                    break;
            }
        });
        
        // Обновляем UI
        if (window.ui) {
            window.ui.updateResourcesUI();
        }
    }
    
    /**
     * Отрисовка сундука
     */
    draw(ctx, cameraX, cameraY) {
        const screenX = this.getScreenX(cameraX);
        const screenY = this.getScreenY(cameraY) + this.bobOffset;
        
        if (screenX + this.radius < 0 || screenX - this.radius > ctx.canvas.width ||
            screenY + this.radius < 0 || screenY - this.radius > ctx.canvas.height) {
            return;
        }
        
        ctx.save();
        
        // Эффект свечения при открытии
        if (this.glowIntensity > 0) {
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 20 * this.glowIntensity;
        }
        
        // Рисуем сундук
        if (this.isOpen) {
            // Открытый сундук
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX - 20, screenY - 15, 40, 30);
            
            // Крышка
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(screenX - 22, screenY - 25, 44, 10);
            
            // Замок
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(screenX, screenY - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Закрытый сундук
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX - 20, screenY - 20, 40, 30);
            
            // Крышка
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(screenX - 22, screenY - 25, 44, 10);
            
            // Замок
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(screenX, screenY - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Прогресс-бар открытия
        if (this.openProgress > 0 && this.openProgress < 1) {
            const barWidth = 60;
            const barHeight = 6;
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(
                screenX - barWidth/2,
                screenY - 40,
                barWidth,
                barHeight
            );
            
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(
                screenX - barWidth/2,
                screenY - 40,
                barWidth * this.openProgress,
                barHeight
            );
            
            // Текст прогресса
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${Math.floor(this.openProgress * 100)}%`,
                screenX,
                screenY - 45
            );
        }
        
        // Рисуем искры
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        this.sparkles.forEach(sparkle => {
            const x = screenX + Math.cos(sparkle.angle) * sparkle.distance;
            const y = screenY + Math.sin(sparkle.angle) * sparkle.distance;
            
            ctx.beginPath();
            ctx.moveTo(x - 2, y - 2);
            ctx.lineTo(x + 2, y + 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x + 2, y - 2);
            ctx.lineTo(x - 2, y + 2);
            ctx.stroke();
        });
    }
}

window.Chest = Chest;
