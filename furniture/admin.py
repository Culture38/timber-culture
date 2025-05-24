from django.contrib import admin
from .models import PortfolioItem, PortfolioImage, JournalEntry, Inquiry, Subscriber
from django.utils.safestring import mark_safe
from django_ckeditor_5.widgets import CKEditor5Widget
from django import forms


# Portfolio Admin
class PortfolioImageInline(admin.TabularInline):
    model = PortfolioImage
    extra = 1
    fields = ('image', 'is_primary', 'image_preview')
    readonly_fields = ('image_preview',)

    def image_preview(self, obj):
        if obj.image:
            return mark_safe(f'<img src="{obj.image.url}" style="max-width: 100px; max-height: 100px;" />')
        return "No image"
    image_preview.short_description = 'Preview'

    def save_model(self, request, obj, form, change):
        if not obj.alt_text:
            obj.alt_text = obj.portfolio_item.title
        super().save_model(request, obj, form, change)

class PortfolioItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'location', 'popularity', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'location', 'description')
    inlines = [PortfolioImageInline]
    fieldsets = (
        (None, {
            'fields': ('title', 'location', 'description', 'popularity')
        }),
    )

    class Media:
        css = {
            'all': ('furniture/css/admin.css',)
        }
        js = ('furniture/js/admin.js',)

# Journal Admin
class JournalAdminForm(forms.ModelForm):
    full_content = forms.CharField(
        widget=CKEditor5Widget(config_name='default'),
        help_text="Use <strong>Heading 2</strong> for main sections and <strong>Heading 3</strong> for subsections to generate the Table of Contents."
    )
    class Meta:
        model = JournalEntry
        fields = '__all__'

class JournalAdmin(admin.ModelAdmin):
    form = JournalAdminForm
    list_display = ('title', 'category', 'date', 'slug', 'created_at')
    list_filter = ('category', 'date')
    search_fields = ('title', 'excerpt', 'full_content', 'slug')
    date_hierarchy = 'date'
    ordering = ['-date']
    prepopulated_fields = {'slug': ('title',)}  # Auto-generate slug from title
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'date', 'category', 'excerpt', 'full_content', 'toc_preview')
        }),
        ('Image', {
            'fields': ('image', 'image_preview'),
        }),
    )
    readonly_fields = ('image_preview', 'toc_preview')

    def image_preview(self, obj):
        if obj.image:
            return mark_safe(f'<img src="{obj.image.url}" style="max-width: 100px; max-height: 100px;" />')
        return "No image"
    image_preview.short_description = 'Image Preview'

    def toc_preview(self, obj):
        if obj.full_content:
            import re
            toc_items = []
            for match in re.findall(r'<h2>(.*?)</h2>|<h3>(.*?)</h3>', obj.full_content, re.IGNORECASE):
                if match[0]:  # h2
                    toc_items.append(f'<li class="toc-h2">{match[0]}</li>')
                elif match[1]:  # h3
                    toc_items.append(f'<li class="toc-h3">{match[1]}</li>')
            if toc_items:
                return mark_safe('<ul class="toc-preview">' + ''.join(toc_items) + '</ul>')
        return "No table of contents available"
    toc_preview.short_description = 'Table of Contents Preview'

    class Media:
        css = {
            'all': ('furniture/css/admin.css',)
        }
        js = ('furniture/js/admin.js',)
        
# Subscriber
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ['email', 'created_at']
    list_filter = ['created_at']
    search_fields = ['email']
    list_per_page = 25
    actions = ['delete_selected']

    def has_change_permission(self, request, obj=None):
        return False  # Prevent editing to avoid accidental changes

    def has_add_permission(self, request):
        return False  # Prevent manual additions via admin

# Inquiry Admin
class InquiryAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'project_type', 'processed', 'created_at')
    list_filter = ('project_type', 'processed', 'created_at')
    search_fields = ('full_name', 'email', 'project_description', 'other_project')
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    fieldsets = (
        (None, {
            'fields': ('full_name', 'phone', 'email', 'project_type', 'other_project', 'project_description', 'processed')
        }),
        ('Image', {
            'fields': ('image', 'image_preview'),
        }),
    )
    readonly_fields = ('image_preview',)
    actions = ['mark_as_processed']

    def image_preview(self, obj):
        if obj.image:
            return mark_safe(f'<img src="{obj.image.url}" style="max-width: 100px; max-height: 100px;" />')
        return "No image"
    image_preview.short_description = 'Image Preview'

    def mark_as_processed(self, request, queryset):
        updated = queryset.update(processed=True)
        self.message_user(request, f"{updated} inquiries marked as processed.")
    mark_as_processed.short_description = "Mark selected inquiries as processed"

    class Media:
        css = {
            'all': ('furniture/css/admin.css',)
        }
        js = ('furniture/js/admin.js',)
    

# Register models
admin.site.register(Subscriber)
admin.site.register(PortfolioItem, PortfolioItemAdmin)
admin.site.register(JournalEntry, JournalAdmin)
admin.site.register(Inquiry, InquiryAdmin)