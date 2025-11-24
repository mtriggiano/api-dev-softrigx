import { AlertCircle } from 'lucide-react';

/**
 * Modal para crear instancias de producción
 */
export default function CreateProdModal({
  show,
  onClose,
  onCreate,
  newProdInstanceName,
  setNewProdInstanceName,
  odooVersion,
  setOdooVersion,
  odooEdition,
  setOdooEdition,
  sslMethod,
  setSslMethod,
  actionLoading
}) {
  if (!show) return null;

  const handleClose = () => {
    onClose();
    setNewProdInstanceName('');
    setOdooVersion('19');
    setOdooEdition('enterprise');
    setSslMethod('letsencrypt');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Crear Nueva Instancia de Producción
        </h3>
        
        <input
          type="text"
          value={newProdInstanceName}
          onChange={(e) => setNewProdInstanceName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="Nombre (ej: cliente1, empresa-abc)"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        
        {/* Preview del dominio */}
        {newProdInstanceName && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Dominio:</strong> {newProdInstanceName}.softrigx.com
            </p>
          </div>
        )}

        {/* Selector de versión de Odoo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Versión de Odoo
          </label>
          <select
            value={odooVersion}
            onChange={(e) => setOdooVersion(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="19">Odoo 19</option>
            <option value="18">Odoo 18</option>
          </select>
        </div>

        {/* Selector de edición */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Edición
          </label>
          <select
            value={odooEdition}
            onChange={(e) => setOdooEdition(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="enterprise">Enterprise</option>
            <option value="community">Community</option>
          </select>
        </div>

        {/* Selector de método SSL */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Método SSL
          </label>
          <select
            value={sslMethod}
            onChange={(e) => setSslMethod(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="letsencrypt">Let's Encrypt (Certbot)</option>
            <option value="cloudflare">Cloudflare Origin Certificate</option>
            <option value="http">HTTP (sin SSL)</option>
          </select>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>IMPORTANTE:</strong> Esta instancia se creará en PRODUCCIÓN con un subdominio.
              El dominio principal softrigx.com está protegido y NO será modificado.
              La creación puede tardar 10-15 minutos.
            </span>
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onCreate}
            disabled={actionLoading.createProd || !newProdInstanceName.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {actionLoading.createProd ? 'Creando...' : 'Crear Producción'}
          </button>
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
