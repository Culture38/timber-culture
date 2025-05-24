from django.urls import path
from . import views

urlpatterns = [
    # Main site routes
    path('', views.landing, name='landing'),
    path('portfolio/', views.portfolio, name='portfolio'),
    path('about/', views.about, name='about'),
    path('journal/', views.journal, name='journal'),
    path('contact/', views.contact, name='contact'),
    path('subscribe/', views.subscribe, name='subscribe'),
    path('submit_inquiry/', views.submit_inquiry, name='submit_inquiry'),
    
    # Journal detail route
    path('journal/<int:id>/<slug:slug>/', views.journal_detail, name='journal_detail'),
    
    # API routes
    path('api/portfolio/', views.portfolio_api, name='portfolio_api'),
    path('api/portfolio/<int:project_id>/like/', views.like_portfolio_item, name='like_portfolio'),
    path('journal-api/', views.journal_api, name='journal_api'),
]