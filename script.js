// Variables globales
let datosRecursos = []; // Recursos cargados desde el JSON
let savedSearches = []; //busquedas guardadas
let currentSearch = []; //búsqueda actual
const RESULTADOS_POR_PAGINA = 4; // Define la cantidad de resultados por página
let paginaActual = 1; // Define la página actual

// variables para llamadas al DOM
//Botones
const savedSearchesBtn = document.getElementById('savedSearchesBtn'); // Botón de FILTROS GUARDADOS
const savedSearchesModalBtn = document.getElementById('savedSearchesModalBtn'); // Botón de FILTROS GUARDADOS del modal
const infoBtn = document.getElementById('infoBtn'); // Botón de INFO
const closeBtn = Array.from(document.getElementsByClassName('closeBtn')); // Botones de CERRAR el modal
const saveFilterBtn = document.getElementById('saveFilterBtn'); // Botón de GUARDAR FILTRO
const saveFilterModalBtn = document.getElementById('saveFilterModalBtn'); // Botón de GUARDAR FILTRO del modal
const clearFiltersBtn = document.getElementById('clearFiltersBtn'); // Botón de LIMPIAR FILTROS
const clearFiltersModalBtn = document.getElementById('clearFiltersModalBtn'); // Botón de LIMPIAR FILTROS del modal
const searchBtn = document.getElementById("searchBtn"); // Botón de BÚSQUEDA
const applyFilterBtn = document.getElementById('applyFilterBtn'); // Botón de APLICAR FILTRO
const applyFilterModalBtn = document.getElementById('applyFilterModalBtn'); // Botón de APLICAR FILTRO del modal
const advancedSearchBtn = document.getElementById('advancedSearchBtn'); // Botón de BÚSQUEDA AVANZADA
//Otros
const searchInput = document.getElementById('searchInput'); // Input de búsqueda principal
const resultsList = document.getElementById('resultsList'); // Lista de resultados
const filterContainer = document.getElementById('filterContainer'); // Contenedor de filtros
const orderBy = document.getElementById('orderBy') // Select de ordenar por
const selectCatalog = document.getElementById('selectCatalog')
const paginacionContainer = document.getElementById('paginacionContainer'); // Contenedor de paginación
const searchDescription = document.getElementById('searchDescription'); // Descripción de la búsqueda
const availableOnlyCheckbox = document.getElementById('availableOnly'); // Checkbox de solo disponibles


/*---------------
CARGAR RECURSOS
---------------*/
// Usa la función rellenarSelector con el tercer parámetro para autores
function procesarDatos(recursos) {
    const catalogos = obtenerValoresUnicos(recursos, 'catalogo');
    const formatos = obtenerValoresUnicos(recursos, 'formato_recurso');
    const materias = obtenerValoresUnicos(recursos, 'materia');
    const autores = obtenerValoresUnicos(recursos, 'autor');
    const editoriales = obtenerValoresUnicos(recursos, 'editorial');
    const idiomas = obtenerValoresUnicos(recursos, 'idioma');

    rellenarSelector('selectCatalog', catalogos, "Todos los catálogos");
    rellenarSelector('format', formatos, "Todos los formatos");
    rellenarSelector('subject', materias, "Todas las materias");
    rellenarSelector('author', autores, "Todos los autores", true); // Aplica capitalización a cada palabra
    rellenarSelector('publisher', editoriales, "Todas las editoriales");
    rellenarSelector('language', idiomas, "Todos los idiomas");
}

function obtenerValoresUnicos(recursos, campo) {
    // Mantén la capitalización original del JSON
    const valores = recursos.map(item => item[campo].trim());
    const unicos = new Set(valores);
    return Array.from(unicos).sort();
}

// Función para cargar los datos de recursos.json
async function cargarRecursos() {
    try {
        const respuesta = await fetch('./recursos.json');
        if (!respuesta.ok) {
            throw new Error('Error al cargar los recursos');
        }
        const datos = await respuesta.json();
        datosRecursos = datos.recursos; // Guardar en la variable global
        procesarDatos(datos.recursos); // Procesar los datos para llenar los selectores
        console.log("Datos cargados:", datosRecursos); // Verifica los datos cargados
        return datos.recursos;
    } catch (error) {
        console.error("Error al cargar los recursos:", error);
    }
}

