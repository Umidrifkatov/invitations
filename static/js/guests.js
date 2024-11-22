



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
        const $guestSection = $('#eventDetails1 .addguestform');
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
        const $guestSection = $('#eventDetails1 .addguestform');
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
    return $('#eventDetails1').data('event-id');
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
                        <small class="">Добавлен(а): ${formatDate(guest.created_at)}</small>    
                    </div>
                    <div class="d-flex gap-2">
                        <button 
                            onclick="copyInviteLink('${guest.invite_token}', '${escapeHtml(guest.name)}')"
                            class="btn btn-sm btn-outline-secondary"
                            title="Копировать приглашение"
                        >
                            <i class="bi bi-share"></i>
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





function addGuest(eventId) {
    const formHtml = `
        <div class="guest-form mt-2 mb-3">
            <div class="input-group">
                <input type="text" class="form-control tg-input" placeholder="Имя гостя" id="guestName">
                <button class="tg-button" type="button" style="width: auto;" id="addGuestBtn">Добавить</button>
            </div>
        </div>
    `;

    // Добавляем форму и настраиваем обработчики
    const $guestSection = $('#eventDetails1 .addguestform');
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


async function copyInviteLink(token, guestName) {
    try {
        const botUsername = 'Taklif96bot';
        const inviteLink = `https://t.me/${botUsername}?startapp=invite_${token}`;
        
        // Создаем текст сообщения в HTML формате для Telegram
        const messageText = `Hurmatli ${guestName}!


Taklifnoma:
${inviteLink}`;
        
        // Копируем текст
        await navigator.clipboard.writeText(messageText);
          
    } catch (err) {
        console.error('Failed to copy:', err);
    }
 }



// Обновленная функция отображения приглашения
function showInvitation(invitation) {
    showView('detailsView');
    const $details = $('#eventDetails');
    
    let mapLinkHtml = '';
    if (invitation.event.map_link) {
        const [lat, lon] = invitation.event.map_link.split(',').map(coord => coord.trim());
        const yandexMapUrl = `https://yandex.ru/maps/?pt=${lon},${lat}&z=17&l=map`;
        mapLinkHtml = `
            <p class="mb-2">
                <a href="${yandexMapUrl}" target="_blank" class="btn-outline-primary text-decoration-none">
                    <strong><i class="bi bi-geo-alt"></i> Xaritada ko\'rish </strong>
                </a>
            </p>`;
    }

    // Получаем выбранный стиль из данных приглашения
    const style = invitation.event.color_scheme || 'classic';
    
    // Применяем соответствующий шаблон
    $details.html(invitationTemplates[style](invitation, mapLinkHtml));
    
    // Добавляем класс стиля к контейнеру
    $details.removeClass('classic elegant modern').addClass(style);}


























        const invitationTemplates = {
            classic: function (invitation, mapLinkHtml) {
                // Hide navigation
                $('.nav-bottom').hide();
                // Remove classes and styles from #app, keeping only max-width
                $('#app').removeClass();
                $('#app').removeAttr('style');
        
                const backgroundStyle = invitation.event.background_image_url
                    ? `background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${invitation.event.background_image_url}');
                       background-size: cover;
                       background-position: center;
                       background-attachment: fixed;
                       min-height: 100vh;`
                    : '';
        
                const textShadowStyle = `text-shadow: 1px 1px 1px rgba(255,255,255,0.5);`;
        
                const formattedDate = formatDateUz(invitation.event.date);
                
                let mapLinkHtml = '';
                if (invitation.event.map_link) {
                    const [lat, lon] = invitation.event.map_link.split(',').map(coord => coord.trim());
                    const yandexMapUrl = `https://yandex.ru/maps/?pt=${lon},${lat}&z=17&l=map`;
            
                }




                return `
                    <div style="${backgroundStyle}" class="px-4">
                        <div class="text-center pt-5">
                            <div class="mb-4 pt-5">
                                <div class="mb-3" style="font-size: 1.5rem; color: white; ${textShadowStyle}">
                                    Qadrli ${escapeHtml(invitation.guest.name)}
                                </div>
                                ${
                                    invitation.event.description
                                        ? `<div class="mb-4" style="font-size: 1.3rem; color: white; ${textShadowStyle}">
                                            ${escapeHtml(invitation.event.description)}
                                        </div>`
                                        : ''
                                }
                            </div>
                            
                            <div class="mx-auto pt-5" style="max-width: 600px">
                                <div class="row mb-5">
                                    <div class="col-6">
                                        <p class="mb-4">
                                            <i class="bi bi-calendar-event h4 mb-2" style="color: white; ${textShadowStyle}"></i><br>
                                            <strong style="color: white; font-size: 1.3rem; ${textShadowStyle}">Vaqt</strong><br>
                                            <span style="font-size: 1.2rem; color: white; ${textShadowStyle}">
                                                ${formattedDate}
                                            </span>
                                        </p>
                                    </div>
                                    <div class="col-6">
                                        <p class="mb-4">
                                            <i class="bi bi-geo-alt h4 mb-2" style="color: white; ${textShadowStyle}"></i><br>
                                            <strong style="color: white; font-size: 1.3rem; ${textShadowStyle}">Manzil</strong><br>
                                            <span style="font-size: 1.2rem; color: white; ${textShadowStyle}">
                                                ${escapeHtml(invitation.event.location)}
                                            </span>
                                        </p>
                                    </div>
                                </div>


                                


                                <div class="mt-4 text-center ">
                                    <a class="btn btn-outline-light btn-lg w-100" href="${yandexMapUrl}" target="_blank">
                                        <i class="bi bi-geo-alt"></i> Xaritada manzilni ko‘rish
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div> 
                `;
            }
        };
        
        // Helper function for formatting date to Uzbek style
        function formatDateUz(date) {
            const options = { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric' };
            const uzDate = new Date(date).toLocaleDateString('uz-UZ', options);
            return uzDate.replace(',', '').replace(' soat', ' soat') + ' da';
        }
        