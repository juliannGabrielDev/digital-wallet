from django.urls import path
from .views import RegisterView, MyContactListView, UserContactListView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/contacts/', MyContactListView.as_view(), name='my-contact-list'),
    path('<uuid:user_id>/contacts/', UserContactListView.as_view(), name='user-contact-list'),
]
