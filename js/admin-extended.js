// Partners Management

// Load partners
async function loadPartners() {
    try {
        const response = await fetch('tables/partners?limit=1000&sort=order');
        const data = await response.json();
        
        document.getElementById('loading-partners').style.display = 'none';
        
        if (data.data && data.data.length > 0) {
            displayPartners(data.data);
        }
    } catch (error) {
        console.error('Error loading partners:', error);
        document.getElementById('loading-partners').style.display = 'none';
    }
}

// Display partners
function displayPartners(partners) {
    const container = document.getElementById('partners-list');
    
    container.innerHTML = partners.map(partner => `
        <div class="border border-gray-200 rounded-xl p-6 hover:border-cyan-300 transition">
            <div class="flex items-start justify-between">
                <div class="flex-1 flex items-center gap-4">
                    <img src="${partner.logo_url}" alt="${partner.name}" class="h-16 w-32 object-contain">
                    <div>
                        <h3 class="text-xl font-bold text-gray-900">${partner.name}</h3>
                        ${partner.website ? `<a href="${partner.website}" target="_blank" class="text-cyan-600 hover:text-cyan-700 text-sm"><i class="fas fa-external-link-alt mr-1"></i>${partner.website}</a>` : ''}
                        ${partner.description ? `<p class="text-gray-600 text-sm mt-2">${partner.description}</p>` : ''}
                    </div>
                </div>
                <button onclick="deletePartner('${partner.id}')" class="w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Partner form submission
document.getElementById('partner-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const partnerData = {
        name: document.getElementById('partner-name').value,
        logo_url: document.getElementById('partner-logo').value,
        website: document.getElementById('partner-website').value,
        description: document.getElementById('partner-description').value,
        order: parseInt(document.getElementById('partner-order').value)
    };
    
    try {
        const response = await fetch('tables/partners', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(partnerData)
        });
        
        if (response.ok) {
            document.getElementById('success-modal').classList.remove('hidden');
            document.getElementById('partner-form').reset();
            loadPartners();
        } else {
            alert('Ошибка при добавлении партнёра');
        }
    } catch (error) {
        console.error('Error adding partner:', error);
        alert('Ошибка при добавлении партнёра');
    }
});

// Reset partner form
document.getElementById('reset-partner-btn').addEventListener('click', function() {
    document.getElementById('partner-form').reset();
});

// Delete partner
window.deletePartner = async function(partnerId) {
    if (!confirm('Удалить партнёра?')) return;
    
    try {
        const response = await fetch(`tables/partners/${partnerId}`, {
            method: 'DELETE'
        });
        
        if (response.ok || response.status === 204) {
            loadPartners();
        } else {
            alert('Ошибка при удалении');
        }
    } catch (error) {
        console.error('Error deleting partner:', error);
        alert('Ошибка при удалении');
    }
};

// Certificates Management

// Load certificates
async function loadCertificates() {
    try {
        const response = await fetch('tables/certificates?limit=1000&sort=order');
        const data = await response.json();
        
        document.getElementById('loading-certificates').style.display = 'none';
        
        if (data.data && data.data.length > 0) {
            displayCertificates(data.data);
        }
    } catch (error) {
        console.error('Error loading certificates:', error);
        document.getElementById('loading-certificates').style.display = 'none';
    }
}

// Display certificates
function displayCertificates(certificates) {
    const container = document.getElementById('certificates-list');
    
    container.innerHTML = certificates.map(cert => `
        <div class="border border-gray-200 rounded-xl p-6 hover:border-cyan-300 transition">
            <div class="flex items-start justify-between">
                <div class="flex-1 flex gap-4">
                    <img src="${cert.image_url}" alt="${cert.title}" class="h-24 w-20 object-cover rounded">
                    <div>
                        <h3 class="text-xl font-bold text-gray-900">${cert.title}</h3>
                        <p class="text-gray-600 text-sm mt-1">${cert.number}</p>
                        <p class="text-gray-600 text-sm mt-1">
                            <i class="fas fa-calendar mr-1"></i>${cert.issued_date} - ${cert.expiry_date}
                        </p>
                        ${cert.description ? `<p class="text-gray-600 text-sm mt-2">${cert.description}</p>` : ''}
                    </div>
                </div>
                <button onclick="deleteCertificate('${cert.id}')" class="w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Certificate form submission
document.getElementById('certificate-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const certData = {
        title: document.getElementById('cert-title').value,
        number: document.getElementById('cert-number').value,
        issued_date: document.getElementById('cert-issued').value,
        expiry_date: document.getElementById('cert-expiry').value,
        image_url: document.getElementById('cert-image').value,
        pdf_url: document.getElementById('cert-pdf').value,
        description: document.getElementById('cert-description').value,
        order: parseInt(document.getElementById('cert-order').value)
    };
    
    try {
        const response = await fetch('tables/certificates', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(certData)
        });
        
        if (response.ok) {
            document.getElementById('success-modal').classList.remove('hidden');
            document.getElementById('certificate-form').reset();
            loadCertificates();
        } else {
            alert('Ошибка при добавлении сертификата');
        }
    } catch (error) {
        console.error('Error adding certificate:', error);
        alert('Ошибка при добавлении сертификата');
    }
});

// Reset certificate form
document.getElementById('reset-cert-btn').addEventListener('click', function() {
    document.getElementById('certificate-form').reset();
});

// Delete certificate
window.deleteCertificate = async function(certId) {
    if (!confirm('Удалить сертификат?')) return;
    
    try {
        const response = await fetch(`tables/certificates/${certId}`, {
            method: 'DELETE'
        });
        
        if (response.ok || response.status === 204) {
            loadCertificates();
        } else {
            alert('Ошибка при удалении');
        }
    } catch (error) {
        console.error('Error deleting certificate:', error);
        alert('Ошибка при удалении');
    }
};

// Initialize partners and certificates on load
loadPartners();
loadCertificates();