# views.py
from django.forms import ValidationError
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from urllib.parse import parse_qs
import json

from .models import Event, Guest
from .serializers import EventSerializer, GuestSerializer






class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    

    def get_telegram_id(self):
        print(self.request)
        try:
            telegram_data = self.request.headers.get('X-Telegram-Init-Data', '')
            data_dict = parse_qs(telegram_data)
            user_data = json.loads(data_dict.get('user', ['{}'])[0])
            return str(user_data.get('id'))
        except:
            return None

    def get_queryset(self):
        telegram_id = self.get_telegram_id()
        if not telegram_id:
            return Event.objects.none()
        return Event.objects.filter(telegram_id=telegram_id)

    def perform_create(self, serializer):
        telegram_id = self.get_telegram_id()
        if not telegram_id:
            raise ValidationError("Invalid Telegram user")
            
        color_scheme = self.request.data.get('color_scheme', 'classic')
        has_table = self.request.data.get('has_table') == 'true'
        
        # Создаем событие
        event = serializer.save(
            telegram_id=telegram_id,
            color_scheme=color_scheme,
            has_table=has_table
        )
        
        # Обрабатываем изображение
        if 'background_image' in self.request.FILES:
            try:
                event.background_image = self.request.FILES['background_image']
                event.save()
                print(f"Image saved: {event.background_image.url}")
            except Exception as e:
                print(f"Error saving image: {str(e)}")
    
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            # Проверяем, принадлежит ли событие текущему пользователю
            if str(instance.telegram_id) != self.get_telegram_id():
                return Response(
                    {"error": "You don't have permission to delete this event"}, 
                    status=403
                )
            
            # Удаляем событие
            self.perform_destroy(instance)
            return Response(status=204)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=400
            )




class GuestViewSet(viewsets.ModelViewSet):
    serializer_class = GuestSerializer
    queryset = Guest.objects.all().order_by('-created_at')

    def get_queryset(self):
        queryset = super().get_queryset()
        event_id = self.request.query_params.get('event_id')
        if event_id:
            queryset = queryset.filter(event=event_id)
        return queryset

    # Добавляем специальный endpoint для гостей события
    @action(detail=False, methods=['get'], url_path=r'event/(?P<event_id>\d+)')
    def event_guests(self, request, event_id=None):
        guests = self.queryset.filter(event=event_id)
        serializer = self.get_serializer(guests, many=True)
        return Response(serializer.data)
    



@api_view(['GET'])
def get_invitation(request, token):
    print(f"Searching for token: {token}")  # Логируем искомый токен
    
    # Выведем все существующие токены для отладки
    all_tokens = Guest.objects.values_list('invite_token', flat=True)
    print(f"Available tokens: {list(all_tokens)}")
    
    try:
        guest = Guest.objects.select_related('event').get(invite_token=token)
        print(f"Found guest: {guest.name} for event: {guest.event.title}")
        
        return Response({
            'event': EventSerializer(guest.event).data,
            'guest': GuestSerializer(guest).data
        })
    except Guest.DoesNotExist:
        print(f"No guest found with token: {token}")
        return Response({'error': 'Invitation not found'}, status=404)
    except Exception as e:
        print(f"Error: {str(e)}")
        return Response({'error': str(e)}, status=500)