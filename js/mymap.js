//const urlGeoserver = 'http://00ed66ff-9d44-4cb1-83a7-6dd80b766787.clouding.host:8070/geoserver/wms';
const urlGeoserver = 'http://localhost:8080/geoserver/wms';

// Asignar layerData según el módulo
let layerData = 'gmx:municipios2024';
let styleData = 'municipios_provincias';
let centerData = [21.6218, -81.5012];
let zoomData = 13;

var map = L.map('map', {
    center: centerData,
    zoom: zoomData,
    attributionControl: false
});
var baseLayers = {};
var overLayers = {};
// Usa una capa base compatible con EPSG:4326

baseLayers['OSM'] = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    continuousWorld: true,
    noWrap: true,
    crs: L.CRS.EPSG4326,
    maxZoom: 20,
    zIndex: 1
}).addTo(map);

baseLayers ["Satélite"] = L.tileLayer('https://khms1.google.com/kh/v=1004&src=app&x={x}&y={y}&z={z}',{
	maxZoom: 19
});	
	

map.zoomControl.setPosition('bottomright');

 

var cluster = L.markerClusterGroup({
    maxClusterRadius: 50, // Radio máximo para formar clústeres (en píxeles)
    disableClusteringAtZoom: 14 // Nivel de zoom en el que no se agrupan
});
createMarkers();
map.addLayer(cluster);

overLayers['Puntos de interés'] = cluster;

/*let wmsDataLayer = L.tileLayer.wms(urlGeoserver, {
    layers: layerData,
    styles: styleData,
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
    crs: L.CRS.EPSG4326,
    zIndex: 4
});

// Agregar la capa WMS al mapa
map.addLayer(wmsDataLayer);

overLayers['Municipios'] = wmsDataLayer;

// Crear control de leyenda para la capa WMS
const mapLegend = new MapLegend({
    serverUrl: urlGeoserver,
    layer: layerData,
    style: styleData
});

// Función para actualizar la leyenda cuando cambie la capa
function updateLegend(layerName) {
    if (mapLegend) {
        mapLegend.setLayer(layerName);
    }
}
*/

async function loadSubcategoryIconMap(subcategoryId) {
    const url = `http://localhost/api/subcategories/${subcategoryId}`;
    try {
        const result = await $.getJSON(url);
        const hash = result?.map_icon_rel?.hash;
        if (hash) return hash;
    } catch (error) {
        console.error('Error cargando icono de subcategoría', error);
    }
    return 'imagen-no-disponible.jpg';
}

// Panel lateral derecho para mostrar detalles
let infoPanel;
let infoPanelContent;

function ensureInfoPanel() {
    if (infoPanel) return infoPanel;

    infoPanel = document.createElement('div');
    infoPanel.id = 'info-panel';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'info-panel-close';

    // Icono de cierre con Font Awesome
    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-times';
    closeBtn.appendChild(closeIcon);
    closeBtn.onclick = closeInfoPanel;

    infoPanelContent = document.createElement('div');
    infoPanelContent.id = 'info-panel-content';

    infoPanel.appendChild(closeBtn);
    infoPanel.appendChild(infoPanelContent);
    document.body.appendChild(infoPanel);

    return infoPanel;
}

