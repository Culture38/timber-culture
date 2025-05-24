from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.db.models import Q
from django.core.paginator import Paginator
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import PortfolioItem, JournalEntry, Subscriber
from .serializers import JournalEntrySerializer
from .forms import InquiryForm
import logging
import random
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

# Set up logging
logger = logging.getLogger(__name__)

# Define constant for items per page
ITEMS_PER_PAGE = 13

def landing(request):
    return render(request, 'furniture/landing.html')

def portfolio(request):
    portfolio_items = PortfolioItem.objects.all().prefetch_related('images')
    return render(request, 'furniture/portfolio.html', {'portfolio_items': portfolio_items})

def about(request):
    # Fetch all portfolio items with their images
    portfolio_items = PortfolioItem.objects.all().prefetch_related('images')

    # Collect all images from portfolio items
    all_images = []
    for item in portfolio_items:
        all_images.extend(
            {
                'src': image.image.url,
                'alt': image.alt_text or f'Image for {item.title}',
            }
            for image in item.images.all()
        )
    # Get recently shown images from session (if any)
    recent_images = request.session.get('recent_about_images', [])

    # Filter out recently shown images
    available_images = [img for img in all_images if img['src'] not in recent_images]

    # Select 3 random images (or fewer if not enough)
    selected_images = random.sample(available_images, min(3, len(available_images))) if available_images else []

    # Update session with new image URLs
    recent_images = [img['src'] for img in selected_images] + recent_images[:6]  # Keep last 6 to avoid repetition
    request.session['recent_about_images'] = recent_images[:9]  # Cap at 9 for three visits

    # Log the selected images for debugging
    logger.debug(f"Selected images for About page: {[img['src'] for img in selected_images]}")

    # Pass the images to the template
    context = {'gallery_images': selected_images}
    return render(request, 'furniture/about.html', context)

def journal(request):
    category = request.GET.get('category', 'all')
    search_query = request.GET.get('search', '')
    journal_entries = JournalEntry.objects.all().order_by('-date')
    if category != 'all':
        journal_entries = journal_entries.filter(category=category)
    if search_query:
        journal_entries = journal_entries.filter(
            Q(title__icontains=search_query) |
            Q(excerpt__icontains=search_query) |
            Q(full_content__icontains=search_query)
        )
    
    paginator = Paginator(journal_entries, ITEMS_PER_PAGE)
    page_number = request.GET.get('page', 1)
    try:
        page_obj = paginator.page(page_number)
    except Exception as e:
        logger.error(f"Pagination error in journal view: {e}")
        page_obj = paginator.page(1)
    
    context = {
        'journal_entries': page_obj,
        'category': category,
        'search_query': search_query,
    }
    return render(request, 'furniture/journal.html', context)

def journal_detail(request, id, slug):
    entry = get_object_or_404(JournalEntry, id=id, slug=slug)
    category = request.GET.get('category', 'all')
    search_query = request.GET.get('search', '')
    journal_entries = JournalEntry.objects.all().order_by('-date')
    if category != 'all':
        journal_entries = journal_entries.filter(category=category)
    if search_query:
        journal_entries = journal_entries.filter(
            Q(title__icontains=search_query) |
            Q(excerpt__icontains=search_query) |
            Q(full_content__icontains=search_query)
        )
    
    paginator = Paginator(journal_entries, ITEMS_PER_PAGE)
    page_number = request.GET.get('page', 1)
    try:
        page_obj = paginator.page(page_number)
    except Exception as e:
        logger.error(f"Pagination error in journal_detail view: {e}")
        page_obj = paginator.page(1)
    
    context = {
        'journal_entries': page_obj,
        'category': category,
        'search_query': search_query,
        'entry': entry,
    }
    return render(request, 'furniture/journal.html', context)

def contact(request):
    return render(request, 'furniture/contact.html')

