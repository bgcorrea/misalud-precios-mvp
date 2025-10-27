const state = {
  page: 1,
  pageSize: 10,
  total: 0,
  productos: [],
  rol: "Operador",
  listas: [],
  search: "",
  categoriaFilter: "",
  semaforoFilter: "",
  currentHistorico: null,
  comprasChart: null,
  ventasChart: null,
};

const tableBody = document.querySelector("#productosTable tbody");
const pageInfo = document.getElementById("pageInfo");
const totalInfo = document.getElementById("totalInfo");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const rolIcon = document.getElementById("rolIcon");
const rolText = document.getElementById("rolText");
const generarListaBtn = document.getElementById("btnGenerarLista");
const historicoModal = document.getElementById("historicoModal");
const closeModalBtn = document.getElementById("closeModal");
const closeModalFooterBtn = document.getElementById("closeModalBtn");
const tableView = document.getElementById("tableView");
const chartView = document.getElementById("chartView");
const toggleTableBtn = document.getElementById("toggleTable");
const toggleChartBtn = document.getElementById("toggleChart");
const historicoTemplate = document.getElementById("historicoTemplate");
const toastPanel = document.getElementById("toast");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch");
const categoriaFilter = document.getElementById("categoriaFilter");
const semaforoFilter = document.getElementById("semaforoFilter");
const clearFiltersBtn = document.getElementById("clearFilters");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
let toastTimer;
let searchDebounce;

function showToast(message, variant = "info") {
  if (!toastPanel) return;

  const colors = {
    info: "bg-blue-600",
    success: "bg-emerald-600",
    error: "bg-red-600",
    warning: "bg-amber-600"
  };

  const icons = {
    info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`
  };

  toastPanel.innerHTML = `
    <div class="${colors[variant]} text-white px-6 py-3 rounded-lg shadow-2xl flex items-center space-x-3">
      ${icons[variant]}
      <span class="font-medium">${message}</span>
    </div>
  `;

  toastPanel.classList.remove("opacity-0", "pointer-events-none", "translate-y-2");
  toastPanel.classList.add("opacity-100", "pointer-events-auto", "translate-y-0");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastPanel.classList.add("opacity-0", "pointer-events-none", "translate-y-2");
    toastPanel.classList.remove("opacity-100", "pointer-events-auto", "translate-y-0");
  }, 3500);
}

function updateRoleUi() {
  const isGerencia = state.rol === "Gerencia";

  // Actualizar display del rol
  if (rolIcon && rolText) {
    rolIcon.textContent = isGerencia ? "👔" : "👤";
    rolText.textContent = state.rol;
  }

  // Actualizar botón de generar lista
  if (generarListaBtn) {
    generarListaBtn.disabled = !isGerencia;
    if (isGerencia) {
      generarListaBtn.classList.remove("opacity-50", "cursor-not-allowed");
    } else {
      generarListaBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
  }
}

function semaforoBadge(color) {
  const configs = {
    ROJO: "bg-gradient-to-br from-red-500 to-red-600",
    AMARILLO: "bg-gradient-to-br from-amber-400 to-orange-500",
    VERDE: "bg-gradient-to-br from-emerald-400 to-green-500"
  };

  const bgClass = configs[color] || configs.VERDE;
  return `<div class="w-8 h-8 rounded-full ${bgClass} shadow-md mx-auto"></div>`;
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
    row.className = "hover:bg-blue-50 transition-colors duration-150";
    row.innerHTML = `
      <td class="px-3 py-4 text-sm font-mono text-gray-900">${producto.codigoInterno}</td>
      <td class="px-2 py-4 text-xs font-mono text-gray-600">${producto.codigoBarras}</td>
      <td class="px-4 py-4">
        <div class="text-sm font-medium text-gray-900">${producto.descripcion}</div>
        <div class="text-xs text-gray-500 mt-0.5 flex items-center">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            ${producto.categoria}${producto.fragmentado ? ' · Fragmentado' : ''}
          </span>
        </div>
      </td>
      <td class="px-4 py-4 text-right text-sm font-semibold text-gray-900">
        ${producto.costoPromedio ? `$${producto.costoPromedio.toFixed(2)}` : '<span class="text-gray-400">—</span>'}
      </td>
      <td class="px-4 py-4 text-right text-sm font-semibold text-gray-900">$${producto.precioActual.toFixed(2)}</td>
      <td class="px-4 py-4">
        <div class="flex flex-col space-y-1">
          <input type="number" min="0" step="0.1"
            value="${producto.precioPropuesto.toFixed(2)}"
            data-id="${producto.id}"
            class="w-full px-3 py-2 text-sm font-semibold text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            aria-label="Editar precio propuesto para ${producto.descripcion}">
          <div class="alerta text-xs text-red-600 font-medium" data-alerta="${producto.id}"></div>
        </div>
      </td>
      <td class="px-4 py-4 text-center">
        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-700">
          ${((producto.margenAplicado ?? 0) * 100).toFixed(1)}%
        </span>
      </td>
      <td class="px-4 py-4 text-center">${semaforoBadge(producto.semaforo)}</td>
      <td class="px-4 py-4">
        <div class="flex flex-col items-stretch space-y-2 min-w-[110px]">
          <button data-historico="${producto.id}"
            class="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 transition-all">
            <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            Historial
          </button>
          <button data-guardar="${producto.id}"
            class="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-500 transition-all transform hover:-translate-y-0.5">
            <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Guardar
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  const totalPages = Math.ceil(state.total / state.pageSize);
  pageInfo.textContent = `Página ${state.page} de ${totalPages}`;
  totalInfo.textContent = `${state.total} productos`;

  prevPageBtn.disabled = state.page <= 1;
  nextPageBtn.disabled = state.page >= totalPages;

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

    showToast("Precio actualizado correctamente.", "success");
    fetchProductos();
  } catch (error) {
    showToast("Error al guardar el precio.", "error");
  }
}