async function openInfoPanel(markerID) {
    ensureInfoPanel();

    infoPanelContent.innerHTML = '<div class="panel-loading">Cargando...</div>';
    infoPanel.style.display = 'block'; // control de visibilidad únicamente

    try {
        const data = await $.getJSON(`/api/points/${markerID}`);
        const subdata = await $.getJSON(`/api/subcategories/${data.subcategory_id}`); 

        const name = data?.name?.es || 'Sin nombre';
        const description = data?.description?.es || '';
        const subcategory = subdata?.name.es || '';
        const addressLine = data?.address?.es || '';
        const entity = data?.entidad?.es || data?.entity || '';
        const contactPhone = data?.phones || '';
        const contactEmail = data?.emails || '';
        const contactWeb = data?.urls || '';

        /*function quickParse(description) {
            return description
                // Decodificar
                .replace(/\\u003C/g, '<')
                .replace(/\\u003E/g, '>')
                // Separar por divs
                .split(/<div>|<\/div>/)
                // Limpiar espacios y filtrar vacíos
                .map(item => item.trim())
                .filter(item => item !== '');
        }
        const items = quickParse(description);    
        const descriptionHTML = items.length
            ? items.map(src => `
                ${src}
                `).join('<br>')
            : description;    */

        const phoneHTML = contactPhone.length
            ? contactPhone.map(src => `
                <a href="tel:${src.replace(/\s/g, '')}" class="icon-text web-link">${src}</a>
                `).join('')
            : '';

        const emailHTML = contactEmail.length
            ? contactEmail.map(src => `
                <a href="mailto:${src}" class="icon-text web-link">${src}</a>
                `).join('')
            : '';            

        const mainImage = (data?.media && data.media[0]) || 'imagen-no-disponible.jpg';
        const gallery = (data?.files && data.files.length ? data.files : (data?.files || []));

        

        const galleryHTML = gallery.length
            ? gallery.map(src => `
                <div class="panel-gallery-item">
                    <img src="/api/${src.hash}" alt="${src.alt?.es || 'Foto'}" onclick="window.open('/api/${src.hash}', '_blank')" />
                </div>`).join('')
            : '<div class="panel-gallery-empty">Sin fotos disponibles</div>';

        const infoHTML = `
            <div class="panel-block panel-main">
                <div class="panel-main-image">
                    <img src="/api/${mainImage}" alt="${name}">
                </div>
            </div>

            <div class="panel-block panel-info">
                <div class="panel-info-row"><span class="text-name" >${name}</span></div>
                <div class="panel-info-row"><span class="text-subcategory" >${subcategory}</span></div>
                <div class="panel-info-row">
                    <span class="normal-text">
                        ${description}
                    </span>
                </div>
				<hr style="margin: 8px; border: 0; border-top: 1px solid #ccc;"> 
				${entity != '' ? 
					`<div class="panel-info-row">
						<div class="subcategory-content">
							<img src="./js/images/entidad.png" alt="Entidad" class="icon">
							<span class="icon-text">${entity}</span>
						</div>                
					</div>` 
					: ''
				}				
				${addressLine != '' ? 	
					`<div class="panel-info-row">
						<div class="subcategory-content">
							<img src="./js/images/place.png" alt="Dirección" class="icon">
							<span class="icon-text">${addressLine}</span>
						</div>                
					</div>`
					: ''
				}
                ${contactPhone.length ? 
                    `<div class="panel-info-row">
                        <div class="subcategory-content">
                            <img src="./js/images/phones.png" alt="Teléfonos" class="icon">
                            <div class="links-column">
                                ${phoneHTML}
                            </div>
                       </div>
                    </div>` 
                    : ''
                }                    
                ${contactEmail.length ? 
                    `<div class="panel-info-row">
                        <div class="subcategory-content">
                            <img src="./js/images/emails.png" alt="Email" class="icon">
                            <div class="links-column">
                                ${emailHTML}
                            </div>
                        </div>
                    </div>` 
                    : ''
                }         
                ${contactWeb.length ? 
                    `<div class="panel-info-row">
                        <div class="subcategory-content">
                            <img src="./js/images/urls.png" alt="Web" class="icon">
                            <a href="${contactWeb}" 
                                class="icon-text web-link" 
                                target="_blank" 
                                rel="noopener noreferrer">
                                ${contactWeb}
                            </a>
                        </div>
                    </div>   ` 
                    : ''
                }                        
            </div>

            <div class="panel-block panel-gallery">
                <div class="panel-gallery-header">
                    <span class="text-name">Galería</span>
                </div>
                <div class="panel-gallery-items">
                    ${galleryHTML}
                </div>
            </div>
        `;

        infoPanelContent.innerHTML = infoHTML;
    } catch (error) {
        console.error('Error cargando detalle del marcador', error);
        infoPanelContent.innerHTML = '<div class="panel-error">No se pudo cargar la información.</div>';
    }
}

function closeInfoPanel() {
    if (infoPanel) {
        infoPanel.style.display = 'none';
    }
}

function getPopupContent(data){
    let popupContent = `<p><center><span class="text-subcategory">${data.name.es}</span></center></p>`;
    // Construye el contenido del popup con los datos del vehículo
    let imagen = data.media[0] ? data.media[0] : 'Sin imagen';
    if (data.media[0]) {
        popupContent += `<img src="/api/${data.media[0]}"  width="250"  alt="Imagen no disponible">`;
    }
    popupContent += `<a href="#" onclick="openInfoPanel(${data.id}); return false;">`;
    popupContent += `<p>Clic para más información</p></a>`;

    return popupContent;
}  

