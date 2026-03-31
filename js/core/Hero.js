// js/core/Hero.js (исправленная версия)
// ==============================
// Класс героя в игре.
// ==============================

class Hero {
    constructor(id, name, baseStats, type) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.level = 1;
        this.exp = 0;
        this.expToNextLevel = 100;
        this.isUnlocked = true;
        
        // Получаем конфигурацию класса
        const classConfig = window.HeroClassConfig[type] || window.HeroClassConfig.warrior;
        
        // Базовые характеристики
        this.rawStats = {
            hp: baseStats.hp || classConfig.baseStats.hp,
            attack: baseStats.attack || classConfig.baseStats.attack,
            defense: baseStats.defense || classConfig.baseStats.defense,
            speed: baseStats.speed || classConfig.baseStats.speed
        };
        
        // Максимальное здоровье
        this.maxHp = this.rawStats.hp;
        
        // Текущие характеристики (будут пересчитаны)
        this.currentStats = { ...this.rawStats };
        
        // Снаряжение на основе конфигурации
        this.equipment = this.initEquipmentSlots(classConfig.equipmentSlots);
        
        // Навыки
        this.learnedSkills = [];
        
        // Классовые бонусы с проверкой на undefined
        this.classBonuses = classConfig.classBonuses || {};
        
        // Боевые характеристики
        this.critChance = this.classBonuses.critChance || 0;
        this.critDamage = this.classBonuses.critDamage || 1.5;
        this.lifesteal = 0;
        this.specialEffects = [];
        
        // Конфигурация класса
        this.classConfig = classConfig;
        
        // Инициализация стартовых навыков
        if (classConfig.startingSkills) {
            classConfig.startingSkills.forEach(skillData => {
                const skill = new window.Skill(
                    skillData.id,
                    skillData.name,
                    skillData.description,
                    'passive',
                    [this.type],
                    1,
                    skillData.effects,
                    skillData.icon
                );
                this.learnedSkills.push(skill);
                skill.apply(this);
            });
        }
        
        this.skillPoints = 0;
        this.pendingSkillLevel = 0;
        
