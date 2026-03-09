from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from . import worldbank as wb


# ─── Auth ────────────────────────────────────────────────────────────────────

class CSRFView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "")
        password = request.data.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return Response({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
            })
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"message": "Logged out successfully"})


class MeView(APIView):
    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
        })


# ─── Dashboard Data ───────────────────────────────────────────────────────────

class IndicatorsListView(APIView):
    def get(self, request):
        return Response({
            "indicators": {k: {"label": v["label"], "unit": v["unit"]}
                           for k, v in wb.INDICATORS.items()},
            "countries": wb.COUNTRIES,
        })


class SummaryView(APIView):
    def get(self, request):
        country = request.query_params.get("country", "US").upper()
        data = wb.get_dashboard_summary(country)
        return Response(data)


class TimeSeriesView(APIView):
    def get(self, request):
        indicator = request.query_params.get("indicator", "gdp_growth")
        country   = request.query_params.get("country", "US").upper()
        start     = int(request.query_params.get("start", 2000))
        end       = int(request.query_params.get("end", 2023))
        data = wb.get_indicator_timeseries(indicator, country, start, end)
        return Response(data)


class ComparisonView(APIView):
    def get(self, request):
        indicator = request.query_params.get("indicator", "gdp_per_capita")
        countries = request.query_params.get("countries", "US;CN;IN;GB;DE;JP;BR;CA").split(";")
        year      = int(request.query_params.get("year", 2022))
        data = wb.get_multi_country_comparison(indicator, [c.upper() for c in countries], year)
        return Response(data)


class ScatterView(APIView):
    def get(self, request):
        x = request.query_params.get("x", "gdp_per_capita")
        y = request.query_params.get("y", "life_expectancy")
        year = int(request.query_params.get("year", 2021))
        data = wb.get_scatter_data(x, y, year=year)
        return Response(data)
