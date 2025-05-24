from rest_framework import serializers
from .models import JournalEntry

class JournalEntrySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = JournalEntry
        fields = ['id', 'title', 'slug', 'date', 'image', 'category', 'excerpt', 'full_content']

    def get_image(self, obj):
        return obj.image.url if obj.image else '/static/furniture/images/fallback.png'