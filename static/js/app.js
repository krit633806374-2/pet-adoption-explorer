document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const heroSearchForm = document.getElementById('hero-search-form');
    const searchResultsSection = document.getElementById('search-results-section');
    const searchResults = document.getElementById('search-results');
    
    // Prevent multiple initialization
    let isInitialized = false;
    
    // Debug: Check if elements exist
    console.log('🔍 DOM Elements check:', {
        heroSearchForm: !!heroSearchForm,
        searchResultsSection: !!searchResultsSection,
        searchResults: !!searchResults,
        isInitialized: isInitialized
    });

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
            type: document.getElementById('hero-pet-type').value,
            location: document.getElementById('hero-location').value || 'New York',
            age: document.getElementById('hero-age').value,
            size: document.getElementById('hero-size').value
        };
        
        // Set active state based on search type
        if (searchParams.type === 'dog') {
            setActiveBrowseItem('view-dogs');
        } else if (searchParams.type === 'cat') {
            setActiveBrowseItem('view-cats');
        } else if (!searchParams.type) {
            setActiveBrowseItem('view-all-pets');
        } else {
            // Remove all active states for custom searches
            setActiveBrowseItem('');
        }
        
        await performSearch(searchParams);
    });



    // Set active browse item
    function setActiveBrowseItem(activeId) {
        // Remove active class from all browse buttons
        document.querySelectorAll('.browse-button').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected item
        const activeItem = document.getElementById(activeId);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    // Pet Category Cards
    window.searchPetType = async (petType) => {
        const activeId = petType === 'dog' ? 'view-dogs' : 'view-cats';
        setActiveBrowseItem(activeId);
        await performSearch({ type: petType, location: 'New York' });
    };
    
    // Search All Pets
    window.searchAllPets = async () => {
        console.log('🐾 searchAllPets called - should show ALL pets (no type specified)');
        setActiveBrowseItem('view-all-pets');
        // Don't send type parameter at all for all pets
        await performSearch({ location: 'New York' });
    };
    
    // Auto-load all pets when page is ready
    async function initializePage() {
        if (isInitialized) {
            console.log('⚠️ Page already initialized, skipping...');
            return;
        }
        
        isInitialized = true;
        console.log('🚀 Initializing page with all pets...');
        console.log('🔧 Setting active item to view-all-pets');
        setActiveBrowseItem('view-all-pets');
        
        try {
            console.log('📞 Calling searchAllPets...');
            await searchAllPets();
            console.log('✅ Page initialization complete');
        } catch (error) {
            console.error('❌ Failed to initialize page:', error);
            isInitialized = false; // Reset on error
        }
    }
    
    // Load pets immediately when DOM is ready (only once)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePage);
    } else {
        // DOM is already ready
        setTimeout(initializePage, 100); // Small delay to ensure everything is ready
    }

    // Main Search Function
    async function performSearch(params) {
        console.log('🔍 performSearch called with params:', params);
        showLoading();
        
        try {
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    queryParams.append(key, value);
                }
            });
            
            console.log('🌐 Final query URL:', `/search?${queryParams}`);
            
            const response = await fetch(`/search?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const pets = await response.json();
            console.log('🐕 Received pets:', pets.length, pets);
            console.log('📊 Pet types in results:', pets.map(p => p.type));
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
        
        // Update section title
        const sectionTitle = searchResultsSection.querySelector('.section-title');
        const displayType = searchType === 'pets' ? 'pet' : searchType;
        if (pets.length > 0) {
            sectionTitle.textContent = searchType === 'pets' ? 
                `Available Pets (${pets.length})` : 
                `Found ${pets.length} ${displayType}${pets.length !== 1 ? 's' : ''}`;
        } else {
            sectionTitle.textContent = searchType === 'pets' ? 
                'Available Pets' : 
                `No ${displayType}s found`;
        }
        
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
            <div class="pet-image-container">
                <img src="${pet.photo_url || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop'}" 
                     alt="${pet.name || 'Adorable pet'}" 
                     class="pet-image" 
                     onerror="this.src='https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop'">
            </div>
            
            <div class="pet-info">
                <div class="pet-name">${pet.name || 'Sweet Pet'}</div>
                
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
                    ${pet.gender ? `
                    <div class="detail-row">
                        <i class="fas fa-venus-mars"></i>
                        <span><strong>Gender:</strong> ${pet.gender}</span>
                    </div>` : ''}
                    ${pet.size ? `
                    <div class="detail-row">
                        <i class="fas fa-weight"></i>
                        <span><strong>Size:</strong> ${pet.size}</span>
                    </div>` : ''}
                </div>
                
                ${pet.description ? `
                <div class="pet-description">
                    <h4><i class="fas fa-info-circle"></i> About ${pet.name}</h4>
                    <p>${pet.description}</p>
                </div>` : ''}
                
                <div class="contact-section">
                    <div class="contact-info">
                        ${pet.contact ? `
                        <div class="contact-item">
                            <i class="fas fa-envelope contact-icon"></i>
                            <div class="contact-details">
                                <span class="contact-label">Email:</span>
                                <a href="mailto:${pet.contact}" class="contact-value">${pet.contact}</a>
                            </div>
                        </div>` : ''}
                        ${pet.phone ? `
                        <div class="contact-item">
                            <i class="fas fa-phone-alt contact-icon"></i>
                            <div class="contact-details">
                                <span class="contact-label">Tel:</span>
                                <a href="tel:${pet.phone}" class="contact-value">${pet.phone}</a>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
                
                <div class="pet-actions">
                    <button onclick="saveFavorite('${pet.id}', '${pet.name?.replace(/'/g, "\\'")}', '${pet.type}', '${pet.breed?.replace(/'/g, "\\'")}', '${pet.age}', '${pet.contact?.replace(/'/g, "\\'")}', '${pet.photo_url}')" 
                            class="btn btn-primary btn-favorite">
                        <i class="fas fa-heart"></i> Save to Favorites
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }



    // Auto-load is now handled by initializePage()
});

// Global Functions for onclick handlers
window.saveFavorite = async function(petId, name, type, breed, age, contact, photoUrl) {
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
            const button = event?.target || document.querySelector(`button[onclick*="${petId}"]`);
            
            if (result.action === 'added') {
                if (button) {
                    button.classList.add('favorited');
                    button.innerHTML = '<i class="fas fa-heart"></i> Added!';
                }
                showMessage(`${name || 'Pet'} added to favorites!`, 'success');
            } else {
                if (button) {
                    button.classList.remove('favorited');
                    button.innerHTML = '<i class="fas fa-heart"></i> Save to Favorites';
                }
                showMessage(`${name || 'Pet'} removed from favorites!`, 'info');
            }
        } else {
            throw new Error(result.message || 'Failed to manage favorite');
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