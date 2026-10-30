/* ===== CARRITO DE COMPRAS BONTÁ =====
   Se carga en todas las páginas con:
   <script src="carrito.js"></script>  (antes de </body>)
   Los pedidos se envían por correo con Formspree. */

// 📩 Formulario de Formspree donde llegan los pedidos
const FORMSPREE = 'https://formspree.io/f/myeepokw';

// WhatsApp (solo para los enlaces de Contacto y pie de página): 52 + 10 dígitos, sin espacios ni +
const WHATSAPP = '520000000000';
const KEY = 'bonta_carrito';
const MAX_POR_PRODUCTO = 99;

let carrito = [];
let enviado = false;
let enviando = false;

function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(KEY));
    carrito = Array.isArray(datos)
      ? datos.filter(p => p && p.id && Number.isFinite(p.precio) && Number.isInteger(p.cant) && p.cant > 0)
      : [];
  } catch (e) { carrito = []; }
}
cargar();

const dinero = n => '$' + n.toLocaleString('es-MX') + ' MXN';
const total = () => carrito.reduce((s, p) => s + p.precio * p.cant, 0);
const piezas = () => carrito.reduce((s, p) => s + p.cant, 0);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fechaMinima() {
  const d = new Date();
  d.setDate(d.getDate() + 1); // 24 h de anticipación
  const dos = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

function guardar() {
  try { localStorage.setItem(KEY, JSON.stringify(carrito)); } catch (e) {}
  pintar();
}

function aviso(texto) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = texto;
  t.classList.add('visible');
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => t.classList.remove('visible'), 2200);
}

function agregar(item) {
  if (!item) return;
  enviado = false;
  const ya = carrito.find(p => p.id === item.id);
  if (ya) ya.cant = Math.min(ya.cant + 1, MAX_POR_PRODUCTO);
  else carrito.push({ id: item.id, nombre: item.nombre, precio: item.precio, cant: 1 });
  guardar();
  aviso('✓ ' + item.nombre + ' agregado al carrito');
  const btn = document.querySelector('.cart-btn');
  if (btn) { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); }
}

function cambiar(id, delta) {
  const p = carrito.find(x => x.id === id);
  if (!p) return;
  p.cant = Math.min(p.cant + delta, MAX_POR_PRODUCTO);
  if (p.cant <= 0) carrito = carrito.filter(x => x.id !== id);
  guardar();
}

function vaciar() { carrito = []; guardar(); }

function abrir(si) {
  document.body.classList.toggle('carrito-abierto', si);
  const btn = document.querySelector('.cart-btn');
  if (btn) btn.setAttribute('aria-expanded', String(si));
  if (si) {
    const cerrar = document.querySelector('.carrito-head button');
    if (cerrar) cerrar.focus();
  } else if (btn) {
    btn.focus();
  }
}

function pintar() {
  const cuenta = document.getElementById('carrito-count');
  if (!cuenta) return;
  cuenta.textContent = piezas();
  const lista = document.getElementById('carrito-lista');
  if (!carrito.length) {
    lista.innerHTML = enviado
      ? '<p class="carrito-ok"><strong>✓ ¡Pedido enviado!</strong><br>Gracias por tu pedido. Te contactaremos pronto para confirmar los detalles de entrega o recolección.</p>'
      : '<p class="carrito-vacio">Tu carrito está vacío.<br>Agrega algo rico desde la <a href="tienda.html">tienda</a>.</p>';
  } else {
    lista.innerHTML = carrito.map(p => `
      <div class="carrito-item">
        <div><strong>${esc(p.nombre)}</strong><br><span>${dinero(p.precio)}</span></div>
        <div class="carrito-qty">
          <button onclick="cambiar('${esc(p.id)}',-1)" aria-label="Quitar uno de ${esc(p.nombre)}">−</button>
          <b>${p.cant}</b>
          <button onclick="cambiar('${esc(p.id)}',1)" aria-label="Agregar uno de ${esc(p.nombre)}">+</button>
        </div>
      </div>`).join('');
  }
  document.getElementById('carrito-total').textContent = dinero(total());
  document.getElementById('carrito-enviar').disabled = !carrito.length || enviando;
  document.querySelector('.carrito-foot').hidden = enviado && !carrito.length;
  document.getElementById('carrito-vaciar').hidden = !carrito.length;
}

function marcar(campo, mensaje) {
  campo.classList.add('error');
  document.getElementById('carrito-error').textContent = mensaje;
  campo.focus();
}

