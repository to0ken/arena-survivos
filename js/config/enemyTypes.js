// js/config/enemyTypes.js
// Конфигурация типов врагов

const EnemyTypeConfig = {
    goblin: {
        name: 'Гоблин',
        baseHp: 30,
        baseAttack: 5,
        speed: 2,
        expValue: 10,
        color: '#2d5a27',
        spriteKey: 'goblin',
        variants: ['goblin', 'goblin_1', 'goblin_2'],
        bobSpeed: 9,
        attackInterval: 1.0,
        radius: 20
    },
    
    skeleton: {
        name: 'Скелет',
        baseHp: 40,
        baseAttack: 8,
        speed: 1.5,
        expValue: 15,
        color: '#aaaaaa',
        spriteKey: 'skeleton',
        variants: ['skeleton', 'skeleton_1'],
        bobSpeed: 6,
        attackInterval: 1.2,
        radius: 20
    },
    
    ghost: {
        name: 'Призрак',
        baseHp: 25,
        baseAttack: 6,
        speed: 3,
        expValue: 12,
        color: '#aa4aff',
        spriteKey: 'ghost',
        variants: ['ghost'],
        bobSpeed: 4,
        attackInterval: 0.8,
        radius: 18,
        effects: ['phase']
    },
    
    orc: {
        name: 'Орк',
        baseHp: 60,
        baseAttack: 12,
        speed: 1.2,
        expValue: 25,
        color: '#8B4513',
        spriteKey: 'orc',
        variants: ['orc'],
        bobSpeed: 5,
        attackInterval: 1.5,
        radius: 25
    },
    
    boss: {
        name: 'Босс',
        baseHp: 200,
        baseAttack: 25,
        speed: 1.0,
        expValue: 100,
        color: '#e94560',
        spriteKey: 'boss',
        variants: ['boss'],
        bobSpeed: 3,
        attackInterval: 2.0,
        radius: 35,
        isBoss: true,
        abilities: ['summon', 'rage']
    },

    archer: {
        name: 'Лучник',
        baseHp: 25,
        baseAttack: 8,
        speed: 1.8,
        expValue: 15,
        color: '#8B4513',
        spriteKey: 'archer',
        variants: ['archer'],
        bobSpeed: 8,
        attackInterval: 2.0,
        radius: 18,
        attackType: 'ranged',        // Дальний бой
        range: 250,                   // Дальность стрельбы
        projectileSpeed: 300,
        unlockWave: 3,                // Появляется с 3 волны
        description: 'Атакует с расстояния'
    },
    
    // НОВЫЙ ТИП: Маг
    mage: {
        name: 'Маг',
        baseHp: 20,
        baseAttack: 6,
        speed: 1.5,
        expValue: 20,
        color: '#4a4aff',
        spriteKey: 'mage',
        variants: ['mage'],
        bobSpeed: 6,
        attackInterval: 3.0,
        radius: 18,
        attackType: 'magic',          // Магическая атака
        range: 200,
        projectileSpeed: 250,
        effects: ['slow'],             // Замедляет при попадании
        slowDuration: 2,
        slowAmount: 0.5,
        unlockWave: 5,                 // Появляется с 5 волны
        description: 'Замедляет героя магией'
    },
    
    // НОВЫЙ ТИП: Элитный враг
    elite: {
        name: 'Элитный воин',
        baseHp: 80,
        baseAttack: 15,
        speed: 1.3,
        expValue: 40,
        color: '#ffaa00',
        spriteKey: 'elite',
        variants: ['elite'],
        bobSpeed: 5,
        attackInterval: 1.5,
        radius: 25,
        attackType: 'melee',
        effects: ['stun'],             // Может оглушать
        stunChance: 0.2,
        unlockWave: 7,                  // Появляется с 7 волны
        description: 'Опасный противник с усиленными характеристиками'
    }
};

window.EnemyTypeConfig = EnemyTypeConfig;
