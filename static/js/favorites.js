document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const refreshFavoritesBtn = document.getElementById('refresh-favorites');
    const exportFavoritesBtn = document.getElementById('export-favorites');
    const favoritesList = document.getElementById('favorites-list');
    const emptyFavorites = document.getElementById('empty-favorites');
    const loading = document.getElementById('loading');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Stats Elements
    const totalFavoritesEl = document.getElementById('total-favorites');
    const dogCountEl = document.getElementById('dog-count');
    const catCountEl = document.getElementById('cat-count');
    const recentAddedEl = document.getElementById('recent-added');

    let allFavorites = [];
    let filteredFavorites = [];

    // Utility Functions
    function showLoading() {
        loading.classList.remove('hidden');
    }

    function hideLoading() {
        loading.classList.add('hidden');
    }

    function showMessage(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
        
        document.body.insertBefore(messageDiv, document.body.firstChild);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 4000);
    }

    // Load Favorites
    async function loadFavorites() {
        showLoading();
        
        try {
            const response = await fetch('/favorites');
            const favorites = await response.json();
            
            allFavorites = favorites;
            filteredFavorites = [...favorites];
            
            updateStats(favorites);
            displayFavorites(favorites);
            
        } catch (error) {
            console.error('Error loading favorites:', error);
            showMessage('Error loading favorites. Please try again.', 'error');
            showEmptyState();
        } finally {
            hideLoading();
        }
    }

    // Update Statistics
    function updateStats(favorites) {
        const totalCount = favorites.length;
        const dogCount = favorites.filter(fav => fav[3].toLowerCase() === 'dog').length;
        const catCount = favorites.filter(fav => fav[3].toLowerCase() === 'cat').length;
        const recentCount = Math.min(totalCount, 3); // Assuming recent = last 3 added
        
        // Animate number changes
        animateNumber(totalFavoritesEl, totalCount);
        animateNumber(dogCountEl, dogCount);
        animateNumber(catCountEl, catCount);
        animateNumber(recentAddedEl, recentCount);
    }

    // Animate Number
    function animateNumber(element, targetNumber) {
        const currentNumber = parseInt(element.textContent) || 0;
        const increment = targetNumber > currentNumber ? 1 : -1;
        const duration = 1000;
        const steps = Math.abs(targetNumber - currentNumber);
        const stepDuration = steps > 0 ? duration / steps : 0;

        if (steps === 0) return;

        let current = currentNumber;
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            if (current === targetNumber) {
                clearInterval(timer);
            }
        }, stepDuration);
    }

    // Display Favorites
    function displayFavorites(favorites) {
        favoritesList.innerHTML = '';
        
        if (favorites.length === 0) {
            showEmptyState();
            return;
        }
        
        hideEmptyState();
        
        favorites.forEach(fav => {
            const favCard = createFavoriteCard(fav);
            favoritesList.appendChild(favCard);
        });
    }

    // Create Favorite Card
    function createFavoriteCard(fav) {
        const card = document.createElement('div');
        card.className = 'pet-card';
        card.setAttribute('data-type', fav[3].toLowerCase());
        card.setAttribute('data-age', fav[5].toLowerCase());
        
        card.innerHTML = `
            <img src="${fav[7] || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop'}" 
                 alt="${fav[2]}" 
                 class="pet-image"
                 onerror="this.src='https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop'">
            
            <div class="pet-info">
                <div class="pet-name">${fav[2]}</div>
                <div class="pet-details">
                    <div><i class="fas fa-paw"></i> <strong>Breed:</strong> ${fav[4]}</div>
                    <div><i class="fas fa-birthday-cake"></i> <strong>Age:</strong> ${fav[5]}</div>
                    <div><i class="fas fa-tag"></i> <strong>Type:</strong> ${fav[3]}</div>
                </div>
                <div class="pet-contact">
                    <i class="fas fa-envelope"></i> ${fav[6]}
                </div>
                <div class="pet-actions">
                    <button onclick="deleteFavorite('${fav[1]}')" class="btn btn-danger">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                    <button onclick="contactShelter('${fav[6]}')" class="btn btn-secondary">
                        <i class="fas fa-phone"></i> Contact
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    // Show/Hide Empty State
    function showEmptyState() {
        favoritesList.style.display = 'none';
        emptyFavorites.classList.remove('hidden');
    }

    function hideEmptyState() {
        favoritesList.style.display = 'grid';
        emptyFavorites.classList.add('hidden');
    }

    // Filter Favorites
    function filterFavorites(filterType) {
        let filtered = [...allFavorites];
        
        if (filterType !== 'all') {
            filtered = allFavorites.filter(fav => {
                const type = fav[3].toLowerCase();
                const age = fav[5].toLowerCase();
                
                return type === filterType || age === filterType;
            });
        }
        
        filteredFavorites = filtered;
        displayFavorites(filtered);
        updateStats(filtered);
    }

    // Event Listeners
    refreshFavoritesBtn.addEventListener('click', () => {
        loadFavorites();
        showMessage('Favorites refreshed!');
    });

    exportFavoritesBtn.addEventListener('click', async () => {
        showLoading();
        
        try {
            const response = await fetch('/export');
            const result = await response.json();
            
            showMessage('Favorites exported to favorites.json successfully!');
            
        } catch (error) {
            console.error('Error exporting favorites:', error);
            showMessage('Error exporting favorites. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });

    // Filter Button Event Listeners
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const filterType = btn.getAttribute('data-filter');
            filterFavorites(filterType);
        });
    });

    // Load favorites on page load
    loadFavorites();
});

// Global Functions
window.deleteFavorite = async function(petId) {
    if (confirm('Are you sure you want to remove this pet from your favorites?')) {
        try {
            const response = await fetch(`/favorites?pet_id=${petId}`, { 
                method: 'DELETE' 
            });
            
            if (response.ok) {
                showMessage('Pet removed from favorites!');
                // Reload favorites
                location.reload();
            } else {
                throw new Error('Failed to delete favorite');
            }
            
        } catch (error) {
            console.error('Error deleting favorite:', error);
            showMessage('Error removing favorite. Please try again.', 'error');
        }
    }
};

window.contactShelter = function(email) {
    if (email && email !== 'Contact shelter directly') {
        window.location.href = `mailto:${email}?subject=Interest in Pet Adoption&body=Hello, I am interested in adopting one of your pets. Please let me know more details.`;
    } else {
        showMessage('Contact information not available for this pet.', 'error');
    }
};

// Show message function for global use
window.showMessage = function(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 4000);
};