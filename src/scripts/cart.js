// cart.js - Script mejorado para manejar el carrito de compras

class Cart {
  constructor() {
    this.items = [];
    this.isCartOpen = false;
    this.init();
  }

  init() {
    // Cargar carrito desde localStorage si existe
    this.loadCart();
    
    // Agregar event listeners cuando el DOM esté listo
    document.addEventListener('astro:page-load', () => {
      setTimeout(() => {
        this.bindEvents();
        this.updateCartDisplay();
        this.emitCartUpdated();
      }, 100);
    });

    // Para páginas que no usan Astro
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          this.bindEvents();
          this.updateCartDisplay();
          this.emitCartUpdated();
        }, 100);
      });
    } else {
      setTimeout(() => {
        this.bindEvents();
        this.updateCartDisplay();
        this.emitCartUpdated();
      }, 100);
    }
  }

  // Emitir evento personalizado cuando el carrito se actualiza
  emitCartUpdated() {
    const event = new CustomEvent('cartUpdated', {
      detail: {
        items: this.items,
        total: this.getTotal(),
        count: this.getItemCount()
      }
    });
    document.dispatchEvent(event);
  }

  bindEvents() {
    // Limpiar listeners anteriores
    this.removeExistingListeners();

    // Botones de agregar al carrito
    const addToCartButtons = document.querySelectorAll('.add-to-cart-button');
    addToCartButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.addToCart(button);
      });
    });

    // Manejar el dropdown del carrito
    const cartButton = document.getElementById('cart-button');
    const cartDropdown = document.getElementById('cart-dropdown');
    
    if (cartButton && cartDropdown) {
      // Click en el botón del carrito
      cartButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleCartDropdown();
      });

      // Cerrar dropdown al hacer click fuera
      document.addEventListener('click', (e) => {
        if (this.isCartOpen && 
            !cartButton.contains(e.target) && 
            !cartDropdown.contains(e.target)) {
          this.closeCartDropdown();
        }
      });

      // Prevenir que clicks dentro del dropdown lo cierren
      cartDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  removeExistingListeners() {
    // Esta función ayuda a evitar listeners duplicados
    const cartButton = document.getElementById('cart-button');
    if (cartButton) {
      cartButton.replaceWith(cartButton.cloneNode(true));
    }
  }

  toggleCartDropdown() {
    const cartDropdown = document.getElementById('cart-dropdown');
    if (!cartDropdown) return;

    this.isCartOpen = !this.isCartOpen;
    
    if (this.isCartOpen) {
      cartDropdown.classList.remove('hidden');
      // Cerrar menú SHOP si está abierto
      const shopDropdown = document.getElementById('shop-dropdown');
      if (shopDropdown) {
        shopDropdown.classList.add('opacity-0', 'invisible');
        shopDropdown.classList.remove('opacity-100', 'visible');
      }
    } else {
      cartDropdown.classList.add('hidden');
    }
  }

  closeCartDropdown() {
    const cartDropdown = document.getElementById('cart-dropdown');
    if (cartDropdown && this.isCartOpen) {
      cartDropdown.classList.add('hidden');
      this.isCartOpen = false;
    }
  }

  addToCart(button) {
    const product = {
      id: button.getAttribute('data-id'),
      image: button.getAttribute('data-image'),
      title: button.getAttribute('data-title'),
      description: button.getAttribute('data-descrip'),
      price: parseFloat(button.getAttribute('data-price')) || 0,
      quantity: 1
    };

    // Validar que el producto tenga datos válidos
    if (!product.id || !product.title) {
      console.error('❌ Producto inválido:', product);
      return;
    }

    // Verificar si el producto ya existe en el carrito
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push(product);
    }

    this.saveCart();
    this.updateCartDisplay();
    this.emitCartUpdated();
    this.showAddedNotification(product.title);
    
    // Cambiar temporalmente el texto del botón
    const originalText = button.textContent;
    button.textContent = '¡Agregado!';
    button.style.backgroundColor = '#c9c9c9';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '';
    }, 1000);
  }

  removeFromCart(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.saveCart();
    this.updateCartDisplay();
    this.emitCartUpdated();
  }

  updateQuantity(productId, newQuantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      if (newQuantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = newQuantity;
        this.saveCart();
        this.updateCartDisplay();
        this.emitCartUpdated();
      }
    }
  }

  getTotal() {
    return this.items.reduce((total, item) => {
      const price = typeof item.price === 'number' ? item.price : 0;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      return total + (price * quantity);
    }, 0);
  }

  getItemCount() {
    return this.items.reduce((count, item) => {
      const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
      return count + quantity;
    }, 0);
  }

  updateCartDisplay() {
    // Actualizar contador del carrito
    this.updateCartCounter();
    // Actualizar dropdown del carrito
    this.updateCartDropdown();
  }

  updateCartCounter() {
    const cartCount = document.querySelector('.cart-count');
    if (!cartCount) {
      console.log('❌ No se encontró el elemento .cart-count');
      return;
    }

    const count = this.getItemCount();
    console.log('🛒 Actualizando contador:', count);
    
    // Actualizar el texto
    cartCount.textContent = count.toString();
    
    // Mostrar/ocultar el contador
    if (count > 0) {
      cartCount.style.display = 'flex';
      cartCount.style.visibility = 'visible';
      cartCount.style.opacity = '1';
      console.log('✅ Contador mostrado');
    } else {
      cartCount.style.display = 'none';
      cartCount.style.visibility = 'hidden';
      cartCount.style.opacity = '0';
      console.log('❌ Contador ocultado');
    }
  }

  updateCartDropdown() {
    const cartItems = document.getElementById('cart-items');
    const cartEmpty = document.getElementById('cart-empty');
    const cartTotal = document.getElementById('cart-total');

    if (!cartItems || !cartEmpty || !cartTotal) return;

    if (this.items.length === 0) {
      cartItems.innerHTML = '';
      cartEmpty.style.display = 'block';
      cartTotal.textContent = '€0.00';
    } else {
      cartEmpty.style.display = 'none';
      cartItems.innerHTML = this.items.map(item => {
        const image = item.image || '/images/placeholder.jpg';
        const title = item.title || 'Producto sin nombre';
        const price = typeof item.price === 'number' ? item.price : 0;
        const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
        
        return `
          <div class="flex items-center justify-between py-2 border-b last:border-b-0" data-id="${item.id}">
            <div class="flex items-center space-x-3">
              <img 
                src="${image}" 
                alt="${title}" 
                class="w-12 h-12 object-cover rounded"
                onerror="this.src='/images/placeholder.jpg'"
              >
              <div class="flex-1">
                <h4 class="text-sm font-medium text-gray-800 leading-tight">${title}</h4>
                <p class="text-xs text-gray-500 mt-1">€${price.toFixed(2)} c/u</p>
              </div>
            </div>
            <div class="flex items-center space-x-2 ml-2">
              <div class="flex items-center space-x-1 bg-gray-100 rounded px-1">
                <button class="quantity-btn minus-btn text-gray-600 hover:text-gray-800 w-6 h-6 flex items-center justify-center text-sm" data-id="${item.id}">-</button>
                <span class="text-sm font-medium min-w-[20px] text-center">${quantity}</span>
                <button class="quantity-btn plus-btn text-gray-600 hover:text-gray-800 w-6 h-6 flex items-center justify-center text-sm" data-id="${item.id}">+</button>
              </div>
              <button class="remove-btn text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center font-bold" data-id="${item.id}" title="Eliminar">×</button>
            </div>
          </div>
        `;
      }).join('');

      cartTotal.textContent = `€${this.getTotal().toFixed(2)}`;

      // Agregar event listeners para los botones del dropdown
      this.bindCartDropdownEvents();
    }
  }

  bindCartDropdownEvents() {
    // Botones de restar cantidad
    document.querySelectorAll('.minus-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const item = this.items.find(item => item.id === id);
        if (item) {
          this.updateQuantity(id, item.quantity - 1);
        }
      });
    });

    // Botones de sumar cantidad
    document.querySelectorAll('.plus-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const item = this.items.find(item => item.id === id);
        if (item) {
          this.updateQuantity(id, item.quantity + 1);
        }
      });
    });

    // Botones de eliminar
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.removeFromCart(id);
      });
    });
  }

  showAddedNotification(productTitle) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gray-700 text-white px-4 py-2 rounded shadow-lg z-[60] transition-opacity';
    notification.textContent = `${productTitle} agregado al carrito`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }

  saveCart() {
    try {
      localStorage.setItem('cart', JSON.stringify(this.items));
      console.log('💾 Carrito guardado:', this.items);
    } catch (e) {
      console.warn('No se pudo guardar el carrito en localStorage:', e);
    }
  }

  loadCart() {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        this.items = JSON.parse(savedCart);
        console.log('📦 Carrito cargado:', this.items);
      }
    } catch (e) {
      console.warn('No se pudo cargar el carrito desde localStorage:', e);
      this.items = [];
    }
  }

  clearCart() {
    this.items = [];
    this.saveCart();
    this.updateCartDisplay();
    this.emitCartUpdated();
    console.log('🗑️ Carrito limpiado');
  }
}

// Inicializar el carrito
const cart = new Cart();

// Exportar para uso global
window.cart = cart;