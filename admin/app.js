const API_URL = 'http://localhost:3000/api/admin';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let restaurants = [];
let categories = [];
let allCategories = [];

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    if (authToken && currentUser) {
        showApp();
        loadDashboard();
    }
});

// Login Form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showApp();
            loadDashboard();
        } else {
            errorEl.textContent = data.error || 'Giriş başarısız!';
            errorEl.classList.add('show');
        }
    } catch (error) {
        errorEl.textContent = 'Sunucuya bağlanılamadı! Server çalışıyor mu kontrol edin.';
        errorEl.classList.add('show');
    }
});

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').classList.add('active');
    
    // Kullanıcı adını göster
    const userName = currentUser.restaurantName 
        ? `${currentUser.username} (${currentUser.restaurantName})` 
        : currentUser.username;
    document.getElementById('userName').textContent = userName;
    
    // Manager ise restoran ve kullanıcılar menüsünü gizle
    if (currentUser.role === 'manager') {
        const restaurantMenu = document.querySelector('.menu-item[onclick="showSection(\'restaurants\')"]');
        if (restaurantMenu) {
            restaurantMenu.style.display = 'none';
        }
        
        const usersMenu = document.getElementById('users-menu');
        if (usersMenu) {
            usersMenu.style.display = 'none';
        }
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    location.reload();
}

// Check if user is admin
function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

// Get restaurant filter
function getRestaurantFilter() {
    if (isAdmin()) {
        return {};
    }
    return { restaurantId: currentUser.restaurantId };
}

// Section Navigation
function showSection(section) {
    // Update menu
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.menu-item').classList.add('active');
    
    // Update content
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`section-${section}`).classList.add('active');
    
    // Update title
    const titles = {
        dashboard: 'Dashboard',
        restaurants: 'Restoranlar',
        categories: 'Kategoriler',
        products: 'Ürünler',
        orders: 'Siparişler',
        users: 'Kullanıcılar'
    };
    document.getElementById('pageTitle').textContent = titles[section];
    
    // Load data
    if (section === 'dashboard') loadDashboard();
    else if (section === 'restaurants') loadRestaurants();
    else if (section === 'categories') loadCategories();
    else if (section === 'products') loadProducts();
    else if (section === 'orders') loadOrders();
    else if (section === 'users') loadUsers();
}

// Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/stats/dashboard`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const stats = await response.json();
            
            // Admin için tüm istatistikler
            if (isAdmin()) {
                document.getElementById('stat-restaurants').textContent = stats.totalRestaurants;
                document.getElementById('stat-orders').textContent = stats.totalOrders;
                document.getElementById('stat-pending').textContent = stats.pendingOrders;
                document.getElementById('stat-revenue').textContent = stats.todayRevenue + '₺';
            } else {
                // Manager için sadece kendi restoranının istatistikleri
                // İstatistikleri yeniden hesapla
                await loadManagerStats();
            }
        }
    } catch (error) {
        console.error('Dashboard yüklenemedi:', error);
    }
}

