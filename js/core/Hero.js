class Hero {

  constructor(id, name, baseStats, type) {
    this.id = id;
    this.name = name;
    this.type = type; // 'warrior', 'archer', 'mage'
    this.level = 1;
    this.exp = 0;
    this.expToNextLevel = 100; // опыт до следующего уровня

    // Базовые характеристики (растут с уровнем)
    this.baseStats = {
      hp: baseStats.hp || 100,
      attack: baseStats.attack || 10,
      defense: baseStats.defense || 5,
      speed: baseStats.speed || 10,
    };

    // Текущие характеристики (с учётом экипировки)
    this.currentStats = { ...this.baseStats };

    // Инвентарь (9 слотов)
    this.inventory = new Array(9).fill(null);

    // Экипировка (оружие, броня, аксессуар)
    this.equipment = { weapon: null, armor: null, accessory: null };

  }

  /**
   * Добавляет опыт герою. Если опыта хватает - повышает уровень
   * @param {number} amount - Количество опыта
   */
  addExp(amount) {
    this.exp += amount;
    // Пока опыта больше чем нужно для уровня - качаемся
    while (this.exp >= this.expToNextLevel) {
      this.levelUp();
    }
  }

  /**
   * Повышает уровень героя, улучшает характеристики
   */
  levelUp() {
    this.level++;
    this.exp -= this.expToNextLevel;
    // Увеличиваем требуемый опыт на 50%
    this.expToNextLevel = Math.floor(this.expToNextLevel * 1.5);

    // Улучшаем базовые характеристики
    this.baseStats.hp += 10;
    this.baseStats.attack += 2;
    this.baseStats.defense += 1;

    // Обновляем текущие статы с учётом экипировки
    this.updateCurrentStats();
  }

  /**
   * Пересчитывает текущие характеристики с учётом экипировки
   */
  updateCurrentStats() {
    this.currentStats = { ...this.baseStats };

    // Добавляем бонусы от оружия
    if (this.equipment.weapon) {
      this.currentStats.attack += this.equipment.weapon.bonusAttack || 0;
    }
    // Добавляем бонусы от брони
    if (this.equipment.armor) {
      this.currentStats.defense += this.equipment.armor.bonusDefense || 0;
      this.currentStats.hp += this.equipment.armor.bonusHp || 0;
    }
  }


  equip(item, slot) {
    if (slot === "weapon" || slot === "armor" || slot === "accessory") {
      this.equipment[slot] = item;
      this.updateCurrentStats();
    }
  }

  // ДОБАВИЛА ПРОВЕРКУ id
    addToInventory(item) {
    if (!item || !item.id) {
      return false;
    }
    const emptySlot = this.inventory.findIndex((slot) => slot === null);
    if (emptySlot !== -1) {
      this.inventory[emptySlot] = item;
      return true;
    }
    return false;
  }
}


window.Hero = Hero;
