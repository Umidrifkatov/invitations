from django.db import models

class Event(models.Model):
    telegram_id = models.CharField(max_length=100)  # Creator's Telegram ID
    title = models.CharField(max_length=255)
    date = models.DateTimeField()
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title










class Guest(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='guests')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def get_queryset(cls):
        # Возвращаем QuerySet со всеми гостями, отсортированными по дате создания
        return cls.objects.all().order_by('-created_at')

    class Meta:
        ordering = ['-created_at']  # Сортировка по умолчанию
        verbose_name = 'Guest'
        verbose_name_plural = 'Guests'

    def __str__(self):
        # Строковое представление для админки и отладки
        return f"{self.name} - {self.event.title}"

    @classmethod
    def get_event_guests(cls, event_id):
        # Получить всех гостей конкретного события
        return cls.objects.filter(event_id=event_id).order_by('-created_at')

    @property
    def created_at_formatted(self):
        # Форматированная дата для отображения
        return self.created_at.strftime("%d %b %Y %H:%M")