def subscribe(request):
    if request.method == 'POST':
        try:
            email = request.POST.get('email')
            logger.info(f"Subscription attempt: {email}")
            if not email:
                logger.warning("No email provided")
                return JsonResponse({'error': 'Email is required'}, status=400)
            try:
                validate_email(email)
            except ValidationError as e:
                logger.warning(f"Invalid email format: {email}, Error: {e}")
                return JsonResponse({'error': 'Invalid email address'}, status=400)
            if Subscriber.objects.filter(email=email).exists():
                logger.warning(f"Duplicate email: {email}")
                return JsonResponse({'error': 'This email is already subscribed'}, status=400)
            subscriber = Subscriber(email=email)
            logger.debug(f"Attempting to save subscriber: {email}")
            subscriber.save()
            logger.info(f"Subscriber saved: {email}")
            return JsonResponse({'message': 'Subscribed successfully'}, status=200)
        except Exception as e:
            logger.error(f"Error in subscribe: {e}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=500)
    logger.warning("Invalid request method")
    return JsonResponse({'error': 'Invalid request'}, status=400)

def submit_inquiry(request):
    if request.method == 'POST':
        try:
            logger.info(f"POST data: {request.POST}")
            logger.info(f"Files: {request.FILES}")
            form = InquiryForm(request.POST, request.FILES)
            if form.is_valid():
                inquiry = form.save()
                logger.info(f"Inquiry saved: {inquiry.full_name}, Image: {inquiry.image}, Image path: {inquiry.image.path if inquiry.image else 'None'}")
                return JsonResponse({'message': 'Inquiry submitted successfully'}, status=200)
            else:
                errors = {field: error[0] for field, error in form.errors.items()}
                logger.warning(f"Form validation failed: {errors}")
                return JsonResponse({'error': errors}, status=400)
        except Exception as e:
            logger.error(f"Error in submit_inquiry: {e}")
            return JsonResponse({'error': 'An unexpected error occurred'}, status=500)
    logger.warning("Invalid request method")
    return JsonResponse({'error': 'Invalid request'}, status=400)

def portfolio_api(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Invalid request method'}, status=400)

    portfolio_items = PortfolioItem.objects.all().prefetch_related('images')
    sort = request.GET.get('sort', 'recent')
    if sort == 'popular':
        portfolio_items = portfolio_items.order_by('-popularity')
    else:
        portfolio_items = portfolio_items.order_by('-created_at')

    paginator = Paginator(portfolio_items, ITEMS_PER_PAGE)
    page_number = request.GET.get('page', 1)

    try:
        page_obj = paginator.page(page_number)
    except Exception as e:
        logger.error(f"Pagination error in portfolio_api: {e}")
        page_obj = paginator.page(1)

    data = []
    for item in page_obj:
        images = [
            {
                'src': image.image.url,
                'alt': image.alt_text or f'Image for {item.title}',
                'is_primary': image.is_primary
            } for image in item.images.all()
        ]
        data.append({
            'id': item.id,
            'title': item.title or 'Untitled',
            'location': item.location or 'Unknown',
            'description': item.description or '',
            'popularity': item.popularity or 0,
            'images': images,
            'created_at': item.created_at.isoformat() if item.created_at else None
        })

    response = {
        'portfolio_items': data,
        'has_next': page_obj.has_next(),
        'total_items': paginator.count,
        'current_page': page_obj.number
    }

    return JsonResponse(response, status=200)

@api_view(['POST'])
def like_portfolio_item(request, project_id):
    try:
        item = PortfolioItem.objects.get(id=project_id)
        liked = request.data.get('liked', False)
        item.popularity += 1 if liked else -1
        item.popularity = max(item.popularity, 0)
        item.save()
        return Response({'status': 'success', 'popularity': item.popularity})
    except PortfolioItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=404)

@api_view(['GET'])
def journal_api(request):
    journal_entries = JournalEntry.objects.all().order_by('-date')
    
    if entry_id := request.GET.get('id'):
        journal_entries = journal_entries.filter(id=entry_id)
        if not journal_entries.exists():
            logger.warning(f"No journal entries found for ID: {entry_id}")
            return Response({'journal_entries': []}, status=200)
    category = request.GET.get('category', 'all')
    if category != 'all':
        journal_entries = journal_entries.filter(category=category)
    if search_query := request.GET.get('search', ''):
        journal_entries = journal_entries.filter(
            Q(title__icontains=search_query) |
            Q(excerpt__icontains=search_query) |
            Q(full_content__icontains=search_query)
        )
    
    paginator = Paginator(journal_entries, ITEMS_PER_PAGE)
    page_number = request.GET.get('page', 1)
    
    try:
        page_obj = paginator.page(page_number)
    except Exception as e:
        logger.error(f"Pagination error in journal_api: {e}")
        page_obj = paginator.page(1)
    
    serializer = JournalEntrySerializer(page_obj, many=True)
    
    response = {
        'journal_entries': serializer.data,
        'has_next': page_obj.has_next(),
        'page': page_obj.number
    }
    logger.debug(f"Journal API response: page={page_obj.number}, has_next={page_obj.has_next()}, entries={len(serializer.data)}")
    return Response(response)