// Función para rellenar un selector con opciones
function rellenarSelector(selectorId, opciones, textoPorDefecto, capitalizar = false) {
    const selector = document.getElementById(selectorId);

    // Limpia el selector antes de añadir nuevas opciones
    selector.innerHTML = '';

    // Añade la opción por defecto
    const opcionPorDefecto = document.createElement('option');
    opcionPorDefecto.value = '';
    opcionPorDefecto.textContent = textoPorDefecto;
    selector.appendChild(opcionPorDefecto);

    // Añade las opciones provenientes del JSON
    opciones.forEach(opcion => {
        const elementoOpcion = document.createElement('option');
        elementoOpcion.value = opcion;
        elementoOpcion.textContent = capitalizar ? capitalizarCadaPalabra(opcion) : opcion;
        selector.appendChild(elementoOpcion);
    });
}

function capitalizarCadaPalabra(texto) {
    return texto.split(' ').map(palabra => 
        palabra.charAt(0).toUpperCase() + palabra.slice(1)
    ).join(' ');
}

// cuando la página se carga para iniciar la carga y el procesamiento de los datos
document.addEventListener('DOMContentLoaded', function() {
    cargarRecursos();
});

/* --------------------
   Manejo de Búsquedas
   -------------------- */

// Verificar si una búsqueda ya está guardada
function isSearchSaved(searchTerm) {
    return savedSearches.some(savedSearch => JSON.stringify(savedSearch) === JSON.stringify(search));
}

// Función para validar el término de búsqueda
function isValidSearchTerm(searchTerm) {
    return searchTerm !== '';
}

/* -----------------------------
   Visualización de resultadoss
   ----------------------------- */

// Función para mostrar los resultados de búsqueda
function displayResults(searchTerm = '', resultadosFiltrados = []) {
    console.log("Mostrando resultados para:", searchTerm);
    console.log("Resultados a mostrar:", resultadosFiltrados);

    // Llama a paginarResultados aquí
    paginarResultados(resultadosFiltrados);

    // Muestra el contenedor de resultados y filtros
    document.querySelector('.results-and-filters-container').style.display = 'flex';

    // Oculta el botón de búsqueda avanzada en pantallas grandes
    if (isLargeScreen()) {
        advancedSearchBtn.style.display = 'none';
    }
}

//resultados filtrados y los divide en páginas:
function paginarResultados(resultadosFiltrados) {
    const numeroDePaginas = Math.ceil(resultadosFiltrados.length / RESULTADOS_POR_PAGINA);
    mostrarPagina(resultadosFiltrados, paginaActual);
    mostrarControlesPaginacion(resultadosFiltrados, numeroDePaginas);
}

//muestra las páginas:
function mostrarPagina(resultados, numeroPagina) {
    const inicio = (numeroPagina - 1) * RESULTADOS_POR_PAGINA;
    const fin = inicio + RESULTADOS_POR_PAGINA;
    const resultadosPagina = resultados.slice(inicio, fin);

    resultsList.innerHTML = ''; // Limpiar resultados anteriores

    if (resultadosPagina.length > 0) {
        resultadosPagina.forEach(recurso => {
            resultsList.appendChild(crearElementoLista(recurso));
        });
    } else {
        // Si no hay resultados, muestra un mensaje
        const busqueda = searchInput.value.trim()
        const noResultsMessage = document.createElement('li');
        noResultsMessage.innerHTML = `No se encontraron resultados para: <strong>${searchDescription.innerHTML}</strong>.`;
        noResultsMessage.classList.add('no-results');
        resultsList.appendChild(noResultsMessage);
    }
}

// Crear los elementos de la lista de resultados
function crearElementoLista(recurso) {
    const resultItem = document.createElement("li");
    resultItem.className = "search-result-item";

    // Determinar la clase de disponibilidad basada en el valor de recurso.disponibilidad
    const availabilityClass = recurso.disponibilidad ? 'available' : 'not-available';

    resultItem.innerHTML = `
        <div class="result-cover"><img src="${recurso.portada}" alt="Portada"></div>
        <div class="result-info">
            <div class="result-actions">
                <button class="action-btn" title="Copiar"><i class="fas fa-copy"></i></button>
                <button class="action-btn" title="Enviar correo"><i class="fas fa-envelope"></i></button>
                <button class="action-btn" title="Guardar"><i class="fas fa-save"></i></button>
                <button class="action-btn" title="Más opciones"><i class="fas fa-ellipsis-h"></i></button>
            </div>
            <div class="result-format">${recurso.formato_recurso} - <span>${recurso.materia} </span></div>
            <div class="result-title">${recurso.titulo}</div>
            <div class="result-author">${recurso.autor} - ${recurso.editorial}, ${recurso.fecha_publicacion}</div>
            <div class="result-availability">${recurso.disponibilidad ? '<strong class="available"> <i class="fas fa-check"></i> Disponible'  : '<strong class="not-available"><i class="fas fa-times"></i> No Disponible'} - ${recurso.localizacion} </strong></div>
        </div>`;
    return resultItem;
}

