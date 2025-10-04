document.addEventListener('DOMContentLoaded', function() {
    loadFavorites();
    setupFilters();
});

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            filterFavorites(filter);
        });
    });
}

async function loadFavorites() {
    const favoritesGrid = document.getElementById('favorites-list');
    const emptyState = document.getElementById('empty-favorites');
    const loading = document.getElementById('loading');
    
    try {
        loading.classList.remove('hidden');
        
        const response = await fetch('/favorites');
        const data = await response.json();
        
        loading.classList.add('hidden');
        
        if (data.pets && data.pets.length > 0) {
            displayFavorites(data.pets);
            emptyState.classList.add('hidden');
            favoritesGrid.classList.remove('hidden');
        } else {
            emptyState.classList.remove('hidden');
            favoritesGrid.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Error loading favorites:', error);
        loading.classList.add('hidden');
        showMessage('Error loading favorites', 'error');
    }
}

function displayFavorites(pets) {
    const favoritesGrid = document.getElementById('favorites-list');
    favoritesGrid.innerHTML = '';
    
    pets.forEach(pet => {
        const petCard = createFavoriteCard(pet);
        favoritesGrid.appendChild(petCard);
    });
}

function createFavoriteCard(pet) {
    const card = document.createElement('div');
    card.className = 'pet-card';
    
    card.innerHTML = `
        <div class="pet-image-container">
            <img src="${pet.photo_url || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400'}" 
                 alt="${pet.name || 'Pet'}" 
                 class="pet-image">
        </div>
        
        <div class="pet-info">
            <div class="pet-name">${pet.name || 'Pet'}</div>
            
            <div class="pet-details">
                <div class="detail-row">
                    <i class="fas fa-dna"></i>
                    <span><strong>Breed:</strong> ${pet.breed || 'Mixed'}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-birthday-cake"></i>
                    <span><strong>Age:</strong> ${pet.age || 'Unknown'}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-paw"></i>
                    <span><strong>Type:</strong> ${pet.type || 'Pet'}</span>
                </div>
            </div>
            
            <div class="pet-contact">
                <h4><i class="fas fa-phone"></i> Contact</h4>
                <div class="contact-details">
                    ${pet.contact ? `
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <a href="mailto:${pet.contact}">${pet.contact}</a>
                    </div>` : ''}
                    ${pet.phone ? `
                    <div class="contact-item">
                        <i class="fas fa-phone-alt"></i>
                        <a href="tel:${pet.phone}">${pet.phone}</a>
                    </div>` : ''}
                </div>
            </div>
            
            <div class="pet-actions">
                <button onclick="removeFavorite('${pet.id}', '${pet.name || 'Pet'}')" 
                        class="btn btn-danger btn-remove">
                    <i class="fas fa-trash"></i> Remove from Favorites
                </button>
            </div>
        </div>
    `;
    
    return card;
}

async function removeFavorite(petId, petName) {
    if (confirm('Remove ' + petName + ' from favorites?')) {
        try {
            const response = await fetch('/manage_favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'add',
                    pet_id: petId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showMessage(petName + ' removed from favorites!', 'info');
                loadFavorites();
            }
            
        } catch (error) {
            console.error('Error:', error);
            showMessage('Error removing favorite', 'error');
        }
    }
}

function filterFavorites(filter) {
    const petCards = document.querySelectorAll('.pet-card');
    
    petCards.forEach(card => {
        card.style.display = 'block';
    });
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + (type || 'success');
    messageDiv.innerHTML = '<i class="fas fa-check-circle"></i> ' + message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(function() {
        messageDiv.remove();
    }, 3000);
}
