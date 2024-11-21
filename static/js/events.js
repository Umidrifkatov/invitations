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
                    <p class="text-muted">Нет мероприятий</p>
                    <button onclick="showView('createView')" class="tg-button">
                        Создать
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











async function handleCreateEvent(event) {
    event.preventDefault();
    const $form = $('#createEventForm');
    const $submitBtn = $('#submitButton');
    
    try {
        // Валидация координат
        const mapLink = $form.find('[name="map_link"]').val().trim();
        if (mapLink) {
            const coords = mapLink.split(',').map(coord => parseFloat(coord.trim()));
            
            if (coords.length !== 2 || 
                isNaN(coords[0]) || 
                isNaN(coords[1]) || 
                coords[0] < -90 || 
                coords[0] > 90 || 
                coords[1] < -180 || 
                coords[1] > 180) {
                
                tg.showPopup({
                    title: 'Ошибка',
                    message: 'Введите координаты в формате: 41.302789, 69.226394',
                    buttons: [{ type: 'ok' }]
                });
                return false;
            }
        }
        
        $submitBtn.prop('disabled', true).html(
            '<span class="spinner-border spinner-border-sm me-2"></span>Создание...'
        );
        
        const formData = new FormData($form[0]);
        
        // Добавляем значения переключателей
        formData.append('has_table', $('#tableToggle').is(':checked'));
        
        // Если файл не выбран или переключатель выключен, удаляем поле файла
        if (!$('#imageToggle').is(':checked')) {
            formData.delete('background_image');
        }

        // Если координаты введены, форматируем их
        if (formData.get('map_link')) {
            const [lat, lon] = formData.get('map_link').split(',').map(coord => parseFloat(coord.trim()));
            formData.set('map_link', `${lat}, ${lon}`);
        }
        
    
    
    // Проверяем файл и переключатель
    const imageFile = $('#imageInput')[0].files[0];
    if ($('#imageToggle').is(':checked') && imageFile) {
        formData.set('background_image', imageFile);
    } else {
        formData.delete('background_image');
    }
    
    // Отправка без Content-Type
    const response = await fetch('/api/events/', {
        method: 'POST',
        headers: {
            'X-Telegram-Init-Data': tg.initData
        },
        body: formData
    });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Не удалось создать событие');
        }
        
        $form[0].reset();
        showView('eventsView');
        
    } catch (error) {
        console.error('Error creating event:', error);
        tg.showPopup({
            title: 'Ошибка',
            message: error.message || 'Не удалось создать событие',
            buttons: [{ type: 'ok' }]
        });
    } finally {
        $submitBtn.prop('disabled', false).text('Создать');
    }
    
    return false;
}












// Показ детальной информации о событии
async function showEventDetails(eventId) {
    showView('detailsView1');
    const $details = $('#eventDetails1');
    $details.data('event-id', eventId);
    $details.html('<div class="loading"></div>');
    
    try {
        const response = await fetch(`/api/events/${eventId}/`, {
            headers: {
                'X-Telegram-Init-Data': tg.initData
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch event details');
        const event = await response.json();
        
        // Формируем ссылку на Яндекс Карты из координат
        let mapLinkHtml = '';
        if (event.map_link) {
            const [lat, lon] = event.map_link.split(',').map(coord => coord.trim());
            const yandexMapUrl = `https://yandex.ru/maps/?pt=${lon},${lat}&z=17&l=map`;
            mapLinkHtml = `
                <p class="mb-2">
                    
                    <a href="${yandexMapUrl}" target="_blank" class="btn-outline-primary text-decoration-none">
                       <strong> <i class="bi bi-geo-alt"></i> Местоположение на карте </strong> 
                    </a>
                    
                </p>`;
        }
 
        // Обновляем HTML с деталями события
        $details.html(`
            
                <h3 class="h4 mb-4 mt-2">${escapeHtml(event.title)}</h3>
                
            
            <div class="container p-2">
                <div class="card-body">
                    <p class="mb-2"><strong>Дата и время:</strong> ${formatDate(event.date)}</p>
                    <p class="mb-2"><strong>Адрес и ориентир:</strong> ${escapeHtml(event.location)}</p>
                    ${event.description ? `<p class="mb-4">${escapeHtml(event.description)}</p>` : ''}
                    ${mapLinkHtml}  <!-- Добавляем ссылку на карту -->
                    
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
                <p>Не удалось загрузить детали события</p>
                <button onclick="showView('eventsView')" class="tg-button">
                    Вернуться к списку
                </button>
            </div>
        `);
    }
 }




// Функция удаления события
async function deleteEvent(eventId, e) {
    e.stopPropagation(); // Предотвращаем открытие деталей события

    // Показываем подтверждение через Telegram UI
    tg.showPopup({
        title: 'Подтверждение',
        message: 'Вы уверены, что хотите удалить это событие?',
        buttons: [
            { id: 'delete', type: 'destructive', text: 'Удалить' },
            { id: 'cancel', type: 'cancel', text: 'Отмена' }
        ]
    }, async (buttonId) => {
        if (buttonId === 'delete') {
            try {
                const response = await fetch(`/api/events/${eventId}/`, {
                    method: 'DELETE',
                    headers: {
                        'X-Telegram-Init-Data': tg.initData
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to delete event');
                }

            

                // Перезагружаем список событий
                loadEvents();
            } catch (error) {
                console.error('Error deleting event:', error);
                tg.showPopup({
                    title: 'Ошибка',
                    message: 'Не удалось удалить событие',
                    buttons: [{ type: 'ok' }]
                });
            }
        }
    });
}