//Mostrar controles de pagina
function mostrarControlesPaginacion(resultadosFiltrados, numeroDePaginas) {
    paginacionContainer.innerHTML = ''; // Limpiar la paginación anterior

    for (let i = 1; i <= numeroDePaginas; i++) {
        const botonPagina = document.createElement('button');
        botonPagina.textContent = i;
        botonPagina.classList.add('boton-pagina');

        // Resaltar el botón de la página actual
        if (i === paginaActual) {
            botonPagina.classList.add('pagina-actual');
        }

        // Actualizar el event listener para pasar los resultados filtrados
        botonPagina.addEventListener('click', function() {
            paginaActual = i;
            mostrarPagina(resultadosFiltrados, i);
            mostrarControlesPaginacion(resultadosFiltrados, numeroDePaginas);
        });

        paginacionContainer.appendChild(botonPagina);
    }
}

/* ---------------------
   Gestión de Modales
   --------------------- */

// Funciones para abrir y cerrar modales
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

/* --------------------
   Event Listeners
   -------------------- */
// Even listener para el menu de navegación activo
document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav-menu a');

    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navLinks.forEach(l => l.classList.remove('active-link'));
            this.classList.add('active-link');
        });
    });
});

// Abre el modal de información
infoBtn.addEventListener('click', function () {
    openModal('infoModal');
});

// Cierra el modal cuando se hace clic en el botón de cierre
Array.from(closeBtn).forEach(button => {
    button.addEventListener('click', function () {
        closeModal(this.closest('.modal').id);
    });
});

// Event listener para el botón de guardar búsqueda
saveFilterBtn.addEventListener('click', function() {
    let currentSearchValues = getCriteriosBusquedaAvanzada();
    let searchAsString = JSON.stringify(currentSearchValues);
    let alreadySaved = savedSearches.some(savedSearch => JSON.stringify(savedSearch) === searchAsString);

    if (!alreadySaved) {
        savedSearches.push(currentSearchValues);
        updateSavedSearchesModal();
        if (confirm('¿Quieres guardar este filtro o búsqueda?')) {
            // Guarda la búsqueda
            showConfirmationMessage('El filtro o la búsqueda se ha guardado correctamente.');
        } else {
            // No hagas nada
        }
    } else {
        showAlertMessage('Este filtro o búsqueda ya está guardado.');
    }
});

// Event listener para el boton de filtros guardados
savedSearchesBtn.addEventListener('click', function() {
    updateAdvancedSearchesModal();
    openModal('savedSearchesModal'); // Usa la función openModal para mostrar el modal
});

// Event listener para el boton de filtros guardados desde el modal
savedSearchesModalBtn.addEventListener('click', function() {
    updateAdvancedSearchesModal();
    openModal('savedSearchesModal'); // Usa la función openModal para mostrar el modal
});

// Cierra el modal si se hace clic fuera de su contenido
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
}

// Event listener para el botón de limpiar filtros
clearFiltersBtn.addEventListener('click', function() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los filtros?')) {
        clearFilters();
    }
});

// Event listener para el botón de limpiar filtros
clearFiltersModalBtn.addEventListener('click', function() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los filtros?')) {
        clearFilters();
    }
});

// Event listener para el botón de búsqueda
searchBtn.addEventListener("click", aplicarFiltro);

// Event listener para el campo de búsqueda
searchInput.addEventListener('input', function() {
    let searchValue = this.value;

    // Transfiere el valor actual del campo de búsqueda al primer input de los filtros
    transferCurrentSearchToFilter();

});

// Event listener para el selectpr de catalogo 
selectCatalog.addEventListener('change', function() {
    console.log("Nuevo valor seleccionado en el catálogo:", this.value);
});

// Event listener para los botones de búsqueda
applyFilterModalBtn.addEventListener('click', aplicarFiltro);

applyFilterBtn.addEventListener('click', aplicarFiltro);


/* ------------------------------
   Gestión de Búsquedas Guardadas
   ------------------------------ */

   //Evitar Guardar Búsquedas Avanzadas Duplicadas
   function getAdvancedSearchValues() {
    let values = [];
    document.querySelectorAll('#advancedSearchModal .row').forEach(row => {
        let rowValues = [];
        row.querySelectorAll('select, input[type="text"]').forEach(element => {
            rowValues.push(element.value);
        });
        values.push(rowValues);
    });
    return values;
}

function translateValue(value) {
    const translations = {
        'any': 'cualquier campo',
        'title': 'Título',
        'author': 'Autor',
        'subject': 'Materia',
        'contains': 'contiene',
        'is': 'es',
        'starts_with': 'empieza por',
        'and': 'y',
        'or': 'o',
        'not': 'no',
    };
    return translations[value] || value;
}

