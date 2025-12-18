let centerData = [21.6218, -81.5012];
let zoomData = 13;

var map = L.map('map', {
    center: centerData,
    zoom: zoomData,
    attributionControl: false
});
var baseLayers = {};
var overLayers = {};
var layerControl;
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

var markersById = {};
var areasLayer;
var cluster = L.markerClusterGroup({
    maxClusterRadius: 50, // Radio máximo para formar clústeres (en píxeles)
    disableClusteringAtZoom: 14 // Nivel de zoom en el que no se agrupan
});
createMarkers();
map.addLayer(cluster);

overLayers['Puntos de interés'] = cluster;


// Cargar capa de áreas (GeoJSON de polígonos)

async function loadSubcategoryIconMap(subcategoryId) {
    const url = `/api/subcategories/${subcategoryId}`;
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

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

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
    closeLeftPanel();
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

async function loadGeoJSON() {
    try {
        const areas = await $.getJSON(`/api/areas/`);

        // Eliminar capa anterior si ya existe
        if (areasLayer) {
            map.removeLayer(areasLayer);
            delete overLayers['Áreas'];
            if (layerControl) {
                layerControl.removeLayer(areasLayer);
            }
        }

        // Crear capa GeoJSON con estilo semitransparente
        areasLayer = L.geoJSON(areas, {
            style: function (feature) {
                return {
                    color: '#232323',        // borde
                    weight: 2,
                    fillColor: '#FFFF00',    // relleno
                    fillOpacity: 0.1        // semitransparente
                };
            },
            onEachFeature: function (feature, layer) {
                // Popup sencillo con el nombre si existe
                //const name = feature?.properties?.NOMBRE || feature?.properties?.name || 'Área';
                layer.bindPopup(getInstalationPopupContent(feature), {
                    autoClose: false,
                    keepInView: true, 
                });
            }
        }).addTo(map);

        // Añadir a capas superpuestas para el control de capas
        overLayers['Áreas'] = areasLayer;
        if (layerControl) {
            layerControl.addOverlay(areasLayer, 'Áreas');
        }
    } catch (error) {
        console.error('Error cargando geoJSON', error);
    }           
}

let leftPanel;
let leftPanelContent;
let navigationStack = [];

async function openLeftPanel() {
    closeInfoPanel();
    ensureLeftPanel();
    leftPanelContent.innerHTML = '<div class="panel-loading">Cargando...</div>';    
    leftPanel.style.display = 'block'; // control de visibilidad únicamente   
    try {
        const areas = await $.getJSON(`/api/areas/`);
        const features =  areas.features || [];

        const itemsHTML = features.length
            ? features.map(src => `
                <div class="panel-info-row">
                    <div class="subcategory-content">
                        <div class="fila-con-enlace">
                            <a href="javascript:void(0)" 
                            class="enlace-selectable" 
                            onclick="focusFeature(this, '${src.properties.Coordenadas_GPS_Centro}',${src.properties.id}, 18)">
                            ${src.properties.NOMBRE}
                            </a>
                        </div>
                    </div>
                </div> 
                `).join('')
            : '';        

        const leftHTML = `
            <div class="panel-block panel-info">
                <div class="panel-info-row"><span class="text-name" >Instalaciones</span></div>
                <br>
                ${itemsHTML}  
            </div>
        `;        

        leftPanelContent.innerHTML = leftHTML;
        navigationStack.push(leftHTML);
    } catch (error) {
        console.error('Error cargando geoJSON', error);
        infoPanelContent.innerHTML = '<div class="panel-error">No se pudo cargar la información.</div>';
    }            
}

let closeLeftBtn;
let closeLeftIcon;

function ensureLeftPanel() {
    if (leftPanel) return leftPanel;

    leftPanel = document.createElement('div');
    leftPanel.id = 'left-panel';

    closeLeftBtn = document.createElement('button');
    closeLeftBtn.id = 'left-panel-close';

    // Icono de cierre con Font Awesome
    closeLeftIcon = document.createElement('i');
    closeLeftIcon.className = 'fas fa-times';
    closeLeftBtn.appendChild(closeLeftIcon);
    closeLeftBtn.onclick = closeLeftPanel;

    leftPanelContent = document.createElement('div');
    leftPanelContent.id = 'left-panel-content';

    leftPanel.appendChild(closeLeftBtn);
    leftPanel.appendChild(leftPanelContent);
    document.body.appendChild(leftPanel);

    return leftPanel;
}


function closeLeftPanel() {
    if (leftPanel) {
        leftPanel.style.display = 'none';
    }
}

const starHTML = `                   
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" role="img" aria-hidden="true" class="star">
        <path fill="currentColor" d="M12 5.21a.65.65 0 0 0-.55-.53l-3.6-.6L6.63.46a.66.66 0 0 0-1.26 0L4.16 4.08l-3.6.6a.65.65 0 0 0-.56.53.66.66 0 0 0 .31.69L3.2 7.63 2 11.12a.67.67 0 0 0 .26.76.64.64 0 0 0 .38.12.65.65 0 0 0 .41-.15L6 9.52l2.92 2.33a.65.65 0 0 0 .41.15.64.64 0 0 0 .38-.12.67.67 0 0 0 .26-.76L8.8 7.63l2.88-1.73a.66.66 0 0 0 .32-.69">
        </path>
    </svg> 
`;

async function openInfoLeftPanel(contentId) {
   if (!leftPanel) {
        openLeftPanel();
    } 
    closeInfoPanel();
    leftPanel.style.display = 'block';
    map.closePopup(); 
    leftPanelContent.innerHTML = '<div class="panel-loading">Cargando...</div>'; 
    closeLeftIcon.className = 'fas fa-angle-left';
    closeLeftBtn.onclick = goBack;
    const area = await $.getJSON(`/api/areas/${contentId}`);
    const properties = area?.properties;

    // Definición de servicios (clave JSON, etiqueta, icono)
    const servicesConfig = [
        { key: 'Amenities_Primeros_auxilios', label: 'Primeros auxilios', icon: './js/images/services/primeros_auxilios.png' },
        { key: 'Amenities_TVCableSat_24h', label: 'TV Cable / Satélite 24h', icon: './js/images/services/tv_cable.png' },
        { key: 'Amenities_CentroNegocios', label: 'Centro de negocios', icon: './js/images/services/centro_negocios.png' },
        { key: 'Amenities_ConexionPC_Hab', label: 'Conexión PC en habitación', icon: './js/images/services/conexion_pc.png' },
        { key: 'Amenities_AccesoInternetHab', label: 'Internet en habitación', icon: './js/images/services/internet_hab.png' },
        { key: 'Amenities_Voltaje_110_220AC_60Hz', label: 'Voltaje', icon: './js/images/services/voltaje.png' },
        { key: 'Recepcion_CambioMoneda', label: 'Cambio de moneda', icon: './js/images/services/cambio_moneda.png' },
        { key: 'Recepcion_RentadeCarro', label: 'Renta de autos', icon: './js/images/services/renta_carros.png' },
        { key: 'Recepcion_CajaSeguridad', label: 'Caja de seguridad', icon: './js/images/services/caja_seguridad.png' },
        { key: 'Recepcion_SpanishSpoken', label: 'Español', icon: './js/images/services/spanish.png' },
        { key: 'Recepcion_OtherLanguages', label: 'Otros idiomas', icon: './js/images/services/otros_idiomas.png' },
        { key: 'Ascensores', label: 'Ascensores', icon: './js/images/services/elevadores.png' },
        { key: 'Facilidades_para_discapacitados', label: 'Facilidades Discapacitados', icon: './js/images/services/discapacitados.png' },
        { key: 'Total_bares', label: 'Bares', icon: './js/images/services/bares.png' },
        { key: 'Total_restaurantes', label: 'Restaurantes', icon: './js/images/services/restaurantes.png' },
    ];

    const servicesHTML = servicesConfig
        .filter(service => {
            const value = properties?.[service.key];
            return value && String(value).toLowerCase() !== 'no';
        })
        .map(service => {
            const value = properties?.[service.key];
            return `
                <div class="service-item">
                    <img src="${service.icon}" alt="${service.label}" class="service-icon">
                    <span class="service-text">
                        ${service.label}${value && String(value).toLowerCase() !== 'si' ? `: ${value}` : ''}
                    </span>
                </div>
            `;
        })
        .join('');

    const playaConfig = [
        { key: 'Playa_ColorArena', label: 'Arena', icon: './js/images/services/arena.png' },
        { key: 'Playa_servicio_Salvavidas', label: 'Salvavidas', icon: './js/images/services/salvavidas.png' },
        { key: 'Playa_Sombrillas quitasol', label: 'Sombrillas Playa', icon: './js/images/services/sombrilla_playa.png' },
        { key: 'Playa_Duchas', label: 'Duchas Playas', icon: './js/images/services/ducha_playa.png' },
        { key: 'Playa_Tumbonas', label: 'Tumbonas Playa', icon: './js/images/services/tumbona_playa.png' },
        { key: 'Piscina_Adulto', label: 'Piscinas para Adultos', icon: './js/images/services/adulto_piscina.png' },
        { key: 'Piscina_Niño', label: 'Piscinas para Niños', icon: './js/images/services/nino_piscina.png' },
        { key: 'Piscinas_Duchas', label: 'Duchas Piscina', icon: './js/images/services/ducha_piscina.png' },
        { key: 'Piscinas_tumbonas', label: 'Tumbonas Piscina', icon: './js/images/services/tumbona_piscina.png' },
    ];     


    const playaHTML = playaConfig
    .filter(service => {
        const value = properties?.[service.key];
        return value && String(value).toLowerCase() !== 'no';
    })
    .map(service => {
        const value = properties?.[service.key];
        return `
            <div class="service-item">
                <img src="${service.icon}" alt="${service.label}" class="service-icon">
                <span class="service-text">
                    ${service.label}${value && String(value).toLowerCase() !== 'si' ? `: ${value}` : ''}
                </span>
            </div>
        `;
    })
    .join('');

   const deportesConfig = [
        { key: 'Masaje', label: 'Masaje', icon: './js/images/services/masajes.png' },
        { key: 'Gimnasio', label: 'Gimnasio', icon: './js/images/services/gimnasio.png' },
        { key: 'Canchas_de_squash', label: 'Squash', icon: './js/images/services/squash.png' },
        { key: 'Canchas_de_tennis', label: 'Tenis', icon: './js/images/services/tenis.png' },
        { key: 'Curso_de_Golf', label: 'Curso de Golf', icon: './js/images/services/golf.png' },
        { key: 'Otros_deportes_acuaticos_playa', label: 'Deportes acuáticos', icon: './js/images/services/deportes_acuaticos.png' },
        { key: 'Actividades_marinas_buceo', label: 'Buceo', icon: './js/images/services/buceo.png' },
    ];        


    const deportesHTML = deportesConfig
    .filter(service => {
        const value = properties?.[service.key];
        return value && String(value).toLowerCase() !== 'no';
    })
    .map(service => {
        const value = properties?.[service.key];
        return `
            <div class="service-item">
                <img src="${service.icon}" alt="${service.label}" class="service-icon">
                <span class="service-text">
                    ${service.label}${value && String(value).toLowerCase() !== 'si' ? `: ${value}` : ''}
                </span>
            </div>
        `;
    })
    .join('');

    const leftHTML = `

        <div class="panel-info-row"><span class="text-name" >${properties.NOMBRE}</span></div>
            <div class="type-content">
                ${starHTML.repeat(parseInt(properties.Categoría_Turística[0]))}
                <span class="icon-text">${properties.Tipo_Hotel}</span><br>
            </div>
            <div class="panel-main-image">
                <img src="/api/${properties.Foto}" alt="${properties.NOMBRE}">
            </div>
        </div>
        <div class="panel-info-row">
            <span class="normal-text">
                ${properties?.Descripcion}
            </span>
        </div>
        <hr style="margin: 8px; border: 0; border-top: 1px solid #ccc;">  
        <div class="panel-info-row">
            <div class="subcategory-content">
                <img src="./js/images/entidad.png" alt="Entidad" class="icon">
                <span class="icon-text">${properties?.Propietario_Operador}</span>
            </div>                
        </div>   
        <div class="panel-info-row">
            <div class="subcategory-content">
                <img src="./js/images/place.png" alt="Dirección" class="icon">
                <span class="icon-text">${properties?.Direccion_Ubicacion}, ${properties?.Provincia}, 
                CP ${properties?.Codigo_Postal}
                </span>
            </div>                
        </div>                    
        <div class="panel-info-row">
            <div class="subcategory-content">
                <img src="./js/images/phones.png" alt="Teléfono" class="icon">
                <div class="links-column">
                    ${properties?.Telefono}
                </div>
            </div>
        </div>  
        <div class="panel-info-row">
            <div class="subcategory-content">
                <img src="./js/images/emails.png" alt="Email" class="icon">
                <div class="links-column">
                    ${properties?.E_mailAddress}
                </div>
            </div>
        </div>              
        <div class="panel-info-row">
            <div class="subcategory-content">
                <img src="./js/images/pago.png" alt="Forma de pago" class="icon">
                <div class="links-column">
                    ${properties?.FormaPago_CreditCard}
                </div>
            </div>
        </div>           
        <hr style="margin: 8px; border: 0; border-top: 1px solid #ccc;">      
        ${servicesHTML 
            ? `<div class="panel-info-row">
                    <span class="text-subcategory"><b>Servicios generales</b></span>
               </div>
               <div class="services-grid">
                    ${servicesHTML}
               </div>`
            : ''
        }
        <hr style="margin: 8px; border: 0; border-top: 1px solid #ccc;">  
        ${playaHTML 
            ? `<div class="panel-info-row">
                    <span class="text-subcategory"><b>Playas y piscinas</b></span>
               </div>
               <div class="services-grid">
                    ${playaHTML}
               </div>`
            : ''
        }             
        <hr style="margin: 8px; border: 0; border-top: 1px solid #ccc;">  
        ${deportesHTML 
            ? `<div class="panel-info-row">
                    <span class="text-subcategory"><b>Deportes y bienestar</b></span>
               </div>
               <div class="services-grid">
                    ${deportesHTML}
               </div>`
            : ''
        }   
        <hr style="margin: 8px; border: 0; border-top: 1px solid #ccc;">  
        <div class="panel-info-row">
            <span class="text-subcategory"><b>Transporte y aeropuerto</b></span>
        </div>
        <div class="panel-info-row">
            <div class="subcategory-content">
                <img src="./js/images/aeropuerto.png" alt="Aeropuerto cercano" class="icon">
                <div class="links-column">
                    ${properties?.Aeropuerto_Cercano}
                </div>
            </div>
        </div> 
        <div class="panel-info-row">
            <div class="subcategory-content">
                <img src="./js/images/distancia.png" alt="Distancia al Aeropuerto" class="icon">
                <div class="links-column">
                    ${properties?.Distancia_al_aeropuerto}
                </div>
            </div>
        </div>  
        <div class="panel-info-row">
            <div class="subcategory-content">
                <img src="./js/images/transporte.png" alt="Transporte disponible" class="icon">
                <div class="links-column">
                    ${properties?.OtrosMediosTransporteAeropuertoHotel}
                </div>
            </div>
        </div>  
        <div class="panel-info-row">
            <div class="subcategory-content">
                <img src="./js/images/costo.png" alt="Costo del transporte" class="icon">
                <div class="links-column">
                    ${properties?.CostoTransporteAeropuertoHotel}
                </div>
            </div>
        </div>                                              
                   
    `;          
    leftPanelContent.innerHTML = leftHTML;
    navigationStack.push(leftHTML); 
}

function goBack() {
    if (navigationStack.length > 1) {
        navigationStack.pop(); // Eliminar contenido actual
        const previousContent = navigationStack[navigationStack.length - 1];
        closeLeftIcon.className = 'fas fa-times';
        closeLeftBtn.onclick = closeLeftPanel;        
        leftPanelContent.innerHTML = previousContent;
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

function getInstalationPopupContent(feature){
    const properties = feature?.properties;
    //let popupContent = `<center><span class="text-subcategory"><b>Datos de la Instalación</b></span></center>`;
    let popupContent = `<center><span class="text-subcategory"><b>${properties?.NOMBRE}</b></span></center>`;
    popupContent += `
        <div class="type-content">
            ${starHTML.repeat(parseInt(properties.Categoría_Turística[0]))}
        </div>`;

    let imagen = properties?.Foto || 'Sin imagen';
    if (imagen) {
        popupContent += `<img src="/api/${imagen}"  width="250" style="margin: 4px 0;"  alt="Imagen no disponible">`;
    }
    //popupContent += `<a href="#" onclick="openInfoLeftPanel(${properties.id}); return false;">`;
    //popupContent += `<p>Clic para más información</p></a>`;
    popupContent += `<center><span class="normal-text">${properties?.Situación_Hotel}</span></center>`;
    popupContent += `<div><button class="panel-gallery-btn" onclick="openInfoLeftPanel(${properties.id}); return true;">Ver detalles</button></div>`;

    return popupContent;
} 

function createMarkers(){
    $.getJSON(`/api/points?bbox=-81.62388715,21.58320191,-81.35649683,21.70624878`, function(result) {					
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
                        keepInView: true, 
                        offset: L.point(0, -10) 
                    });

                    // Abrir panel lateral con scroll al hacer click
                    marker.on('click', function(e) {
                        if (isMobileDevice()) {
                            this.openPopup();
                        } else {
                            openInfoPanel(data.id);
                        }
                    });
                    // Guardar referencia para poder centrar después
                    markersById[data.id] = marker;

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

function focusMarkerById(pointId, zoom = 17) {
    document.getElementById("nombre").value = "";
    const marker = markersById[pointId];
    if (marker) {
        const targetZoom = zoom || map.getZoom();
        map.setView(marker.getLatLng(), targetZoom);
        marker.openPopup();
    }
}

function focusFeature(elemento, feature, id, zoom = 18) {
    if (isMobileDevice()) {
        closeLeftPanel();
    }    

    event.preventDefault();
    // 2. Quitar la clase 'seleccionada' de TODAS las filas
    document.querySelectorAll('.fila-con-enlace').forEach(fila => {
        fila.classList.remove('seleccionada');
    });
    // 3. Encontrar la fila padre y agregar clase 'seleccionada'
    elemento.closest('.fila-con-enlace').classList.add('seleccionada');

    const coord = feature; //.properties.Coordenadas_GPS_Centro;
    const [lat, lon] = coord.split(',');
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const targetZoom = zoom || map.getZoom();
    map.closePopup(); 
    map.setView([latNum, lonNum], targetZoom, { animate: false });    
    openPopupById(id);
}

function openPopupById(featureId) {
    // Buscar el layer que corresponde al feature con ese ID
    areasLayer.eachLayer(function(layer) {
        const feature = layer.feature;
        
        if (feature && feature.properties && feature.properties.id === featureId) {
            // Abrir popup
            layer.openPopup();            
            return layer; // Devolver el layer encontrado
        }
    });
    
    return null; // No encontrado
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
layerControl = L.control.layers(baseLayers, overLayers, {
    inline: true, // enable inline mode
    collapsed: true,
    position: 'bottomleft' 
}).addTo(map);

loadGeoJSON();

let controlZoomDisplay = map.zoomDisplayControl;
L.DomEvent.disableClickPropagation(controlZoomDisplay._container);
controlZoomDisplay._container.title = 'Zoom a toda la extensión del mapa';
//controlZoomDisplay._container.style.cursor = "pointer";
L.DomEvent.addListener(controlZoomDisplay._container, 'click', function () {
    map.setView(centerData, zoomData);
});

L.LogoControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control logo-control');
        var button = L.DomUtil.create('a', 'img-logo-control', container);
        button.href = "https://www.cuba.travel/destinos/isla-de-la-juventud"; // 
        button.target = "_blank"; // Abrir en nueva pestaña
        button.rel = "noopener noreferrer"; // Seguridad        
        button.innerHTML = '<img width="85%" class="logo-control-img" src="./js/images/logo.jpg">';
        L.DomEvent.disableClickPropagation(button);
        container.title = "Cayo Largo del Sur";
        return container;
    },
});

new L.LogoControl().addTo(map);

L.MenuControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control logo-control');
        var button = L.DomUtil.create('a', 'img-logo-control', container);       
        //button.innerHTML = '<i class="fas fa-building"></i>'; // Icono de menú
        button.innerHTML = '<img width="85%" class="logo-control-img" src="./js/images/entidad.png">';
        button.href = "javascript:void(0);"; // Enlace que no navega
        button.onclick = function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto
            openLeftPanel();
        };        
        L.DomEvent.disableClickPropagation(button);
        container.title = "Instalaciones";
        return container;
    },
});

