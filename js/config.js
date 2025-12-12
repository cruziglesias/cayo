const CONFIG_ENV = 'DEV';

let CONFIG_URL_BASE = './js/';

let CONFIG_URL_REPORTSERVER = 'https://mapas.andariego.cu/reportserver/reportserver/httpauthexport?user=geoportal&apikey=geoportal&format=json&download=false';

let CONFIG_URL_MAPSERVER = 'http://local.geocuba.cu/cgi-bin/mapserv';

let CONFIG_URL_DISPATCH = './js/'

const CONFIG_GEOPORTAL_MAPFILE = '/var/www/GIS2/gis_Genesig_v2/branches/desarrollo/projects/hidraulico/server_conf/geoweb/userMaps/geoportal.map'

const CONFIG_IOMAP_MAPFILE = '/var/www/GIS2/gis_Genesig_v2/branches/desarrollo/projects/hidraulico/server_conf/geoweb/userMaps/ioMap.map';

let CONFIG_FILTROS;
// Configuración de URLs para las APIs de filtros
CONFIG_FILTROS = {
  // URL para obtener provincias - devuelve array de {idprovincia, nombre}
  URL_PROVINCIAS: CONFIG_URL_REPORTSERVER + '&key=provincias',
  // URL para obtener cuencas - devuelve array de {idcuencafluvial, nombre}
  URL_CUENCAS: CONFIG_URL_REPORTSERVER + '&key=cuencas',
  // URL para obtener acuíferos - devuelve array de {idacuifero, nombre}
  URL_ACUIFEROS: CONFIG_URL_REPORTSERVER + '&key=acuiferos'
};

let CONFIG_IMAGES;
CONFIG_IMAGES = {
  URL_PROVINCIAS: CONFIG_URL_BASE + 'images/provincia mini.png',
  URL_CUENCAS: CONFIG_URL_BASE + 'images/cuenca mini.png',
  URL_ACUIFEROS: CONFIG_URL_BASE + 'images/acuifero mini.png'
};


if (CONFIG_ENV == 'PROD') {
  CONFIG_URL_BASE = '../wp-content/themes/astra/js/';

  CONFIG_URL_MAPSERVER = 'https://sgia.hidro.gob.cu/cgi-bin/mapserv';

  CONFIG_URL_REPORTSERVER = 'https://reportesmicosta.hidro.gob.cu/reportserver/reportserver/httpauthexport?user=geoportal&apikey=geoportal&format=json&download=false';

  CONFIG_URL_DISPATCH = '.'

  CONFIG_FILTROS = {
    URL_PROVINCIAS: CONFIG_URL_REPORTSERVER + '&key=provincias',
    URL_CUENCAS: CONFIG_URL_REPORTSERVER + '&key=cuencas',
    URL_ACUIFEROS: CONFIG_URL_REPORTSERVER + '&key=acuiferos'
  };

  CONFIG_IMAGES = {
    URL_PROVINCIAS: CONFIG_URL_BASE + 'images/provincia mini.png',
    URL_CUENCAS: CONFIG_URL_BASE + 'images/cuenca mini.png',
    URL_ACUIFEROS: CONFIG_URL_BASE + 'images/acuifero mini.png'
  };
}

// Exportar la configuración si se usa como módulo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG_ENV,
    CONFIG_FILTROS,
    CONFIG_IMAGES,
    CONFIG_URL_BASE,
    CONFIG_URL_MAPSERVER,
    CONFIG_URL_REPORTSERVER,
    CONFIG_URL_DISPATCH,
	CONFIG_GEOPORTAL_MAPFILE,
	CONFIG_IOMAP_MAPFILE
  };
}