// Función para guardar una nueva búsqueda
function saveNewSearch() {
    searchDescription.innerText;
    let filterValues = getCriteriosDeBusqueda();
    let searchToSave = { description: searchDescription, criteria: filterValues };

    let alreadySaved = savedSearches.some(savedSearch => 
        JSON.stringify(savedSearch.criteria) === JSON.stringify(filterValues)
    );

    if (!alreadySaved) {
        savedSearches.push(searchToSave);
        updateSavedSearchesModal();
        if (confirm('¿Quieres guardar este filtro o búsqueda?')) {
            // Guarda la búsqueda
            showConfirmationMessage('El filtro o la búsqueda se ha guardado correctamente.');
        } else {
            // No hagas nada
        }
    } else {
        showAlertMessage('Este filtro o búsqueda ya está guardado.');
    }
}

// Función auxiliar para guardar una búsqueda
function saveSearch(searchTerm) {
    let searchCriteria = ['any', 'contains', searchTerm];
    let searchToSave = { description: `Búsqueda: "${searchTerm}"`, criteria: [searchCriteria] };

    if (!savedSearches.some(savedSearch => 
        JSON.stringify(savedSearch.criteria) === JSON.stringify([searchCriteria]))
    ) {
        savedSearches.push(searchToSave);
        updateSavedSearchesModal();
    }
}

// Eliminar una búsqueda guardada
function deleteSavedSearch(index) {
    savedSearches.splice(index, 1);
    updateSavedSearchesModal();
}

//Actualizar el modal de búsquedas guardadas
function updateSavedSearchesModal() {
    let list = document.getElementById('savedSearchList');
    let message = document.getElementById('noSavedSearchMessage');
    list.innerHTML = '';
    message.style.display = savedSearches.length === 0 ? 'block' : 'none';
    savedSearches.forEach((search, index) => {
        if (search && search.description && search.description.trim() !== '') { // Verifica si search, search.description existen y si la descripción no está vacía
            let listItem = createSearchListItem(search, index);
            list.appendChild(listItem);
        }
    });
}

// Crear un elemento de lista para una búsqueda guardada
function createSearchListItem(search, index) {
    let listItem = document.createElement('li');
    listItem.textContent = search.description;
    listItem.classList.add('saved-search-item'); 

    let deleteButton = createDeleteButton(index);
    listItem.appendChild(deleteButton);

    listItem.onclick = function() { selectSearch(search.criteria); };

    return listItem;
}

// Crear botón de eliminar para una búsqueda guardada
function createDeleteButton(index) {
    let deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-search-btn');
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.setAttribute('title', 'Eliminar la búsqueda de la lista');

    deleteButton.onclick = function(event) {
        event.stopPropagation();
        // Antes de eliminar una búsqueda
        if (confirm('¿Estás seguro de que quieres eliminar este filtro o búsqueda?')) {
            // Elimina la búsqueda
            deleteSavedSearch(index);
            showConfirmationMessage('El filtro o la búsqueda se ha eliminado correctamente.');
        } else {
            // No hagas nada
        }
    };
    return deleteButton;
}

//confirmar si se desea eliminar una búsqueda guardada
function confirmAndDeleteSearch(index, buttonElement) {
    let confirmDelete = confirm(`¿Está seguro de que desea eliminar esta búsqueda guardada?`);
    if (confirmDelete) {
        deleteSavedSearch(index);
        showConfirmationMessage('La búsqueda se ha eliminado correctamente.');
    }
}

// Seleccionar una búsqueda guardada desde el modal
function selectSearch(search) {
    if (search.criteria.length === 1 && search.criteria[0][0] === 'any') {
        // Búsqueda simple
        searchInput.value = search.criteria[0][2];
    } else {
        // Búsqueda avanzada
        // Establecer los valores en los filtros de búsqueda avanzada
        setAdvancedSearchValues(search.criteria);
        openModal('advancedSearchModal');
    }
    closeModal('savedSearchesModal');
    updateSearchDescription();
}


/* ---------------------------
   Búsqueda Avanzada y Filtros
   --------------------------- */

// Actualiza el modal de búsquedas avanzadas
function updateAdvancedSearchesModal() {
    let list = document.getElementById('advancedSavedSearchList');
    list.innerHTML = '';
    savedAdvancedSearches.forEach((search, index) => {
        let listItem = document.createElement('li');
        listItem.textContent = search.description;
        listItem.classList.add('saved-search-item');

        let deleteButton = createAdvancedDeleteButton(index); 
        listItem.appendChild(deleteButton);
        list.appendChild(listItem);
    });

    document.getElementById('noAdvancedSavedSearchMessage').style.display = savedSearches.length === 0 ? 'block' : 'none';
}

