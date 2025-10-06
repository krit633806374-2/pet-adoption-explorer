document.addEventListener('DOMContentLoaded', () => {
  const heroSearchForm = document.getElementById('hero-search-form');
  const searchResultsSection = document.getElementById('search-results-section');
  const searchResults = document.getElementById('search-results');
  const loading = document.getElementById('loading');
  const loadMoreBtn = document.getElementById('load-more');

  let isInitialized = false;
  let currentPage = 1;
  let totalPages = 1;
  let currentQuery = {};

  function showLoading(){ loading?.classList.remove('hidden'); }
  function hideLoading(){ loading?.classList.add('hidden'); }
  function showMessage(message, type='success'){
    const el = document.createElement('div');
    el.className = `message ${type}`;
    el.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':'exclamation-circle'}"></i> ${message}`;
    document.body.prepend(el);
    setTimeout(()=>el.remove(), 3000);
  }
  function scrollToResults(){ searchResultsSection?.scrollIntoView({behavior:'smooth', block:'start'}); }
  function setActiveBrowseItem(activeId){
    document.querySelectorAll('.browse-button').forEach(b=>b.classList.remove('active'));
    const el = document.getElementById(activeId);
    if(el) el.classList.add('active');
  }

  heroSearchForm?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const params = {
      animal_type: document.getElementById('hero-pet-type')?.value || undefined,
      location: document.getElementById('hero-location')?.value || '10001',
      age: document.getElementById('hero-age')?.value || undefined,
      size: document.getElementById('hero-size')?.value || undefined,
      per_page: 24,
      page: 1
    };
    if(!params.animal_type) setActiveBrowseItem('view-all-pets');
    else if(params.animal_type==='dog') setActiveBrowseItem('view-dogs');
    else if(params.animal_type==='cat') setActiveBrowseItem('view-cats');
    await startSearch(params);
  });

  window.searchPetType = async (petType)=>{
    setActiveBrowseItem(petType==='dog'?'view-dogs':'view-cats');
    await startSearch({ animal_type: petType, location: '10001', per_page: 24, page: 1 });
  };
  window.searchAllPets = async ()=>{
    setActiveBrowseItem('view-all-pets');
    await startSearch({ location: '10001', per_page: 24, page: 1 });
  };

  async function initializePage(){
    if(isInitialized) return;
    isInitialized = true;
    setActiveBrowseItem('view-all-pets');
    await searchAllPets();
  }
  initializePage();

  async function startSearch(params){
    searchResults.innerHTML = '';
    currentPage = 1;
    totalPages = 1;
    currentQuery = params || {};
    await fetchPage(1, true);
  }

  async function fetchPage(page = 1, replaceTitle = false){
    showLoading();
    try{
      const q = new URLSearchParams({ ...currentQuery, page: String(page) });
      const res = await fetch(`/api/search?${q.toString()}`);
      if(!res.ok) throw new Error(res.status);
      const data = await res.json();

      currentPage = data.page;
      totalPages = data.total_pages;

      appendCards(data.items);

      const titleEl = searchResultsSection.querySelector('.section-title');
      const totalNow = searchResults.children.length;
      titleEl.textContent = `Available Pets (${totalNow})`;
      showMessage(`Loaded page ${currentPage}/${totalPages}`);

      loadMoreBtn.style.display = currentPage < totalPages ? 'block' : 'none';
      setTimeout(scrollToResults, 100);
    }catch(err){
      console.error(err);
      showMessage('Error searching pets','error');
    }finally{
      hideLoading();
    }
  }

  function appendCards(items){
    items.forEach(p => searchResults.appendChild(createPetCard(p)));
  }

  function createPetCard(pet){
    const card = document.createElement('div');
    card.className='pet-card';
    const safe = s=> (s||'').toString().replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    card.innerHTML = `
      <div class="pet-image-container">
        <img src="${pet.photo_url || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop'}"
             alt="${safe(pet.name)||'Adorable pet'}"
             class="pet-image"
             onerror="this.src='https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop'">
      </div>
      <div class="pet-info">
        <div class="pet-name">${safe(pet.name) || 'Sweet Pet'}</div>
        <div class="pet-details">
          <div class="detail-row"><i class="fas fa-dna"></i><span><strong>Breed:</strong> ${safe(pet.breed) || 'Mixed'}</span></div>
          <div class="detail-row"><i class="fas fa-birthday-cake"></i><span><strong>Age:</strong> ${safe(pet.age) || 'Unknown'}</span></div>
          <div class="detail-row"><i class="fas fa-paw"></i><span><strong>Type:</strong> ${safe(pet.type) || 'Pet'}</span></div>
          ${pet.gender?`<div class="detail-row"><i class="fas fa-venus-mars"></i><span><strong>Gender:</strong> ${safe(pet.gender)}</span></div>`:''}
          ${pet.size?`<div class="detail-row"><i class="fas fa-weight"></i><span><strong>Size:</strong> ${safe(pet.size)}</span></div>`:''}
        </div>
        ${pet.description?`<div class="pet-description"><h4><i class="fas fa-info-circle"></i> About ${safe(pet.name)}</h4><p>${safe(pet.description)}</p></div>`:''}
        <div class="contact-section">
          <div class="contact-info">
            ${pet.contact?`<div class="contact-item"><i class="fas fa-envelope contact-icon"></i><div class="contact-details"><span class="contact-label">Email:</span><a href="mailto:${safe(pet.contact)}" class="contact-value">${safe(pet.contact)}</a></div></div>`:''}
            ${pet.phone?`<div class="contact-item"><i class="fas fa-phone-alt contact-icon"></i><div class="contact-details"><span class="contact-label">Tel:</span><a href="tel:${safe(pet.phone)}" class="contact-value">${safe(pet.phone)}</a></div></div>`:''}
          </div>
        </div>
        <div class="pet-actions">
          <button class="btn btn-primary btn-favorite"> <i class="fas fa-heart"></i> Save to Favorites </button>
        </div>
      </div>
    `;
    card.querySelector('.btn-favorite').addEventListener('click', ()=> saveToFavorites(pet));
    return card;
  }

  async function saveToFavorites(pet){
    try{
      const res = await fetch('/api/favorites', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(pet)
      });
      const payload = await res.json().catch(()=> ({}));
      if(!res.ok || !payload.ok){
        const msg = payload.error || `HTTP ${res.status}`;
        console.error('Save failed:', msg);
        showMessage(`Error saving favorite: ${msg}`, 'error');
        return;
      }
      showMessage(`${pet.name || 'Pet'} added to favorites!`);
    }catch(e){
      console.error(e);
      showMessage('Error saving favorite: network error','error');
    }
  }

  loadMoreBtn?.addEventListener('click', async ()=>{
    if (currentPage < totalPages) {
      await fetchPage(currentPage + 1);
    }
  });
});
