const storageKey = 'cozy-photo-album-state';
const photoSlotsPerPage = 2;
const photoSlotCounts = [2, 2, 2, 2, 2];
const defaultPages = [
  {
    title: 'Quando ero appena nato',
    subtitle: '...tu eri lì',
    summary: '',
    photos: Array(photoSlotsPerPage).fill(null)
  },
  {
    title: 'Garden Picnic',
    subtitle: '...tu eri lì',
    summary: '',
    photos: Array(photoSlotsPerPage).fill(null)
  },
  {
    title: 'Rainy Window',
    subtitle: '...tu eri lì',
    summary: '',
    photos: Array(photoSlotsPerPage).fill(null)
  },
  {
    title: 'Evening Walk',
    subtitle: '...tu eri lì',
    summary: '',
    photos: Array(photoSlotsPerPage).fill(null)
  },
  {
    title: 'Night Lights',
    subtitle: '...tu eri lì',
    summary: '',
    photos: Array(photoSlotsPerPage).fill(null)
  }
];

let currentPage = 0;
let state = loadState();

const titleEl = document.getElementById('pageTitle');
const subtitleEl = document.getElementById('pageSubtitle');
const photoGridEl = document.getElementById('photoGrid');
const rightPhotoSpotEl = document.getElementById('rightPhotoSpot');
const summaryEl = document.getElementById('pageSummary');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const closeButton = document.getElementById('closeButton');
const bookShell = document.getElementById('bookShell');
const bookCover = document.getElementById('bookCover');

function getPhotoSlotCount(pageIndex) {
  return photoSlotCounts[pageIndex] ?? photoSlotsPerPage;
}

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return { currentPage: 0, pages: defaultPages.map((page) => ({ ...page })) };

    const parsed = JSON.parse(saved);
    const parsedPages = Array.isArray(parsed.pages) ? parsed.pages : [];
    return {
      currentPage: parsed.currentPage ?? 0,
      pages: defaultPages.map((defaultPage, index) => {
        const page = parsedPages[index] || {};
        const slotCount = getPhotoSlotCount(index);
        const photos = Array.isArray(page.photos) ? page.photos.slice(0, slotCount) : [];
        while (photos.length < slotCount) photos.push(null);
        const migratedTitle =
          index === 0 && (!page.title || page.title === 'Spring Morning')
            ? defaultPage.title
            : (page.title || defaultPage.title);
        const migratedSummary =
          !page.summary ||
          page.summary === 'Write a memory...' ||
          page.summary === 'A gentle start to the day with warm sun and a calm little table.' ||
          page.summary === 'Tiny snacks, sleepy flowers, and the kind of laughter that stays.' ||
          page.summary === 'Soft rain, warm light, and a blanket of calm in the afternoon.' ||
          page.summary === 'A peaceful walk at sunset with slow steps and warm colors.' ||
          page.summary === 'The day closes with calm lights and small memories worth keeping.'
            ? defaultPage.summary
            : page.summary;

        return {
          title: migratedTitle,
          subtitle: page.subtitle || defaultPage.subtitle,
          summary: migratedSummary,
          photos
        };
      })
    };
  } catch {
    return { currentPage: 0, pages: defaultPages.map((page) => ({ ...page })) };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify({ currentPage, pages: state.pages }));
}

function render() {
  const page = state.pages[currentPage];
  const slotCount = getPhotoSlotCount(currentPage);
  const hasTwoPhotos = slotCount > 1;
  titleEl.textContent = page.title;
  subtitleEl.textContent = page.subtitle || '...tu eri lì';
  summaryEl.textContent = page.summary || '';
  prevButton.style.display = currentPage === 0 ? 'none' : 'inline-flex';
  nextButton.style.display = currentPage >= state.pages.length - 1 ? 'none' : 'inline-flex';
  photoGridEl.classList.toggle('photo-grid-two-photo-layout', hasTwoPhotos);
  photoGridEl.classList.toggle('photo-grid-page2', currentPage === 1 && !hasTwoPhotos);
  photoGridEl.classList.toggle('photo-grid-page4', currentPage === 3 && !hasTwoPhotos);
  photoGridEl.classList.toggle('photo-grid-page5', currentPage === 4);
  photoGridEl.innerHTML = '';
  rightPhotoSpotEl.hidden = !hasTwoPhotos;
  rightPhotoSpotEl.innerHTML = '';

  for (let index = 0; index < slotCount; index += 1) {
    const photo = page.photos[index] ?? null;
    const slot = document.createElement('label');
    slot.className = 'photo-slot';
    if (currentPage === 1 && !hasTwoPhotos) {
      slot.classList.add('photo-slot-page2');
    }
    if (currentPage === 3 && !hasTwoPhotos) {
      slot.classList.add('photo-slot-page4');
    }
    if (currentPage === 4) {
      slot.classList.add('photo-slot-page5');
    }

    if (photo) {
      slot.innerHTML = `<img src="${photo}" alt="Photo ${index + 1}" />`;
    } else {
      slot.innerHTML = `<span class="slot-label">＋</span>`;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', (event) => handlePhotoUpload(event, index));
    slot.appendChild(input);

    if (hasTwoPhotos && index === 1) {
      slot.classList.add('photo-slot-right-feature');
      if (currentPage === 4) {
        slot.classList.add('photo-slot-right-page5');
      }
      rightPhotoSpotEl.appendChild(slot);
    } else {
      if (hasTwoPhotos && index === 0) {
        slot.classList.add('photo-slot-left-feature');
        if (currentPage === 1) {
          slot.classList.add('photo-slot-left-page2-full');
        }
        if (currentPage === 3) {
          slot.classList.add('photo-slot-left-page4-full');
        }
      }
      photoGridEl.appendChild(slot);
    }
  }
}

function normalizeEditableText(value, fallback) {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned || fallback;
}

function bindEditableField(element, key, fallback) {
  element.addEventListener('blur', () => {
    const page = state.pages[currentPage];
    page[key] = normalizeEditableText(element.innerText, fallback);
    element.textContent = page[key];
    saveState();
  });

  element.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      element.blur();
    }
  });
}

function handlePhotoUpload(event, index) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    state.pages[currentPage].photos[index] = reader.result;
    saveState();
    render();
  };
  reader.readAsDataURL(file);
}

function goToPage(nextIndex) {
  const clampedIndex = Math.max(0, Math.min(nextIndex, state.pages.length - 1));
  currentPage = clampedIndex;
  saveState();
  render();
}

prevButton.addEventListener('click', () => goToPage(currentPage - 1));
nextButton.addEventListener('click', () => goToPage(currentPage + 1));
bookCover.addEventListener('click', () => {
  bookShell.classList.add('open');
});
bookCover.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    bookShell.classList.add('open');
  }
});
closeButton.addEventListener('click', () => {
  bookShell.classList.remove('open');
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    bookShell.classList.remove('open');
  }
});

currentPage = state.currentPage;
bindEditableField(titleEl, 'title', 'Untitled page');
bindEditableField(subtitleEl, 'subtitle', '...tu eri lì');
render();
