const state = {
  page: 1,
  pageSize: 10,
  total: 0,
  productos: [],
  rol: "Operador",
  listas: [],
};

const tableBody = document.querySelector("#productosTable tbody");
const pageInfo = document.getElementById("pageInfo");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const rolSelect = document.getElementById("rolSelect");
const generarListaBtn = document.getElementById("btnGenerarLista");
const btnGenerarListaSide = document.getElementById("btnGenerarListaSide");
const listasContent = document.getElementById("listasContent");
const sidePanelContent = document.getElementById("sidePanelContent");
const closePanelBtn = document.getElementById("closePanel");
const historicoTemplate = document.getElementById("historicoTemplate");
const toastPanel = document.getElementById("toast");
let toastTimer;

function showToast(message, variant = "info") {
  if (!toastPanel) return;
  toastPanel.textContent = message;
  toastPanel.classList.remove("toast--error");
  if (variant === "error") {
    toastPanel.classList.add("toast--error");
  }
  toastPanel.classList.add("toast--visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastPanel.classList.remove("toast--visible");
  }, 3500);
}

function updateRoleUi() {
  const isGerencia = state.rol === "Gerencia";

  if (generarListaBtn) {
    generarListaBtn.disabled = !isGerencia;
    generarListaBtn.setAttribute("aria-disabled", String(!isGerencia));
    generarListaBtn.title = isGerencia ? "" : "Disponible solo para Gerencia";
  }

  if (btnGenerarListaSide) {
    btnGenerarListaSide.disabled = !isGerencia;
    btnGenerarListaSide.setAttribute("aria-disabled", String(!isGerencia));
    btnGenerarListaSide.title = isGerencia ? "" : "Disponible solo para Gerencia";
  }
}

function semaforoBadge(color) {
  const clase =
    color === "ROJO"
      ? "badge--rojo"
      : color === "AMARILLO"
      ? "badge--amarillo"
      : "badge--verde";
  const label =
    color === "ROJO"
      ? "Alerta roja: revisar precio propuesto"
      : color === "AMARILLO"
      ? "Alerta amarilla: considerar ajuste"
      : "En rango verde";
  return `<span class="badge ${clase}" role="status" aria-label="${label}" title="${label}">${color}</span>`;
}

function validarRango(producto, nuevo) {
  const parametros = producto.parametrosCategoria;
  const sugerido = producto.precioSugerido ?? producto.precioActual;
  const diferencia = nuevo - sugerido;
  const porcentaje = (diferencia / sugerido) * 100;
  if (porcentaje < parametros.rangoEdicionMin) {
    return `Fuera de rango. Mínimo ${parametros.rangoEdicionMin}%`;
  }
  if (porcentaje > parametros.rangoEdicionMax) {
    return `Fuera de rango. Máximo ${parametros.rangoEdicionMax}%`;
  }
  return "";
}

function renderProductos() {
  tableBody.innerHTML = "";
  state.productos.forEach((producto) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${producto.codigoInterno}</td>
      <td>${producto.codigoBarras}</td>
      <td>
        <div>${producto.descripcion}</div>
        <small>${producto.categoria}${
          producto.fragmentado ? " · Fragmentado" : ""
        }</small>
      </td>
      <td>${producto.costoPromedio ?? "—"}</td>
      <td>${producto.precioActual.toFixed(2)}</td>
      <td>
        <div class="editable">
          <input type="number" min="0" step="0.1" value="${producto.precioPropuesto.toFixed(
            2
          )}" data-id="${producto.id}" aria-label="Editar precio propuesto para ${
      producto.descripcion
    }">
          <div class="alerta" data-alerta="${producto.id}"></div>
        </div>
      </td>
      <td>${((producto.margenAplicado ?? 0) * 100).toFixed(1)}%</td>
      <td>${semaforoBadge(producto.semaforo)}</td>
      <td>
        <button class="button button--outline" data-historico="${producto.id}">Ver historial</button>
        <button class="button button--primary" data-guardar="${producto.id}">Guardar</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  pageInfo.textContent = `Página ${state.page} de ${Math.ceil(
    state.total / state.pageSize
  )}`;

  document
    .querySelectorAll("input[data-id]")
    .forEach((input) =>
      input.addEventListener("input", (event) => {
        const value = Number(event.target.value);
        const id = Number(event.target.dataset.id);
        const producto = state.productos.find((p) => p.id === id);
        if (!producto || !Number.isFinite(value)) {
          return;
        }
        const mensaje = validarRango(producto, value);
        const alerta = document.querySelector(`[data-alerta="${id}"]`);
        if (alerta) {
          alerta.textContent = mensaje;
        }
      })
    );

  document.querySelectorAll("[data-guardar]").forEach((btn) =>
    btn.addEventListener("click", (event) => {
      const id = Number(event.target.dataset.guardar);
      guardarProducto(id);
    })
  );

  document.querySelectorAll("[data-historico]").forEach((btn) =>
    btn.addEventListener("click", (event) => {
      const id = Number(event.target.dataset.historico);
      cargarHistorico(id);
    })
  );
}