//Función para Establecer los Valores de la Búsqueda Avanzada
function setAdvancedSearchValues(values) {
    // Extraer los criterios de búsqueda avanzada
    let valuesSearch = search.criteria;

    // Limpiar los filtros existentes
    clearFilters();

    // Asegúrate de que hay suficientes filas de filtros
    while (document.querySelectorAll('#advancedSearchModal .filter-row').length < valuesSearch.length) {
        addFilter();
    }

    // Asignar los valores a las filas de filtros
    document.querySelectorAll('#advancedSearchModal .filter-row').forEach((row, index) => {
        let rowValues = valuesSearch[index];
        let inputs = row.querySelectorAll('select, input[type="text"]');
        inputs.forEach((input, inputIndex) => {
            input.value = rowValues[inputIndex];
        });
    });

    updateSearchDescription();
}

// Crea un botón de eliminar para una búsqueda avanzada
function createAdvancedDeleteButton(index) {
    let deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-search-btn');
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.setAttribute('title', 'Eliminar búsqueda avanzada');

    deleteButton.onclick = function(event) {
        event.stopPropagation();
        // Obtiene la descripción de la búsqueda avanzada
        let description = savedSearches[index].description;
        let confirmDelete = confirm(`¿Eliminar la búsqueda avanzada "${description}"?`);
        if (confirmDelete) {
            savedSearches.splice(index, 1); // Elimina usando el índice
            updateAdvancedSearchesModal();
            showConfirmationMessage('Búsqueda eliminada correctamente');
        }
    };
    return deleteButton;
}

// Añade un nuevo filtro en la búsqueda avanzada
function addFilter() {
    var filterRow = document.createElement('div');
    filterRow.classList.add('row');
    filterRow.innerHTML = `
    <select class="field-select" title="Selecciona un campo: ">
        <option value="any">Cualquier campo</option>
        <option value="title">Título</option>
        <option value="author">Autor</option>
        <option value="subject">Materia</option>
    </select>
    <select class="condition-select" title="Selecciona una condición: ">
        <option value="contains">contiene</option>
        <option value="is">es (exacto)</option>
        <option value="starts_with">empieza por</option>
    </select>
    <input type="text" placeholder="Introduzca un término de búsqueda" title="Introduzca un término de búsqueda">
    `;
    document.querySelector('.search-filters').insertBefore(filterRow, document.querySelector('.search-explanation'))
    addEventListenersToFilters(); // Añade event listeners a los nuevos elementos
    updateSearchDescription(); // Actualiza la descripción de la búsqueda

    // Cambia el estilo del select .logic-select anterior
    let previousLogicSelect = document.querySelector('.search-filters .row:last-child .logic-select');
    if (previousLogicSelect && previousLogicSelect.value !== '') {
        previousLogicSelect.classList.remove('logic-select');
    }
}
function clearFilters() {
    // Limpia el campo de búsqueda principal
    if (searchInput) {
        searchInput.value = '';
    }

    // Encuentra el contenedor de filtros
    let filterContainer = document.getElementById('filterContainer');

    // Limpia los inputs de texto
    let textInputs = filterContainer.querySelectorAll('input[type="text"]');
    textInputs.forEach(function(input) {
        input.value = '';
    });

    // Restablece los selects
    let selects = filterContainer.querySelectorAll('select');
    selects.forEach(function(select) {
        select.selectedIndex = 0;
        // Añade la clase 'logic-select' a los selects con la clase 'logicSelect'
        if (select.classList.contains('logicSelect')) {
            select.classList.add('logic-select');
        }
    });

    // Restablece el checkbox de disponibilidad
    if (availableOnlyCheckbox) {
        availableOnlyCheckbox.checked = false;
    }

    // Restablece los inputs de tipo fecha
    let dateInputs = filterContainer.querySelectorAll('input[type="date"]');
    dateInputs.forEach(function (input) {
        input.value = ''; // Esto restablecerá la fecha a un estado vacío
    });

    // Solo elimina las filas adicionales, dejando intacta la primera fila
    let additionalFilterRows = Array.from(filterContainer.querySelectorAll('.row'));
    additionalFilterRows.shift(); // Elimina la primera fila del array
    console.log("Filas adicionales a eliminar:", additionalFilterRows);
    additionalFilterRows.forEach(function (row) {
        row.remove();
    });

    // Limpia los resultados anteriores
    resultsList.innerHTML = '';

    updateSearchDescription(); // Actualiza la descripción de la búsqueda
}

// Función auxiliar para determinar si estamos en una pantalla grande
function isLargeScreen() {
    return window.innerWidth >= 768; // Considera 'grande' una pantalla de 768px o más
}

