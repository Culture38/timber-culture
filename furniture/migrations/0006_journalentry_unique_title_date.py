# Generated by Django 5.1.7 on 2025-05-11 06:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('furniture', '0005_alter_journalentry_slug_and_more'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='journalentry',
            constraint=models.UniqueConstraint(fields=('title', 'date'), name='unique_title_date'),
        ),
    ]