async function guardarProducto(id) {
  const input = document.querySelector(`input[data-id="${id}"]`);
  if (!input) return;
  const valor = Number(input.value);
  const producto = state.productos.find((p) => p.id === id);
  if (!producto || !Number.isFinite(valor)) {
    showToast("Valor inválido.", "error");
    return;
  }

  const alerta = document.querySelector(`[data-alerta="${id}"]`);
  const mensaje = validarRango(producto, valor);
  if (mensaje) {
    if (alerta) alerta.textContent = mensaje;
    return;
  }

  try {
    const respuesta = await fetch(`/api/productos/${id}/precio-propuesto`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-role": state.rol,
      },
      body: JSON.stringify({
        precioPropuesto: valor,
        usuario: state.rol.toLowerCase(),
      }),
    });

    if (!respuesta.ok) {
      const error = await respuesta.json();
      showToast(error.mensaje || "No se pudo guardar.", "error");
      return;
    }

    showToast("Precio actualizado.");
    fetchProductos();
  } catch (error) {
    console.error(error);
    showToast("Error al guardar el precio.", "error");
  }
}

async function cargarHistorico(id) {
  try {
    const respuesta = await fetch(`/api/productos/${id}/historico`, {
      headers: {
        "x-role": state.rol,
      },
    });
    if (!respuesta.ok) {
      throw new Error("No se pudo obtener el histórico.");
    }
    const data = await respuesta.json();
    renderHistorico(data);
  } catch (error) {
    console.error(error);
    showToast("Error al cargar el histórico.", "error");
  }
}

function renderHistorico(data) {
  const clone = historicoTemplate.content.cloneNode(true);
  const comprasContainer = clone.querySelector("[data-compras]");
  const ventasContainer = clone.querySelector("[data-ventas]");

  const secciones = [
    ["Última semana", data.compras.semana, comprasContainer],
    ["30 días", data.compras.mes, comprasContainer],
    ["90 días", data.compras.trimestre, comprasContainer],
    ["Última semana", data.ventas.semana, ventasContainer],
    ["30 días", data.ventas.mes, ventasContainer],
    ["90 días", data.ventas.trimestre, ventasContainer],
  ];

  for (let i = 0; i < secciones.length; i += 1) {
    const [titulo, lista, contenedor] = secciones[i];
    const header = document.createElement("h4");
    header.textContent = titulo;
    contenedor.appendChild(header);

    const ul = document.createElement("ul");
    if (!lista || lista.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Sin registros.";
      ul.appendChild(li);
    } else {
      lista.forEach((item) => {
        const li = document.createElement("li");
        const monto = item.costo_total ?? item.precio_total;
        li.textContent = `${item.fecha}: ${item.cantidad} ${item.unidad}(s) · $${Number(
          monto
        ).toFixed(2)}`;
        ul.appendChild(li);
      });
    }
    contenedor.appendChild(ul);
  }

  sidePanelContent.innerHTML = "";
  sidePanelContent.appendChild(clone);
}

