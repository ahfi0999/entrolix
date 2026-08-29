from django.test import TestCase
from rest_framework.test import APIClient


class InquiryApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_accepts_valid_inquiry(self):
        response = self.client.post('/api/inquiries/', {
            'name': 'Jane Smith',
            'email': 'jane@example.com',
            'message': 'We need help modernizing our customer platform.',
            'website': '',
        }, format='json')
        self.assertEqual(response.status_code, 201)

    def test_rejects_short_message(self):
        response = self.client.post('/api/inquiries/', {
            'name': 'Jane Smith', 'email': 'jane@example.com', 'message': 'Too short'
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_rejects_honeypot(self):
        response = self.client.post('/api/inquiries/', {
            'name': 'Spam Bot', 'email': 'bot@example.com',
            'message': 'This message is long enough to pass validation.',
            'website': 'https://spam.example',
        }, format='json')
        self.assertEqual(response.status_code, 400)
