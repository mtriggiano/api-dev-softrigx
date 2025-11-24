/**
 * Utilidades para mensajes de confirmación de acciones
 */

/**
 * Obtiene el título de confirmación según la acción
 * @param {string} action - Acción a realizar (restart, update-db, etc.)
 * @returns {string} Título del modal de confirmación
 */
export function getConfirmTitle(action) {
  const titles = {
    restart: 'Reiniciar Instancia',
    'update-db': 'Actualizar Base de Datos',
    'update-files': 'Actualizar Archivos',
    'sync-filestore': 'Sincronizar Filestore',
    'regenerate-assets': 'Regenerar Assets',
    delete: 'Eliminar Instancia'
  };
  return titles[action] || 'Confirmar Acción';
}

/**
 * Obtiene el mensaje de confirmación según la acción
 * @param {string} action - Acción a realizar
 * @param {string} instanceName - Nombre de la instancia
 * @returns {string} Mensaje de confirmación
 */
export function getConfirmMessage(action, instanceName) {
  const messages = {
    restart: `¿Deseas reiniciar la instancia ${instanceName}? El servicio se detendrá temporalmente.`,
    'update-db': `¿Actualizar la base de datos de ${instanceName} desde producción? Esta operación puede tardar varios minutos.`,
    'update-files': `¿Actualizar los archivos de ${instanceName} desde producción?`,
    'sync-filestore': `¿Sincronizar el filestore (imágenes y archivos) de ${instanceName} desde producción? Esto copiará todos los assets.`,
    'regenerate-assets': `¿Regenerar los assets (CSS, JS, iconos) de ${instanceName}? El servicio se detendrá temporalmente.`,
    delete: `¿Estás seguro de eliminar la instancia ${instanceName}? Esta acción no se puede deshacer y se perderán todos los datos.`
  };
  return messages[action] || '¿Deseas continuar con esta acción?';
}
