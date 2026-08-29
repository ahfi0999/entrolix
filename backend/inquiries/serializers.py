from rest_framework import serializers
from .models import Inquiry

class InquirySerializer(serializers.ModelSerializer):
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Inquiry
        fields = ['id', 'name', 'email', 'message', 'website', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError('Please enter your full name.')
        return value

    def validate_message(self, value):
        value = value.strip()
        if len(value) < 20:
            raise serializers.ValidationError('Please provide at least 20 characters.')
        if len(value) > 5000:
            raise serializers.ValidationError('Please keep your message under 5,000 characters.')
        return value

    def validate(self, attrs):
        if attrs.pop('website', ''):
            raise serializers.ValidationError('Unable to accept this submission.')
        return attrs
