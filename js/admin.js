// Check authentication
const SESSION_KEY = 'etm_admin_session';

const checkAuth = () => {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    
    const sessionData = JSON.parse(session);
    const now = new Date().getTime();
    
    if (now >= sessionData.expiry) {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
};

// Check on page load
if (!checkAuth()) {
    // Redirecting to login
}

// Logout functionality
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem(SESSION_KEY);
            window.location.href = 'login.html';
        }
    });
}

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    });
}

// Tab switching
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const targetTab = this.dataset.tab;
        
        // Update tab buttons
        document.querySelectorAll('.admin-tab').forEach(t => {
            t.classList.remove('active', 'bg-white', 'text-blue-600');
            t.classList.add('bg-white/10', 'text-white');
        });
        this.classList.add('active', 'bg-white', 'text-blue-600');
        this.classList.remove('bg-white/10', 'text-white');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`tab-${targetTab}`).classList.remove('hidden');
    });
});

// Initialize Quill rich text editor
const quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: 'Введите подробное описание проекта...',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link'],
            ['clean']
        ]
    }
});

// Tags management
let tags = [];

function addTag(tag) {
    tag = tag.trim();
    if (tag && !tags.includes(tag)) {
        tags.push(tag);
        renderTags();
    }
}

function removeTag(tag) {
    tags = tags.filter(t => t !== tag);
    renderTags();
}

function renderTags() {
    const container = document.getElementById('tags-container');
    container.innerHTML = tags.map(tag => `
        <span class="tag-item px-3 py-1 bg-cyan-100 text-cyan-700 text-sm rounded-full flex items-center gap-2">
            ${tag}
            <button type="button" onclick="removeTag('${tag}')" class="hover:text-cyan-900">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');
}

// Make removeTag available globally
window.removeTag = removeTag;

// Tag input handler
document.getElementById('tag-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTag(this.value);
        this.value = '';
    }
});

// Load existing projects
async function loadProjects() {
    try {
        const response = await fetch('tables/projects?limit=1000&sort=-year');
        const data = await response.json();
        
        document.getElementById('loading-projects').style.display = 'none';
        
        if (data.data && data.data.length > 0) {
            displayProjects(data.data);
        } else {
            document.getElementById('no-projects-admin').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('loading-projects').style.display = 'none';
        document.getElementById('no-projects-admin').classList.remove('hidden');
    }
}

// Display projects in admin list
function displayProjects(projects) {
    const container = document.getElementById('projects-list');
    document.getElementById('no-projects-admin').classList.add('hidden');
    
    container.innerHTML = projects.map(project => `
        <div class="border border-gray-200 rounded-xl p-6 hover:border-cyan-300 transition">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-xl font-bold text-gray-900">${project.title}</h3>
                        <span class="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
                            ${project.year}
                        </span>
                        <span class="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            ${project.category || 'Без категории'}
                        </span>
                    </div>
                    <div class="text-gray-600 text-sm mb-2">
                        <i class="fas fa-building mr-2"></i>${project.client || 'Клиент не указан'}
                        <span class="mx-2">•</span>
                        <i class="fas fa-map-marker-alt mr-2"></i>${project.location || 'Локация не указана'}
                    </div>
                    ${project.tags && project.tags.length > 0 ? `
                        <div class="flex flex-wrap gap-2 mt-3">
                            ${project.tags.map(tag => `
                                <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">${tag}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="flex gap-2 ml-4">
                    <button onclick="deleteProject('${project.id}')" class="w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Form submission
document.getElementById('project-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get description from Quill
    const description = quill.root.innerHTML;
    
    // Prepare project data
    const projectData = {
        title: document.getElementById('title').value,
        year: parseInt(document.getElementById('year').value),
        category: document.getElementById('category').value,
        client: document.getElementById('client').value,
        location: document.getElementById('location').value,
        image_url: document.getElementById('image_url').value,
        description: description,
        tags: tags
    };
    
    try {
        const response = await fetch('tables/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });
        
        if (response.ok) {
            // Show success modal
            document.getElementById('success-modal').classList.remove('hidden');
            
            // Reset form
            resetForm();
            
            // Reload projects list
            loadProjects();
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server response:', response.status, errorData);
            alert('Ошибка при добавлении проекта: ' + (errorData.message || response.statusText));
        }
    } catch (error) {
        console.error('Error adding project:', error);
        alert('Ошибка при добавлении проекта: ' + error.message);
    }
});

// Reset form
function resetForm() {
    document.getElementById('project-form').reset();
    quill.setContents([]);
    tags = [];
    renderTags();
}

document.getElementById('reset-btn').addEventListener('click', resetForm);

// Delete project
let projectToDelete = null;

window.deleteProject = function(projectId) {
    projectToDelete = projectId;
    document.getElementById('delete-modal').classList.remove('hidden');
}

document.getElementById('cancel-delete').addEventListener('click', function() {
    document.getElementById('delete-modal').classList.add('hidden');
    projectToDelete = null;
});

document.getElementById('confirm-delete').addEventListener('click', async function() {
    if (!projectToDelete) return;
    
    try {
        const response = await fetch(`tables/projects/${projectToDelete}`, {
            method: 'DELETE'
        });
        
        if (response.ok || response.status === 204) {
            document.getElementById('delete-modal').classList.add('hidden');
            projectToDelete = null;
            loadProjects();
        } else {
            alert('Ошибка при удалении проекта');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Ошибка при удалении проекта');
    }
});

// Close success modal
document.getElementById('close-success-modal').addEventListener('click', function() {
    document.getElementById('success-modal').classList.add('hidden');
});

// Close modals on backdrop click
document.getElementById('success-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
    }
});

document.getElementById('delete-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
        projectToDelete = null;
    }
});

// Initialize
loadProjects();