function createMarkers(){
    $.getJSON(`http://localhost/api/points?bbox=-81.62388715,21.58320191,-81.35649683,21.70624878`, function(result) {					
        if (result.length > 0){
            let index = 0;
            let chunkSize = 20;

            async function processChunk() {
                const endIndex = Math.min(index + chunkSize, result.length);
                const chunk = result.slice(index, endIndex);
                const iconNames = await Promise.all(
                    chunk.map(data => loadSubcategoryIconMap(data.subcategory_id))
                );
                chunk.forEach((data, idx) =>  {
                    const iconName = iconNames[idx];
                        
                    var subcatIcon = L.icon({
                        iconUrl: `/api/${iconName}`,
                        iconSize: [28, 28]
                    });

                    var marker = L.marker([data.location.lat, data.location.lng], {
                        icon: subcatIcon,
                        draggable: false
                    })
                    .bindPopup(getPopupContent(data), {
                        closeButton: false,
                        autoClose: true,  // IMPORTANTE: evitar cierre automático
                        closeOnClick: false,  // No cerrar al hacer click
                        offset: L.point(0, -10) 
                    });

                    // Abrir panel lateral con scroll al hacer click
                    marker.on('click', function(e) {
                        openInfoPanel(data.id);
                    });

                    // Eventos mouseover/mouseout
                    marker.on('mouseover', function(e) {
                        this.openPopup();
                    });
                    
                    marker.on('mouseout', function(e) {
                        // Solo cerrar si no estamos sobre el popup
                        setTimeout(() => {
                            if (!this._popup._container.matches(':hover')) {
                                this.closePopup();
                            }
                        }, 100);
                    });
                    
                    // Mantener popup abierto si el mouse está sobre él
                    marker.on('popupopen', function(e) {
                        var popup = this.getPopup();
                        popup.getElement().addEventListener('mouseover', function() {
                            clearTimeout(marker._popupTimeout);
                        });
                        popup.getElement().addEventListener('mouseout', function() {
                            marker._popupTimeout = setTimeout(function() {
                                marker.closePopup();
                            }, 300);
                        });
                    });

                    cluster.addLayer(marker);
                });
        
                index = endIndex;
        
                if (index < result.length) {
                    // Programar el próximo chunk
                    setTimeout(processChunk, 0);
                } 
            }
            processChunk();
        } else {
            notifyMessage('danger', 'Error al cargar los datos');
        } 
    }); 

}

/*function formatPropertyName(propertyName) {
    const propertyNameMap = {
        'nombre': 'Municipio',
        'codigo': 'Código',
        'poblacion': 'Población',
        'urbana': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Urbana',
        'rural': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Rural',        
        'masculinid': 'Masculinidad',
        'masc_urb': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Urbano',
        'masc_rur': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Rural',
        'distribuci': 'Distribución (%)',
        'defu_inf': 'Defunciones infantiles',
        'mort_inf': 'Mortalidad infantil',
        't_m_crec': 'Tasa crecimiento (%)',
        'envejec': 'Envejecimiento (%)',
        't_fec_ad': 'Tasa fecundidad',
        'p_fec_ad': 'Peso fecundidad (%)',
    };

    return propertyNameMap[propertyName] || propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
}*/

