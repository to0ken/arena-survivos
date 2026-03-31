// js/core/Skill.js (исправленная версия)

class Skill {
    constructor(id, name, description, type, heroClasses, levelRequirement, effects, icon = '✨') {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = type; // 'passive', 'active', 'ultimate'
        this.heroClasses = heroClasses;
        this.levelRequirement = levelRequirement;
        this.effects = effects || {}; // Важно: если effects undefined, ставим пустой объект
        this.icon = icon;
        this.isUnlocked = false;
        
        // Для активных навыков
        this.cooldown = 0;
        this.maxCooldown = (effects && effects.cooldown) || 0;
        this.duration = (effects && effects.duration) || 0;
        this.isActive = false;
        this.activeTimer = 0;
    }
    
    // Применить эффекты навыка к герою
    apply(hero) {
        console.log(`✨ Применяем навык ${this.name} к герою ${hero.name}`);
        
        // Сохраняем ссылку на героя для активных навыков
        this.hero = hero;
        
        // Применяем пассивные эффекты напрямую к rawStats
        if (this.type === 'passive' && this.effects) {
            if (this.effects.attack) {
                hero.rawStats.attack += this.effects.attack;
                console.log(`  +${this.effects.attack} к атаке`);
            }
            if (this.effects.defense) {
                hero.rawStats.defense += this.effects.defense;
                console.log(`  +${this.effects.defense} к защите`);
            }
            if (this.effects.hp) {
                hero.rawStats.hp += this.effects.hp;
                console.log(`  +${this.effects.hp} к здоровью`);
            }
            if (this.effects.speed) {
                hero.rawStats.speed += this.effects.speed;
                console.log(`  +${this.effects.speed} к скорости`);
            }
        }
        
        // Пересчитываем характеристики героя
        hero.recalculateStats();
    }
    
    // Активировать активный навык
    activate() {
        if (this.type !== 'active' || this.cooldown > 0) return false;
        
        this.isActive = true;
        this.activeTimer = this.duration;
        this.cooldown = this.maxCooldown;
        
        console.log(`✨ Активирован навык: ${this.name}`);
        
        // Применяем временные эффекты
        if (this.effects && this.effects.special) {
            this.hero.specialEffects = this.hero.specialEffects || [];
            this.hero.specialEffects.push({
                ...this.effects.special,
                source: this.id,
                duration: this.duration
            });
        }
        
        return true;
    }
    
    // Обновление активного навыка
    update(deltaTime) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }
        
        if (this.isActive) {
            this.activeTimer -= deltaTime;
            
            if (this.activeTimer <= 0) {
                this.deactivate();
            }
        }
    }
    
    // Деактивировать навык
    deactivate() {
        this.isActive = false;
        
        // Убираем временные эффекты
        if (this.hero && this.hero.specialEffects) {
            this.hero.specialEffects = this.hero.specialEffects.filter(
                effect => effect.source !== this.id
            );
        }
        
        console.log(`✨ Навык ${this.name} закончил действие`);
    }
}

// Менеджер навыков
class SkillManager {
    constructor() {
        this.skills = [];
        this.initSkills();
    }
    
    initSkills() {
        const config = window.SkillConfig || {};
        
        // Загружаем все навыки из конфигурации
        Object.values(config).forEach(category => {
            if (Array.isArray(category)) {
                category.forEach(skillData => {
                    this.skills.push(new Skill(
                        skillData.id,
                        skillData.name,
                        skillData.description,
                        skillData.type || 'passive',
                        skillData.heroClasses,
                        skillData.levelRequirement,
                        skillData.effects,
                        skillData.icon
                    ));
                });
            }
        });
        
        console.log('Навыки инициализированы:', this.skills.length);
    }
    
    // Получить доступные навыки для героя
    getAvailableSkills(hero, level) {
        return this.skills.filter(skill => 
            skill.heroClasses.includes(hero.type) && 
            skill.levelRequirement <= level &&
            !hero.learnedSkills.some(s => s.id === skill.id)
        );
    }
    
    // Получить 3 случайных навыка для выбора
    getRandomSkillsForHero(hero, level) {
        const available = this.getAvailableSkills(hero, level);
        
        if (available.length === 0) {
            hero.pendingSkillLevel = 0;
            return [];
        }
        
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(3, shuffled.length));
    }
    
    // Изучить навык
    learnSkill(hero, skillId) {
        const skill = this.skills.find(s => s.id === skillId);
        if (!skill) return false;
        
        if (hero.learnedSkills.some(s => s.id === skillId)) return false;
        
        // Создаем копию навыка для героя
        const heroSkill = new Skill(
            skill.id,
            skill.name,
            skill.description,
            skill.type,
            skill.heroClasses,
            skill.levelRequirement,
            { ...skill.effects },
            skill.icon
        );
        
        hero.learnedSkills.push(heroSkill);
        heroSkill.apply(hero);
        
        console.log(`✨ Герой ${hero.name} изучил навык: ${skill.name}`);
        return true;
    }
    
    // Обновление всех активных навыков героя
    updateHeroSkills(hero, deltaTime) {
        if (!hero || !hero.learnedSkills) return;
        
        hero.learnedSkills.forEach(skill => {
            if (skill.type === 'active') {
                skill.update(deltaTime);
            }
        });
    }
}

window.Skill = Skill;
window.SkillManager = SkillManager;
