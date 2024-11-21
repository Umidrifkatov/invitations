const tg = window.Telegram.WebApp;
const startParam = tg.initDataUnsafe.start_param;
// Инициализация приложения
$(document).ready(function() {
    tg.ready();
    tg.expand();
    loadEvents();
    loadSettings();

    $('.scheme-option').click(function() {
        $('.scheme-option').removeClass('active');
        $(this).addClass('active');
        $('#colorScheme').val($(this).data('scheme'));
    });

    // Выбираем классическую схему по умолчанию
    $('.scheme-option[data-scheme="classic"]').click();


    //обработчик отображения поля отправки файла
    $('#imageToggle').change(function() {
        $('#imageUploadBlock').toggle(this.checked);
    });
    
    // Добавляем обработчик для отображения имени выбранного файла
    $('#imageInput').change(function() {
        const fileName = this.files[0]?.name;
        if (fileName) {
            $(this).closest('#imageUploadBlock').find('.file-name').text(fileName);
        }
    });


    if (startParam && startParam.startsWith('invite_')) {
        const inviteToken = startParam.replace('invite_', '');
        // Загружаем данные приглашения
        loadInvitation(inviteToken);
    }

});








async function loadInvitation(token) {
    try {
        const response = await fetch(`/api/invitations/${token}/`, {
            headers: {
                'X-Telegram-Init-Data': tg.initData
            }
        });
        
        if (!response.ok) throw new Error('Failed to load invitation');
        const data = await response.json();
        
        showInvitation(data);
    } catch (error) {
        console.error('Error loading invitation:', error);
        tg.showPopup({
            title: 'Ошибка',
            message: 'Не удалось загрузить приглашение',
            buttons: [{ type: 'ok' }]
        });
    }
}








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