new L.MenuControl().addTo(map)

new L.Control.BootstrapModal({
    modalId: 'modal_search',
    tooltip: 'Buscar en el mapa',
    glyph: 'search',
    position: "topleft" 
}).addTo(map);	

var bsearch = L.DomUtil.get("search");
if (bsearch) {
    L.DomEvent.addListener(bsearch, 'click', function() {

        var name = document.getElementById("nombre").value;
        document.getElementById("nombre").value = "";
        if (name) {
            //centerMap(name, 14);

        } else {
            notifyMessage('danger', 'Lugar de interés no encontrado');
        }
    });
} 

// --- Búsqueda incremental en el modal ---
const searchInput = document.getElementById('nombre');
let searchResultsBox;

function ensureSearchResultsBox() {
    if (searchResultsBox) return searchResultsBox;
    searchResultsBox = document.createElement('div');
    searchResultsBox.id = 'search-results';
    searchResultsBox.className = 'search-results';
    const inputWrapper = searchInput ? searchInput.parentElement : null;
    if (inputWrapper) {
        inputWrapper.appendChild(searchResultsBox);
    } else {
        document.body.appendChild(searchResultsBox);
    }
    return searchResultsBox;
}

function clearSearchResults() {
    if (searchResultsBox) {
        searchResultsBox.innerHTML = '';
        searchResultsBox.style.display = 'none';
    }
}

