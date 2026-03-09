from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('csrf/',       views.CSRFView.as_view()),
    path('auth/login/', views.LoginView.as_view()),
    path('auth/logout/',views.LogoutView.as_view()),
    path('auth/me/',    views.MeView.as_view()),

    # Data
    path('indicators/', views.IndicatorsListView.as_view()),
    path('summary/',    views.SummaryView.as_view()),
    path('timeseries/', views.TimeSeriesView.as_view()),
    path('comparison/', views.ComparisonView.as_view()),
    path('scatter/',    views.ScatterView.as_view()),
]
