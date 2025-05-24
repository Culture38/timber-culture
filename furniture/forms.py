from django import forms
from .models import Inquiry
import logging

logger = logging.getLogger(__name__)

class InquiryForm(forms.ModelForm):
    class Meta:
        model = Inquiry
        fields = ['full_name', 'phone', 'email', 'project_type', 'other_project', 'project_description', 'image', 'processed']

    def clean_full_name(self):
        return self._extracted_from_clean_project_description_2(
            'full_name', 3, 'Full name must be at least 3 characters.'
        )

    def clean_phone(self):
        phone = self.cleaned_data['phone'].strip()
        if not (10 <= len(phone) <= 13) or not phone.replace('+', '').isdigit():
            raise forms.ValidationError('Phone number must be 10-13 digits, with optional + prefix.')
        return phone

    def clean_email(self):
        email = self.cleaned_data['email'].strip()
        if '@' not in email or '.' not in email:
            raise forms.ValidationError('Invalid email address.')
        return email

    def clean_project_type(self):
        project_type = self.cleaned_data['project_type']
        if project_type not in [choice[0] for choice in Inquiry.PROJECT_TYPE_CHOICES]:
            raise forms.ValidationError('Invalid project type.')
        return project_type

    def clean_other_project(self):
        project_type = self.cleaned_data.get('project_type')
        other_project = self.cleaned_data['other_project'].strip()
        if project_type == 'other' and not other_project:
            raise forms.ValidationError('Please specify the other project type.')
        return other_project

    def clean_project_description(self):
        return self._extracted_from_clean_project_description_2(
            'project_description',
            10,
            'Project description must be at least 10 characters.',
        )

    # TODO Rename this here and in `clean_full_name` and `clean_project_description`
    def _extracted_from_clean_project_description_2(self, arg0, arg1, arg2):
        full_name = self.cleaned_data[arg0].strip()
        if len(full_name) < arg1:
            raise forms.ValidationError(arg2)
        return full_name

    def clean_image(self):
        image = self.cleaned_data.get('image')
        if image:
            logger.info(f"Validating image: {image.name}, type: {image.content_type}, size: {image.size}")
            valid_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            max_size = 5 * 1024 * 1024  # 5MB
            if image.content_type not in valid_types:
                logger.warning(f"Invalid image type: {image.content_type}")
                raise forms.ValidationError('Image must be JPEG, PNG, GIF, or WebP.')
            if image.size > max_size:
                logger.warning(f"Image too large: {image.size} bytes")
                raise forms.ValidationError('Image size must be under 5MB.')
        else:
            logger.info("No image provided")
        return image