async function fetchProductos() {
  try {
    const respuesta = await fetch(
      `/api/productos?page=${state.page}&pageSize=${state.pageSize}`,
      {
        headers: { "x-role": state.rol },
      }
    );
    if (!respuesta.ok) {
      throw new Error("No se pudo cargar la lista de productos.");
    }
    const data = await respuesta.json();
    state.productos = data.data;
    state.total = data.total;
    state.page = data.page;
    state.pageSize = data.pageSize;
    renderProductos();
  } catch (error) {
    console.error(error);
    showToast("Error al cargar los productos.", "error");
  }
}

rolSelect.addEventListener("change", () => {
  state.rol = rolSelect.value;
  updateRoleUi();
  fetchProductos();
});

prevPageBtn.addEventListener("click", () => {
  if (state.page > 1) {
    state.page -= 1;
    fetchProductos();
  }
});

nextPageBtn.addEventListener("click", () => {
  if (state.page * state.pageSize < state.total) {
    state.page += 1;
    fetchProductos();
  }
});

closePanelBtn.addEventListener("click", () => {
  sidePanelContent.innerHTML =
    "<p>Seleccione un producto para ver sus últimas compras y ventas.</p>";
});

async function fetchListas() {
  try {
    const respuesta = await fetch("/api/listas/vigente", {
      headers: { "x-role": state.rol },
    });

    if (respuesta.status === 404) {
      listasContent.innerHTML = `
        <div class="empty-state">
          <p>📭 No hay listas base generadas todavía.</p>
          <p style="font-size: 0.85rem; margin-top: 0.5rem;">
            Use el botón de abajo para generar una nueva lista.
          </p>
        </div>
      `;
      return;
    }

    if (!respuesta.ok) {
      throw new Error("Error al cargar listas");
    }

    const listaVigente = await respuesta.json();
    renderListas([listaVigente]);
  } catch (error) {
    console.error(error);
    listasContent.innerHTML = `
      <div class="empty-state">
        <p>⚠️ Error al cargar las listas</p>
      </div>
    `;
  }
}

function renderListas(listas) {
  if (!listas || listas.length === 0) {
    listasContent.innerHTML = `
      <div class="empty-state">
        <p>📭 No hay listas disponibles</p>
      </div>
    `;
    return;
  }

  listasContent.innerHTML = listas
    .map(
      (lista) => `
    <div class="lista-item">
      <div class="lista-item__info">
        <h4>Lista #${lista.codigo}</h4>
        <p>${new Date(lista.fecha_generacion).toLocaleString("es-ES")}</p>
      </div>
      <div class="lista-item__actions">
        <button
          class="button button--success btn-icon"
          data-descargar="${lista.id}"
          title="Descargar CSV"
          aria-label="Descargar lista ${lista.codigo}">
          ⬇️
        </button>
      </div>
    </div>
  `
    )
    .join("");

  document.querySelectorAll("[data-descargar]").forEach((btn) =>
    btn.addEventListener("click", (event) => {
      const id = event.target.dataset.descargar;
      descargarLista(id);
    })
  );
}

function descargarLista(listaId) {
  const url = `/api/listas/${listaId}/descargar?sep=;`;
  const link = document.createElement("a");
  link.href = url;
  link.download = `lista_${listaId}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("📥 Descargando lista...");
}

async function generarNuevaLista() {
  if (state.rol !== "Gerencia") {
    showToast("Función disponible solo para Gerencia.", "error");
    return;
  }

  try {
    const respuesta = await fetch("/api/listas/generar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-role": state.rol,
      },
      body: JSON.stringify({ usuario: state.rol.toLowerCase() }),
    });

    if (!respuesta.ok) {
      const error = await respuesta.json();
      showToast(error.mensaje || "No se pudo generar la lista.", "error");
      return;
    }

    const data = await respuesta.json();
    showToast(`✅ Lista ${data.codigo} generada con éxito.`);
    fetchListas();
  } catch (error) {
    console.error(error);
    showToast("Error al generar la lista base.", "error");
  }
}

if (generarListaBtn) {
  generarListaBtn.addEventListener("click", generarNuevaLista);
}

if (btnGenerarListaSide) {
  btnGenerarListaSide.addEventListener("click", generarNuevaLista);
}

updateRoleUi();
fetchProductos();
fetchListas();
