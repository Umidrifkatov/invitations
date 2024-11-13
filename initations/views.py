# views.py
from django.forms import ValidationError
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from urllib.parse import parse_qs
import json

from .models import Event, Guest
from .serializers import EventSerializer, GuestSerializer

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer

    def get_telegram_id(self):
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
        serializer.save(telegram_id=telegram_id)





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
    @action(detail=False, methods=['get'], url_path='event/(?P<event_id>\d+)')
    def event_guests(self, request, event_id=None):
        guests = self.queryset.filter(event=event_id)
        serializer = self.get_serializer(guests, many=True)
        return Response(serializer.data)