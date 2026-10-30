/* ===== CATÁLOGO BONTÁ =====
   Para cambiar productos, precios o fotos edita solo esta lista.
   📷 IMÁGENES: puedes usar una ruta de tu carpeta "img" o un enlace.
   Si la foto no existe o no carga, se muestra el emoji en su lugar. */

const FOTO = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const PRODUCTOS = [
  // ---- Repostería completa ----
  // Es momento de esperar nuevas recetas y fotos, por lo que esta categoría está vacía por ahora.
  // ---- Roles de canela ----
  { id: 'roles-1', cat: 'roles', emoji: '🥐', nombre: 'Roles de Canela (caja de 1)', desc: 'Masa de fermentación lenta con glaseado artesanal.', precio: 75, img: 'img/roles_de_canela.jpg' },
  { id: 'roles-6', cat: 'roles', emoji: '🥐', nombre: 'Roles de Canela (caja de 6)', desc: 'Ideal para compartir en reuniones y desayunos.', precio: 400, img: 'img/roles_de_canela.jpg' },

  // ---- Cajas sorpresa ----
  { id: 'sorpresa-chica', cat: 'sorpresa', emoji: '🎁', nombre: 'Caja Sorpresa Chica', desc: 'Selección de la casa con 4 piezas distintas.', precio: 250, img: 'img/sorpresa-chica.jpg' },
  { id: 'sorpresa-grande', cat: 'sorpresa', emoji: '🎁', nombre: 'Caja Sorpresa Grande', desc: 'Selección de la casa con 8 piezas distintas.', precio: 450, img: 'img/sorpresa-grande.jpg' },

  // ---- Galletas ----
  { id: 'galletas-limon', cat: 'galletas', emoji: '🍪', nombre: 'Galletas Artesanales de Limón', desc: 'Con mermelada de cítricos naturales. 1 pieza.', precio: 55, img: 'img/galleta_limon.jpeg' },
  { id: 'galletas-chocolate', cat: 'galletas', emoji: '🍪', nombre: 'Galletas Artesanales de Triple Chocolate', desc: 'Para los amantes del chocolate. 1 pieza.', precio: 50, img: 'img/galleta_triple_chocolate.jpeg' },
  { id: 'galletas-pumpkin', cat: 'galletas', emoji: '🍪', nombre: 'Galletas Artesanales de Pumpkin', desc: 'Con el sabor de temporada. 1 pieza.', precio: 55, img: 'img/galleta_pumpkin.jpeg' },
];

const CATEGORIAS = [
  { id: 'todo', nombre: 'Todo' },
  { id: 'roles', nombre: 'Roles de canela' },
  { id: 'sorpresa', nombre: 'Cajas sorpresa' },
  { id: 'galletas', nombre: 'Galletas' }
];

function mostrar(cat) {
  document.querySelectorAll('.filtro').forEach(b => {
    const activo = b.dataset.cat === cat;
    b.classList.toggle('activo', activo);
    b.setAttribute('aria-pressed', String(activo));
  });
  const lista = PRODUCTOS.filter(p => cat === 'todo' || p.cat === cat);
  document.getElementById('tienda-grid').innerHTML = lista.length
    ? lista.map(p => `
    <article class="tienda-card">
      <div class="tienda-media">
        <span aria-hidden="true">${p.emoji}</span>
        <img src="${esc(p.img)}" alt="${esc(p.nombre)}" loading="lazy" onerror="this.remove()">
      </div>
      <div class="tienda-info">
        <h3>${esc(p.nombre)}</h3>
        <p>${esc(p.desc)}</p>
        <div class="tienda-pie">
          <strong>${dinero(p.precio)}</strong>
          <button class="btn-agregar" data-id="${esc(p.id)}" aria-label="Agregar ${esc(p.nombre)} al carrito">Agregar</button>
        </div>
      </div>
    </article>`).join('')
    : '<p class="tienda-vacio">Aún no hay productos en esta categoría.</p>';
}

document.addEventListener('DOMContentLoaded', () => {
  const filtros = document.getElementById('filtros');
  filtros.innerHTML = CATEGORIAS
    .map(c => `<button class="filtro" data-cat="${c.id}" aria-pressed="false">${c.nombre}</button>`).join('');
  filtros.addEventListener('click', e => {
    const b = e.target.closest('.filtro');
    if (b) mostrar(b.dataset.cat);
  });
  document.getElementById('tienda-grid').addEventListener('click', e => {
    const b = e.target.closest('.btn-agregar');
    if (b) agregar(PRODUCTOS.find(p => p.id === b.dataset.id));
  });
  mostrar('todo');
});
