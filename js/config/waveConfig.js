// js/config/waveConfig.js
// Конфигурация волн для арены

const WaveConfig = {
    // Базовые настройки
    base: {
        waveDuration: 30,           // Длительность волны в секундах
        baseEnemyCount: 5,           // Базовое количество врагов
        spawnInterval: 2.0,           // Интервал спавна в секундах
    },
    
    // Настройки по волнам
    waves: [
        { // Волна 1 - только гоблины
            enemies: ['goblin'],
            spawnRate: 1.5,
            difficulty: 1.0,
            chestChance: 0.3,        // 30% шанс появления сундука
            special: null
        },
        { // Волна 2 - гоблины + скелеты
            enemies: ['goblin', 'skeleton'],
            spawnRate: 1.3,
            difficulty: 1.2,
            chestChance: 0.4,
            special: null
        },
        { // Волна 3 - появляются лучники
            enemies: ['goblin', 'skeleton', 'archer'],
            spawnRate: 1.2,
            difficulty: 1.5,
            chestChance: 0.5,
            special: 'ranged_unlock'  // Разблокировка лучников
        },
        { // Волна 4 - смешанные
            enemies: ['goblin', 'skeleton', 'archer', 'ghost'],
            spawnRate: 1.1,
            difficulty: 1.8,
            chestChance: 0.6,
            special: null
        },
        { // Волна 5 - появляются маги
            enemies: ['goblin', 'skeleton', 'archer', 'ghost', 'mage'],
            spawnRate: 1.0,
            difficulty: 2.0,
            chestChance: 0.7,
            special: 'mage_unlock'
        },
        { // Волна 6 - элитные враги
            enemies: ['goblin', 'skeleton', 'archer', 'ghost', 'mage', 'elite'],
            spawnRate: 0.9,
            difficulty: 2.5,
            chestChance: 0.8,
            special: 'elite_unlock'
        },
        { // Волна 7 - босс
            enemies: ['goblin', 'skeleton', 'archer', 'ghost', 'mage', 'elite', 'boss'],
            spawnRate: 0.8,
            difficulty: 3.0,
            chestChance: 1.0,
            special: 'boss_fight'
        }
    ],
    
    // Коэффициенты сложности для бесконечного режима
    infinite: {
        hpMultiplier: 0.3,           // +30% здоровья каждую волну
        damageMultiplier: 0.2,        // +20% урона каждую волну
        speedMultiplier: 0.1,         // +10% скорости каждую волну
        spawnRateMultiplier: -0.05,   // -5% интервала спавна (чаще враги)
        chestChanceMultiplier: 0.05   // +5% шанс сундука каждую волну
    }
};

window.WaveConfig = WaveConfig;