function debounce(fn, delay = 250) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

async function fetchPointsByName(query) {
    const where = encodeURIComponent(JSON.stringify({ name: query }));
    const url = `/api/points?where=${where}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error en la búsqueda');
    return res.json();
}

function renderSearchResults(results) {
    ensureSearchResultsBox();
    if (!results || !results.length) {
        clearSearchResults();
        return;
    }
    const itemsHTML = results.map(item => {
        const displayName = item?.name?.es || 'Sin nombre';
        const pid = item?.id ?? '';
        return `<button type="button" class="search-result-item" data-id="${pid}">
            <span class="result-name">${displayName}</span>
        </button>`;
    }).join('');
    searchResultsBox.innerHTML = itemsHTML;
    searchResultsBox.style.display = 'block';

    // Enlazar eventos de selección
    searchResultsBox.querySelectorAll('.search-result-item').forEach(btn => {
        btn.onclick = () => {
            const pid = btn.getAttribute('data-id');
            const label = btn.querySelector('.result-name')?.textContent || '';
            if (searchInput) searchInput.value = label;
            clearSearchResults();
            // Cerrar modal si existe instancia de bootstrap
            const modalEl = document.getElementById('modal_search');
            if (modalEl && window.bootstrap) {
                const instance = bootstrap.Modal.getInstance(modalEl);
                if (instance) instance.hide();
            }
            if (pid) {
                focusMarkerById(pid, 18);
            }
        };
    });
}

if (searchInput) {
    ensureSearchResultsBox();
    const debouncedSearch = debounce(async (event) => {
        const q = event.target.value.trim();
        if (q.length < 2) {
            clearSearchResults();
            return;
        }
        try {
            const results = await fetchPointsByName(q);
            renderSearchResults(results);
        } catch (err) {
            console.error('Error buscando puntos:', err);
            clearSearchResults();
        }
    }, 350);

    searchInput.addEventListener('input', debouncedSearch);
    searchInput.addEventListener('blur', () => setTimeout(clearSearchResults, 200));
}

function centerMap(name, zoom) {
    //map.setView(markers[device].getLatLng(),zoom == 0 ? map.getZoom() : zoom);
}

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




