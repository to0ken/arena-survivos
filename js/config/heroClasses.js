// js/config/heroClasses.js (исправленная версия)

const HeroClassConfig = {
    warrior: {
        name: 'Воин',
        baseStats: { hp: 120, attack: 18, defense: 12, speed: 8 },
        description: 'Мастер ближнего боя, может носить тяжелую броню',
        equipmentSlots: {
            weapon1: { type: 'weapon', required: false },
            weapon2: { type: ['weapon', 'shield'], required: false },
            armor: { type: 'armor', required: true },
            accessory: { type: 'accessory', required: false }
        },
        startingWeapon: {
            name: 'Меч',
            damage: 8,
            range: 70,
            cooldown: 1.4,
            type: 'melee',
            icon: '⚔️'
        },
        startingSkills: [
            {
                id: 'skill_warrior_toughness',
                name: 'Стойкость',
                description: 'Увеличивает здоровье на 20',
                effects: { hp: 20 },
                icon: '❤️'
            }
        ],
        classBonuses: {
            blockChance: 0.1,
            blockReduction: 0.5,
            healthRegen: 1,
            critChance: 0,
            critDamage: 1.5
        },
        color: '#4aff4a',
        icon: '⚔️'
    },
    
    archer: {
        name: 'Лучник',
        baseStats: { hp: 80, attack: 22, defense: 6, speed: 15 },
        description: 'Мастер дальнего боя, наносит критический урон',
        equipmentSlots: {
            weapon1: { type: 'weapon', required: true },
            armor: { type: 'armor', required: true },
            accessory1: { type: 'accessory', required: false },
            accessory2: { type: 'accessory', required: false }
        },
        startingWeapon: {
            name: 'Лук',
            damage: 12,
            range: 300,
            cooldown: 1.7,
            type: 'ranged',
            accuracy: 0.8,
            icon: '🏹'
        },
        startingSkills: [
            {
                id: 'skill_archer_accuracy',
                name: 'Меткость',
                description: 'Увеличивает шанс попадания на 10%',
                effects: { special: { type: 'accuracy', bonus: 0.1 } },
                icon: '🎯'
            }
        ],
        classBonuses: {
            critChance: 0.15,
            critDamage: 2.0,
            rangeBonus: 1.2,
            healthRegen: 0.5,
            blockChance: 0,
            blockReduction: 0
        },
        color: '#ffaa00',
        icon: '🏹'
    },
    
    mage: {
        name: 'Маг',
        baseStats: { hp: 70, attack: 25, defense: 4, speed: 12 },
        description: 'Владеет магией, может замедлять врагов',
        equipmentSlots: {
            weapon1: { type: 'weapon', required: true },
            accessory1: { type: 'accessory', required: false },
            accessory2: { type: 'accessory', required: false },
            accessory3: { type: 'accessory', required: false }
        },
        startingWeapon: {
            name: 'Посох',
            damage: 5,
            range: 200,
            cooldown: 2.8,
            type: 'magic',
            icon: '🔮'
        },
        startingSkills: [
            {
                id: 'skill_mage_intelligence',
                name: 'Интеллект',
                description: 'Увеличивает урон магии на 15%',
                effects: { attack: 8 },
                icon: '🔮'
            }
        ],
        classBonuses: {
            manaRegen: 2,
            spellDamage: 1.2,
            healthRegen: 0.3,
            blockChance: 0,
            blockReduction: 0,
            critChance: 0,
            critDamage: 1.5
        },
        color: '#aa4aff',
        icon: '🔮'
    },
    
    rogue: {
        name: 'Разбойник',
        baseStats: { hp: 90, attack: 16, defense: 8, speed: 18 },
        description: 'Быстрый и смертоносный, ставит ловушки',
        equipmentSlots: {
            weapon1: { type: 'weapon', required: true },
            weapon2: { type: 'weapon', required: false },
            accessory1: { type: 'accessory', required: false },
            accessory2: { type: 'accessory', required: false }
        },
        startingWeapon: {
            name: 'Кинжалы',
            damage: 6,
            range: 50,
            cooldown: 0.75,
            type: 'melee',
            icon: '🗡️'
        },
        startingSkills: [
            {
                id: 'skill_rogue_poison',
                name: 'Отравленные клинки',
                description: 'Отравляет врагов, нанося 5 урона в секунду в течение 3 секунд',
                effects: { special: { type: 'poison', damage: 5, duration: 3 } },
                icon: '☠️'
            }
        ],
        classBonuses: {
            critChance: 0.2,
            critDamage: 2.5,
            dodgeChance: 0.1,
            healthRegen: 0.5,
            blockChance: 0,
            blockReduction: 0
        },
        color: '#ff4a4a',
        icon: '🗡️'
    }
};

window.HeroClassConfig = HeroClassConfig;