// Abre el modal de búsqueda avanzada y transfiere la búsqueda actual
// Modifica el Event Listener para el botón de búsqueda avanzada
advancedSearchBtn.addEventListener('click', function () {
    if (isLargeScreen()) {
        // En pantallas grandes, muestra el contenedor de filtros y resultados
        document.querySelector('.results-and-filters-container').style.display = 'flex';
        // Oculta el botón de búsqueda avanzada
        this.style.display = 'none';
        // Transfiere el valor actual del campo de búsqueda al primer input de los filtros
        transferCurrentSearchToFilter();
    } else {
        // En pantallas pequeñas, abre el modal de búsqueda avanzada
        //transferCurrentSearchToAdvancedModal();
        openModal('advancedSearchModal');
    }
});

// Transfiere el valor de la búsqueda actual al modal de búsqueda avanzada
function transferCurrentSearchToAdvancedModal() {
    // Obtén el valor actual del campo de búsqueda
    let currentSearchValue = searchInput.value;

    // Encuentra el primer input de texto en el modal de búsqueda avanzada
    let advancedSearchInput = document.querySelector('#advancedSearchModal .filter-row input[type="text"]');

    // Si existe el input en el modal, transfiera el valor actual del campo de búsqueda
    if (advancedSearchInput) {
        advancedSearchInput.value = currentSearchValue;
        updateSearchDescription(); // Actualiza la descripción después de transferir el valor
    }
}

// Función para transferir el valor de la búsqueda actual al primer input de los filtros
function transferCurrentSearchToFilter() {
    let currentSearchValue = searchInput.value;
    // Selecciona el primer input de texto dentro del div .row en .search-filters
    let filterInput = document.querySelector('.search-filters .row input[type="text"]');
    if (filterInput) {
        filterInput.value = currentSearchValue;
    }
    updateSearchDescription();
}

function updateSearchDescription() {
    let description = 'Búsqueda: ';
    let filterRows = document.querySelectorAll('.search-filters .row');
    let descriptions = [];

    filterRows.forEach(function(filter) {
        let elements = filter.querySelectorAll('.field-select, .condition-select, input[type="text"], .logicSelect');
        let rowDescription = [];

        elements.forEach(function(element, index) {
            // Ignorar el select .logic-select si está en su valor por defecto
            if (element.classList.contains('logicSelect') && element.selectedIndex === 0) {
                return; 
            }

            if (element.tagName === 'SELECT') {
                let selectedText = element.options[element.selectedIndex].text;
                rowDescription.push(index > 0 && index < elements.length - 1 ? selectedText.toLowerCase() : selectedText);
            } else if (element.tagName === 'INPUT') {
                let term = element.value.trim();
                rowDescription.push(term !== '' ? `"<strong>${term}</strong>"` : '"<strong>cualquier valor</strong>"');
            }
        });

        if (rowDescription.length > 0) {
            descriptions.push(rowDescription.join(' '));
        }
    });

    description += descriptions.join('  ');
    searchDescription.innerHTML = description;
}

// Añade event listeners a los filtros y los inputs para actualizar la descripción en tiempo real
function addEventListenersToFilters() {
    document.querySelectorAll('.search-filters .row select, .search-filters .row input[type="text"]').forEach(function(element) {
        element.addEventListener('change', function() {
            updateSearchDescription();
            // Si el elemento es un .logic-select y su valor no es el por defecto, añadir un nuevo filtro
            if (element.classList.contains('logic-select') && element.value !== '+ LíNEA') {
                this.classList.remove('logic-select');
                addFilter();
            }
        });
        element.addEventListener('keyup', updateSearchDescription);
    });
}

// Mostrar u ocultar botón de filtros en dispositivos móviles
function toggleFiltersButton() {
    const showFiltersBtn = document.getElementById("showFiltersBtn");
    if (window.innerWidth < 768) {
        showFiltersBtn.style.display = "block";
    } else {
        showFiltersBtn.style.display = "none";
    }
}

/* --------------------
    APLICAR FILTROS
    -------------------- */

function cumpleCriteriosAvanzados(recurso, criterios) {
    return criterios.every(criterio => {
        // Obtiene el valor del recurso directamente usando el campo del criterio
        const valorRecurso = recurso[criterio.campo];

        // Si el campo no existe en el recurso, retorna false
        if (valorRecurso === undefined) return false;

        // Verifica la condición para el valor del recurso
        return verificaCondicion(valorRecurso, criterio.condicion, criterio.termino);
    });
}

function verificaCondicion(valorCampo, condicion, termino) {
    switch (condicion) {
        case 'contains':
            return valorCampo.toLowerCase().includes(termino.toLowerCase());
        case 'is':
            return valorCampo.toLowerCase() === termino.toLowerCase();
        case 'starts_with':
            return valorCampo.toLowerCase().startsWith(termino.toLowerCase());
        default:
            return false;
    }
}

