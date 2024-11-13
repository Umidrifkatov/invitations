



// Функция загрузки гостей
async function loadGuests(eventId) {
    try {
        // Используем новый endpoint для получения гостей конкретного события
        const response = await fetch(`/api/guests/event/${eventId}/`, {
            headers: {
                'X-Telegram-Init-Data': tg.initData
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch guests');
        const guests = await response.json();
        
        console.log('Loaded guests:', guests); // Для отладки
        
        // Обновляем секцию с гостями
        const $guestSection = $('#eventDetails .addguestform');
        $guestSection.html(`
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="h5 mb-0">Количество гостей (${guests.length})</h4>
                <button onclick="addGuest(${eventId})" class="btn btn-lg btn-outline-primary">
                    <i class="bi bi-plus"></i> 
                </button>
            </div>
            ${renderGuests(guests)}
        `);
    } catch (error) {
        console.error('Error loading guests:', error);
        const $guestSection = $('#eventDetails .addguestform');
        $guestSection.html(`
            <div class="alert alert-danger">
                Failed to load guests. <button onclick="loadGuests(${eventId})" class="btn btn-sm btn-link">Try again</button>
            </div>
        `);
    }
}



async function deleteGuest(guestId, e) {
    e.stopPropagation(); // Предотвращаем всплытие события

    try {
        const response = await fetch(`/api/guests/${guestId}/`, {
            method: 'DELETE',
            headers: {
                'X-Telegram-Init-Data': tg.initData
            }
        });

        if (!response.ok) throw new Error('Failed to delete guest');

        // После успешного удаления перезагружаем список гостей
        // Получаем eventId из URL или data-атрибута
        const eventId = getCurrentEventId(); // Нужно реализовать эту функцию
        await loadGuests(eventId);

    } catch (error) {
        console.error('Error deleting guest:', error);
        tg.showAlert('Failed to delete guest');
    }
}

// Функция получения текущего eventId
function getCurrentEventId() {
    // Можно хранить в data-атрибуте на странице или в URL
    return $('#eventDetails').data('event-id');
}


function renderGuests(guests) {
    if (!guests || guests.length === 0) {
        return '<p class="mx-auto">Нет добавленных гостей</p>';
    }

    return `
        <div class="list-group mt-3">
            ${guests.map(guest => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <h4 class="basictext">${escapeHtml(guest.name)}</h4>
                        
                        <small class="">Добавлено: ${formatDate(guest.created_at)}</small>    
                        
                    </div>
                    <div class="d-flex gap-2">
                        <button 
                            onclick="copyGuest('${escapeHtml(guest.name)}')" 
                            class="btn btn-sm btn-outline-secondary"
                            title="Копировать имя"
                        >
                            <i class="bi bi-clipboard"></i>
                        </button>
                        <button 
                            onclick="deleteGuest(${guest.id}, event)" 
                            class="btn btn-sm btn-outline-danger"
                            title="Удалить"
                        >
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Функция для копирования имени гостя
async function copyGuest(name) {
    try {
        await navigator.clipboard.writeText(name);
        tg.showPopup({
            message: 'Имя скопировано',
            buttons: [{ type: 'ok' }]
        });
    } catch (err) {
        console.error('Failed to copy:', err);
        tg.showPopup({
            message: 'Не удалось скопировать имя',
            buttons: [{ type: 'ok' }]
        });
    }
}




function addGuest(eventId) {
    const formHtml = `
        <div class="guest-form mt-2 mb-3">
            <div class="input-group">
                <input type="text" class="form-control tg-input" placeholder="Имя гостя" id="guestName">
                <button class="tg-button" type="button" style="width: auto;" id="addGuestBtn">+</button>
            </div>
        </div>
    `;

    // Добавляем форму и настраиваем обработчики
    const $guestSection = $('#eventDetails .addguestform');
    $guestSection.find('.tg-button').last().hide(); // Скрываем только кнопку "Add Guest"
    $guestSection.append(formHtml);

    // Обработчик добавления гостя
    async function handleAddGuest() {
        const name = $('#guestName').val().trim();
        if (!name) return;

        const $btn = $('#addGuestBtn');
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

        try {
            const response = await fetch('/api/guests/', {
                method: 'POST',
                headers: {
                    'X-Telegram-Init-Data': tg.initData,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event: eventId,
                    name: name

                })
            });

            if (!response.ok) throw new Error('Failed to add guest');
            
            // После успешного добавления обновляем детали события
            await showEventDetails(eventId);
        } catch (error) {
            console.error('Error:', error);
            tg.showAlert('Failed to add guest');
            $btn.prop('disabled', false).text('Add');
        }
    }

    // Добавляем обработчики событий
    $('#addGuestBtn').click(handleAddGuest);
    $('#guestName').keypress(function(e) {
        if (e.which === 13) { // Enter key
            handleAddGuest();
        }
    });

    $('#guestName').focus();
}