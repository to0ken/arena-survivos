// ==============================
// Класс рецепта крафта
// ==============================
class Recipe {
  /**
   * Создаёт новый рецепт
   * @param {string} id - Уникальный идентификатор
   * @param {string} name - Название рецепта
   * @param {Object} resultItem - Предмет, который получается
   * @param {Array} materials - Материалы [{ itemId, quantity }]
   * @param {number} requiredLevel - Требуемый уровень героя
   * @param {string} requiredSkill - Требуемый навык (если есть)
   */
  constructor(
    id,
    name,
    resultItem,
    materials,
    requiredLevel = 1,
    requiredSkill = null,
  ) {
    this.id = id;
    this.name = name;
    this.resultItem = resultItem;
    this.materials = materials;
    this.requiredLevel = requiredLevel;
    this.requiredSkill = requiredSkill;
    this.isUnlocked = false; // По умолчанию закрыт
    this.unlockChance = 0.05; // 5% шанс открыть при крафте
    this.description = `Создает ${resultItem.name}`;
  }

  /**
   * Проверяет, может ли герой скрафтить этот предмет
   * @param {Object} hero - Герой
   * @param {Object} availableMaterials - Доступные материалы
   * @returns {Object} - { success, message }
   */
  canCraft(hero, availableMaterials) {
    // Проверяем уровень
    if (hero.level < this.requiredLevel) {
      return {
        success: false,
        message: `Требуется уровень ${this.requiredLevel}`,
      };
    }

    // Проверяем материалы
    for (const material of this.materials) {
      if (
        !availableMaterials[material.itemId] ||
        availableMaterials[material.itemId] < material.quantity
      ) {
        return { success: false, message: `Не хватает ${material.itemId}` };
      }
    }

    return { success: true, message: "Можно скрафтить" };
  }

  /**
   * Пытается открыть новый рецепт при крафте
   * @param {Array} allRecipes - Все рецепты
   * @returns {Object|null} - Открытый рецепт или null
   */
  tryUnlockNewRecipe(allRecipes) {
    // Ищем закрытые рецепты
    const lockedRecipes = allRecipes.filter(
      (r) => !r.isUnlocked && r.id !== this.id,
    );

    if (lockedRecipes.length > 0 && Math.random() < this.unlockChance) {
      const randomRecipe =
        lockedRecipes[Math.floor(Math.random() * lockedRecipes.length)];
      randomRecipe.isUnlocked = true;
      return randomRecipe;
    }
    return null;
  }
}
