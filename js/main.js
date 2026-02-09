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

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar-scroll');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '#!') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Form submission handler
const contactForm = document.querySelector('form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        
        // Show success message
        alert('Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.');
        
        // Reset form
        this.reset();
    });
}

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.card-hover').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Load partners
async function loadPartners() {
    try {
        const response = await fetch('tables/partners?limit=100&sort=order');
        const data = await response.json();
        
        const container = document.getElementById('partners-container');
        const loading = document.getElementById('partners-loading');
        
        if (data.data && data.data.length > 0) {
            container.innerHTML = data.data.map(partner => `
                <div class="bg-white p-6 rounded-xl border border-gray-200 hover:border-cyan-300 hover:shadow-lg transition flex items-center justify-center">
                    ${partner.website ? `<a href="${partner.website}" target="_blank" class="block w-full">` : '<div class="w-full">'}
                        <img src="${partner.logo_url}" alt="${partner.name}" class="w-full h-20 object-contain grayscale hover:grayscale-0 transition" title="${partner.description}">
                    ${partner.website ? '</a>' : '</div>'}
                </div>
            `).join('');
        }
        
        loading.style.display = 'none';
    } catch (error) {
        console.error('Error loading partners:', error);
        document.getElementById('partners-loading').style.display = 'none';
    }
}

// Load certificates
async function loadCertificates() {
    try {
        const response = await fetch('tables/certificates?limit=100&sort=order');
        const data = await response.json();
        
        const container = document.getElementById('certificates-container');
        const loading = document.getElementById('certificates-loading');
        
        if (data.data && data.data.length > 0) {
            container.innerHTML = data.data.map(cert => `
                <div class="card-hover bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer" onclick="openCertificateModal('${cert.id}')">
                    <div class="relative h-64 overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500">
                        <img src="${cert.image_url}" alt="${cert.title}" class="w-full h-full object-cover">
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                            ${cert.title}
                        </h3>
                        <div class="flex items-center justify-between text-sm text-gray-600 mb-3">
                            <span><i class="fas fa-hashtag mr-1"></i>${cert.number}</span>
                            <span><i class="fas fa-calendar mr-1"></i>${cert.issued_date}</span>
                        </div>
                        <p class="text-gray-600 text-sm line-clamp-2 mb-4">
                            ${cert.description}
                        </p>
                        <button class="text-cyan-600 hover:text-cyan-700 font-medium text-sm">
                            Подробнее <i class="fas fa-arrow-right ml-1"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        loading.style.display = 'none';
    } catch (error) {
        console.error('Error loading certificates:', error);
        document.getElementById('certificates-loading').style.display = 'none';
    }
}

// Store certificates data
let certificatesData = [];

// Open certificate modal
async function openCertificateModal(certId) {
    if (certificatesData.length === 0) {
        const response = await fetch('tables/certificates?limit=100');
        const data = await response.json();
        certificatesData = data.data || [];
    }
    
    const cert = certificatesData.find(c => c.id === certId);
    if (!cert) return;
    
    const modal = document.getElementById('certificate-modal');
    document.getElementById('cert-modal-title').textContent = cert.title;
    document.getElementById('cert-modal-image').src = cert.image_url;
    document.getElementById('cert-modal-number').textContent = cert.number;
    document.getElementById('cert-modal-issued').textContent = cert.issued_date;
    document.getElementById('cert-modal-expiry').textContent = cert.expiry_date;
    document.getElementById('cert-modal-description').textContent = cert.description;
    
    // PDF link
    const pdfContainer = document.getElementById('cert-modal-pdf-container');
    const pdfLink = document.getElementById('cert-modal-pdf');
    if (cert.pdf_url) {
        pdfLink.href = cert.pdf_url;
        pdfContainer.classList.remove('hidden');
    } else {
        pdfContainer.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Make function global
window.openCertificateModal = openCertificateModal;

// Close certificate modal
function closeCertModal() {
    document.getElementById('certificate-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

document.getElementById('close-cert-modal').addEventListener('click', closeCertModal);

// Close modal on backdrop click
document.getElementById('certificate-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeCertModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCertModal();
    }
});

// Initialize
loadPartners();
loadCertificates();