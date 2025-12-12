// Control de Leyenda WMS
class MapLegend {
    constructor(options = {}) {
        this.serverUrl = options.serverUrl || 'http://local.geocuba.cu/geoserver/wms';
        this.layer = options.layer || 'gmx:municipios';
        this.style = options.style || 'municipios_limite';
        this.legend_options = options.legend_options || 'countMatched:true;fontAntiAliasing:true;hideEmptyRules:true';
        this.position = options.position || 'topright';
        this.width = options.width || 500;
        this.height = options.height || 200;
        this.legendContainer = null;
        this.isVisible = false;
        this.cqlFilter = '1=1';
        this.init();
    }
    
    init() {
        this.createLegendControl();
        this.loadLegend();
    }
    
    // Crear el control de leyenda
    createLegendControl() {
        // Crear contenedor principal
        this.legendContainer = document.createElement('div');
        this.legendContainer.className = 'map-legend-control';
        this.legendContainer.style.cssText = `
            max-width: ${this.width}px;
            max-height: ${this.height}px;
        `;
        
        // Crear header del control
        const header = document.createElement('div');
        header.className = 'legend-header';
        header.innerHTML = `
            <span class="legend-title">Leyenda</span>
            <button class="legend-toggle" type="button"><i class="fas fa-chevron-up"></i></button>
        `;
        
        // Crear contenedor para la imagen de la leyenda
        const content = document.createElement('div');
        content.className = 'legend-content';
        content.style.padding = '10px';
        
        // Agregar elementos al contenedor
        this.legendContainer.appendChild(header);
        this.legendContainer.appendChild(content);
        
        // Agregar al mapa
        const mapContainer = document.querySelector('#map');
        if (mapContainer) {
            mapContainer.appendChild(this.legendContainer);
        }
        
        // Event listeners
        const toggleBtn = header.querySelector('.legend-toggle');
        toggleBtn.addEventListener('click', () => {
            this.toggle();
        });
        
        // Mostrar la leyenda inicialmente
        this.show();
    }
    
    // Cargar la leyenda desde el servidor WMS
    loadLegend() {
        const params = {
            request: 'GetLegendGraphic',
            service: 'WMS',
            version: '1.3.0',
            layer: this.layer,
            style: this.style,
            format: 'image/png',
			cql_filter: this.cqlFilter,
            width: 20,
            height: 20,
            transparent: true,
            legend_options: this.legend_options
        };
        
        const url = `${this.serverUrl}${L.Util.getParamString(params)}`;
        
        // Crear imagen de la leyenda
        const legendImg = document.createElement('img');
        legendImg.src = url;
        //legendImg.style.width = '100%';
        legendImg.style.height = 'auto';
        //
        
        // Agregar al contenedor
        const content = this.legendContainer.querySelector('.legend-content');
        content.innerHTML = '';
        content.appendChild(legendImg);
        
        // Manejar errores de carga
        legendImg.onerror = () => {
            content.innerHTML = '<p style="color: #666; font-size: 12px; text-align: center;">Leyenda no disponible</p>';
        };
        
        // Manejar carga exitosa
        legendImg.onload = () => {
            // La imagen se cargó correctamente
            //console.log('Leyenda cargada exitosamente');
        };
    }
    
    // Mostrar/ocultar la leyenda
    toggle() {
        this.isVisible = !this.isVisible;
        const content = this.legendContainer.querySelector('.legend-content');
        content.style.display = this.isVisible ? 'block' : 'none';
        //this.legendContainer.style.display = this.isVisible ? 'block' : 'none';
        
        const toggleBtn = this.legendContainer.querySelector('.legend-toggle');
        toggleBtn.innerHTML = this.isVisible ? '<i class="fas fa-chevron-up"></i>' : '<i class="fas fa-chevron-down"></i>';
    }
    
    // Mostrar la leyenda
    show() {
        this.isVisible = true;
        this.legendContainer.style.display = 'block';
        const toggleBtn = this.legendContainer.querySelector('.legend-toggle');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    }
    
    // Ocultar la leyenda
    hide() {
        this.isVisible = false;
        this.legendContainer.style.display = 'none';
        const toggleBtn = this.legendContainer.querySelector('.legend-toggle');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    }
    
    // Actualizar la capa de la leyenda
    setLayer(layer, style = null) {
        this.layer = layer;
        if (style) {
            this.style = style;
        }
        this.loadLegend();
    }

    // Actualizar el estilo la capa de la leyenda
    setStyle(style) {
        this.style = style;
        this.loadLegend();
    }  

    // Actualizar la capa de la leyenda
    setFilter(filter) {
        this.cqlFilter = filter;
        this.loadLegend();
    }   	
    
    // Obtener la capa actual
    getLayer() {
        return this.layer;
    }
    
    // Destruir el control
    destroy() {
        if (this.legendContainer && this.legendContainer.parentNode) {
            this.legendContainer.parentNode.removeChild(this.legendContainer);
        }
    }
} 