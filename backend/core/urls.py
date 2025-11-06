from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from chat import views as chat_views

router = routers.DefaultRouter()
router.register(r'conversations', chat_views.ConversationViewSet, basename='conversation')
router.register(r'messages', chat_views.MessageViewSet, basename='message')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/ai/', include('ai_module.urls')),
    path('api/auth/', include('rest_framework.urls')),
]
