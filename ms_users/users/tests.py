from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import CustomUser, Contact


class ContactListAPITests(APITestCase):
	def setUp(self):
		self.owner = CustomUser.objects.create_user(
			username='owner',
			email='owner@example.com',
			password='testpass123'
		)
		self.other_user = CustomUser.objects.create_user(
			username='other',
			email='other@example.com',
			password='testpass123'
		)
		self.contact_1 = CustomUser.objects.create_user(
			username='alice',
			email='alice@example.com',
			password='testpass123'
		)
		self.contact_2 = CustomUser.objects.create_user(
			username='bob',
			email='bob@example.com',
			password='testpass123'
		)

		Contact.objects.create(owner=self.owner, contact_user=self.contact_1, alias='Alice del trabajo')
		Contact.objects.create(owner=self.owner, contact_user=self.contact_2, alias='Bob del gym')

	def test_list_my_contacts(self):
		self.client.force_authenticate(user=self.owner)
		url = reverse('my-contact-list')

		response = self.client.get(url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 2)

	def test_forbid_list_other_user_contacts(self):
		self.client.force_authenticate(user=self.other_user)
		url = reverse('user-contact-list', kwargs={'user_id': self.owner.id})

		response = self.client.get(url)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_allow_list_specific_user_contacts_when_self(self):
		self.client.force_authenticate(user=self.owner)
		url = reverse('user-contact-list', kwargs={'user_id': self.owner.id})

		response = self.client.get(url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 2)
