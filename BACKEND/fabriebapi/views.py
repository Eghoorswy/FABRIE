# fabrieapi/views.py

from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

def home_view(request):
    return HttpResponse("Welcome to FABRIE Backend API")

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({"detail": "CSRF cookie set"})