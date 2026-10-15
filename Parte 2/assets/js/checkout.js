/* ============================================================
   checkout.js — Compra (checkout) y buscador del menú con
   validaciones en JavaScript (Evaluación 2, vistas de la tienda).
   Requiere cart.js (expone window.carritoLCN).
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Pon 1 para que el pago siempre resulte correcto, 0 para que siempre falle (útil para la demo).
  const PROBABILIDAD_EXITO = 0.8;
  const CLAVE_ORDENES = 'lcn_ordenes';

  const REGIONES = {
    'Arica y Parinacota': ['Arica', 'Putre', 'Camarones'],
    'Tarapacá': ['Iquique', 'Alto Hospicio', 'Pozo Almonte'],
    'Antofagasta': ['Antofagasta', 'Calama', 'Mejillones', 'Taltal'],
    'Atacama': ['Copiapó', 'Vallenar', 'Caldera'],
    'Coquimbo': ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel'],
    'Valparaíso': ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Quillota'],
    'Región Metropolitana de Santiago': ['Cerrillos', 'La Florida', 'Las Condes', 'Maipú', 'Ñuñoa', 'Providencia', 'Puente Alto', 'Quilicura', 'San Bernardo', 'Santiago', 'Vitacura'],
    "Libertador General Bernardo O'Higgins": ['Rancagua', 'Machalí', 'San Fernando', 'Rengo'],
    'Maule': ['Talca', 'Curicó', 'Linares', 'Constitución'],
    'Ñuble': ['Chillán', 'Chillán Viejo', 'San Carlos'],
    'Biobío': ['Concepción', 'Talcahuano', 'Los Ángeles', 'Coronel'],
    'La Araucanía': ['Temuco', 'Padre Las Casas', 'Villarrica', 'Angol'],
    'Los Ríos': ['Valdivia', 'La Unión', 'Panguipulli'],
    'Los Lagos': ['Puerto Montt', 'Osorno', 'Castro', 'Puerto Varas'],
    'Aysén': ['Coyhaique', 'Puerto Aysén'],
    'Magallanes': ['Punta Arenas', 'Puerto Natales']
  };

  // ---------- Reglas de validación (cada una devuelve '' si es válido) ----------
  const RE_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
  const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const RE_CALLE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,#°º\-]+$/;
  const RE_DEPTO = /^[A-Za-z0-9 #\-]+$/;

  const reglas = {
    nombre: (v) => !v ? 'El nombre es obligatorio.'
      : v.length < 2 || v.length > 50 ? 'Debe tener entre 2 y 50 caracteres.'
      : !RE_NOMBRE.test(v) ? 'Solo letras, espacios, guion o apóstrofe.' : '',
    apellidos: (v) => !v ? 'Los apellidos son obligatorios.'
      : v.length < 2 || v.length > 60 ? 'Deben tener entre 2 y 60 caracteres.'
      : !RE_NOMBRE.test(v) ? 'Solo letras, espacios, guion o apóstrofe.' : '',
    correo: (v) => !v ? 'El correo es obligatorio.'
      : v.length > 100 ? 'Máximo 100 caracteres.'
      : !RE_CORREO.test(v) ? 'Ingresa un correo válido (ej: nombre@correo.cl).' : '',
    calle: (v) => !v ? 'La calle es obligatoria.'
      : v.length < 3 || v.length > 80 ? 'Debe tener entre 3 y 80 caracteres.'
      : !RE_CALLE.test(v) ? 'Contiene caracteres no permitidos.'
      : !/\d/.test(v) ? 'Incluye el número de la dirección.' : '',
    depto: (v) => !v ? ''
      : v.length > 20 ? 'Máximo 20 caracteres.'
      : !RE_DEPTO.test(v) ? 'Solo letras, números, # o guion.' : '',
    region: (v) => !v ? 'Selecciona una región.' : '',
    comuna: (v) => !v ? 'Selecciona una comuna.' : '',
    indicaciones: (v) => v.length > 200 ? 'Máximo 200 caracteres.' : ''
  };

  // ---------- Elementos ----------
  const modalCarrito = document.getElementById('jsModalCarrito');
  const modalCheckout = document.getElementById('jsModalCheckout');
  const btnIrCheckout = document.getElementById('jsCheckoutBtn');
  const vistaForm = document.getElementById('jsCheckoutForm');
  const vistaResultado = document.getElementById('jsCheckoutResult');
  const form = document.getElementById('jsCheckoutFormEl');
  const resumen = document.getElementById('jsCheckoutSummary');
  const totalEl = document.getElementById('jsCheckoutTotal');
  const btnPagar = document.getElementById('jsPayBtn');
  const avisoCarrito = document.getElementById('jsCheckoutAlert');
  const selRegion = form.elements.region;
  const selComuna = form.elements.comuna;

  const fmt = (n) => '$' + n.toLocaleString('es-CL');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const total = () => window.carritoLCN.obtener().reduce((a, i) => a + i.price * i.qty, 0);

  // ---------- Región -> Comuna ----------
  Object.keys(REGIONES).forEach((r) => selRegion.add(new Option(r, r)));
  const cargarComunas = () => {
    selComuna.length = 1;
    (REGIONES[selRegion.value] || []).forEach((c) => selComuna.add(new Option(c, c)));
  };
  selRegion.addEventListener('change', () => { cargarComunas(); validarCampo(selComuna); });

  // ---------- Validación de campos ----------
  function validarCampo(campo) {
    const valor = campo.value.trim();
    const error = reglas[campo.name](valor);
    campo.classList.toggle('is-invalid', !!error);
    campo.classList.toggle('is-valid', !error && valor !== '');
    const fb = campo.parentElement.querySelector('.invalid-feedback');
    if (fb) fb.textContent = error;
    return !error;
  }

  const campos = Array.from(form.elements).filter((el) => reglas[el.name]);
  campos.forEach((c) => {
    c.addEventListener('blur', () => validarCampo(c));
    c.addEventListener('input', () => { if (c.classList.contains('is-invalid')) validarCampo(c); });
  });

  function validarFormulario() {
    let primerError = null;
    campos.forEach((c) => { if (!validarCampo(c) && !primerError) primerError = c; });
    const vacio = window.carritoLCN.obtener().length === 0;
    avisoCarrito.classList.toggle('d-none', !vacio);
    if (vacio) return false;
    if (primerError) primerError.focus();
    return !primerError;
  }

  // ---------- Vistas del modal ----------
  function pintarResumen() {
    const items = window.carritoLCN.obtener();
    resumen.innerHTML = '<tr><th>Producto</th><th>Precio</th><th>Cant.</th><th>Subtotal</th></tr>' +
      items.map((i) => `<tr><td>${esc(i.name)}</td><td>${fmt(i.price)}</td><td>${i.qty}</td><td>${fmt(i.price * i.qty)}</td></tr>`).join('');
    totalEl.textContent = 'Total a pagar: ' + fmt(total());
    btnPagar.textContent = 'Pagar ahora ' + fmt(total());
  }

  function mostrarFormulario() {
    vistaResultado.classList.add('d-none');
    vistaForm.classList.remove('d-none');
    pintarResumen();
    avisoCarrito.classList.toggle('d-none', window.carritoLCN.obtener().length > 0);
  }

  function prellenarDesdeSesion() {
    // Si el proyecto expone obtenerSesion() (como usa admin-auth.js), se autocompletan los datos.
    if (typeof obtenerSesion !== 'function' || form.elements.nombre.value) return;
    const s = obtenerSesion();
    if (!s) return;
    form.elements.nombre.value = s.nombre || '';
    form.elements.apellidos.value = s.apellidos || '';
    form.elements.correo.value = s.correo || s.email || '';
  }

  btnIrCheckout.addEventListener('click', (e) => {
    e.preventDefault();
    modalCarrito.classList.remove('active');
    prellenarDesdeSesion();
    mostrarFormulario();
    modalCheckout.classList.add('active');
  });

  // ---------- Pago (simulado) ----------
  function generarNumeroOrden() {
    const d = new Date();
    const base = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    return '#' + base + String(Math.floor(Math.random() * 900) + 100);
  }

  function guardarOrden(orden) {
    try {
      const lista = JSON.parse(localStorage.getItem(CLAVE_ORDENES)) || [];
      lista.push(orden);
      localStorage.setItem(CLAVE_ORDENES, JSON.stringify(lista));
    } catch (err) { console.error('No se pudo guardar la orden:', err); }
  }

  function pintarResultado(ok, orden, datos) {
    const filas = orden.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td>${fmt(i.price * i.qty)}</td></tr>`).join('');
    vistaResultado.innerHTML = ok
      ? `<div class="checkout__result checkout__result--ok"><i class="fa-regular fa-circle-check"></i>
           <h3>Se ha realizado la compra. nro ${orden.numero}</h3></div>`
      : `<div class="checkout__result checkout__result--error"><i class="fa-regular fa-circle-xmark"></i>
           <h3>No se pudo realizar el pago. nro ${orden.numero}</h3></div>`;
    vistaResultado.innerHTML += `
      <p><strong>${esc(datos.nombre)} ${esc(datos.apellidos)}</strong> · ${esc(datos.correo)}<br>
         ${esc(datos.calle)}${datos.depto ? ', ' + esc(datos.depto) : ''}, ${esc(datos.comuna)}, ${esc(datos.region)}
         ${datos.indicaciones ? '<br><em>' + esc(datos.indicaciones) + '</em>' : ''}</p>
      <table class="checkout__summary"><tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr>${filas}</table>
      <p class="checkout__total">${ok ? 'Total pagado' : 'Total a pagar'}: ${fmt(orden.total)}</p>
      <div class="checkout__actions">
        ${ok ? '<button type="button" class="btn-border" id="jsPrintBtn">Imprimir boleta</button>'
             : '<button type="button" class="btn-primary" id="jsRetryBtn">Volver a realizar el pago</button>'}
        <button type="button" class="btn-border jsCheckoutClose">${ok ? 'Seguir en el menú' : 'Cancelar'}</button>
      </div>`;
    vistaForm.classList.add('d-none');
    vistaResultado.classList.remove('d-none');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const datos = {};
    campos.forEach((c) => { datos[c.name] = c.value.trim(); });
    const items = window.carritoLCN.obtener();
    const orden = { numero: generarNumeroOrden(), fecha: new Date().toISOString(), items, total: total() };
    const exito = Math.random() < PROBABILIDAD_EXITO;

    if (exito) {
      guardarOrden({ ...orden, cliente: datos, estado: 'Pagada' });
      window.carritoLCN.vaciar();
      form.reset();
      campos.forEach((c) => c.classList.remove('is-valid', 'is-invalid'));
      cargarComunas();
    }
    pintarResultado(exito, orden, datos);
  });

  vistaResultado.addEventListener('click', (e) => {
    if (e.target.id === 'jsRetryBtn') mostrarFormulario();
    if (e.target.id === 'jsPrintBtn') window.print();
    if (e.target.closest('.jsCheckoutClose')) modalCheckout.classList.remove('active');
  });
  modalCheckout.addEventListener('click', (e) => { if (e.target === modalCheckout) modalCheckout.classList.remove('active'); });
  modalCheckout.querySelector('.modal__close').addEventListener('click', () => modalCheckout.classList.remove('active'));

  // ---------- Buscador del menú (filtro con validación) ----------
  const buscador = document.getElementById('jsMenuSearch');
  const ayudaBusqueda = document.getElementById('jsMenuSearchHelp');
  const contenido = document.querySelector('#menu .tab-content');
  const aviso = document.createElement('p');
  aviso.className = 'menu-empty d-none';
  aviso.textContent = 'No encontramos platos que coincidan con tu búsqueda.';
  contenido.after(aviso);

  const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  buscador.addEventListener('input', () => {
    const texto = buscador.value.trim();
    const invalido = texto.length > 40 || /[<>{}\[\]\\]/.test(texto);
    buscador.classList.toggle('is-invalid', invalido);
    ayudaBusqueda.textContent = invalido ? 'Máximo 40 caracteres y sin símbolos especiales.' : '';
    if (invalido) return;

    const q = normalizar(texto);
    contenido.classList.toggle('is-searching', q.length > 0);
    let visibles = 0;
    contenido.querySelectorAll('.tab-pane').forEach((pane) => {
      let enPane = 0;
      pane.querySelectorAll('.menu-item').forEach((item) => {
        const coincide = !q || normalizar(item.textContent).includes(q);
        item.classList.toggle('d-none', !coincide);
        if (coincide) enPane++;
      });
      pane.classList.toggle('d-none', q.length > 0 && enPane === 0);
      visibles += enPane;
    });
    aviso.classList.toggle('d-none', visibles > 0);
  });
});
