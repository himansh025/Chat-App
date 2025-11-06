from django.urls import path
from . import views

urlpatterns = [
    path('query/', views.AIQueryView.as_view(), name='ai-query'),
    path('search/', views.SemanticSearchView.as_view(), name='semantic-search'),
    path('reindex/', views.ReindexView.as_view(), name='reindex'),
]