async function cargarHistorico(id) {
  try {
    // Abrir el modal
    if (historicoModal) {
      historicoModal.classList.remove("hidden");
    }

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
    showToast("Error al cargar el histórico.", "error");
    closeHistoricoModal();
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
    header.className = "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 mt-3 first:mt-0";
    header.textContent = titulo;
    contenedor.appendChild(header);

    const ul = document.createElement("ul");
    ul.className = "space-y-1.5";
    if (!lista || lista.length === 0) {
      const li = document.createElement("li");
      li.className = "text-xs text-gray-400 italic";
      li.textContent = "Sin registros.";
      ul.appendChild(li);
    } else {
      lista.forEach((item) => {
        const li = document.createElement("li");
        li.className = "text-xs bg-slate-50 p-2 rounded-lg border-l-2 border-blue-400";
        const monto = item.costo_total ?? item.precio_total;
        li.textContent = `${item.fecha}: ${item.cantidad} ${item.unidad}(s) · $${Number(
          monto
        ).toFixed(2)}`;
        ul.appendChild(li);
      });
    }
    contenedor.appendChild(ul);
  }

  state.currentHistorico = data;
  tableView.innerHTML = "";
  tableView.appendChild(clone);
}

async function fetchProductos() {
  try {
    const params = new URLSearchParams({
      page: state.page,
      pageSize: state.pageSize,
    });

    if (state.search) {
      params.append("search", state.search);
    }
    if (state.categoriaFilter) {
      params.append("categoria", state.categoriaFilter);
    }
    if (state.semaforoFilter) {
      params.append("semaforo", state.semaforoFilter);
    }

    const url = `/api/productos?${params.toString()}`;

    const respuesta = await fetch(url, {
      headers: { "x-role": state.rol },
    });


    if (!respuesta.ok) {
      throw new Error("No se pudo cargar la lista de productos.");
    }

    const data = await respuesta.json();

    // El filtro de semáforo ahora se aplica en el backend
    state.productos = data.data;
    state.total = data.total;
    state.page = data.page;
    state.pageSize = data.pageSize;
    renderProductos();
  } catch (error) {
    showToast("Error al cargar los productos.", "error");
  }
}

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

// Función para cerrar el modal de historial
function closeHistoricoModal() {
  if (historicoModal) {
    historicoModal.classList.add("hidden");
    tableView.innerHTML = '<p class="text-gray-500 text-center py-8">Cargando historial...</p>';
    chartView.classList.add("hidden");
    tableView.classList.remove("hidden");
    toggleTableBtn.classList.add("bg-white", "text-blue-600", "shadow-sm");
    toggleTableBtn.classList.remove("text-gray-600");
    toggleChartBtn.classList.remove("bg-white", "text-blue-600", "shadow-sm");
    toggleChartBtn.classList.add("text-gray-600");

    // Destruir gráficos si existen
    if (state.comprasChart) {
      state.comprasChart.destroy();
      state.comprasChart = null;
    }
    if (state.ventasChart) {
      state.ventasChart.destroy();
      state.ventasChart = null;
    }
  }
}

// Event listeners para cerrar el modal
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeHistoricoModal);
}

if (closeModalFooterBtn) {
  closeModalFooterBtn.addEventListener("click", closeHistoricoModal);
}

// Cerrar modal al hacer click en el fondo oscuro
if (historicoModal) {
  historicoModal.addEventListener("click", (e) => {
    if (e.target === historicoModal) {
      closeHistoricoModal();
    }
  });
}

