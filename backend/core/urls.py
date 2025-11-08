from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from chat import views as chat_views
from django.http import JsonResponse


router = routers.DefaultRouter()
router.register(r'conversations', chat_views.ConversationViewSet, basename='conversation')
router.register(r'messages', chat_views.MessageViewSet, basename='message')

def home(request):
    return JsonResponse({'message': 'AI Chat API is running 🚀'})

urlpatterns = [
     path('', home),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/ai/', include('ai_module.urls')),
    path('api/auth/', include('rest_framework.urls')),
]
