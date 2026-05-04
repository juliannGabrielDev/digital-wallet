from django.urls import path
from .views import make_transfer, get_balance, deactivate_card, activate_card

urlpatterns = [
    path('transfer/', make_transfer, name='make_transfer'),
    path('balance/', get_balance, name='get_balance'),
    path('deactivate/', deactivate_card, name='deactivate_card'),
    path('activate/', activate_card, name='activate_card'),
]