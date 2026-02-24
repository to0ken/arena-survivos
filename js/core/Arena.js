class Arena {
    constructor(locationConfig) {
        this.location = locationConfig.id;
        this.costType = locationConfig.costType;
        this.duration = 60; // секунд
        this.enemies = [];
        this.rewards = {};
    }

    start(hero) { /* Инициализация боя */ }
    update(deltaTime) { /* Игровой цикл */ }
    end(victory) { /* Выдача наград */ }
}