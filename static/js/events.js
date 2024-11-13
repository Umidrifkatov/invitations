// Загрузка списка всех событий
async function loadEvents() {
    const $eventsList = $('#eventsList');
    // Показываем индикатор загрузки
    $eventsList.html('<div class="loading"></div>');
    
    try {
        // Отправляем запрос на получение списка событий
        // Добавляем данные инициализации Telegram для авторизации
        const response = await fetch('/api/events/', {
            headers: {
                'X-Telegram-Init-Data': tg.initData
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        
        // Проверяем, есть ли пагинация в ответе
        const events = data.results || data;
        
        // Проверяем что данные - это массив
        if (!Array.isArray(events)) {
            console.error('Events data is not an array:', events);
            throw new Error('Invalid events data format');
        }
        
        // Если событий нет - показываем сообщение и кнопку создания
        if (events.length === 0) {
            $eventsList.html(`
                <div class="text-center py-4">
                    <p class="text-muted">No events yet</p>
                    <button onclick="showView('createView')" class="tg-button">
                        Create Your First Event
                    </button>
                </div>
            `);
            return;
        }
        
        // Формируем HTML для каждого события
        // Для каждого события создаем карточку с основной информацией
        const eventCards = events.map(event => `
            <div class="event-card">
                <div class="d-flex justify-content-between align-items-start">
                    <div onclick="showEventDetails(${event.id})" style="flex: 1; cursor: pointer;">
                        <h1 class="h5 mb-1">${escapeHtml(event.title)}</h1>
                        <p class="mb-1 text">${formatDate(event.date)}</p>
                        <p class="mb-0 small">${escapeHtml(event.location)}</p>
                    </div>
                    <div class="d-flex flex-column align-items-end gap-2">
                        <span class="badge bg-outline">
                            ${event.guests_count || 0} Гостей
                        </span>
                        <button 
                            class="btn btn-sm btn-outline-danger" 
                            onclick="deleteEvent(${event.id}, event)"
                            style="padding: 0.25rem 0.5rem;"
                        >
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Вставляем сгенерированный HTML на страницу
        $eventsList.html(eventCards);
    } catch (error) {
        // В случае ошибки показываем сообщение и кнопку повторной загрузки
        console.error('Failed to load events:', error);
        $eventsList.html(`
            <div class="text-danger py-4 text-center">
                <p>Failed to load events: ${error.message}</p>
                <button onclick="loadEvents()" class="tg-button">Try Again</button>
            </div>
        `);
    }
}

// Обработка создания нового события
async function handleCreateEvent(event) {
    event.preventDefault();
    const $form = $('#createEventForm');
    const $submitBtn = $('#submitButton');
    
    try {
        // Блокируем кнопку отправки и показываем спиннер
        $submitBtn.prop('disabled', true).html(
            '<span class="spinner-border spinner-border-sm me-2"></span>Creating...'
        );
        
        // Собираем данные формы
        const formData = new FormData($form[0]);
        const jsonData = Object.fromEntries(formData.entries());
        
        // Отправляем запрос на создание события
        const response = await fetch('/api/events/', {
            method: 'POST',
            headers: {
                'X-Telegram-Init-Data': tg.initData,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create event');
        }
        
        // Показываем сообщение об успехе через Telegram UI
        tg.showPopup({
            title: 'Success!',
            message: 'Event created successfully',
            buttons: [{ type: 'ok' }]
        });
        
        // Очищаем форму и возвращаемся к списку событий
        $form[0].reset();
        showView('eventsView');
        
    } catch (error) {
        // Показываем ошибку через Telegram UI
        console.error('Error creating event:', error);
        tg.showPopup({
            title: 'Error',
            message: error.message || 'Failed to create event',
            buttons: [{ type: 'ok' }]
        });
    } finally {
        // Возвращаем кнопку в исходное состояние
        $submitBtn.prop('disabled', false).text('Create Event');
    }
    
    return false;
}

// Показ детальной информации о событии
// Функция отображения деталей события


// Обновленная функция showEventDetails
async function showEventDetails(eventId) {
    showView('detailsView');
    const $details = $('#eventDetails');
    $details.data('event-id', eventId); // Сохраняем eventId
    $details.html('<div class="loading"></div>');
    
    try {
        const response = await fetch(`/api/events/${eventId}/`, {
            headers: {
                'X-Telegram-Init-Data': tg.initData
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch event details');
        const event = await response.json();
        
        // Обновляем HTML с деталями события
        $details.html(`
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 class="h4 mb-0">${escapeHtml(event.title)}</h3>
                
            </div>
            <div class="container p-2">
                
                    <div class="card-body">
                        <p class="mb-2"><strong>Дата и время:</strong> ${formatDate(event.date)}</p>
                        <p class="mb-2"><strong>Адрес и ориентир:</strong> ${escapeHtml(event.location)}</p>
                        ${event.description ? `<p class="mb-4">${escapeHtml(event.description)}</p>` : ''}
                        
                        <div class="mb-4 addguestform">
                            <div class="loading"></div>
                        </div>
                    </div>
                
            </div>
        `);

        // Загружаем гостей отдельным запросом
        loadGuests(eventId);

    } catch (error) {
        console.error('Error loading event details:', error);
        $details.html(`
            <div class="text-danger py-4 text-center">
                <p>Failed to load event details</p>
                <button onclick="showView('eventsView')" class="tg-button">
                    Back to Events
                </button>
            </div>
        `);
    }
}