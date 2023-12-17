// Variables globales
let savedSearches = []; //busquedas guardadas
let currentSearch = []; //búsqueda actual
//let savedAdvancedSearches = []; // Búsquedas avanzadas guardadas
const RESULTADOS_POR_PAGINA = 4; // Define la cantidad de resultados por página
let paginaActual = 1; // Define la página actual
let resultadosFiltrados = []; // de momento la mantenemos vacía por si la necesitamos más adelante


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
        procesarDatos(datos.recursos); // Procesar los datos para llenar los selectores
        console.log("Datos cargados:", datos.recursos); // Verifica los datos cargados
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

// Función para manejar la solicitud de búsqueda
function handleSearchRequest() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    console.log("Término de busqueda: " + searchTerm); // Verifica el término de búsqueda
    //verifica si el término de búsqueda es válido
    if (searchTerm) {
        displayResults(searchTerm); // Búsqueda normal
    } else {
        showAlertMessage('Por favor, ingrese un término de búsqueda o use la búsqueda avanzada.');
    }
}

// Función para validar el término de búsqueda
function isValidSearchTerm(searchTerm) {
    return searchTerm !== '';
}

/* -----------------------------
   Visualización de resultadoss
   ----------------------------- */

// Función para mostrar los resultados de búsqueda
async function displayResults(searchTerm = '', criteriosBusquedaAvanzada = []) {
    const recursos = await cargarRecursos();
    const terminoBusqueda = searchTerm.toLowerCase();

    // Aplica la búsqueda avanzada si hay criterios, de lo contrario aplica la búsqueda normal
    resultadosFiltrados = recursos.filter(recurso => {
        return criteriosBusquedaAvanzada.length > 0
            ? cumpleCriteriosAvanzados(recurso, criteriosBusquedaAvanzada)
            : recurso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
              recurso.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
              recurso.materia.toLowerCase().includes(searchTerm.toLowerCase());
    });
    // Llama a paginarResultados aquí
    paginarResultados(resultadosFiltrados);

    // Muestra el contenedor de resultados y filtros
    document.querySelector('.results-and-filters-container').style.display = 'flex';

    // Oculta el botón de búsqueda avanzada en pantallas grandes
    if (isLargeScreen()) {
        document.getElementById('advancedSearchBtn').style.display = 'none';
    }
}

//resultados filtrados y los divide en páginas:
function paginarResultados(resultados) {
    const numeroDePaginas = Math.ceil(resultados.length / RESULTADOS_POR_PAGINA);
    mostrarPagina(resultados, paginaActual);
    mostrarControlesPaginacion(numeroDePaginas);
}

//muestra las páginas:
function mostrarPagina(resultados, numeroPagina) {
    const inicio = (numeroPagina - 1) * RESULTADOS_POR_PAGINA;
    const fin = inicio + RESULTADOS_POR_PAGINA;
    const resultadosPagina = resultados.slice(inicio, fin);

    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = ''; // Limpiar resultados anteriores

    if (resultadosPagina.length > 0) {
        resultadosPagina.forEach(recurso => {
            resultsList.appendChild(crearElementoLista(recurso));
        });
    } else {
        // Si no hay resultados, muestra un mensaje
        const busqueda = document.getElementById('searchInput').value.trim()
        const noResultsMessage = document.createElement('li');
        noResultsMessage.textContent = `No se encontraron resultados para "${busqueda}".`;
        resultsList.appendChild(noResultsMessage);
    }
}

// Crear los elementos de la lista de resultados
function crearElementoLista(recurso) {
    const resultItem = document.createElement("li");
    resultItem.className = "search-result-item";
    resultItem.innerHTML = `
        <div class="result-cover"><img src="${recurso.portada}" alt="Portada"></div>
        <div class="result-info">
            <div class="result-actions">
                <button class="action-btn" title="Copiar"><i class="fas fa-copy"></i></button>
                <button class="action-btn" title="Enviar correo"><i class="fas fa-envelope"></i></button>
                <button class="action-btn" title="Guardar"><i class="fas fa-save"></i></button>
                <button class="action-btn" title="Más opciones"><i class="fas fa-ellipsis-h"></i></button>
            </div>
            <div class="result-format">${recurso.formato_recurso}</div>
            <div class="result-title">${recurso.titulo}</div>
            <div class="result-author">${recurso.autor} - ${recurso.editorial}, ${recurso.fecha_publicacion}</div>
            <div class="result-availability">${recurso.disponibilidad ? '<i class="fas fa-check"></i> Disponible' : '<i class="fas fa-times"></i> No Disponible'}</div>
        </div>`;
    return resultItem;
}

