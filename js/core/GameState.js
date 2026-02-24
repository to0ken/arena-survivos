/**
 * @file GameState.js
 * @description Центральное хранилище состояния игры (Singleton).
 * Все модули должны читать данные только отсюда и изменять их только через методы GameState.
 */

// Создаем глобальный объект. Он будет доступен во всех скриптах как window.GameState
const GameState = {
  // --- Данные ---
  resources: {
    proviziya: 10,
    toplivo: 5,
    instrumenty: 3,
  },
  // Массив героев. Пока пустой, сюда мы будем добавлять объекты Hero.
  heroes: [],
  // ID героя, который сейчас выбран для игры.
  currentHeroId: null,
  // Ресурсы для крафта.

  lastPassiveUpdate: Date.now(),

  inventory: {
    // ЭТО УЖЕ ЕСТЬ
    wood: 0,
    metal: 0,
    cloth: 0,
  },

  shop: null,

  // Служебное поле: массив функций (слушателей), которые будут вызваны при любом изменении состояния.
  _listeners: [],

  // --- Методы для работы с состоянием ---

  /**
   * Подписка на изменения состояния.
   * @param {Function} callback - Функция, которая будет вызвана при изменении.
   */
  subscribe(callback) {
    this._listeners.push(callback);
  },

  /**
   * Уведомление всех подписчиков об изменении.
   * @private
   */
  notify() {
    this._listeners.forEach((cb) => cb(this));
  },

  /**
   * Изменяет количество ресурса. Используйте этот метод вместо прямой записи в resources.
   * @param {string} type - Тип ресурса ('proviziya', 'toplivo' или 'instrumenty').
   * @param {number} amount - На сколько изменить (может быть отрицательным).
   */
  updateResource(type, amount) {
    if (this.resources[type] !== undefined) {
      // Убеждаемся, что ресурс не уходит в минус.
      this.resources[type] = Math.max(0, this.resources[type] + amount);
      // Оповещаем UI, что данные изменились.
      this.notify();
    }
  },

  /**
   * Сохраняет текущее состояние в localStorage.
   */
  save() {
    const stateToSave = {
      resources: this.resources,
      heroes: this.heroes,
      currentHeroId: this.currentHeroId,
      materials: this.materials,
    };
    localStorage.setItem("arenaSurvivorsSave", JSON.stringify(stateToSave));
    console.log("Игра сохранена!");
  },

  /**
   * Загружает состояние из localStorage.
   */
  load() {
    const saved = localStorage.getItem("arenaSurvivorsSave");
    if (saved) {
      const parsed = JSON.parse(saved);
      this.resources = parsed.resources;
      this.heroes = parsed.heroes;
      this.currentHeroId = parsed.currentHeroId;
      this.materials = parsed.materials;
      this.notify();
      console.log("Игра загружена!");
    }
  },

  /**
   * Выбирает героя для боя
   * @param {string} heroId - ID героя
   */
  selectHero(heroId) {
    this.currentHeroId = heroId;

    // Обновляем отображение в шапке
    const heroNameSpan = document.getElementById("currentHeroName");
    const hero = this.heroes.find((h) => h.id === heroId);
    if (hero) {
      heroNameSpan.textContent = `Герой: ${hero.name}`;
    } else {
      heroNameSpan.textContent = "Герой: Не выбран";
    }

    this.notify();
  },

  /**
   * Возвращает текущего выбранного героя
   * @returns {Object|null} - Герой или null
   */
  getCurrentHero() {
    return this.heroes.find((h) => h.id === this.currentHeroId);
  },

  
    initShop() {
        this.shop = new window.Shop();
        this.notify();
    },

  /**
   * Пассивное обновление ресурсов (вызывается каждую секунду)
   */
  passiveUpdate() {
    const now = Date.now();
    // Сколько секунд прошло с последнего обновления
    const diffSeconds = Math.floor((now - this.lastPassiveUpdate) / 1000);

    if (diffSeconds >= 1) {
      // Каждый открытый герой даёт ресурсы
      let proviziyaGain = 0;
      let toplivoGain = 0;
      let instrumentyGain = 0;

      this.heroes.forEach((hero) => {
        // По 0.1 ресурса в секунду за каждого героя
        proviziyaGain += 0.1 * diffSeconds;
        toplivoGain += 0.1 * diffSeconds;
        instrumentyGain += 0.1 * diffSeconds;
      });

      // Применяем накопленные ресурсы (округляем до 1 знака)
      this.resources.proviziya =
        Math.round((this.resources.proviziya + proviziyaGain) * 10) / 10;
      this.resources.toplivo =
        Math.round((this.resources.toplivo + toplivoGain) * 10) / 10;
      this.resources.instrumenty =
        Math.round((this.resources.instrumenty + instrumentyGain) * 10) / 10;

      this.lastPassiveUpdate = now;

      // +++ НОВОЕ: проверяем обновление магазина
      if (this.shop) {
        const refreshed = this.shop.checkAndRefresh();
        if (refreshed) {
          console.log("Ассортимент магазина обновлен!");
        }
      }
      
      this.notify();
    }
  },
};


// Делаем объект глобальным, чтобы он был доступен во всех файлах.
window.GameState = GameState;
// Запускаем цикл пассивного обновления (каждую секунду)
setInterval(() => {
    window.GameState.passiveUpdate();
}, 1000);
