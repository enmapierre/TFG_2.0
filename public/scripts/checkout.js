document.addEventListener("astro:page-load", initCartUI);
document.addEventListener("DOMContentLoaded", initCartUI);

function initCartUI() {
  setTimeout(() => {
    renderCartSummary();
    setupFormHandlers();
    setupCardFormatting();
  }, 200);
}

function getCartItems() {
  try {
    // Cambiar a "carrito" para ser consistente
    const saved = localStorage.getItem("carrito");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function renderCartSummary() {
  const cart = getCartItems();
  const emptyMsg = document.getElementById("empty-cart-message");
  const itemsContainer = document.getElementById("cart-items");
  const costSummary = document.getElementById("cost-summary");
  const submitButton = document.getElementById("submit-button");

  if (!cart.length) {
    emptyMsg?.classList.remove("hidden");
    itemsContainer?.classList.add("hidden");
    costSummary?.classList.add("hidden");
    if (submitButton) submitButton.disabled = true;
    return;
  }

  // Mostrar items - usar nombres consistentes con el carrito
  const html = cart.map((producto) => `
    <div class="flex items-center gap-4 bg-gray-50 p-4 border rounded-lg">
      <img src="${producto.imagen}" alt="${producto.nombre}" class="border rounded w-20 h-20 object-cover" />
      <div class="flex flex-col">
        <span class="font-medium">${producto.nombre}</span>
        <span class="text-gray-600 text-sm">Cantidad: ${producto.cantidad}</span>
        <span class="text-gray-600 text-sm">Precio: €${producto.precio.toFixed(2)}</span>
        <span class="font-semibold text-gray-900 text-sm">Subtotal: €${(producto.precio * producto.cantidad).toFixed(2)}</span>
      </div>
    </div>
  `).join("");

  itemsContainer.innerHTML = html;
  emptyMsg?.classList.add("hidden");
  itemsContainer?.classList.remove("hidden");
  costSummary?.classList.remove("hidden");
  if (submitButton) submitButton.disabled = false;

  // Resumen de costes
  const subtotal = cart.reduce((sum, producto) => sum + producto.precio * producto.cantidad, 0);
  const tax = subtotal * 0.21;
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;

  document.getElementById("subtotal").textContent = `€${subtotal.toFixed(2)}`;
  document.getElementById("tax").textContent = `€${tax.toFixed(2)}`;
  document.getElementById("shipping").textContent = shipping === 0 ? "Gratis" : `€${shipping.toFixed(2)}`;
  document.getElementById("total").textContent = `€${total.toFixed(2)}`;
}

// Manejo del form de checkout
function setupFormHandlers() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  const message = document.getElementById("checkout-message");
  const submitBtn = document.getElementById("submit-button");
  const submitText = document.querySelector(".submit-text");
  const spinner = document.querySelector(".loading-spinner");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log('=== INICIANDO ENVÍO DE FORMULARIO ===');
    
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.classList.add("hidden");
    if (spinner) spinner.classList.remove("hidden");
    if (message) message.classList.add("hidden");

    const formData = new FormData(form);
    const cart = getCartItems();

    console.log('Carrito obtenido:', cart);

    if (!cart.length) {
      showMessage("error", "❌ Tu carrito está vacío.");
      resetSubmit();
      return;
    }

    // Validar datos de tarjeta antes de enviar
    const cardNumber = formData.get("card_number").replace(/\s/g, "");
    const cardCVC = formData.get("card_cvc");
    const cardExpiry = formData.get("card_expiry");

    if (cardNumber !== "4111111111111111" || cardCVC !== "345" || cardExpiry !== "10/25") {
      showMessage("error", "❌ Datos de tarjeta incorrectos. Usa: 4111 1111 1111 1111, CVC: 345, Vencimiento: 10/25");
      resetSubmit();
      return;
    }

    // Preparar payload con nombres consistentes
    const payload = {
      name: formData.get("name"),
      surname: formData.get("surname"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      city: formData.get("city"),
      postal_code: formData.get("postal_code"),
      country: formData.get("country"),
      card_number: formData.get("card_number"),
      card_expiry: formData.get("card_expiry"),
      card_cvc: formData.get("card_cvc"),
      card_name: formData.get("card_name"),
      cart: cart.map((producto) => ({
        id: producto.id || `product_${Date.now()}_${Math.random()}`, 
        name: producto.nombre, 
        price: parseFloat(producto.precio), 
        quantity: parseInt(producto.cantidad), 
        image: producto.imagen
      }))
    };

    console.log('Payload preparado:', payload);
    
      cart.map(async(producto)=>{
        const res = await fetch("http://localhost:8080/productos/" + producto._id, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(producto)
      });

      })
      localStorage.removeItem("carrito");
    
  });

  function showMessage(type, text) {
    if (!message) return;
    message.classList.remove("hidden");
    message.textContent = text;
    message.className = `p-3 rounded-md text-sm font-medium ${type === "success" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"}`;
  }

  function resetSubmit() {
    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.classList.remove("hidden");
    if (spinner) spinner.classList.add("hidden");
  }
}

// Formato tarjetas
function setupCardFormatting() {
  const num = document.getElementById("card_number");
  const exp = document.getElementById("card_expiry");
  const cvc = document.getElementById("card_cvc");

  num?.addEventListener("input", e => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 16);
    e.target.value = val.replace(/(.{4})/g, "$1 ").trim();
  });

  exp?.addEventListener("input", e => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
    e.target.value = val;
  });

  cvc?.addEventListener("input", e => {
    e.target.value = e.target.value.replace(/\D/g, "").substring(0, 4);
  });
}

// Escuchar actualizaciones del carrito
window.addEventListener("storage", (e) => {
  if (e.key === "carrito") renderCartSummary(); // Cambiar a "carrito"
});
document.addEventListener("cartUpdated", renderCartSummary);