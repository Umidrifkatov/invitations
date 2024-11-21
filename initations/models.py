from django.db import models
from django.core.validators import FileExtensionValidator
from django.forms import ValidationError

class Event(models.Model):
    SCHEME_CHOICES = [
        ('classic', 'Классическая'),
        ('elegant', 'Элегантная'),
        ('modern', 'Современная'),
    ]

    telegram_id = models.CharField(max_length=100)  # Creator's Telegram ID
    title = models.CharField(max_length=255)
    date = models.DateTimeField()
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    map_link = models.CharField(max_length=500, blank=True, null=True)
    
    # Новые поля
    color_scheme = models.CharField(
        max_length=20, 
        choices=SCHEME_CHOICES,
        default='classic'
    )
    has_table = models.BooleanField(default=False)  # Для переключателя стола


    background_image = models.ImageField(
        upload_to='event_backgrounds/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])]
    )
    
    def clean(self):
        if self.background_image and self.background_image.size > 5*1024*1024:  # 5MB
            raise ValidationError('Изображение должно быть меньше 5MB')


    def __str__(self):
        return self.title


    




class Guest(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='guests')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    invite_token = models.CharField(max_length=50, unique=True, blank=True)  # Добавляем поле для токена


    def save(self, *args, **kwargs):
        if not self.invite_token:
            # Генерируем уникальный токен при создании
            import uuid
            self.invite_token = str(uuid.uuid4())[:8]
        super().save(*args, **kwargs)


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
    

    @classmethod
    def get_by_token(cls, token):
        try:
            return cls.objects.select_related('event').get(invite_token=token)
        except cls.DoesNotExist:
            return None