//Mostrar controles de pagina
function mostrarControlesPaginacion(numeroDePaginas) {
    const contenedorPaginacion = document.getElementById('paginacion');
    contenedorPaginacion.innerHTML = ''; // Limpiar la paginación anterior

    for (let i = 1; i <= numeroDePaginas; i++) {
        const botonPagina = document.createElement('button');
        botonPagina.textContent = i;
        botonPagina.classList.add('boton-pagina');

        // Resaltar el botón de la página actual
        if (i === paginaActual) {
            botonPagina.classList.add('pagina-actual');
        }

        // Agregar un event listener para cambiar la página al hacer clic
        botonPagina.addEventListener('click', function() {
            paginaActual = i;
            mostrarPagina(resultadosFiltrados, i); 
            mostrarControlesPaginacion(numeroDePaginas);
        });

        contenedorPaginacion.appendChild(botonPagina);
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

// Abre el modal de búsquedas guardadas
document.getElementById('savedSearchesBtn').addEventListener('click', function () {
    openModal('savedSearchesModal');
});

// Abre el modal de información
document.getElementById('infoBtn').addEventListener('click', function () {
    openModal('infoModal');
});

// Cierra el modal cuando se hace clic en el botón de cierre
Array.from(document.getElementsByClassName('close-btn')).forEach(button => {
    button.addEventListener('click', function () {
        closeModal(this.closest('.modal').id);
    });
});

// Event listener para el botón de guardar búsqueda
document.getElementById('saveSearchButton').addEventListener('click', function() {
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

// Event listener para el boton de busqueda avanzada guardadas
document.getElementById('savedSearchesAdvancedBtn').addEventListener('click', function() {
    updateAdvancedSearchesModal();
    openModal('advancedSearchesModal'); // Usa la función openModal para mostrar el modal
});

// Cierra el modal si se hace clic fuera de su contenido
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
}

// Event listener para el botón de limpiar filtros
document.getElementById('clearFilters').addEventListener('click', function() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los filtros?')) {
        clearFilters();
    }
});

// Event listener para el botón de búsqueda
document.getElementById("searchBtn").addEventListener("click", handleSearchRequest);

// Event listener para el campo de búsqueda
document.getElementById('searchInput').addEventListener('input', function() {
    let searchValue = this.value;

    // Transfiere el valor actual del campo de búsqueda al primer input de los filtros
    transferCurrentSearchToFilter();

    // // Oculta el contenedor de resultados y filtros si el campo de búsqueda cambia
    // document.querySelector('.results-and-filters-container').style.display = 'none';
    // // Muestra el botón de búsqueda avanzada en pantallas grandes
    // if (isLargeScreen()) {
    //     document.getElementById('advancedSearchBtn').style.display = 'inline-block';
    // }
});

// Event listener para el botón de búsqueda avanzada
document.getElementById('performSearch').addEventListener('click', handleSearchRequest);

document.getElementById('applyFilterButton').addEventListener('click', aplicarFiltro);


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
    let searchDescription = document.getElementById('searchDescription').innerText;
    let filterValues = getCriteriosBusquedaAvanzada();
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
        document.getElementById('searchInput').value = search.criteria[0][2];
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
        let searchDescription = savedSearches[index].description;
        let confirmDelete = confirm(`¿Eliminar la búsqueda avanzada "${searchDescription}"?`);
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

// Limpia todos los filtros dentro del contenedor 'filter-container'
function clearFilters() {
    // Encuentra el contenedor de filtros
    let filterContainer = document.getElementById('filter-container');

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

    // Restablece los inputs de tipo fecha
    let dateInputs = filterContainer.querySelectorAll('input[type="date"]');
    dateInputs.forEach(function(input) {
        input.value = ''; // Esto restablecerá la fecha a un estado vacío
    });

    // Si hay otras filas de filtros adicionales, remuévelas
    let additionalFilterRows = filterContainer.querySelectorAll('.filter-row:not(:first-child)');
    additionalFilterRows.forEach(function(row) {
        row.remove();
    });

    updateSearchDescription(); // Actualiza la descripción de la búsqueda
}

// Función auxiliar para determinar si estamos en una pantalla grande
function isLargeScreen() {
    return window.innerWidth >= 768; // Considera 'grande' una pantalla de 768px o más
}

// Abre el modal de búsqueda avanzada y transfiere la búsqueda actual
// Modifica el Event Listener para el botón de búsqueda avanzada
document.getElementById('advancedSearchBtn').addEventListener('click', function () {
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
    let currentSearchValue = document.getElementById('searchInput').value;

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
    let currentSearchValue = document.getElementById('searchInput').value;
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
    document.getElementById('searchDescription').innerHTML = description;
}

// Añade event listeners a los filtros y los inputs para actualizar la descripción en tiempo real
function addEventListenersToFilters() {
    document.querySelectorAll('.search-filters .row select, .search-filters .row input[type="text"]').forEach(function(element) {
        element.addEventListener('change', function() {
            updateSearchDescription();
            // Si el elemento es un .logic-select y su valor no es el por defecto, añadir un nuevo filtro
            if (element.classList.contains('logic-select') && element.value !== '') {
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

function getCriteriosBusquedaAvanzada() {
    let criterios = [];
    let searchTerm = document.getElementById('searchInput').value.trim();

    if (searchTerm) {
        criterios.push({ campo: 'searchTerm', condicion: 'contains', termino: searchTerm });
    }

    document.querySelectorAll('.search-filters .row').forEach(row => {
        let campo = row.querySelector('.field-select').value;
        let condicion = row.querySelector('.condition-select').value;
        let termino = row.querySelector('input[type="text"]').value.trim();

        if (termino) {
            criterios.push({ campo, condicion, termino });
        }
    });

    return criterios;
}

function cumpleCriteriosAvanzados(recurso, criterios) {
    return criterios.every(criterio => {
        // Usando un objeto para mapear campos a propiedades del recurso
        const campoAMapeo = {
            'title': recurso.titulo,
            'author': recurso.autor,
            'subject': recurso.materia
            // Agrega más mapeos si son necesarios
        };

        // Obtiene el valor del recurso basado en el mapeo
        const valorRecurso = campoAMapeo[criterio.campo];

        // Si no hay un mapeo para el campo, retorna false
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

function buscarConCriterios(recursos, criterios) {
    const resultadosFiltrados = recursos.filter(recurso => {
        return criterios.every(criterio => {
            const valor = recurso[criterio.campo]; // asumiendo que el campo coincide con la clave del objeto
            const termino = criterio.termino.toLowerCase();

            switch (criterio.condicion) {
                case 'contains':
                    return valor.toLowerCase().includes(termino);
                case 'is':
                    return valor.toLowerCase() === termino;
                case 'starts_with':
                    return valor.toLowerCase().startsWith(termino);
                default:
                    return true;
            }
        });
    });

    console.log("Resultados después de aplicar criterios de búsqueda:", resultadosFiltrados);
    return resultadosFiltrados;
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
        // Espera a que los recursos se carguen.
        const todosLosRecursos = await cargarRecursos();

        // Recolectar criterios de búsqueda
        const criterios = getCriteriosDeBusqueda();
        const orden = document.getElementById('orderBy').value;

        // Filtrar recursos
        let resultados = buscarConCriterios(todosLosRecursos, criterios);

        // Ordenar resultados si se ha especificado
        if (orden) {
            resultados = ordenarResultados(resultados, orden);
        }

        console.log("Resultados a mostrar después de ordenar (si aplica):", resultados);

        // Mostrar resultados
        displayResults('', resultados); 
    } catch (error) {
        console.error("Error al aplicar el filtro:", error);
    }
}

function getCriteriosDeBusqueda() {
    let criterios = [];
    document.querySelectorAll('#filter-container .filter-row').forEach(row => {
        let campo = row.querySelector('.field-select').value;
        let condicion = row.querySelector('.condition-select').value;
        let termino = row.querySelector('input[type="text"]').value.trim();

        if (termino) {
            criterios.push({ campo, condicion, termino });
        }
    });

    console.log("Criterios de búsqueda recolectados:", criterios);
    return criterios;
}

function buscarConCriterios(recursos, criterios) {
    return recursos.filter(recurso => {
        return criterios.every(criterio => {
            const valor = recurso[criterio.campo]; // Asumiendo que el campo coincide con la clave del objeto
            const termino = criterio.termino.toLowerCase();

            switch (criterio.condicion) {
                case 'contains':
                    return valor.toLowerCase().includes(termino);
                case 'is':
                    return valor.toLowerCase() === termino;
                case 'starts_with':
                    return valor.toLowerCase().startsWith(termino);
                default:
                    return true;
            }
        });
    });
}

function ordenarResultados(resultados, orden) {
    return resultados.sort((a, b) => {
        let valorA = a[orden].toLowerCase();
        let valorB = b[orden].toLowerCase();
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