// Generar nueva lista base
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
    showToast(`Lista ${data.codigo} generada con éxito. Puede descargarla desde el enlace de descarga.`, "success");

    // Ofrecer descarga inmediata
    setTimeout(() => {
      const url = `/api/listas/${data.id}/descargar?sep=;`;
      const link = document.createElement("a");
      link.href = url;
      link.download = `lista_${data.codigo}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 500);
  } catch (error) {
    showToast("Error al generar la lista base.", "error");
  }
}

if (generarListaBtn) {
  generarListaBtn.addEventListener("click", generarNuevaLista);
}

// Búsqueda con debounce
searchInput.addEventListener("input", (e) => {
  const value = e.target.value;
  clearTimeout(searchDebounce);

  if (value) {
    clearSearchBtn.classList.remove("hidden");
  } else {
    clearSearchBtn.classList.add("hidden");
  }

  searchDebounce = setTimeout(() => {
    state.search = value;
    state.page = 1;
    fetchProductos();
  }, 300);
});

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  state.search = "";
  state.page = 1;
  clearSearchBtn.classList.add("hidden");
  fetchProductos();
});

// Filtros
categoriaFilter.addEventListener("change", (e) => {
  state.categoriaFilter = e.target.value;
  state.page = 1;
  fetchProductos();
});

semaforoFilter.addEventListener("change", (e) => {
  state.semaforoFilter = e.target.value;
  state.page = 1;
  fetchProductos();
});

clearFiltersBtn.addEventListener("click", () => {
  searchInput.value = "";
  categoriaFilter.value = "";
  semaforoFilter.value = "";
  state.search = "";
  state.categoriaFilter = "";
  state.semaforoFilter = "";
  state.page = 1;
  clearSearchBtn.classList.add("hidden");
  fetchProductos();
});

// Cargar categorías
async function fetchCategorias() {
  try {
    const respuesta = await fetch("/api/categorias");
    if (!respuesta.ok) return;
    const categorias = await respuesta.json();
    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoriaFilter.appendChild(option);
    });
  } catch (error) {
  }
}

// Toggle entre vista tabla y gráficos
toggleTableBtn.addEventListener("click", () => {
  tableView.classList.remove("hidden");
  chartView.classList.add("hidden");
  toggleTableBtn.classList.add("bg-white", "text-blue-600", "shadow-sm");
  toggleTableBtn.classList.remove("text-gray-600");
  toggleChartBtn.classList.remove("bg-white", "text-blue-600", "shadow-sm");
  toggleChartBtn.classList.add("text-gray-600");
});

toggleChartBtn.addEventListener("click", () => {
  if (!state.currentHistorico) {
    showToast("Seleccione un producto primero", "warning");
    return;
  }
  tableView.classList.add("hidden");
  chartView.classList.remove("hidden");
  toggleChartBtn.classList.add("bg-white", "text-blue-600", "shadow-sm");
  toggleChartBtn.classList.remove("text-gray-600");
  toggleTableBtn.classList.remove("bg-white", "text-blue-600", "shadow-sm");
  toggleTableBtn.classList.add("text-gray-600");

  renderCharts(state.currentHistorico);
});

// Renderizar gráficos
function renderCharts(data) {
  const comprasCtx = document.getElementById("comprasChart").getContext("2d");
  const ventasCtx = document.getElementById("ventasChart").getContext("2d");

  // Destruir gráficos anteriores si existen
  if (state.comprasChart) state.comprasChart.destroy();
  if (state.ventasChart) state.ventasChart.destroy();

  // Preparar datos de compras
  const comprasData = [
    ...(data.compras.trimestre || []),
    ...(data.compras.mes || []),
    ...(data.compras.semana || []),
  ].reverse();

  const comprasLabels = comprasData.map(c => c.fecha);
  const comprasPreciosUnitarios = comprasData.map(c =>
    (c.costo_total / c.cantidad).toFixed(2)
  );

  // Preparar datos de ventas
  const ventasData = [
    ...(data.ventas.trimestre || []),
    ...(data.ventas.mes || []),
    ...(data.ventas.semana || []),
  ].reverse();

  const ventasLabels = ventasData.map(v => v.fecha);
  const ventasCantidades = ventasData.map(v => v.cantidad);

  // Gráfico de compras (línea)
  state.comprasChart = new Chart(comprasCtx, {
    type: "line",
    data: {
      labels: comprasLabels,
      datasets: [{
        label: "Precio Unitario ($)",
        data: comprasPreciosUnitarios,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: (context) => `Precio: $${context.parsed.y}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return '$' + value.toFixed(2);
            }
          }
        }
      }
    }
  });

  // Gráfico de ventas (barras)
  state.ventasChart = new Chart(ventasCtx, {
    type: "bar",
    data: {
      labels: ventasLabels,
      datasets: [{
        label: "Cantidad Vendida",
        data: ventasCantidades,
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}


// Verificar autenticación al cargar
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

if (!token || !user) {
  window.location.href = '/';
} else {
  // Cargar rol del usuario logueado
  try {
    const userData = JSON.parse(user);
    state.rol = userData.rol;
  } catch (e) {
    window.location.href = '/';
  }
}

// Event listener para cerrar sesión
btnCerrarSesion.addEventListener("click", () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showToast("Sesión cerrada exitosamente", "success");
  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
});

updateRoleUi();
fetchCategorias();
fetchProductos();

