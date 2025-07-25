# Generated by Django 5.1.7 on 2025-05-11 16:28

import furniture.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('furniture', '0006_journalentry_unique_title_date'),
    ]

    operations = [
        migrations.CreateModel(
            name='Inquiry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full_name', models.CharField(max_length=100)),
                ('phone', models.CharField(max_length=15)),
                ('email', models.EmailField(max_length=254)),
                ('project_type', models.CharField(choices=[('wood-structure', 'Wood Structure'), ('custom_furniture', 'Custom Furniture'), ('other', 'Other')], max_length=20)),
                ('other_project', models.CharField(blank=True, max_length=200)),
                ('project_description', models.TextField()),
                ('image', models.ImageField(blank=True, null=True, upload_to=furniture.models.inquiry_image_path)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [models.Index(fields=['created_at'], name='furniture_i_created_b5854e_idx'), models.Index(fields=['project_type'], name='furniture_i_project_4000df_idx')],
            },
        ),
    ]
