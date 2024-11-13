
function loadSettings() {
    const notifications = localStorage.getItem('notifications') === 'true';
    $('#notificationToggle').prop('checked', notifications);

    $('#notificationToggle').on('change', function() {
        localStorage.setItem('notifications', this.checked);
    });
}

function changeLanguage() {
    tg.showPopup({
        title: 'Change Language',
        message: 'Select your preferred language:',
        buttons: [
            { id: 'en', type: 'default', text: 'English' },
            { id: 'es', type: 'default', text: 'Español' },
            { id: 'ru', type: 'default', text: 'Русский' },
            { type: 'cancel' }
        ]
    }, (buttonId) => {
        if (buttonId && buttonId !== 'cancel') {
            localStorage.setItem('language', buttonId);
            tg.showAlert('Language updated successfully');
        }
    });
}

