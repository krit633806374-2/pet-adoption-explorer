document.addEventListener('DOMContentLoaded', () => {
  loadFavorites();
  setupFilters();
  const refreshBtn = document.getElementById('refresh-favorites');
  refreshBtn?.addEventListener('click', loadFavorites);
});

function setupFilters(){
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn=>{
    btn.addEventListener('click', function(){
      filterButtons.forEach(b=>b.classList.remove('active'));
      this.classList.add('active');
      filterFavorites(this.getAttribute('data-filter'));
    });
  });
}

async function loadFavorites(){
  const listEl = document.getElementById('favorites-list');
  const emptyEl = document.getElementById('empty-favorites');
  const loading = document.getElementById('loading');
  try{
    loading?.classList.remove('hidden');
    const res = await fetch('/api/favorites');
    const data = await res.json();
    loading?.classList.add('hidden');

    if(Array.isArray(data) && data.length){
      renderFavorites(data);
      emptyEl?.classList.add('hidden');
      listEl?.classList.remove('hidden');
      updateStats(data);
    }else{
      listEl.innerHTML = '';
      emptyEl?.classList.remove('hidden');
      listEl?.classList.add('hidden');
      updateStats([]);
    }
  }catch(e){
    console.error(e);
    loading?.classList.add('hidden');
    showMessage('Error loading favorites','error');
  }
}

function renderFavorites(pets){
  const listEl = document.getElementById('favorites-list');
  listEl.innerHTML = '';
  pets.forEach(p => listEl.appendChild(createFavoriteCard(p)));
}

function createFavoriteCard(pet){
  const card = document.createElement('div');
  card.className = 'pet-card';
  const safe = s=> (s||'').toString().replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  card.innerHTML = `
    <div class="pet-image-container">
      <img src="${pet.photo_url || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400'}"
           alt="${safe(pet.name)||'Pet'}" class="pet-image">
    </div>
    <div class="pet-info">
      <div class="pet-name">${safe(pet.name) || 'Pet'}</div>
      <div class="pet-details">
        <div class="detail-row"><i class="fas fa-dna"></i><span><strong>Breed:</strong> ${safe(pet.breed) || 'Mixed'}</span></div>
        <div class="detail-row"><i class="fas fa-birthday-cake"></i><span><strong>Age:</strong> ${safe(pet.age) || 'Unknown'}</span></div>
        <div class="detail-row"><i class="fas fa-paw"></i><span><strong>Type:</strong> ${safe(pet.type) || 'Pet'}</span></div>
      </div>
      <div class="pet-actions">
        <button class="btn btn-danger btn-remove"><i class="fas fa-trash"></i> Remove</button>
      </div>
    </div>
  `;
  card.querySelector('.btn-remove').addEventListener('click', ()=> removeFavorite(pet.id, pet.name));
  return card;
}

async function removeFavorite(petId, name){
  if(!confirm(`Remove ${name || 'this pet'} from favorites?`)) return;
  try{
    const res = await fetch(`/api/favorites/${encodeURIComponent(petId)}`, { method: 'DELETE' });
    if(!res.ok) throw new Error('delete failed');
    showMessage('Removed from favorites','info');
    loadFavorites();
  }catch(e){
    console.error(e);
    showMessage('Error removing favorite','error');
  }
}

function filterFavorites(filter){
  const cards = document.querySelectorAll('.pet-card');
  cards.forEach(c => {
    if(filter==='all') { c.style.display='block'; return; }
    const text = (c.querySelector('.pet-details')?.innerText || '').toLowerCase();
    c.style.display = text.includes(filter) ? 'block' : 'none';
  });
}

function updateStats(pets){
  const totalEl = document.getElementById('total-favorites');
  const dogEl = document.getElementById('dog-count');
  const catEl = document.getElementById('cat-count');
  const recentEl = document.getElementById('recent-added');

  totalEl && (totalEl.textContent = pets.length);
  dogEl && (dogEl.textContent = pets.filter(p=> (p.type||'').toLowerCase()==='dog').length);
  catEl && (catEl.textContent = pets.filter(p=> (p.type||'').toLowerCase()==='cat').length);
  recentEl && (recentEl.textContent = Math.min(pets.length, 5));
}

function showMessage(message, type='success'){
  const el = document.createElement('div');
  el.className = `message ${type}`;
  el.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':(type==='info'?'info-circle':'exclamation-circle')}"></i> ${message}`;
  document.body.prepend(el);
  setTimeout(()=>el.remove(), 3000);
}
