# serializers.py
from rest_framework import serializers
from .models import Event, Guest


from rest_framework import serializers
from .models import Event, Guest

class EventSerializer(serializers.ModelSerializer):
    guests_count = serializers.SerializerMethodField()
    background_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 
            'title', 
            'date', 
            'location', 
            'description', 
            'guests_count', 
            'map_link',
            'color_scheme',
            'has_table',
            'background_image',
            'background_image_url'
        ]

    def get_guests_count(self, obj):
        return obj.guests.count()

    def get_background_image_url(self, obj):
        if obj.background_image:
            return obj.background_image.url
        return None




class GuestSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Guest
        fields = ['id', 'event', 'name', 'created_at', 'invite_token']

    

