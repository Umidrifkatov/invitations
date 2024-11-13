# serializers.py
from rest_framework import serializers
from .models import Event, Guest

class EventSerializer(serializers.ModelSerializer):
    guests_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ['id', 'title', 'date', 'location', 'description', 'guests_count']

    def get_guests_count(self, obj):
        return obj.guests.count()

class GuestSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)  # Для отображения времени добавления

    class Meta:
        model = Guest
        fields = ['id', 'event', 'name', 'created_at']