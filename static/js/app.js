document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const heroSearchForm = document.getElementById('hero-search-form');
    const searchResultsSection = document.getElementById('search-results-section');
    const searchResults = document.getElementById('search-results');

    const loading = document.getElementById('loading');

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

    function scrollToResults() {
        searchResultsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }



    // Hero Search Form
    heroSearchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const searchParams = {
            type: document.getElementById('hero-pet-type').value || 'dog',
            location: document.getElementById('hero-location').value || 'New York',
            age: document.getElementById('hero-age').value,
            size: document.getElementById('hero-size').value
        };
        
        await performSearch(searchParams);
    });



    // Pet Category Cards
    window.searchPetType = async (petType) => {
        await performSearch({ type: petType, location: 'New York' });
    };
    
    // Search All Pets
    window.searchAllPets = async () => {
        await performSearch({ location: 'New York' });
    };
    
    // Load all pets on page load
    window.addEventListener('load', () => {
        // Auto-load all pets when page loads
        setTimeout(() => {
            searchAllPets();
        }, 500);
    });

    // Main Search Function
    async function performSearch(params) {
        showLoading();
        
        try {
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });
            
            const response = await fetch(`/search?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const pets = await response.json();
            const displayType = params.type ? params.type : 'pets';
            displaySearchResults(pets, displayType);
            
        } catch (error) {
            console.error('Search error:', error);
            showMessage('Error searching for pets. Please try again.', 'error');
            displaySearchResults([], 'pets');
        } finally {
            hideLoading();
        }
    }

    // Display Search Results
    function displaySearchResults(pets, searchType) {
        searchResults.innerHTML = '';
        searchResultsSection.classList.remove('hidden');
        
        // Update section title
        const sectionTitle = searchResultsSection.querySelector('.section-title');
        const displayType = searchType === 'pets' ? 'pet' : searchType;
        sectionTitle.textContent = pets.length > 0 
            ? `Found ${pets.length} ${displayType}${pets.length !== 1 ? 's' : ''}`
            : `No ${displayType}s found`;
        
        if (pets.length === 0) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <i class="fas fa-paw" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <h3>No pets found</h3>
                        <p>Try adjusting your search criteria or location.</p>
                        <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                            <i class="fas fa-refresh"></i> Search Again
                        </button>
                    </div>
                </div>
            `;
        } else {
            pets.forEach(pet => {
                const petCard = createPetCard(pet);
                searchResults.appendChild(petCard);
            });
            
            showMessage(`Found ${pets.length} adorable ${searchType}${pets.length !== 1 ? 's' : ''}!`);
        }
        
        // Scroll to results
        setTimeout(scrollToResults, 100);
    }

    // Create Pet Card
    function createPetCard(pet) {
        const card = document.createElement('div');
        card.className = 'pet-card';
        
        card.innerHTML = `
            <img src="${pet.photo_url || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop'}" 
                 alt="${pet.name || 'Adorable pet'}" 
                 class="pet-image" 
                 onerror="this.src='https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop'">
            
            <div class="pet-info">
                <div class="pet-name">${pet.name || 'Sweet Pet'}</div>
                <div class="pet-details">
                    <div><strong>Breed:</strong> ${pet.breed || 'Mixed'}</div>
                    <div><strong>Age:</strong> ${pet.age || 'Unknown'}</div>
                    <div><strong>Type:</strong> ${pet.type || 'Pet'}</div>
                </div>
                <div class="pet-contact">
                    <i class="fas fa-envelope"></i> 
                    ${pet.contact || 'Contact shelter directly'}
                </div>
                <button onclick="saveFavorite('${pet.id}', '${pet.name?.replace(/'/g, "\\'")}', '${pet.type}', '${pet.breed?.replace(/'/g, "\\'")}', '${pet.age}', '${pet.contact?.replace(/'/g, "\\'")}', '${pet.photo_url}')" 
                        class="btn btn-primary">
                    <i class="fas fa-heart"></i> Save to Favorites
                </button>
            </div>
        `;
        
        return card;
    }



    // Auto-load some featured pets on page load
    setTimeout(() => {
        performSearch({ type: 'dog', location: 'New York' });
    }, 1000);
});

// Global Functions for onclick handlers
window.saveFavorite = async function(petId, name, type, breed, age, contact, photoUrl) {
    try {
        const response = await fetch('/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                pet_id: petId,
                name: name,
                type: type,
                breed: breed,
                age: age,
                contact: contact,
                photo_url: photoUrl
            })
        });
        
        if (response.ok) {
            showMessage(`${name || 'Pet'} saved to favorites!`);
        } else {
            throw new Error('Failed to save favorite');
        }
        
    } catch (error) {
        console.error('Error saving favorite:', error);
        showMessage('Error saving favorite. Please try again.', 'error');
    }
};

window.deleteFavorite = async function(petId) {
    if (confirm('Are you sure you want to remove this pet from favorites?')) {
        try {
            const response = await fetch(`/favorites?pet_id=${petId}`, { 
                method: 'DELETE' 
            });
            
            if (response.ok) {
                showMessage('Pet removed from favorites!');
                // Refresh favorites list
                document.getElementById('view-favorites').click();
            } else {
                throw new Error('Failed to delete favorite');
            }
            
        } catch (error) {
            console.error('Error deleting favorite:', error);
            showMessage('Error removing favorite. Please try again.', 'error');
        }
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