function ordenarResultados(resultados, orden) {
    const resultadosOrdenados = resultados.sort((a, b) => {
        if (a[orden] < b[orden]) {
            return -1;
        }
        if (a[orden] > b[orden]) {
            return 1;
        }
        return 0;
    });

    console.log("Resultados después de ordenar:", resultadosOrdenados);
    return resultadosOrdenados;
}

async function aplicarFiltro() {
    try {
        // Si los recursos aún no se han cargado, cárgalos.
        if (datosRecursos.length === 0) {
            await cargarRecursos();
        }

        // Utiliza 'datosRecursos' en lugar de cargar los recursos nuevamente.
        console.log("Utilizando datosRecursos en aplicarFiltro:", datosRecursos);

        // Recolectar criterios de búsqueda
        const criterios = getCriteriosDeBusqueda();
        console.log("Criterios de búsqueda recolectados en aplicarFiltro:", criterios);

        // Verifica si hay algún criterio no válido
        criterios.forEach(criterio => {
            if (typeof criterio.termino !== 'string' && typeof criterio.termino !== 'boolean') {
                console.error("Error: término de criterio no es una cadena ni un booleano:", criterio);
            }
        });

        // Filtrar recursos
        let resultados = buscarConCriterios(datosRecursos, criterios);
        console.log("Resultados después de aplicar criterios:", resultados);

        // Ordenar resultados si se ha especificado
        const orden = orderBy.value;
        if (orden) {
            resultados = ordenarResultados(resultados, orden);
            console.log("Resultados después de ordenar:", resultados);
        }

        // Mostrar resultados
        displayResults('', resultados); 
    } catch (error) {
        console.error("Error al aplicar el filtro:", error);
    }
}

function getCriteriosDeBusqueda() {
    let criterios = [];
    let rows = document.querySelectorAll('.search-filters .row');

    // Recolecta el valor del filtro de localización y mapea a los valores del JSON
    let localizacionSeleccionada = document.getElementById('locationFilter').value;
    const mapeoLocalizacion = {
        'en_linea': 'En linea',
        'en_biblioteca': 'En biblioteca'
    };

    if (localizacionSeleccionada && localizacionSeleccionada !== 'any') {
        let terminoLocalizacion = mapeoLocalizacion[localizacionSeleccionada] || localizacionSeleccionada;
        criterios.push({ campo: 'localizacion', condicion: 'is', termino: terminoLocalizacion });
    }

    // Recolecta el valor del filtro de catálogo, localización, y otros filtros adicionales
    let catalogoSeleccionado = selectCatalog.value;
    let formatoSeleccionado = document.getElementById('format').value;
    let materiaSeleccionada = document.getElementById('subject').value;
    let autorSeleccionado = document.getElementById('author').value;
    let editorialSeleccionada = document.getElementById('publisher').value;
    let idiomaSeleccionado = document.getElementById('language').value;

    agregarCriterioSiDiferente(criterios, catalogoSeleccionado, 'catalogo', 'Todos los catálogos');
    agregarCriterioSiDiferente(criterios, formatoSeleccionado, 'formato_recurso', 'Todos los formatos');
    agregarCriterioSiDiferente(criterios, materiaSeleccionada, 'materia', 'Todas las materias');
    agregarCriterioSiDiferente(criterios, autorSeleccionado, 'autor', 'Todos los autores');
    agregarCriterioSiDiferente(criterios, editorialSeleccionada, 'editorial', 'Todas las editoriales');
    agregarCriterioSiDiferente(criterios, idiomaSeleccionado, 'idioma', 'Todos los idiomas');


    // Recolecta los criterios de búsqueda de cada fila de filtros
    rows.forEach(row => {
        let campo = row.querySelector('.field-select').value;
        let condicion = row.querySelector('.condition-select').value;
        let termino = row.querySelector('input[type="text"]').value.trim();
        let operadorLogicoElement = row.querySelector('.logicSelect');
        let operadorLogico = operadorLogicoElement && operadorLogicoElement.value !== '+ LíNEA' ? operadorLogicoElement.value : null;

        // Mapeo de los campos a las claves del objeto recurso
        const mapeoCampo = {
            'title': 'titulo',
            'author': 'autor',
            'subject': 'materia',
            'any': 'any' // Agregar 'any' para manejar el caso 'Cualquier campo'
        };

        let campoMapeado = mapeoCampo[campo] || campo;

        if (termino) {
            let criterio = { campo: campoMapeado, condicion, termino };
            if (operadorLogico) {
                criterio.operadorLogico = operadorLogico;
            }
            criterios.push(criterio);
        }
    });

    // Añadir criterio de disponibilidad si el checkbox está marcado
    if (availableOnlyCheckbox.checked) {
        criterios.push({ campo: 'disponibilidad', condicion: 'is', termino: true }); // Usa el valor booleano true aquí
    }

    console.log("Criterios de búsqueda recolectados:", criterios);
    return criterios;
}

