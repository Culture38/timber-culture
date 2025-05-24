# TC Woodworking Portfolio

## Overview
TC is a Django-based web application for a woodworking company startup, showcasing custom furniture and wood structures. It features a portfolio of projects, a journal for inspiration, tutorials, and updates, a contact form for inquiries, and a subscription system for updates. The platform supports rich content with CKEditor, image uploads, and a RESTful API for portfolio and journal data.

## Features
- **Portfolio**: Display woodworking projects with images, descriptions, and popularity tracking.
- **Journal**: Share blog posts categorized as Inspiration, Tutorials, or Updates, with rich text and image support.
- **Inquiries**: Allow customers to submit project requests with optional images.
- **Subscriptions**: Manage email subscriptions for updates.
- **API**: RESTful endpoints for portfolio and journal data, with sorting and filtering.

## Tech Stack
- **Framework**: Django
- **Database**: Configured for any Django-supported database (e.g., SQLite, PostgreSQL)
- **Dependencies**:
  - `django-ckeditor-5`: For rich text editing in journal entries.
  - `django-rest-framework`: For API endpoints.
  - `pillow`: For image processing.
- **Python**: 3.x
- **Frontend**: HTML templates (assumed; customize with Bootstrap, Tailwind, etc.)

## Database Models
- **PortfolioItem**: Stores project details (title, location, description, popularity, timestamps).
- **PortfolioImage**: Manages project images with primary image constraint and unique file naming.
- **JournalEntry**: Blog posts with title, slug, category (Inspiration, Tutorials, Updates), rich content, and images.
- **Inquiry**: Customer inquiries with project type, description, and optional image.
- **Subscriber**: Email subscriptions with timestamps.

## Setup
1. **Prerequisites**:
   - Python 3.x
   - Django (install via `pip install django django-ckeditor-5 djangorestframework pillow`)
   - Database (e.g., SQLite for development, PostgreSQL for production)
2. **Installation**:
   - Clone the repository: `git clone <repository-url>`
   - Navigate to the project directory: `cd tc-woodworking`
   - Install dependencies: `pip install -r requirements.txt`
3. **Database Setup**:
   - Configure database settings in `settings.py` (e.g., SQLite or PostgreSQL).
   - Run migrations: `python manage.py makemigrations && python manage.py migrate`
4. **Run the Application**:
   - Start the development server: `python manage.py runserver`
   - Access at `http://127.0.0.1:8000`
5. **Configuration**:
   - Set up `MEDIA_ROOT` and `MEDIA_URL` in `settings.py` for image uploads.
   - Configure CKEditor 5 for rich text editing (see `django-ckeditor-5` docs).
   - Add environment variables for sensitive data (e.g., `SECRET_KEY`, database credentials).

## Views and URLs
- **Landing Page**: `/` - Displays the homepage (`furniture/landing.html`).
- **Portfolio**: `/portfolio/` - Lists all projects with images, sortable by popularity or date.
- **About**: `/about/` - Shows random portfolio images with session-based tracking.
- **Journal**: `/journal/` - Lists blog posts with category filtering, search, and pagination.
- **Journal Detail**: `/journal/<id>/<slug>/` - Displays a specific journal entry.
- **Contact**: `/contact/` - Renders the inquiry form.
- **API**:
  - `/api/portfolio/` - Fetches portfolio items with pagination and sorting.
  - `/api/journal/` - Fetches journal entries with filtering by category or search.
  - `/api/portfolio/<id>/like/` - Increments/decrements project popularity.

## File Uploads
- **Portfolio Images**: Stored in `portfolio_images/` with unique filenames based on title and UUID.
- **Journal Images**: Stored in `journal_images/` with unique filenames.
- **Inquiry Images**: Stored in `inquiry_images/YYYY/MM/` with unique filenames based on customer name.

## Notes
- **Image Handling**: Uses `slugify` and UUID for unique file names to prevent overwrites.
- **Pagination**: 13 items per page for portfolio and journal views.
- **Constraints**: Ensures one primary image per portfolio item and unique journal title-date pairs.
- **Logging**: Configured for debugging subscription and inquiry issues.
- **Scalability**: Use PostgreSQL for production and optimize queries with indexes (already defined).

## Contributing
Fork the repository, submit issues, or create pull requests to enhance TC Woodworking.