async function loadManagerStats() {
    try {
        const filter = currentUser.restaurantId;
        
        // Kategoriler
        const catResponse = await fetch(`${API_URL}/restaurants/${filter}/categories`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const categories = await catResponse.json();
        
        // Siparişler
        const ordersResponse = await fetch(`${API_URL}/orders?restaurantId=${filter}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const orders = await ordersResponse.json();
        
        // Bekleyen siparişler
        const pending = orders.filter(o => o.status === 'pending').length;
        
        // Bugünkü gelir
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(o => new Date(o.createdAt) >= today && o.status !== 'cancelled');
        const revenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        
        document.getElementById('stat-restaurants').textContent = '1';
        document.getElementById('stat-orders').textContent = orders.length;
        document.getElementById('stat-pending').textContent = pending;
        document.getElementById('stat-revenue').textContent = revenue + '₺';
        
        // İstatistik label'larını güncelle
        document.querySelector('#stat-restaurants').nextElementSibling.textContent = 'Restoranım';
        
    } catch (error) {
        console.error('Manager stats error:', error);
    }
}

// Restaurants
async function loadRestaurants() {
    const table = document.getElementById('restaurantsTable');
    table.innerHTML = '<tr><td colspan="5" class="loading"><div class="spinner"></div>Yükleniyor...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/restaurants`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            let allRestaurants = await response.json();
            
            // Manager ise sadece kendi restoranını göster
            if (!isAdmin() && currentUser.restaurantId) {
                restaurants = allRestaurants.filter(r => r._id === currentUser.restaurantId);
            } else {
                restaurants = allRestaurants;
            }
            
            if (restaurants.length === 0) {
                table.innerHTML = '<tr><td colspan="5" class="empty-state"><div class="empty-state-icon">🏪</div><p>Henüz restoran eklenmemiş</p></td></tr>';
                return;
            }
            
            table.innerHTML = restaurants.map(r => `
                <tr>
                    <td>${r.emoji} ${r.name}</td>
                    <td>${r.type === 'restaurant' ? 'Restoran' : 'Cafe'}</td>
                    <td>${r.phone}</td>
                    <td><span class="badge ${r.isActive ? 'badge-success' : 'badge-danger'}">${r.isActive ? 'Aktif' : 'Pasif'}</span></td>
                    <td>
                        ${isAdmin() ? `
                            <button class="btn-icon" onclick="editRestaurant('${r._id}')" title="Düzenle">✏️</button>
                            <button class="btn-icon" onclick="deleteRestaurant('${r._id}')" title="Sil">🗑️</button>
                        ` : '<span style="color: #999;">Sadece Görüntüleme</span>'}
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        table.innerHTML = '<tr><td colspan="5" class="empty-state"><p>❌ Yükleme hatası</p></td></tr>';
    }
}

function showRestaurantModal(id = null) {
    if (!isAdmin()) {
        alert('Bu işlem için yetkiniz yok!');
        return;
    }
    
    const modal = document.getElementById('restaurantModal');
    const form = document.getElementById('restaurantForm');
    
    form.reset();
    document.getElementById('restaurant-id').value = '';
    document.getElementById('restaurantModalTitle').textContent = 'Yeni Restoran';
    
    if (id) {
        const restaurant = restaurants.find(r => r._id === id);
        if (restaurant) {
            document.getElementById('restaurant-id').value = restaurant._id;
            document.getElementById('restaurant-name').value = restaurant.name;
            document.getElementById('restaurant-description').value = restaurant.description || '';
            document.getElementById('restaurant-type').value = restaurant.type;
            document.getElementById('restaurant-emoji').value = restaurant.emoji;
            document.getElementById('restaurant-phone').value = restaurant.phone;
            document.getElementById('restaurant-address').value = restaurant.address || '';
            document.getElementById('restaurantModalTitle').textContent = 'Restoran Düzenle';
        }
    }
    
    modal.classList.add('active');
}

function closeRestaurantModal() {
    document.getElementById('restaurantModal').classList.remove('active');
}

document.getElementById('restaurantForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isAdmin()) {
        alert('Bu işlem için yetkiniz yok!');
        return;
    }
    
    const id = document.getElementById('restaurant-id').value;
    const data = {
        name: document.getElementById('restaurant-name').value,
        description: document.getElementById('restaurant-description').value,
        type: document.getElementById('restaurant-type').value,
        emoji: document.getElementById('restaurant-emoji').value,
        phone: document.getElementById('restaurant-phone').value,
        address: document.getElementById('restaurant-address').value,
        isActive: true,
        workingHours: { open: '09:00', close: '23:00' }
    };
    
    try {
        const url = id ? `${API_URL}/restaurants/${id}` : `${API_URL}/restaurants`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeRestaurantModal();
            loadRestaurants();
            loadDashboard();
            alert(id ? 'Restoran güncellendi!' : 'Restoran eklendi!');
        } else {
            alert('Hata oluştu!');
        }
    } catch (error) {
        alert('Bağlantı hatası!');
    }
});

function editRestaurant(id) {
    showRestaurantModal(id);
}

async function deleteRestaurant(id) {
    if (!isAdmin()) {
        alert('Bu işlem için yetkiniz yok!');
        return;
    }
    
    if (!confirm('Bu restoranı silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`${API_URL}/restaurants/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            loadRestaurants();
            loadDashboard();
            alert('Restoran silindi!');
        }
    } catch (error) {
        alert('Silme hatası!');
    }
}

// Categories
async function loadCategories() {
    const table = document.getElementById('categoriesTable');
    table.innerHTML = '<tr><td colspan="6" class="loading"><div class="spinner"></div>Yükleniyor...</td></tr>';
    
    try {
        // Load restaurants
        const resResponse = await fetch(`${API_URL}/restaurants`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        let allRestaurants = await resResponse.json();
        
        // Filter restaurants based on role
        if (!isAdmin() && currentUser.restaurantId) {
            restaurants = allRestaurants.filter(r => r._id === currentUser.restaurantId);
        } else {
            restaurants = allRestaurants;
        }
        
        // Load categories
        allCategories = [];
        for (const restaurant of restaurants) {
            const catResponse = await fetch(`${API_URL}/restaurants/${restaurant._id}/categories`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const cats = await catResponse.json();
            allCategories = [...allCategories, ...cats.map(c => ({ ...c, restaurantName: restaurant.name }))];
        }
        
        if (allCategories.length === 0) {
            table.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="empty-state-icon">📂</div><p>Henüz kategori eklenmemiş</p></td></tr>';
            return;
        }
        
        table.innerHTML = allCategories.map(c => `
            <tr>
                <td>${c.emoji} ${c.name}</td>
                <td>${c.restaurantName}</td>
                <td>${c.emoji}</td>
                <td>${c.order}</td>
                <td><span class="badge ${c.isActive ? 'badge-success' : 'badge-danger'}">${c.isActive ? 'Aktif' : 'Pasif'}</span></td>
                <td>
                    <button class="btn-icon" onclick="editCategory('${c._id}')" title="Düzenle">✏️</button>
                    <button class="btn-icon" onclick="deleteCategory('${c._id}')" title="Sil">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        table.innerHTML = '<tr><td colspan="6" class="empty-state"><p>❌ Yükleme hatası</p></td></tr>';
    }
}

async function showCategoryModal(id = null) {
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    const select = document.getElementById('category-restaurant');
    
    // Load restaurants
    if (restaurants.length === 0) {
        const response = await fetch(`${API_URL}/restaurants`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        let allRestaurants = await response.json();
        
        // Filter for manager
        if (!isAdmin() && currentUser.restaurantId) {
            restaurants = allRestaurants.filter(r => r._id === currentUser.restaurantId);
        } else {
            restaurants = allRestaurants;
        }
    }
    
    // Manager için restoran seçimi disabled
    if (!isAdmin()) {
        select.innerHTML = restaurants.map(r => `<option value="${r._id}" selected>${r.emoji} ${r.name}</option>`).join('');
        select.disabled = true;
    } else {
        select.innerHTML = '<option value="">Restoran Seçin</option>' + 
            restaurants.map(r => `<option value="${r._id}">${r.emoji} ${r.name}</option>`).join('');
        select.disabled = false;
    }
    
    form.reset();
    document.getElementById('category-id').value = '';
    document.getElementById('categoryModalTitle').textContent = 'Yeni Kategori';
    
    if (id) {
        const category = allCategories.find(c => c._id === id);
        if (category) {
            document.getElementById('category-id').value = category._id;
            document.getElementById('category-restaurant').value = category.restaurantId;
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-description').value = category.description || '';
            document.getElementById('category-emoji').value = category.emoji;
            document.getElementById('category-order').value = category.order;
            document.getElementById('categoryModalTitle').textContent = 'Kategori Düzenle';
        }
    } else if (!isAdmin() && currentUser.restaurantId) {
        // Manager için otomatik restoran seç
        document.getElementById('category-restaurant').value = currentUser.restaurantId;
    }
    
    modal.classList.add('active');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
}

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('category-id').value;
    const data = {
        restaurantId: document.getElementById('category-restaurant').value,
        name: document.getElementById('category-name').value,
        description: document.getElementById('category-description').value,
        emoji: document.getElementById('category-emoji').value,
        order: parseInt(document.getElementById('category-order').value),
        isActive: true
    };
    
    try {
        const url = id ? `${API_URL}/categories/${id}` : `${API_URL}/categories`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeCategoryModal();
            loadCategories();
            alert(id ? 'Kategori güncellendi!' : 'Kategori eklendi!');
        } else {
            alert('Hata oluştu!');
        }
    } catch (error) {
        alert('Bağlantı hatası!');
    }
});

function editCategory(id) {
    showCategoryModal(id);
}

async function deleteCategory(id) {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            loadCategories();
            alert('Kategori silindi!');
        }
    } catch (error) {
        alert('Silme hatası!');
    }
}

// Products
let allProducts = [];

async function loadProducts() {
    const table = document.getElementById('productsTable');
    table.innerHTML = '<tr><td colspan="5" class="loading"><div class="spinner"></div>Yükleniyor...</td></tr>';
    
    try {
        // Load restaurants
        if (restaurants.length === 0) {
            const resResponse = await fetch(`${API_URL}/restaurants`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            let allRestaurants = await resResponse.json();
            
            if (!isAdmin() && currentUser.restaurantId) {
                restaurants = allRestaurants.filter(r => r._id === currentUser.restaurantId);
            } else {
                restaurants = allRestaurants;
            }
        }
        
        allProducts = [];
        allCategories = [];
        
        for (const restaurant of restaurants) {
            const catResponse = await fetch(`${API_URL}/restaurants/${restaurant._id}/categories`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const cats = await catResponse.json();
            allCategories = [...allCategories, ...cats];
            
            const prodResponse = await fetch(`${API_URL}/restaurants/${restaurant._id}/products`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const prods = await prodResponse.json();
            allProducts = [...allProducts, ...prods];
        }
        
        if (allProducts.length === 0) {
            table.innerHTML = '<tr><td colspan="5" class="empty-state"><div class="empty-state-icon">🍕</div><p>Henüz ürün eklenmemiş</p></td></tr>';
            return;
        }
        
        table.innerHTML = allProducts.map(p => {
            const category = allCategories.find(c => c._id == p.categoryId._id || c._id == p.categoryId);
            return `
                <tr>
                    <td>${p.name}</td>
                    <td>${category ? category.name : 'Bilinmiyor'}</td>
                    <td>${p.price}₺</td>
                    <td><span class="badge ${p.isAvailable ? 'badge-success' : 'badge-danger'}">${p.isAvailable ? 'Stokta' : 'Tükendi'}</span></td>
                    <td>
                        <button class="btn-icon" onclick="editProduct('${p._id}')" title="Düzenle">✏️</button>
                        <button class="btn-icon" onclick="deleteProduct('${p._id}')" title="Sil">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        table.innerHTML = '<tr><td colspan="5" class="empty-state"><p>❌ Yükleme hatası</p></td></tr>';
    }
}

async function showProductModal(id = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const select = document.getElementById('product-category');
    
    // Load categories
    if (allCategories.length === 0) {
        const response = await fetch(`${API_URL}/restaurants`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        let allRestaurants = await response.json();
        
        let restaurantsToLoad = allRestaurants;
        if (!isAdmin() && currentUser.restaurantId) {
            restaurantsToLoad = allRestaurants.filter(r => r._id === currentUser.restaurantId);
        }
        
        for (const restaurant of restaurantsToLoad) {
            const catResponse = await fetch(`${API_URL}/restaurants/${restaurant._id}/categories`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const cats = await catResponse.json();
            allCategories = [...allCategories, ...cats.map(c => ({ ...c, restaurantName: restaurant.name }))];
        }
    }
    
    select.innerHTML = '<option value="">Kategori Seçin</option>' + 
        allCategories.map(c => `<option value="${c._id}">${c.restaurantName} - ${c.name}</option>`).join('');
    
    form.reset();
    document.getElementById('product-id').value = '';
    document.getElementById('productModalTitle').textContent = 'Yeni Ürün';
    
    if (id) {
        const product = allProducts.find(p => p._id === id);
        if (product) {
            document.getElementById('product-id').value = product._id;
            document.getElementById('product-category').value = product.categoryId._id || product.categoryId;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-order').value = product.order;
            document.getElementById('productModalTitle').textContent = 'Ürün Düzenle';
        }
    }
    
    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('product-id').value;
    const categoryId = document.getElementById('product-category').value;
    const category = allCategories.find(c => c._id === categoryId);
    
    const data = {
        categoryId: categoryId,
        restaurantId: category.restaurantId,
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        order: parseInt(document.getElementById('product-order').value),
        isAvailable: true
    };
    
    try {
        const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeProductModal();
            loadProducts();
            alert(id ? 'Ürün güncellendi!' : 'Ürün eklendi!');
        } else {
            alert('Hata oluştu!');
        }
    } catch (error) {
        alert('Bağlantı hatası!');
    }
});

function editProduct(id) {
    showProductModal(id);
}

async function deleteProduct(id) {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            loadProducts();
            alert('Ürün silindi!');
        }
    } catch (error) {
        alert('Silme hatası!');
    }
}

// Orders
async function loadOrders() {
    const table = document.getElementById('ordersTable');
    table.innerHTML = '<tr><td colspan="7" class="loading"><div class="spinner"></div>Yükleniyor...</td></tr>';
    
    try {
        // Manager için sadece kendi restoranının siparişleri
        let url = `${API_URL}/orders?limit=50`;
        if (!isAdmin() && currentUser.restaurantId) {
            url += `&restaurantId=${currentUser.restaurantId}`;
        }
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const orders = await response.json();
            
            if (orders.length === 0) {
                table.innerHTML = '<tr><td colspan="7" class="empty-state"><div class="empty-state-icon">📦</div><p>Henüz sipariş yok</p></td></tr>';
                return;
            }
            
            const statusEmoji = {
                pending: '⏳ Bekliyor',
                confirmed: '✅ Onaylandı',
                preparing: '👨‍🍳 Hazırlanıyor',
                ready: '🎉 Hazır',
                delivered: '✅ Teslim Edildi',
                cancelled: '❌ İptal'
            };
            
            table.innerHTML = orders.map(o => `
                <tr>
                    <td><strong>${o.orderNumber}</strong></td>
                    <td>${o.customerPhone}</td>
                    <td>${o.restaurantName}</td>
                    <td><strong>${o.totalAmount}₺</strong></td>
                    <td>${statusEmoji[o.status]}</td>
                    <td>${new Date(o.createdAt).toLocaleString('tr-TR')}</td>
                    <td>
                        <select onchange="updateOrderStatus('${o._id}', this.value)" style="padding: 4px; border-radius: 4px;">
                            <option value="${o.status}">${statusEmoji[o.status]}</option>
                            ${o.status !== 'confirmed' ? '<option value="confirmed">✅ Onayla</option>' : ''}
                            ${o.status !== 'preparing' ? '<option value="preparing">👨‍🍳 Hazırlanıyor</option>' : ''}
                            ${o.status !== 'ready' ? '<option value="ready">🎉 Hazır</option>' : ''}
                            ${o.status !== 'delivered' ? '<option value="delivered">✅ Teslim Et</option>' : ''}
                            ${o.status !== 'cancelled' ? '<option value="cancelled">❌ İptal Et</option>' : ''}
                        </select>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        table.innerHTML = '<tr><td colspan="7" class="empty-state"><p>❌ Yükleme hatası</p></td></tr>';
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            loadOrders();
            loadDashboard();
            alert('Sipariş durumu güncellendi!');
        }
    } catch (error) {
        alert('Güncelleme hatası!');
    }
}

// Users Management
let allUsers = [];

async function loadUsers() {
    if (!isAdmin()) {
        return;
    }

    const table = document.getElementById('usersTable');
    table.innerHTML = '<tr><td colspan="6" class="loading"><div class="spinner"></div>Yükleniyor...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            allUsers = await response.json();
            
            if (allUsers.length === 0) {
                table.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="empty-state-icon">👥</div><p>Henüz kullanıcı eklenmemiş</p></td></tr>';
                return;
            }
            
            table.innerHTML = allUsers.map(u => `
                <tr>
                    <td><strong>${u.username}</strong></td>
                    <td>${u.email}</td>
                    <td><span class="badge ${u.role === 'admin' ? 'badge-danger' : 'badge-success'}">${u.role === 'admin' ? '👑 Admin' : '👨‍💼 Manager'}</span></td>
                    <td>${u.restaurantId ? (u.restaurantId.name || 'Silinmiş Restoran') : '-'}</td>
                    <td><span class="badge ${u.isActive ? 'badge-success' : 'badge-danger'}">${u.isActive ? 'Aktif' : 'Pasif'}</span></td>
                    <td>
                        <button class="btn-icon" onclick="editUser('${u._id}')" title="Düzenle">✏️</button>
                        <button class="btn-icon" onclick="deleteUser('${u._id}')" title="Sil">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        table.innerHTML = '<tr><td colspan="6" class="empty-state"><p>❌ Yükleme hatası</p></td></tr>';
    }
}

async function showUserModal(id = null) {
    if (!isAdmin()) {
        alert('Bu işlem için yetkiniz yok!');
        return;
    }

    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const restaurantSelect = document.getElementById('user-restaurant');
    
    // Load restaurants
    if (restaurants.length === 0) {
        const response = await fetch(`${API_URL}/restaurants`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        restaurants = await response.json();
    }
    
    restaurantSelect.innerHTML = '<option value="">Restoran Seçin</option>' + 
        restaurants.map(r => `<option value="${r._id}">${r.emoji} ${r.name}</option>`).join('');
    
    form.reset();
    document.getElementById('user-id').value = '';
    document.getElementById('userModalTitle').textContent = 'Yeni Kullanıcı';
    document.getElementById('user-password').required = true;
    
    if (id) {
        const user = allUsers.find(u => u._id === id);
        if (user) {
            document.getElementById('user-id').value = user._id;
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-email').value = user.email;
            document.getElementById('user-password').value = '';
            document.getElementById('user-password').required = false;
            document.getElementById('user-role').value = user.role;
            
            if (user.restaurantId) {
                document.getElementById('user-restaurant').value = typeof user.restaurantId === 'object' ? user.restaurantId._id : user.restaurantId;
            }
            
            document.getElementById('userModalTitle').textContent = 'Kullanıcı Düzenle';
            toggleRestaurantSelect();
        }
    } else {
        toggleRestaurantSelect();
    }
    
    modal.classList.add('active');
}

function toggleRestaurantSelect() {
    const role = document.getElementById('user-role').value;
    const restaurantGroup = document.getElementById('restaurant-select-group');
    const restaurantSelect = document.getElementById('user-restaurant');
    
    if (role === 'manager') {
        restaurantGroup.style.display = 'block';
        restaurantSelect.required = true;
    } else {
        restaurantGroup.style.display = 'none';
        restaurantSelect.required = false;
        restaurantSelect.value = '';
    }
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isAdmin()) {
        alert('Bu işlem için yetkiniz yok!');
        return;
    }
    
    const id = document.getElementById('user-id').value;
    const role = document.getElementById('user-role').value;
    const password = document.getElementById('user-password').value;
    
    const data = {
        username: document.getElementById('user-username').value,
        email: document.getElementById('user-email').value,
        role: role,
        isActive: true
    };
    
    // Sadece dolu ise şifre ekle
    if (password) {
        data.password = password;
    }
    
    // Manager ise restoran ID ekle
    if (role === 'manager') {
        const restaurantId = document.getElementById('user-restaurant').value;
        if (!restaurantId) {
            alert('Manager rolü için restoran seçmelisiniz!');
            return;
        }
        data.restaurantId = restaurantId;
    }
    
    try {
        const url = id ? `${API_URL}/users/${id}` : `${API_URL}/users`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeUserModal();
            loadUsers();
            alert(id ? 'Kullanıcı güncellendi!' : 'Kullanıcı eklendi! Giriş bilgileri:\nKullanıcı: ' + data.username + '\nŞifre: ' + (password || '[Değiştirilmedi]'));
        } else {
            const error = await response.json();
            alert('Hata: ' + (error.error || 'Kullanıcı kaydedilemedi'));
        }
    } catch (error) {
        alert('Bağlantı hatası!');
    }
});

function editUser(id) {
    showUserModal(id);
}

async function deleteUser(id) {
    if (!isAdmin()) {
        alert('Bu işlem için yetkiniz yok!');
        return;
    }
    
    const user = allUsers.find(u => u._id === id);
    if (user && user._id === currentUser.id) {
        alert('Kendi hesabınızı silemezsiniz!');
        return;
    }
    
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            loadUsers();
            alert('Kullanıcı silindi!');
        }
    } catch (error) {
        alert('Silme hatası!');
    }
}