// Implementar FeatureInfo para la capa WMS
/*map.on('click', function (e) {
    let point = map.latLngToContainerPoint(e.latlng, map.getZoom());
    let size = map.getSize();

    let params = {
        request: 'GetFeatureInfo',
        service: 'WMS',
        srs: 'EPSG:4326',
        styles: '',
        transparent: true,
        version: '1.1.1',
        format: 'image/png',
        bbox: map.getBounds().toBBoxString(),
        height: size.y,
        width: size.x,
        layers: layerData, // O la capa que corresponda
        query_layers: layerData,
        info_format: 'application/json',
        feature_count: 1,
        x: Math.round(point.x),
        y: Math.round(point.y)
    };

    let url = urlGeoserver + L.Util.getParamString(params) 

    fetch(url)
        .then(response => {
            if (params.info_format === 'application/json') {
                return response.json().then(data => ({ format: 'json', data }));
            } else {
                return response.text().then(text => ({ format: 'gml', data: text }));
            }
        })
        .then(result => {
            if (result.format === 'json') {
                const data = result.data;
                if (data.features && data.features.length > 0) {
                    const feature = data.features[0];
                    const properties = feature.properties;
                    let popupContent = '<div class="popup-info-container">';
                    popupContent += '<div class="popup-info-title">';
                    popupContent += '<span class="popup-title-text">Información</span>';
					popupContent += '</div>';
                    for (let prop in properties) {
                        if (!['the_geom', 'geom', 'geometry', 'bbox', 'id'].includes(prop)) {
							popupContent += `<div class="popup-info-item"><span class="popup-info-label">${formatPropertyName(prop)}:</span> <span class="popup-info-value">${properties[prop] ? properties[prop] : '-'}</span></div>`;							
                        }
                    }
                    popupContent += '</div>';
                    L.popup({ className: 'custom-popup' }).setLatLng(e.latlng).setContent(popupContent).openOn(map);
                }
            } else if (result.format === 'gml') {
                // Parsear GML (XML)
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(result.data, "text/xml");
                // Buscar el primer feature
                const feature = xmlDoc.getElementsByTagName(layerData + "_feature")[0];
                if (feature) {
                    // Extraer el ID del objeto (buscar en las propiedades comunes)
                    let objectId = null;
                    for (let node of feature.children) {
                        if (node.tagName.includes("gml:")) continue;
                        // Buscar campos que contengan 'id' en el nombre
                        if (node.tagName.toLowerCase() === 'id' ||
                            node.tagName.toLowerCase() === 'gid') {
                            objectId = node.textContent.trim();
                            break;
                        }
                    }

                    let popupContent = '<div class="popup-info-container">';
                    popupContent += '<div class="popup-info-title">';
                    popupContent += '<span class="popup-title-text">Información</span>';
                    if (!isThematic) {
                        popupContent += `<i class="fas fa-file-alt popup-table-icon" onclick="mostrarBloque('recordsTable','${objectId}')" title="Ver registros"></i>`;
                        popupContent += `<i class="fas fa-table popup-table-icon" onclick="handlePopupTableClick('${objectId}')" title="Ver en tabla"></i>`;
                    }
                    popupContent += '</div>';
                    for (let node of feature.children) {
                        if (node.tagName.includes("gml:")) continue;
                        popupContent += `<div class="popup-info-item"><span class="popup-info-label">${node.tagName}:</span> <span class="popup-info-value">${node.textContent.trim()}</span></div>`;
                    }
                    popupContent += '</div>';
                    L.popup({ className: 'custom-popup' }).setLatLng(e.latlng).setContent(popupContent).openOn(map);
                } else {
                    L.popup({ className: 'custom-popup' }).setLatLng(e.latlng).setContent('Objeto no encontrado').openOn(map);
                }
            }
        })
        .catch(error => {
            console.error('Error al obtener información de la capa:', error);
        });
});*/

// create fullscreen control
let fsControl = L.control.fullscreen({
    position: 'bottomright'
});
// add fullscreen control to the map
map.addControl(fsControl);

// detect fullscreen toggling
map.on('enterFullscreen', function () {
    if (window.console) window.console.log('enterFullscreen');
});
map.on('exitFullscreen', function () {
    if (window.console) window.console.log('exitFullscreen');
});

// Configurar el control de capas en una posición diferente para evitar solapamiento
let layerControl = L.control.layers(baseLayers, overLayers, {
    inline: true, // enable inline mode
    collapsed: true,
    position: 'bottomleft' 
}).addTo(map);

let controlZoomDisplay = map.zoomDisplayControl;
L.DomEvent.disableClickPropagation(controlZoomDisplay._container);
controlZoomDisplay._container.title = 'Zoom a toda la extensión del mapa';
//controlZoomDisplay._container.style.cursor = "pointer";
L.DomEvent.addListener(controlZoomDisplay._container, 'click', function () {
    map.setView(centerData, zoomData);
});

function notify(type, message, duration = 3000) {
    const toast = document.createElement("div");
    toast.className = type;
    toast.innerText = message;
    document.body.appendChild(toast);

    // Forzar reflujo para activar transición
    setTimeout(() => toast.classList.add("show"), 10);

    // Quitar después del tiempo
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, duration);
}