        // Пересчитываем все бонусы
        this.recalculateStats();
    }
    
    initEquipmentSlots(slotConfig) {
        const slots = {};
        for (const slotName of Object.keys(slotConfig)) {
            slots[slotName] = null;
        }
        return slots;
    }
    
    recalculateStats() {
        // Начинаем с базовых характеристик
        this.currentStats = { ...this.rawStats };
        this.maxHp = this.rawStats.hp;
        
        // Сбрасываем боевые характеристики
        this.critChance = this.classBonuses.critChance || 0;
        this.critDamage = this.classBonuses.critDamage || 1.5;
        this.lifesteal = 0;
        
        // Добавляем бонусы от экипировки
        const allEquipment = Object.values(this.equipment).filter(item => item !== null);
        
        allEquipment.forEach(item => {
            if (item.stats) {
                if (item.stats.attack) this.currentStats.attack += item.stats.attack;
                if (item.stats.defense) this.currentStats.defense += item.stats.defense;
                if (item.stats.hp) {
                    this.currentStats.hp += item.stats.hp;
                    this.maxHp += item.stats.hp;
                }
                if (item.stats.speed) this.currentStats.speed += item.stats.speed;
            }
            
            if (item.special) {
                if (item.special.critChance) this.critChance += item.special.critChance;
                if (item.special.critDamage) this.critDamage += item.special.critDamage;
                if (item.special.lifesteal) this.lifesteal += item.special.lifesteal;
            }
        });
        
        // Добавляем бонусы от навыков
        this.learnedSkills.forEach(skill => {
            if (skill.effects) {
                if (skill.effects.attack) this.currentStats.attack += skill.effects.attack;
                if (skill.effects.defense) this.currentStats.defense += skill.effects.defense;
                if (skill.effects.hp) {
                    this.currentStats.hp += skill.effects.hp;
                    this.maxHp += skill.effects.hp;
                }
                if (skill.effects.speed) this.currentStats.speed += skill.effects.speed;
                if (skill.effects.critChance) this.critChance += skill.effects.critChance;
                if (skill.effects.critDamage) this.critDamage += skill.effects.critDamage;
                if (skill.effects.lifesteal) this.lifesteal += skill.effects.lifesteal;
            }
        });
        
        // Убеждаемся, что текущее HP не превышает максимум
        if (this.currentStats.hp > this.maxHp) {
            this.currentStats.hp = this.maxHp;
        }
    }
    
    // Добавить опыт
    addExp(amount) {
        this.exp += amount;
        console.log(`Герой ${this.name} получил ${amount} опыта. Всего: ${this.exp}/${this.expToNextLevel}`);
        
        let leveledUp = false;
        while (this.exp >= this.expToNextLevel) {
            this.levelUp();
            leveledUp = true;
        }
        return leveledUp;
    }
    
    // Повышение уровня
    levelUp() {
        this.level++;
        this.exp -= this.expToNextLevel;
        this.expToNextLevel = Math.floor(this.expToNextLevel * 1.5);
        
        // Улучшаем базовые характеристики
        this.rawStats.hp += 10;
        this.rawStats.attack += 2;
        this.rawStats.defense += 1;
        
        // Пересчитываем все с учетом бонусов
        this.recalculateStats();
        
        // Каждые 3 уровня даем возможность выбрать навык
        if (this.level % 3 === 0) {
            this.pendingSkillLevel = this.level;
            this.skillPoints = (this.skillPoints || 0) + 1;
        }
    }
    
    // Проверить, нужно ли выбрать навык
    hasPendingSkill() {
        return this.pendingSkillLevel > 0;
    }
    
    // Экипировать предмет
    equip(item, slot) {
        const validSlots = this.getValidSlotsForItem(item);
        
        if (!validSlots.includes(slot)) return false;
        
        // Если в слоте уже есть предмет, возвращаем его в рюкзак
        if (this.equipment[slot]) {
            window.GameState.addToBackpack(this.equipment[slot]);
        }
        
        // Экипируем новый предмет
        this.equipment[slot] = item;
        
        // Удаляем предмет из рюкзака
        window.GameState.removeFromBackpack(item.instanceId || item.id);
        
        // Пересчитываем характеристики
        this.recalculateStats();
        return true;
    }
    
    // Снять предмет
    unequip(slot) {
        const item = this.equipment[slot];
        if (!item) return false;
        
        // Возвращаем в рюкзак
        window.GameState.addToBackpack(item);
        
        // Очищаем слот
        this.equipment[slot] = null;
        
        // Пересчитываем характеристики
        this.recalculateStats();
        return true;
    }
    
    // Получить допустимые слоты для предмета
    getValidSlotsForItem(item) {
        const slots = [];
        
        switch(item.type) {
            case 'weapon':
                if (this.type === 'warrior' || this.type === 'rogue') {
                    slots.push('weapon1', 'weapon2');
                } else {
                    slots.push('weapon1');
                }
                break;
            case 'shield':
                if (this.type === 'warrior') slots.push('weapon2');
                break;
            case 'armor':
                if (['warrior', 'archer'].includes(this.type)) slots.push('armor');
                break;
            case 'accessory':
                if (this.type === 'warrior') slots.push('accessory');
                if (this.type === 'archer') slots.push('accessory1', 'accessory2');
                if (this.type === 'mage') slots.push('accessory1', 'accessory2', 'accessory3');
                if (this.type === 'rogue') slots.push('accessory1', 'accessory2');
                break;
        }
        return slots;
    }
    
    // Получить все экипированные предметы
    getEquippedItems() {
        return Object.values(this.equipment).filter(item => item !== null);
    }
    
    // Применить урон с учетом критов и блоков
    calculateDamage(baseDamage) {
        let damage = baseDamage;
        
        // Проверка на блок (для воина)
        if (this.classBonuses.blockChance && Math.random() < this.classBonuses.blockChance) {
            damage *= (1 - (this.classBonuses.blockReduction || 0.5));
            return Math.floor(damage);
        }
        
        // Проверка на уклонение (для разбойника)
        if (this.classBonuses.dodgeChance && Math.random() < this.classBonuses.dodgeChance) {
            return 0; // Полное уклонение
        }
        
        // Критический удар
        if (Math.random() < this.critChance) {
            damage *= this.critDamage;
        }
        
        return Math.floor(damage);
    }
    
    // Восстановление здоровья
    heal(amount) {
        this.currentStats.hp = Math.min(this.currentStats.hp + amount, this.maxHp);
    }
    
    // Регенерация здоровья (вызывается каждый кадр на арене)
    regen(deltaTime) {
        if (this.classBonuses && this.classBonuses.healthRegen) {
            this.heal(this.classBonuses.healthRegen * deltaTime);
        }
    }
}

window.Hero = Hero;
