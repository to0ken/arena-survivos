// js/ui/templates/notification.js
// Шаблон уведомления

const NotificationTemplate = {

    render(message, type = 'success', duration = 2000) {
        return `<div style="
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4aff4a' : '#e94560'};
            color: ${type === 'success' ? '#000' : '#fff'};
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-weight: bold;
            animation: fadeInOut ${duration}ms;
        ">${message}</div>`;
    }
};

window.NotificationTemplate = NotificationTemplate;
