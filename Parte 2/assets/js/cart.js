document.addEventListener('DOMContentLoaded', () => {
  const cart = []; // { name, price, img, qty }

  const addToCartBtns = document.querySelectorAll('[data-btn-action="add-btn-cart"]');
  const closeButtons = document.querySelectorAll('.jsModalClose');

  const cartToggle = document.getElementById('jsCartToggle');
  const cartNavToggle = document.getElementById('jsCartNavToggle');
  const cartCount = document.getElementById('jsCartCount');
  const cartCountNav = document.getElementById('jsCartCountNav');
  const modalList = document.getElementById('jsModalList');
  const subtotalEl = document.getElementById('jsSubtotal');
  const totalEl = document.getElementById('jsTotalCart');
  const modal = document.getElementById('jsModalCarrito');

  // Modal de detalle del producto
  const detailModal = document.getElementById('jsModalDetalle');
  const detailImg = document.getElementById('jsDetailImg');
  const detailName = document.getElementById('jsDetailName');
  const detailIngredients = document.getElementById('jsDetailIngredients');
  const detailPrice = document.getElementById('jsDetailPrice');
  const detailAddBtn = document.getElementById('jsDetailAddBtn');
  const detailLinks = document.querySelectorAll('[data-action="view-detail"]');
  let currentDetailItem = null;

  const parsePrice = (text) => {
    // Convierte "$9.900" -> 9900
    return Number(text.replace(/[^0-9]/g, ''));
  };

  const formatPrice = (num) => {
    return '$' + num.toLocaleString('es-CL');
  };

  const openModal = (modalEl = modal) => {
    modalEl.classList.add('active');
  };

  const closeModal = (modalEl) => {
    modalEl.classList.remove('active');
  };

  const updateCartCount = () => {
    const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
    if (cartCount) cartCount.textContent = totalItems;
    if (cartCountNav) cartCountNav.textContent = totalItems;
  };

  const renderCart = () => {
    modalList.innerHTML = '';

    if (cart.length === 0) {
      modalList.innerHTML = '<p class="modal__empty">Tu carrito está vacío</p>';
    } else {
      cart.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.classList.add('modal__item');
        itemEl.innerHTML = `
          <div class="modal__thumb">
            <img src="${item.img}" alt="${item.name}">
          </div>
          <div class="modal__text-product">
            <p>${item.name}</p>
            <p><strong>${formatPrice(item.price)}</strong></p>
          </div>
          <div class="modal__qty">
            <button type="button" data-action="decrease" data-index="${index}">-</button>
            <span>${item.qty}</span>
            <button type="button" data-action="increase" data-index="${index}">+</button>
          </div>
          <button type="button" class="modal__remove" data-action="remove" data-index="${index}">
            <i class="fa-solid fa-trash"></i>
          </button>
        `;
        modalList.appendChild(itemEl);
      });
    }

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    subtotalEl.textContent = formatPrice(subtotal);
    totalEl.textContent = 'Total: ' + formatPrice(subtotal);

    updateCartCount();
  };

  const addToCart = (name, price, img, btn) => {
    const existing = cart.find((item) => item.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name, price, img, qty: 1 });
    }

    renderCart();

    // Feedback visual en el botón
    if (btn) {
      const originalText = btn.textContent;
      btn.classList.add('added');
      btn.textContent = 'Agregado ✓';
      setTimeout(() => {
        btn.classList.remove('added');
        btn.textContent = originalText;
      }, 1000);
    }
  };

  // Botones "Agregar al carrito" en cada plato del menú
  addToCartBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const menuItem = btn.closest('.menu-item');
      const name = menuItem.querySelector('h4').textContent.trim();
      const priceText = menuItem.querySelector('.price').textContent.trim();
      const img = menuItem.querySelector('.menu-img').getAttribute('src');
      const price = parsePrice(priceText);

      addToCart(name, price, img, btn);
      openModal(modal);
    });
  });

  // Icono flotante del carrito
  if (cartToggle) {
    cartToggle.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(modal);
    });
  }

  // Icono del carrito en el menú de navegación
  if (cartNavToggle) {
    cartNavToggle.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(modal);
    });
  }

  // Cerrar modal (funciona para el carrito y para el detalle)
  closeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      closeModal(btn.closest('.modal'));
    });
  });

  // Cerrar al hacer clic fuera del contenedor del modal
  document.querySelectorAll('.modal').forEach((m) => {
    m.addEventListener('click', (e) => {
      if (e.target === m) closeModal(m);
    });
  });

  // Abrir el detalle del producto al hacer clic en la imagen o el nombre del plato
  detailLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const menuItem = link.closest('.menu-item');
      const name = menuItem.querySelector('h4').textContent.trim();
      const ingredients = menuItem.querySelector('.ingredients').textContent.trim();
      const priceText = menuItem.querySelector('.price').textContent.trim();
      const img = menuItem.querySelector('.menu-img').getAttribute('src');
      const price = parsePrice(priceText);

      currentDetailItem = { name, price, img };

      detailImg.setAttribute('src', img);
      detailImg.setAttribute('alt', name);
      detailName.textContent = name;
      detailIngredients.textContent = ingredients;
      detailPrice.textContent = formatPrice(price);

      openModal(detailModal);
    });
  });

  // Botón "Agregar al carrito" dentro del modal de detalle
  if (detailAddBtn) {
    detailAddBtn.addEventListener('click', () => {
      if (!currentDetailItem) return;
      addToCart(currentDetailItem.name, currentDetailItem.price, currentDetailItem.img, detailAddBtn);
      closeModal(detailModal);
      openModal(modal);
    });
  }

  // Delegación de eventos para +, - y eliminar dentro del carrito
  modalList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const index = Number(btn.dataset.index);
    const action = btn.dataset.action;

    if (action === 'increase') {
      cart[index].qty += 1;
    } else if (action === 'decrease') {
      cart[index].qty -= 1;
      if (cart[index].qty <= 0) cart.splice(index, 1);
    } else if (action === 'remove') {
      cart.splice(index, 1);
    }

    renderCart();
  });

  // API mínima para que checkout.js lea y vacíe el carrito
  window.carritoLCN = {
    obtener: () => cart.map((i) => ({ ...i })),
    vaciar: () => { cart.length = 0; renderCart(); }
  };

  renderCart();
});
