from django.db import models
from django.utils.text import slugify
from datetime import datetime
import os
from uuid import uuid4
from django_ckeditor_5.fields import CKEditor5Field

def portfolio_image_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    title = slugify(instance.portfolio_item.title)
    base_filename = f"{title}{ext}"
    upload_dir = 'portfolio_images'
    existing_images = PortfolioImage.objects.filter(portfolio_item=instance.portfolio_item).exclude(id=instance.id)
    if not existing_images.filter(image__endswith=base_filename).exists():
        return os.path.join(upload_dir, base_filename)
    suffix = uuid4().hex[:8]
    unique_filename = f"{title}_{suffix}{ext}"
    return os.path.join(upload_dir, unique_filename)

def journal_image_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    title = slugify(instance.title)
    base_filename = f"{title}{ext}"
    upload_dir = 'journal_images'
    existing_images = JournalEntry.objects.filter(image__endswith=base_filename).exclude(id=instance.id)
    if not existing_images.exists():
        return os.path.join(upload_dir, base_filename)
    suffix = uuid4().hex[:8]
    unique_filename = f"{title}_{suffix}{ext}"
    return os.path.join(upload_dir, unique_filename)

def inquiry_image_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    name = slugify(instance.full_name)
    base_filename = f"{name}{ext}"
    upload_dir = f'inquiry_images/{datetime.now().strftime("%Y/%m")}'
    existing_images = Inquiry.objects.filter(image__endswith=base_filename).exclude(id=instance.id)
    if not existing_images.exists():
        return os.path.join(upload_dir, base_filename)
    suffix = uuid4().hex[:8]
    unique_filename = f"{name}_{suffix}{ext}"
    return os.path.join(upload_dir, unique_filename)

class PortfolioItem(models.Model):
    title = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    popularity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['popularity']),
            models.Index(fields=['created_at']),
        ]

class PortfolioImage(models.Model):
    portfolio_item = models.ForeignKey(PortfolioItem, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to=portfolio_image_path)
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.portfolio_item.title} - {self.alt_text or 'Image'}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['portfolio_item', 'is_primary'],
                condition=models.Q(is_primary=True),
                name='unique_primary_image_per_portfolio'
            )
        ]

class JournalEntry(models.Model):
    CATEGORY_CHOICES = (
        ('inspiration', 'Inspiration'),
        ('tutorials', 'Tutorials'),
        ('updates', 'Updates'),
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    date = models.DateField()
    image = models.ImageField(upload_to=journal_image_path, blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    excerpt = models.TextField(max_length=500)
    full_content = CKEditor5Field(config_name='default')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while JournalEntry.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-date']
        constraints = [
            models.UniqueConstraint(fields=['title', 'date'], name='unique_title_date'),
        ]
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['category']),
        ]

class Inquiry(models.Model):
    PROJECT_TYPE_CHOICES = (
        ('wood-structure', 'Wood Structure'),
        ('custom_furniture', 'Custom Furniture'),
        ('other', 'Other'),
    )
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    email = models.EmailField()
    project_type = models.CharField(max_length=20, choices=PROJECT_TYPE_CHOICES)
    other_project = models.CharField(max_length=200, blank=True)
    project_description = models.TextField()
    image = models.ImageField(upload_to=inquiry_image_path, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)

    def __str__(self):
        return f"Inquiry from {self.full_name} - {self.project_type}"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['project_type']),
        ]

class Subscriber(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} (Subscribed: {self.created_at.strftime('%Y-%m-%d')})"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['created_at']),
        ]