async function enviarPedido() {
  if (!carrito.length || enviando) return;
  const nombre = document.getElementById('carrito-nombre');
  const tel = document.getElementById('carrito-tel');
  const email = document.getElementById('carrito-email');
  const fecha = document.getElementById('carrito-fecha');
  const error = document.getElementById('carrito-error');
  const boton = document.getElementById('carrito-enviar');

  document.querySelectorAll('.carrito-campos input').forEach(i => i.classList.remove('error'));
  error.textContent = '';

  if (nombre.value.trim().length < 2) return marcar(nombre, 'Escribe tu nombre.');
  if (tel.value.replace(/\D/g, '').length < 10) return marcar(tel, 'Escribe un teléfono de 10 dígitos.');
  if (email.value.trim() && !email.checkValidity()) return marcar(email, 'El correo no es válido.');
  if (!fecha.value || fecha.value < fechaMinima()) return marcar(fecha, 'Elige una fecha con al menos 24 horas de anticipación.');
  if (document.getElementById('carrito-gotcha').value) return; // anti-spam

  const datos = {
    _subject: 'Nuevo pedido Bontá — ' + nombre.value.trim(),
    nombre: nombre.value.trim(),
    telefono: tel.value.trim(),
    fecha_entrega: fecha.value.split('-').reverse().join('/'),
    pedido: carrito.map(p => `${p.cant} x ${p.nombre} — ${dinero(p.precio * p.cant)}`).join('\n'),
    total: dinero(total())
  };
  if (email.value.trim()) datos.email = email.value.trim(); // Formspree lo usa para responder

  enviando = true;
  boton.disabled = true;
  boton.textContent = 'Enviando…';
  try {
    const r = await fetch(FORMSPREE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!r.ok) throw new Error('Formspree ' + r.status);
    enviado = true;
    carrito = [];
    document.getElementById('carrito-form').reset();
    guardar();
  } catch (e) {
    error.textContent = 'No se pudo enviar el pedido. Revisa tu conexión e inténtalo de nuevo.';
  } finally {
    enviando = false;
    boton.textContent = 'Enviar pedido';
    boton.disabled = !carrito.length;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Botón del carrito en la barra
  const wrap = document.querySelector('.nav-wrapper');
  if (wrap) {
    const btn = document.createElement('button');
    btn.className = 'cart-btn';
    btn.setAttribute('aria-label', 'Abrir carrito');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '🛒 <span id="carrito-count">0</span>';
    btn.onclick = () => abrir(true);
    wrap.appendChild(btn);
  }

  // Panel lateral
  document.body.insertAdjacentHTML('beforeend', `
    <div class="carrito-fondo" onclick="abrir(false)"></div>
    <aside class="carrito-panel" role="dialog" aria-modal="true" aria-label="Carrito de compras">
      <div class="carrito-head"><h3>Tu carrito</h3><button onclick="abrir(false)" aria-label="Cerrar carrito">✕</button></div>
      <div id="carrito-lista"></div>
      <div class="carrito-foot">
        <div class="carrito-total"><span>Total</span><strong id="carrito-total"></strong></div>
        <form id="carrito-form" class="carrito-campos" novalidate>
          <label>Tu nombre
            <input type="text" id="carrito-nombre" autocomplete="name" maxlength="60" placeholder="Ej. Ana López" required>
          </label>
          <label>Teléfono o WhatsApp
            <input type="tel" id="carrito-tel" autocomplete="tel" inputmode="tel" maxlength="20" placeholder="10 dígitos" required>
          </label>
          <label>Correo (opcional)
            <input type="email" id="carrito-email" autocomplete="email" maxlength="80" placeholder="tucorreo@ejemplo.com">
          </label>
          <label>Fecha de entrega o recolección
            <input type="date" id="carrito-fecha" min="${fechaMinima()}" required>
          </label>
          <input type="text" id="carrito-gotcha" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;">
          <p class="carrito-aviso">Horneamos bajo pedido: mínimo 24 horas de anticipación.</p>
          <p class="carrito-error" id="carrito-error" role="alert"></p>
          <button type="submit" id="carrito-enviar" class="btn-primary">Enviar pedido</button>
        </form>
        <button id="carrito-vaciar" class="carrito-vaciar" onclick="vaciar()">Vaciar carrito</button>
      </div>
    </aside>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

  const formulario = document.getElementById('carrito-form');
  formulario.addEventListener('submit', e => { e.preventDefault(); enviarPedido(); });
  formulario.addEventListener('input', e => {
    e.target.classList.remove('error');
    document.getElementById('carrito-error').textContent = '';
  });

  // Enlaces de WhatsApp en otras páginas: <a data-whatsapp>
  document.querySelectorAll('[data-whatsapp]').forEach(a => {
    a.href = 'https://wa.me/' + WHATSAPP;
    a.target = '_blank';
    a.rel = 'noopener';
  });

  pintar();
});

// Cerrar con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('carrito-abierto')) abrir(false);
});

// Mantener sincronizado el carrito entre pestañas
window.addEventListener('storage', e => {
  if (e.key === KEY) { cargar(); pintar(); }
});
