// furniture/static/furniture/js/admin.js
// Enhances PortfolioItemAdmin and JournalAdmin: image previews, primary checkbox, category feedback, and TOC preview

document.addEventListener('DOMContentLoaded', () => {
  // Portfolio: Ensure only one image is marked as primary
  const updatePrimaryCheckboxes = () => {
      const primaryCheckboxes = document.querySelectorAll('input[name$="-is_primary"]');
      primaryCheckboxes.forEach((checkbox, index) => {
          checkbox.addEventListener('change', () => {
              if (checkbox.checked) {
                  primaryCheckboxes.forEach((otherCheckbox, otherIndex) => {
                      if (otherIndex !== index) {
                          otherCheckbox.checked = false;
                      }
                  });
              }
          });
      });
  };

  // Portfolio: Update image previews for PortfolioImageInline
  const updatePortfolioImagePreviews = () => {
      const imageInputs = document.querySelectorAll('input[name$="-image"][type="file"]');
      imageInputs.forEach(input => {
          input.removeEventListener('change', handlePortfolioImageChange);
          input.addEventListener('change', handlePortfolioImageChange);
      });
  };

  const handlePortfolioImageChange = (e) => {
      const input = e.target;
      const file = input.files[0];
      if (!file) return;

      const row = input.closest('tr');
      if (!row) return;

      let preview = row.querySelector('.field-image_preview img');
      const previewCell = row.querySelector('.field-image_preview');
      if (!preview && previewCell) {
          preview = document.createElement('img');
          previewCell.innerHTML = '';
          previewCell.appendChild(preview);
      }
      if (!preview) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          preview.src = event.target.result;
      };
      reader.readAsDataURL(file);
  };

  // Journal: Update image preview for Journal
  const updateJournalImagePreview = () => {
      const imageInput = document.querySelector('input[name="image"]');
      if (!imageInput) return;

      imageInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const preview = document.querySelector('#image-preview img');
          if (preview) {
              const reader = new FileReader();
              reader.onload = (event) => {
                  preview.src = event.target.result;
              };
              reader.readAsDataURL(file);
          }
      });
  };

  // Journal: Highlight selected category
  const highlightCategory = () => {
      const categorySelect = document.querySelector('select[name="category"]');
      if (!categorySelect) return;

      categorySelect.addEventListener('change', (e) => {
          const selectedOption = e.target.value;
          categorySelect.classList.remove('category-inspiration', 'category-tutorials', 'category-updates');
          if (selectedOption) {
              categorySelect.classList.add(`category-${selectedOption}`);
          }
      });
  };

  // Journal: Update TOC preview when full_content changes
  const updateTOCPreview = () => {
      const editorElement = document.querySelector('.ck-editor__editable');
      if (!editorElement) return;

      const checkEditor = setInterval(() => {
          if (window.CKEDITOR && CKEDITOR.instances['id_full_content']) {
              clearInterval(checkEditor);
              const editor = CKEDITOR.instances['id_full_content'];
              editor.on('change', () => {
                  const content = editor.getData();
                  const tocPreview = document.querySelector('.toc-preview');
                  if (!tocPreview) return;

                  const parser = new DOMParser();
                  const doc = parser.parseFromString(content, 'text/html');
                  const tocItems = [];
                  doc.querySelectorAll('h2, h3').forEach((heading) => {
                      const text = heading.textContent;
                      const className = heading.tagName.toLowerCase() === 'h2' ? 'toc-h2' : 'toc-h3';
                      tocItems.push(`<li class="${className}">${text}</li>`);
                  });

                  tocPreview.innerHTML = tocItems.length ? tocItems.join('') : '<li>No table of contents available</li>';
              });
          }
      }, 100);
  };

  // Initialize functionality
  updatePrimaryCheckboxes();
  updatePortfolioImagePreviews();
  updateJournalImagePreview();
  highlightCategory();
  updateTOCPreview();

  // Portfolio: Re-run on dynamic formset additions
  document.addEventListener('formset:added', (event) => {
      updatePrimaryCheckboxes();
      updatePortfolioImagePreviews();
  });
});