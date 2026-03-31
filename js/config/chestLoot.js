// js/config/chestLoot.js
// Конфигурация добычи из сундуков

const ChestLootConfig = {
    // Базовые настройки
    base: {
        openTime: 15,                // Время открытия в секундах
        resetTime: 5,                 // Время сброса прогресса
        maxDistance: 100,              // Максимальное расстояние для открытия
    },
    
    // Таблица добычи
    lootTable: [
        // Зелья здоровья (вес 30)
        {
            type: 'consumable',
            id: 'consumable_hp_small',
            name: 'Малое зелье здоровья',
            icon: '💗',
            effect: 'heal',
            value: 30,
            weight: 30,
            minWave: 1,
            maxWave: 3
        },
        {
            type: 'consumable',
            id: 'consumable_hp_medium',
            name: 'Среднее зелье здоровья',
            icon: '💗',
            effect: 'heal',
            value: 60,
            weight: 20,
            minWave: 3,
            maxWave: 5
        },
        {
            type: 'consumable',
            id: 'consumable_hp_large',
            name: 'Большое зелье здоровья',
            icon: '💗',
            effect: 'heal',
            value: 100,
            weight: 10,
            minWave: 5
        },
        
        // Материалы (вес 40)
        {
            type: 'material',
            id: 'material_wood',
            name: 'Древесина',
            icon: '🌲',
            amount: 2,
            weight: 40,
            minWave: 1
        },
        {
            type: 'material',
            id: 'material_iron',
            name: 'Железо',
            icon: '⛓️',
            amount: 1,
            weight: 30,
            minWave: 2
        },
        {
            type: 'material',
            id: 'material_cloth',
            name: 'Ткань',
            icon: '🌯',
            amount: 1,
            weight: 30,
            minWave: 1
        },
        
        // Опыт (вес 20)
        {
            type: 'exp',
            amount: 10,
            weight: 40,
            minWave: 1
        },
        {
            type: 'exp',
            amount: 25,
            weight: 30,
            minWave: 3
        },
        {
            type: 'exp',
            amount: 50,
            weight: 20,
            minWave: 5
        },
        
        // Редкие предметы (вес 10)
        {
            type: 'weapon',
            id: 'weapon_sword_2',
            name: 'Железный меч',
            icon: '⚔️',
            weight: 5,
            minWave: 4
        },
        {
            type: 'accessory',
            id: 'accessory_crit_1',
            name: 'Кольцо удачи',
            icon: '💍',
            stats: { critChance: 0.05 },
            weight: 5,
            minWave: 5
        }
    ],
    
    // Количество предметов из сундука
    itemCount: {
        min: 1,
        max: 3
    }
};

window.ChestLootConfig = ChestLootConfig;
