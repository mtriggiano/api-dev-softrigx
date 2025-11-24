/**
 * Utilidades para filtrado de instancias
 */

/**
 * Filtra instancias por tipo (producción o desarrollo)
 * @param {Array} instanceList - Lista completa de instancias
 * @returns {Object} Objeto con arrays de producción y desarrollo
 */
export function separateInstancesByType(instanceList) {
  return {
    production: instanceList.filter(i => i.type === 'production'),
    development: instanceList.filter(i => i.type === 'development')
  };
}

/**
 * Filtra instancias por instancia de producción relacionada
 * @param {Array} productionInstances - Instancias de producción
 * @param {Array} developmentInstances - Instancias de desarrollo
 * @param {string} filterByProduction - Nombre de la instancia de producción a filtrar
 * @returns {Object} Objeto con arrays filtrados
 */
export function filterByProductionInstance(productionInstances, developmentInstances, filterByProduction) {
  if (filterByProduction === 'all') {
    return { production: productionInstances, development: developmentInstances };
  }

  // Filtrar producción
  const filteredProduction = productionInstances.filter(i => i.name === filterByProduction);
  
  // Filtrar desarrollo relacionado
  // Las instancias dev tienen formato: dev-{nombre}-{produccion}
  const filteredDevelopment = developmentInstances.filter(i => {
    // Extraer el nombre de la instancia de producción del nombre dev
    // Ejemplo: dev-testp4-prod-panel4 -> prod-panel4
    const match = i.database?.match(new RegExp(`dev-[^-]+-(.+)`));
    if (match) {
      const prodName = match[1];
      return prodName === filterByProduction;
    }
    return false;
  });

  return { production: filteredProduction, development: filteredDevelopment };
}

/**
 * Filtra instancias por término de búsqueda
 * @param {Array} instances - Array de instancias a filtrar
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Array} Instancias filtradas
 */
export function filterBySearchTerm(instances, searchTerm) {
  if (!searchTerm.trim()) {
    return instances;
  }

  const search = searchTerm.toLowerCase();
  return instances.filter(i => 
    i.name?.toLowerCase().includes(search) ||
    i.domain?.toLowerCase().includes(search) ||
    i.database?.toLowerCase().includes(search)
  );
}

/**
 * Aplica todos los filtros a las instancias
 * @param {Array} instanceList - Lista completa de instancias
 * @param {string} filterByProduction - Filtro por instancia de producción
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Object} Objeto con arrays filtrados de producción y desarrollo
 */
export function applyAllFilters(instanceList, filterByProduction, searchTerm) {
  // Separar por tipo
  let { production, development } = separateInstancesByType(instanceList);

  // Aplicar filtro por instancia de producción
  ({ production, development } = filterByProductionInstance(production, development, filterByProduction));

  // Aplicar búsqueda por texto
  production = filterBySearchTerm(production, searchTerm);
  development = filterBySearchTerm(development, searchTerm);

  return { production, development };
}
