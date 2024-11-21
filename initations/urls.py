from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views  # Import the views
from .views import EventViewSet, GuestViewSet

# Create the router and register the viewsets
router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'guests', GuestViewSet, basename='guest')

# Combine all URL patterns
urlpatterns = [
    path('', include(router.urls)),  # Include the router URLs
    path('invitations/<str:token>/', views.get_invitation, name='get_invitation'),  # Add the additional URL
]