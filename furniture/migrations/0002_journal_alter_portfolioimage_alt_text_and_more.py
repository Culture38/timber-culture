# Generated by Django 5.1.7 on 2025-05-08 18:49

import furniture.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('furniture', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Journal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('date', models.DateField()),
                ('image', models.ImageField(blank=True, null=True, upload_to=furniture.models.journal_image_path)),
                ('category', models.CharField(choices=[('inspiration', 'Inspiration'), ('tutorials', 'Tutorials'), ('updates', 'Updates')], max_length=20)),
                ('excerpt', models.TextField(max_length=500)),
                ('full_content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-date'],
            },
        ),
        migrations.AlterField(
            model_name='portfolioimage',
            name='alt_text',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AlterField(
            model_name='portfolioimage',
            name='image',
            field=models.ImageField(upload_to=furniture.models.portfolio_image_path),
        ),
    ]
