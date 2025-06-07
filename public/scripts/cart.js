document.addEventListener("DOMContentLoaded", () => {
  const cartIcon = document.querySelector('a[href="/cart"]');
  const cartCount = cartIcon.querySelector("span");
  const cartDropdown = document.getElementById("cart-dropdown");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const cartEmptyMessage = document.getElementById("cart-empty");

  function updateCartUI() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cartItemsContainer.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
      cartEmptyMessage.classList.remove("hidden");
      cartTotal.textContent = "€0.00";
    } else {
      cartEmptyMessage.classList.add("hidden");
      cart.forEach(item => {
        total += item.price * item.quantity;
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("flex", "justify-between", "items-center", "mb-2");

        itemDiv.innerHTML = `
          <div>
            <p class="font-medium">${item.name}</p>
            <p class="text-sm text-gray-600">€${item.price} x ${item.quantity}</p>
          </div>
          <button class="text-red-500 text-sm" data-id="${item.id}">Eliminar</button>
        `;

        // Eliminar producto
        itemDiv.querySelector("button").addEventListener("click", () => {
          removeFromCart(item.id);
        });

        cartItemsContainer.appendChild(itemDiv);
      });

      cartTotal.textContent = `€${total.toFixed(2)}`;
    }

    // Actualiza el contador
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCount.textContent = totalItems;
  }

  function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartUI();
  }

  // Mostrar dropdown del carrito
  cartIcon.addEventListener("click", (e) => {
    e.preventDefault();
    cartDropdown.classList.toggle("hidden");
    updateCartUI();
  });

  // Añadir al carrito (si existe el botón de comprar en la página)
  const addToCartButtons = document.querySelectorAll("#add-to-cart-button");
  addToCartButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      const image = btn.dataset.image;

      let cart = JSON.parse(localStorage.getItem("cart")) || [];

      const existing = cart.find(item => item.id === id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ id, name, price, quantity: 1, image });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartUI();
    });
  });

  // Inicializa el contador del carrito al cargar
  updateCartUI();
});
