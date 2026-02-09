// Mobile menu toggle
document.getElementById('mobile-menu-btn').addEventListener('click', function() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', function() {
        document.getElementById('mobile-menu').classList.add('hidden');
    });
});

// Global variables
let allProjects = [];
let filteredProjects = [];
let currentFilter = { year: 'all', category: '', search: '' };

// Load projects from API
async function loadProjects() {
    try {
        const response = await fetch('tables/projects?limit=1000&sort=-year');
        const data = await response.json();
        allProjects = data.data || [];
        filteredProjects = [...allProjects];
        displayProjects();
        
        // Hide skeleton
        document.getElementById('loading-skeleton').style.display = 'none';
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('loading-skeleton').style.display = 'none';
        showNoProjects();
    }
}

// Display projects
function displayProjects() {
    const container = document.getElementById('projects-container');
    const noProjectsEl = document.getElementById('no-projects');
    
    if (filteredProjects.length === 0) {
        showNoProjects();
        return;
    }
    
    noProjectsEl.classList.add('hidden');
    container.innerHTML = '';
    
    filteredProjects.forEach((project, index) => {
        const card = createProjectCard(project);
        container.appendChild(card);
        
        // Animate card appearance
        setTimeout(() => {
            card.classList.add('show');
        }, index * 50);
    });
}

// Create project card
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card card-hover bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer';
    
    // Default image if none provided
    const imageUrl = project.image_url || `https://via.placeholder.com/400x300/3b82f6/ffffff?text=${encodeURIComponent(project.title)}`;
    
    card.innerHTML = `
        <div class="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500">
            <img src="${imageUrl}" alt="${project.title}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/400x300/3b82f6/ffffff?text=${encodeURIComponent(project.title)}'">
            <div class="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                ${project.year}
            </div>
        </div>
        <div class="p-6">
            <div class="flex items-center space-x-2 mb-3">
                <span class="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
                    ${project.category || 'Без категории'}
                </span>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                ${project.title}
            </h3>
            <p class="text-gray-600 mb-4 line-clamp-3">
                ${stripHtml(project.description)}
            </p>
            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                <div class="flex items-center text-sm text-gray-500">
                    <i class="fas fa-map-marker-alt mr-2"></i>
                    ${project.location || 'Не указано'}
                </div>
                <button class="text-cyan-600 hover:text-cyan-700 font-medium text-sm">
                    Подробнее <i class="fas fa-arrow-right ml-1"></i>
                </button>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => openProjectModal(project));
    
    return card;
}

// Strip HTML tags
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Show no projects message
function showNoProjects() {
    document.getElementById('projects-container').innerHTML = '';
    document.getElementById('no-projects').classList.remove('hidden');
}

// Filter projects
function filterProjects() {
    filteredProjects = allProjects.filter(project => {
        // Year filter
        if (currentFilter.year !== 'all' && project.year !== parseInt(currentFilter.year)) {
            return false;
        }
        
        // Category filter
        if (currentFilter.category && project.category !== currentFilter.category) {
            return false;
        }
        
        // Search filter
        if (currentFilter.search) {
            const searchLower = currentFilter.search.toLowerCase();
            const titleMatch = project.title.toLowerCase().includes(searchLower);
            const descriptionMatch = stripHtml(project.description).toLowerCase().includes(searchLower);
            const clientMatch = (project.client || '').toLowerCase().includes(searchLower);
            const locationMatch = (project.location || '').toLowerCase().includes(searchLower);
            
            if (!titleMatch && !descriptionMatch && !clientMatch && !locationMatch) {
                return false;
            }
        }
        
        return true;
    });
    
    displayProjects();
}

// Year filter buttons
document.querySelectorAll('.filter-btn[data-year], .filter-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all year buttons
        document.querySelectorAll('.filter-btn[data-year], .filter-btn[data-filter]').forEach(b => {
            b.classList.remove('active');
        });
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update filter
        if (this.dataset.filter === 'all') {
            currentFilter.year = 'all';
        } else {
            currentFilter.year = this.dataset.year;
        }
        
        filterProjects();
    });
});

// Category filter
document.getElementById('category-filter').addEventListener('change', function() {
    currentFilter.category = this.value;
    filterProjects();
});

// Search filter
let searchTimeout;
document.getElementById('search-input').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentFilter.search = this.value;
        filterProjects();
    }, 300);
});

// Open project modal
function openProjectModal(project) {
    const modal = document.getElementById('project-modal');
    const imageUrl = project.image_url || `https://via.placeholder.com/800x400/3b82f6/ffffff?text=${encodeURIComponent(project.title)}`;
    
    document.getElementById('modal-title').textContent = project.title;
    document.getElementById('modal-image').src = imageUrl;
    document.getElementById('modal-image').alt = project.title;
    document.getElementById('modal-year').textContent = project.year;
    document.getElementById('modal-category').textContent = project.category || 'Без категории';
    document.getElementById('modal-client').textContent = project.client || 'Не указан';
    document.getElementById('modal-location').textContent = project.location || 'Не указана';
    document.getElementById('modal-description').innerHTML = project.description;
    
    // Tags
    const tagsContainer = document.getElementById('modal-tags');
    const tagsSection = document.getElementById('modal-tags-container');
    
    if (project.tags && Array.isArray(project.tags) && project.tags.length > 0) {
        tagsContainer.innerHTML = project.tags.map(tag => 
            `<span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">${tag}</span>`
        ).join('');
        tagsSection.classList.remove('hidden');
    } else {
        tagsSection.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    document.getElementById('project-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

document.getElementById('close-modal').addEventListener('click', closeModal);

// Close modal on backdrop click
document.getElementById('project-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Initialize
loadProjects();