function agregarCriterioSiDiferente(criterios, valor, campo, textoPorDefecto, condicion = 'is') {
    if (valor && valor !== textoPorDefecto) {
        criterios.push({ campo, condicion, termino: valor });
    }
}


function buscarConCriterios(recursos, criterios) {
    return recursos.filter(recurso => {
        let cumple = false; // Inicialmente, suponemos que no cumple con los criterios

        for (let i = 0; i < criterios.length; i++) {
            const criterioActual = criterios[i];
            const cumpleCriterioActual = verificaCondicionRecurso(recurso, criterioActual);

            if (i === 0) {
                // Para el primer criterio, simplemente asignamos el valor
                cumple = cumpleCriterioActual;
            } else {
                // Para los criterios siguientes, aplicamos el operador lógico
                const operadorLogicoAnterior = criterios[i - 1].operadorLogico;

                switch (operadorLogicoAnterior) {
                    case "or":
                        cumple = cumple || cumpleCriterioActual;
                        break;
                    case "and":
                        cumple = cumple && cumpleCriterioActual;
                        break;
                    case "not":
                        cumple = cumple && !cumpleCriterioActual;
                        break;
                    default:
                        // Si el operador lógico no está definido o no es válido, se asume "y"
                        cumple = cumple && cumpleCriterioActual;
                }
            }
        }

        return cumple;
    });
}

function verificaCondicionRecurso(recurso, criterio) {
    if (criterio.campo === 'any') {
        const camposParaBuscar = ['titulo', 'autor', 'materia'];
        return camposParaBuscar.some(clave => verificaCondicion(recurso[clave], criterio.condicion, criterio.termino));
    } else {
        return verificaCondicion(recurso[criterio.campo], criterio.condicion, criterio.termino);
    }
}

function verificaCondicion(valorCampo, condicion, termino) {
    // Si estamos tratando con un valor booleano, compáralo directamente
    if (typeof valorCampo === "boolean") {
        return condicion === 'is' && valorCampo === termino;
    }

    // Si es una cadena, convertirla a minúsculas para la comparación
    if (typeof valorCampo === "string") {
        switch (condicion) {
            case 'contains':
                return valorCampo.toLowerCase().includes(termino.toLowerCase());
            case 'is':
                return valorCampo.toLowerCase() === termino.toLowerCase();
            case 'starts_with':
                return valorCampo.toLowerCase().startsWith(termino.toLowerCase());
            default:
                return false;
        }
    }

    return false;
}

function ordenarResultados(resultados, orden) {
    return resultados.sort((a, b) => {
        let valorA = a[orden];
        let valorB = b[orden];

        // Verificar si estamos tratando con fechas
        if (orden === 'fecha_publicacion') {
            // Asumiendo que las fechas están en formato de cadena YYYY-MM-DD
            // Convertir a objetos Date para comparar
            valorA = new Date(valorA);
            valorB = new Date(valorB);
        } else {
            // Convertir a minúsculas si es una cadena
            valorA = typeof valorA === 'string' ? valorA.toLowerCase() : valorA;
            valorB = typeof valorB === 'string' ? valorB.toLowerCase() : valorB;
        }

        if (valorA < valorB) {
            return -1;
        }
        if (valorA > valorB) {
            return 1;
        }
        return 0;
    });
}

/* ---------
   Mensajes
   --------- */

// Función para mostrar un mensaje de alerta
function showAlertMessage(message) {
    let alertDiv = document.getElementById('alertMessage');
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 3000); // Oculta el mensaje después de 3 segundos
}

function showConfirmationMessage(message) {
    let confirmationDiv = document.getElementById('confirmationMessage');
    confirmationDiv.textContent = message;
    confirmationDiv.style.display = 'block';
    setTimeout(() => {
        confirmationDiv.style.display = 'none';
    }, 3000); // Oculta el mensaje después de 3 segundos
}

/* --------------------
   Inicialización
   -------------------- */

// Inicializa los event listeners en los filtros e inputs existentes
addEventListenersToFilters();

// Inicializa la descripción de la búsqueda
updateSearchDescription();

// Escuchar cambios de tamaño de pantalla para mostrar/ocultar botón de filtros
window.addEventListener("resize", toggleFiltersButton);
toggleFiltersButton(); // Llamar a la función al cargar la página