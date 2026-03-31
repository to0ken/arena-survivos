// js/core/GameState.js (добавляем недостающие методы)

const GameState = {
    resources: {
        proviziya: 10,
        toplivo: 5,
        instrumenty: 3
    },
    
    // Общий рюкзак для всех предметов
    backpack: [],
    
    // Склад материалов
    materials: {
        wood: 5,
        iron: 2,
        cloth: 3
    },
    
    heroes: [],
    currentHeroId: null,
    lastPassiveUpdate: Date.now(),
    
    shop: null,
    recipeManager: null,
    skillManager: null,
    
    _listeners: [],
    
    // Подписка на изменения
    subscribe(callback) {
        this._listeners.push(callback);
    },
    
    notify() {
        this._listeners.forEach(cb => cb(this));
    },
    
    // Обновление ресурсов
    updateResource(type, amount) {
        if (this.resources[type] !== undefined) {
            this.resources[type] = Math.max(0, Math.round((this.resources[type] + amount) * 10) / 10);
            this.notify();
        }
    },
    
    // Добавить предмет в рюкзак
    addToBackpack(item) {
        if (!this.backpack) this.backpack = [];
        this.backpack.push({
            ...item,
            instanceId: Date.now() + Math.random() + (item.id || 'item')
        });
        console.log(`📦 Предмет добавлен в рюкзак: ${item.name}`);
        this.notify();
        return true;
    },
    
    // Удалить предмет из рюкзака
    removeFromBackpack(itemId) {
        if (!this.backpack) return false;
        const index = this.backpack.findIndex(item => 
            item.id === itemId || item.instanceId === itemId
        );
        if (index !== -1) {
            const item = this.backpack[index];
            this.backpack.splice(index, 1);
            console.log(`📦 Предмет удален из рюкзака: ${item.name}`);
            this.notify();
            return true;
        }
        return false;
    },
    
    // Получить предметы определенного типа из рюкзака
    getBackpackItemsByType(type) {
        if (!this.backpack) return [];
        return this.backpack.filter(item => item.type === type);
    },
    
    // Добавить материалы на склад
    addMaterial(type, amount) {
        if (!this.materials) {
            this.materials = { wood: 0, iron: 0, cloth: 0 };
        }
        if (this.materials[type] !== undefined) {
            this.materials[type] += amount;
            console.log(`📦 Материалы добавлены: ${type} +${amount}`);
            this.notify();
            return true;
        }
        return false;
    },
    
    // Потратить материалы со склада
    useMaterial(type, amount) {
        if (!this.materials) return false;
        if (this.materials[type] !== undefined && this.materials[type] >= amount) {
            this.materials[type] -= amount;
            console.log(`📦 Материалы использованы: ${type} -${amount}`);
            this.notify();
            return true;
        }
        return false;
    },
    
    // Получить все материалы
    getMaterials() {
        if (!this.materials) {
            this.materials = { wood: 0, iron: 0, cloth: 0 };
        }
        return { ...this.materials };
    },
    
    // Проверить, хватает ли материалов
    hasEnoughMaterials(requirements) {
        if (!this.materials) return false;
        for (const req of requirements) {
            const materialKey = req.itemId.replace('material_', '');
            if ((this.materials[materialKey] || 0) < req.quantity) {
                return false;
            }
        }
        return true;
    },
    
    // Выбрать героя для боя
    selectHero(heroId) {
        this.currentHeroId = heroId;
        this.notify();
        const heroNameSpan = document.getElementById('currentHeroName');
        const hero = this.heroes.find(h => h.id === heroId);
        if (hero) {
            heroNameSpan.textContent = `Герой: ${hero.name}`;
        } else {
            heroNameSpan.textContent = 'Герой: Не выбран';
        }
    },
    
    // Получить текущего героя
    getCurrentHero() {
        return this.heroes.find(h => h.id === this.currentHeroId);
    },
    
    // Пассивное обновление ресурсов
    passiveUpdate() {
        const now = Date.now();
        const diffSeconds = Math.floor((now - this.lastPassiveUpdate) / 1000);
        
        if (diffSeconds >= 1) {
            const resourcesGained = {
                proviziya: 0,
                toplivo: 0,
                instrumenty: 0
            };
            
            this.heroes.forEach(hero => {
                if (hero.isUnlocked) {
                    resourcesGained.proviziya += 0.05 * diffSeconds;
                    resourcesGained.toplivo += 0.03 * diffSeconds;
                    resourcesGained.instrumenty += 0.02 * diffSeconds;
                }
            });
            
            this.resources.proviziya = Math.round((this.resources.proviziya + resourcesGained.proviziya) * 10) / 10;
            this.resources.toplivo = Math.round((this.resources.toplivo + resourcesGained.toplivo) * 10) / 10;
            this.resources.instrumenty = Math.round((this.resources.instrumenty + resourcesGained.instrumenty) * 10) / 10;
            
            this.lastPassiveUpdate = now;
            
            if (this.shop) {
                this.shop.checkAndRefresh();
            }
            
            this.notify();
        }
    },
    
    // Инициализация магазина
    initShop() {
        this.shop = new window.Shop();
        this.notify();
    },
    
    // Инициализация рецептов
    initRecipes() {
        this.recipeManager = new window.RecipeManager();
        this.notify();
    },
    
    // Инициализация навыков
    initSkills() {
        this.skillManager = new window.SkillManager();
        this.notify();
    },
    
    // Крафт предмета
    craftItem(recipeId, heroId) {
        if (!this.recipeManager) {
            return { success: false, message: 'Система крафта не инициализирована' };
        }
        
        const hero = this.heroes.find(h => h.id === heroId);
        if (!hero) {
            return { success: false, message: 'Герой не найден' };
        }
        
        const recipe = this.recipeManager.getRecipe(recipeId);
        if (!recipe) {
            return { success: false, message: 'Рецепт не найден' };
        }
        
        if (!recipe.isUnlocked) {
            return { success: false, message: 'Рецепт еще не открыт' };
        }
        
        if (hero.level < recipe.requiredLevel) {
            return { success: false, message: `Требуется уровень ${recipe.requiredLevel}` };
        }
        
        if (!this.hasEnoughMaterials(recipe.materials)) {
            return { success: false, message: 'Недостаточно материалов' };
        }
        
        // Списываем материалы со склада
        for (const material of recipe.materials) {
            const materialKey = material.itemId.replace('material_', '');
            this.useMaterial(materialKey, material.quantity);
        }
        
        // Добавляем результат в рюкзак
        this.addToBackpack(recipe.resultItem);
        
        // Пытаемся открыть новый рецепт
        const newRecipe = recipe.tryUnlockNewRecipe(this.recipeManager.recipes);
        
        let message = `Создан ${recipe.resultItem.name}`;
        if (newRecipe) {
            message += `\n🔓 Открыт новый рецепт: ${newRecipe.name}!`;
        }
        
        return {
            success: true,
            message: message,
            item: recipe.resultItem,
            newRecipe: newRecipe
        };
    },
    
    // Купить предмет в магазине
    buyItem(itemId, heroId) {
        if (!this.shop) {
            return { success: false, message: 'Магазин не инициализирован' };
        }
        
        const hero = this.heroes.find(h => h.id === heroId);
        if (!hero) {
            return { success: false, message: 'Герой не найден' };
        }
        
        const item = this.shop.dailyItems.find(i => i.id === itemId);
        if (!item) {
            return { success: false, message: 'Предмет не найден' };
        }
        
        const price = item.getPrice();
        
        if (this.resources.proviziya < price) {
            return { success: false, message: 'Недостаточно провизии' };
        }
        
        this.updateResource('proviziya', -price);
        
        if (item.type === 'material') {
            this.addMaterial(item.id.replace('material_', ''), item.amount || 1);
        } else {
            this.addToBackpack({ ...item });
        }
        
        return {
            success: true,
            message: `Куплен ${item.name} за ${price} провизии`,
            item: item
        };
    },
    
    // Добавить награды после боя
    addBattleRewards() {
        const materials = [
            { type: 'wood', amount: Math.floor(Math.random() * 3) + 1 },
            { type: 'iron', amount: Math.floor(Math.random() * 2) },
            { type: 'cloth', amount: Math.floor(Math.random() * 2) }
        ];
        
        materials.forEach(m => {
            if (m.amount > 0) {
                this.addMaterial(m.type, m.amount);
            }
        });
        
        if (this.recipeManager && Math.random() < 0.3) {
            const newRecipe = this.recipeManager.tryUnlockRandomRecipe();
            if (newRecipe) {
                return {
                    materials: materials,
                    newRecipe: newRecipe
                };
            }
        }
        
        return { materials: materials };
    }
};

window.GameState = GameState;

setInterval(() => {
    window.GameState.passiveUpdate();
}, 1000);
