const tg = window.Telegram.WebApp;

// Инициализация приложения
$(document).ready(function() {
    tg.ready();
    tg.expand();
    loadEvents();
    loadSettings();
});

// Управление отображением
function showView(viewId) {
    $('.view').removeClass('active');
    $(`#${viewId}`).addClass('active');
    
    $('.nav-item').removeClass('active');
    $(`.nav-item[onclick*="${viewId}"]`).addClass('active');

    if (viewId === 'eventsView') {
        loadEvents();
    }
}