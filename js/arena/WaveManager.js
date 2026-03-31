
class WaveManager {
    constructor(arena) {
        this.arena = arena;
        this.config = window.WaveConfig;
        
        this.currentWave = 0;
        this.waveTime = 0;
        this.waveDuration = this.config.base.waveDuration;
        
        this.unlockedEnemies = new Set(['goblin']); // Стартовые враги
        this.spawnedThisWave = 0;
        this.maxEnemiesThisWave = this.config.base.baseEnemyCount;
    }
    
    
    update(deltaTime) {
        this.waveTime += deltaTime;
        
        // Проверяем, не пора ли перейти к следующей волне
        if (this.waveTime >= this.waveDuration) {
            this.nextWave();
        }
        
        // Проверяем, не нужно ли разблокировать новых врагов
        this.checkUnlocks();
    }
    
    
    nextWave() {
        this.currentWave++;
        this.waveTime = 0;
        
        console.log(`🌊 Волна ${this.currentWave} началась!`);
        
        // Получаем конфиг текущей волны
        const waveConfig = this.config.waves[this.currentWave - 1] || 
                          this.generateInfiniteWave();
        
        // Обновляем параметры
        this.maxEnemiesThisWave = Math.floor(
            this.config.base.baseEnemyCount * waveConfig.difficulty
        );
        this.spawnedThisWave = 0;
        
        // Разблокируем новые типы врагов
        if (waveConfig.special) {
            this.handleSpecialEvent(waveConfig.special);
        }
        
        // Оповещаем UI о новой волне
        if (window.ui) {
            window.ui.showNotification(`🌊 Волна ${this.currentWave}`, 'info');
        }
    }
    
    
    generateInfiniteWave() {
        const inf = this.config.infinite;
        const lastWave = this.config.waves[this.config.waves.length - 1];
        
        return {
            enemies: lastWave.enemies,
            spawnRate: Math.max(
                0.5, 
                lastWave.spawnRate + inf.spawnRateMultiplier * this.currentWave
            ),
            difficulty: lastWave.difficulty + 
                       inf.hpMultiplier * this.currentWave,
            chestChance: Math.min(
                1.0,
                lastWave.chestChance + inf.chestChanceMultiplier * this.currentWave
            )
        };
    }
    
    
    checkUnlocks() {
        Object.entries(window.EnemyTypeConfig).forEach(([type, config]) => {
            if (config.unlockWave && 
                config.unlockWave <= this.currentWave && 
                !this.unlockedEnemies.has(type)) {
                this.unlockedEnemies.add(type);
                console.log(`🔓 Разблокирован новый враг: ${config.name}`);
                
                if (window.ui) {
                    window.ui.showNotification(`🔓 Новый враг: ${config.name}`, 'info');
                }
            }
        });
    }
    
    
    handleSpecialEvent(event) {
        switch(event) {
            case 'ranged_unlock':
                this.arena.showMessage('🏹 Появились лучники! Держите дистанцию!');
                break;
            case 'mage_unlock':
                this.arena.showMessage('🔮 Появились маги! Они замедляют!');
                break;
            case 'elite_unlock':
                this.arena.showMessage('💀 Элитные враги! Будьте осторожны!');
                break;
            case 'boss_fight':
                this.arena.showMessage('👾 БОСС! Соберитесь!');
                this.spawnBoss();
                break;
        }
    }
    
    
    spawnBoss() {
        // Спавним босса в центре карты
        const boss = new ArenaEnemy(
            this.arena.worldWidth / 2,
            this.arena.worldHeight / 2,
            this.currentWave * 2
        );
        boss.type = 'boss';
        this.arena.enemies.push(boss);
    }
    
    
    getAvailableEnemies() {
        const waveConfig = this.config.waves[this.currentWave - 1] || 
                          this.generateInfiniteWave();
        
        return waveConfig.enemies.filter(enemy => 
            this.unlockedEnemies.has(enemy)
        );
    }
    
    
    canSpawnEnemy() {
        return this.spawnedThisWave < this.maxEnemiesThisWave &&
               this.arena.enemies.length < this.arena.maxEnemies;
    }
    
    
    onEnemySpawned() {
        this.spawnedThisWave++;
    }
    
   
    getDifficultyMultiplier() {
        const waveConfig = this.config.waves[this.currentWave - 1] || 
                          this.generateInfiniteWave();
        return waveConfig.difficulty;
    }
    
    
    getChestChance() {
        const waveConfig = this.config.waves[this.currentWave - 1] || 
                          this.generateInfiniteWave();
        return waveConfig.chestChance;
    }
}

window.WaveManager = WaveManager;
