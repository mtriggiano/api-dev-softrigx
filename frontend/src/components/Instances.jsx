import { useState, useEffect, useRef } from 'react';
import { instances, github } from '../lib/api';
import { Server, Play, Square, Trash2, RefreshCw, Database, FileText, Plus, Eye, AlertCircle, FolderSync, Palette, Github, GitCommit, Clock, Settings, MoreVertical, Search, Filter } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import GitHubModal from './GitHubModal';

// Modales refactorizados
import { CreationLogModal, UpdateLogModal } from './instances/modals';
// Hooks personalizados
import { useInstances, useCreationLog, useUpdateLog } from './instances/hooks';

export default function Instances() {
  // Hook para manejar lista de instancias (reemplaza useState y useEffect)
  const { instanceList, loading, fetchInstances } = useInstances();
  
  // Hook para manejar log de creación (reemplaza useState, useEffect y polling)
  const { creationLog, creationLogRef, startPolling: startCreationPolling, closeLog: closeCreationLog } = useCreationLog();
  
  // Hook para manejar log de actualización (reemplaza useState, useEffect y polling)
  const { updateLog, updateLogRef, startPolling: startUpdatePolling, closeLog: closeUpdateLog } = useUpdateLog();
  const [actionLoading, setActionLoading] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateProdModal, setShowCreateProdModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newProdInstanceName, setNewProdInstanceName] = useState('');
  const [odooVersion, setOdooVersion] = useState('19');
  const [odooEdition, setOdooEdition] = useState('enterprise');
  const [sslMethod, setSslMethod] = useState('letsencrypt');
  const [availableProductionInstances, setAvailableProductionInstances] = useState([]);
  const [selectedSourceInstance, setSelectedSourceInstance] = useState('');
  const [neutralizeDatabase, setNeutralizeDatabase] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [logs, setLogs] = useState('');
  const [activeLogTab, setActiveLogTab] = useState('systemd');
  const [logsLoading, setLogsLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, instanceName: null, neutralize: true });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [restartModal, setRestartModal] = useState({ show: false, instanceName: '', status: 'Reiniciando...' });
  const [githubModal, setGithubModal] = useState({ show: false, instanceName: '' });
  const [deleteProductionModal, setDeleteProductionModal] = useState({ show: false, instanceName: '', confirmation: '', step: 1 });
  const [filterByProduction, setFilterByProduction] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Los hooks ya manejan: fetchInstances, creationLog, updateLog, refs y auto-scroll

  const showConfirmation = (action, instanceName) => {
    // Por defecto, neutralizar en update-db
    const neutralize = action === 'update-db' ? true : false;
    setConfirmModal({ isOpen: true, action, instanceName, neutralize });
  };

  const handleAction = async (action, instanceName) => {
    setActionLoading({ ...actionLoading, [`${action}-${instanceName}`]: true });
    
    try {
      let response;
      
      // Para update-db, update-files, sync-filestore y regenerate-assets, mostrar modal con log
      if (action === 'update-db' || action === 'update-files' || action === 'sync-filestore' || action === 'regenerate-assets') {
        response = action === 'update-db' 
          ? await instances.updateDb(instanceName, confirmModal.neutralize)
          : action === 'update-files'
          ? await instances.updateFiles(instanceName)
          : action === 'sync-filestore'
          ? await instances.syncFilestore(instanceName)
          : await instances.regenerateAssets(instanceName);
        
        if (response.data.success) {
          // Usar hook para manejar el polling del log
          startUpdatePolling(instanceName, action);
          fetchInstances();
        }
      } else if (action === 'restart') {
        // Para reiniciar, mostrar modal con estado
        setRestartModal({ show: true, instanceName, status: 'Deteniendo servicio...' });
        
        response = await instances.restart(instanceName);
        
        if (response.data.success) {
          setRestartModal(prev => ({ ...prev, status: 'Iniciando servicio...' }));
          
          // Esperar un momento y verificar estado
          setTimeout(async () => {
            setRestartModal(prev => ({ ...prev, status: '\u2705 Servicio reiniciado correctamente' }));
            
            setTimeout(() => {
              setRestartModal({ show: false, instanceName: '', status: '' });
              setToast({ show: true, message: 'Instancia reiniciada correctamente', type: 'success' });
              fetchInstances();
            }, 2000);
          }, 2000);
        }
      } else if (action === 'delete-production') {
        // Para eliminar producción, abrir modal de doble confirmación
        handleDeleteProduction(instanceName);
        return; // No continuar con el flujo normal
      } else {
        // Para delete y otras acciones
        switch (action) {
          case 'delete':
            response = await instances.delete(instanceName);
            break;
          default:
            break;
        }
        
        if (response) {
          setToast({ show: true, message: response.data.message || 'Acci\u00f3n completada', type: 'success' });
          fetchInstances();
        }
      }
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.error || 'Error al ejecutar la acci\u00f3n', type: 'error' });
    } finally {
      setActionLoading({ ...actionLoading, [`${action}-${instanceName}`]: false });
    }
  };

  const handleDeleteProduction = async (instanceName) => {
    setDeleteProductionModal({ show: true, instanceName, confirmation: '', step: 1 });
  };

  const handleConfirmDeleteProduction = async () => {
    const { instanceName, confirmation } = deleteProductionModal;
    const expectedConfirmation = `BORRAR${instanceName}`;
    
    if (confirmation !== expectedConfirmation) {
      setToast({ show: true, message: `Debes escribir exactamente: ${expectedConfirmation}`, type: 'error' });
      return;
    }

    setActionLoading({ ...actionLoading, [`delete-prod-${instanceName}`]: true });
    try {
      const response = await instances.deleteProduction(instanceName, confirmation);
      setDeleteProductionModal({ show: false, instanceName: '', confirmation: '', step: 1 });
      setToast({ show: true, message: response.data.message || 'Instancia de producción eliminada', type: 'success' });
      fetchInstances();
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.error || 'Error al eliminar la instancia', type: 'error' });
    } finally {
      setActionLoading({ ...actionLoading, [`delete-prod-${instanceName}`]: false });
    }
  };

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      setToast({ show: true, message: 'Debes ingresar un nombre para la instancia', type: 'warning' });
      return;
    }

    setActionLoading({ create: true });
    try {
      const response = await instances.create(newInstanceName, selectedSourceInstance, neutralizeDatabase);
      setShowCreateModal(false);
      
      // Usar hook para manejar el polling del log
      startCreationPolling(newInstanceName, false); // false = dev instance
      
      setNewInstanceName('');
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.error || 'Error al crear la instancia', type: 'error' });
    } finally {
      setActionLoading({ create: false });
    }
  };

  const handleOpenCreateModal = async () => {
    setShowCreateModal(true);
    try {
      const response = await instances.getProductionInstances();
      setAvailableProductionInstances(response.data.instances || []);
      if (response.data.instances && response.data.instances.length > 0) {
        setSelectedSourceInstance(response.data.instances[0].name);
      }
    } catch (error) {
      console.error('Error cargando instancias de producción:', error);
      setToast({ show: true, message: 'Error cargando instancias de producción', type: 'error' });
    }
  };


  const handleCreateProdInstance = async () => {
    if (!newProdInstanceName.trim()) {
      setToast({ show: true, message: 'Debes ingresar un nombre para la instancia', type: 'warning' });
      return;
    }

    setActionLoading({ createProd: true });
    try {
      const response = await instances.createProduction(newProdInstanceName, odooVersion, odooEdition, sslMethod);
      setShowCreateProdModal(false);
      
      const instanceName = response.data.instance_name || `prod-${newProdInstanceName}`;
      
      // Usar hook para manejar el polling del log
      startCreationPolling(instanceName, true); // true = production instance
      
      setNewProdInstanceName('');
      setOdooVersion('19');
      setOdooEdition('enterprise');
      setSslMethod('letsencrypt');
    } catch (error) {
      setToast({ show: true, message: error.response?.data?.error || 'Error al crear la instancia de producción', type: 'error' });
    } finally {
      setActionLoading({ createProd: false });
    }
  };

  const handleViewLogs = async (instanceName, logType = 'systemd') => {
    setSelectedInstance(instanceName);
    setActiveLogTab(logType);
    setLogsLoading(true);
    setLogs('Cargando logs...');
    try {
      if (logType === 'git-deploy') {
        // Logs de Git/Deploy
        const response = await github.getDeployLogs(instanceName, 50);
        if (response.data.success && response.data.logs.length > 0) {
          const formattedLogs = response.data.logs.map(log => {
            const timestamp = new Date(log.timestamp).toLocaleString('es-AR');
            const status = log.status === 'success' ? '✅' : '❌';
            return `[${timestamp}] ${status} ${log.action}: ${log.details} (${log.user})`;
          }).join('\n');
          setLogs(formattedLogs);
        } else {
          setLogs('No hay logs de deploy disponibles');
        }
      } else {
        // Logs normales (systemd, odoo, nginx)
        const response = await instances.getLogs(instanceName, 200, logType);
        setLogs(response.data.logs);
      }
    } catch (error) {
      setLogs('Error al cargar logs: ' + (error.response?.data?.error || error.message));
    } finally {
      setLogsLoading(false);
    }
  };

  const handleLogTabChange = (logType) => {
    if (selectedInstance) {
      handleViewLogs(selectedInstance, logType);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filtrar instancias
  let productionInstances = instanceList.filter(i => i.type === 'production');
  let developmentInstances = instanceList.filter(i => i.type === 'development');

  // Aplicar filtro por instancia de producción
  if (filterByProduction !== 'all') {
    // Mostrar solo la instancia de producción seleccionada
    productionInstances = productionInstances.filter(i => i.name === filterByProduction);
    
    // Mostrar solo las instancias de desarrollo que corresponden a esta producción
    // Las instancias dev tienen formato: dev-{nombre}-{produccion}
    developmentInstances = developmentInstances.filter(i => {
      // Extraer el nombre de la instancia de producción del nombre dev
      // Ejemplo: dev-testp4-prod-panel4 -> prod-panel4
      const match = i.database?.match(new RegExp(`dev-[^-]+-(.+)`));
      if (match) {
        const prodName = match[1];
        return prodName === filterByProduction;
      }
      return false;
    });
  }

  // Aplicar búsqueda por texto
  if (searchTerm.trim()) {
    const search = searchTerm.toLowerCase();
    productionInstances = productionInstances.filter(i => 
      i.name?.toLowerCase().includes(search) ||
      i.domain?.toLowerCase().includes(search) ||
      i.database?.toLowerCase().includes(search)
    );
    developmentInstances = developmentInstances.filter(i => 
      i.name?.toLowerCase().includes(search) ||
      i.domain?.toLowerCase().includes(search) ||
      i.database?.toLowerCase().includes(search)
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Instancias Odoo</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Gestión de instancias de producción y desarrollo</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateProdModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Producción
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Desarrollo
          </button>
        </div>
      </div>

      {/* Barra de filtros y búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filtro por instancia de producción */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-2" />
              Filtrar por Instancia de Producción
            </label>
            <select
              value={filterByProduction}
              onChange={(e) => setFilterByProduction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todas las instancias</option>
              {instanceList
                .filter(i => i.type === 'production')
                .map(prod => (
                  <option key={prod.name} value={prod.name}>
                    {prod.name} {prod.domain ? `(${prod.domain})` : ''}
                  </option>
                ))
              }
            </select>
          </div>

          {/* Buscador */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Search className="w-4 h-4 inline mr-2" />
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, dominio o base de datos..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Botón para limpiar filtros */}
          {(filterByProduction !== 'all' || searchTerm) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterByProduction('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Contador de resultados */}
        {(filterByProduction !== 'all' || searchTerm) && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Mostrando: {productionInstances.length} producción, {developmentInstances.length} desarrollo
          </div>
        )}
      </div>

      {/* Producción */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Producción</h3>
        </div>
        <div className="p-6">
          {productionInstances.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300 text-center py-4">No hay instancias de producción</p>
          ) : (
            <div className="space-y-4">
              {productionInstances.map((instance) => (
                <InstanceCard
                  key={instance.name}
                  instance={instance}
                  onAction={showConfirmation}
                  onViewLogs={handleViewLogs}
                  onGitHub={(instanceName) => setGithubModal({ show: true, instanceName })}
                  actionLoading={actionLoading}
                  isProduction={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desarrollo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Desarrollo</h3>
        </div>
        <div className="p-6">
          {developmentInstances.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300 text-center py-4">No hay instancias de desarrollo</p>
          ) : (
            <div className="space-y-4">
              {developmentInstances.map((instance) => (
                <InstanceCard
                  key={instance.name}
                  instance={instance}
                  onAction={showConfirmation}
                  onViewLogs={handleViewLogs}
                  onGitHub={(instanceName) => setGithubModal({ show: true, instanceName })}
                  actionLoading={actionLoading}
                  isProduction={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Crear Nueva Instancia de Desarrollo
            </h3>
            
            {/* Selector de instancia de producción */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clonar desde:
              </label>
              <select
                value={selectedSourceInstance}
                onChange={(e) => setSelectedSourceInstance(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {productionInstances.map((instance) => (
                  <option key={instance.name} value={instance.name}>
                    {instance.name} {instance.domain ? `(${instance.domain})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Se clonará la base de datos y archivos de esta instancia
              </p>
            </div>
            
            {/* Input de nombre */}
            <input
              type="text"
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value)}
              placeholder="Nombre (ej: juan, testing, feature-xyz)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            
            {/* Checkbox de neutralización */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={neutralizeDatabase}
                  onChange={(e) => setNeutralizeDatabase(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Neutralizar base de datos
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                {neutralizeDatabase 
                  ? '✅ Se desactivarán crons, correos, webhooks y se eliminará la licencia Enterprise'
                  : '⚠️  La instancia mantendrá todos los datos y configuraciones de producción'
                }
              </p>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>La creación puede tardar varios minutos. Se clonará desde {selectedSourceInstance || 'producción'}.</span>
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCreateInstance}
                disabled={actionLoading.create}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading.create ? 'Creando...' : 'Crear'}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de creación de producción */}
      {showCreateProdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Crear Nueva Instancia de Producción</h3>
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
                onClick={handleCreateProdInstance}
                disabled={actionLoading.createProd || !newProdInstanceName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading.createProd ? 'Creando...' : 'Crear Producción'}
              </button>
              <button
                onClick={() => {
                  setShowCreateProdModal(false);
                  setNewProdInstanceName('');
                  setOdooVersion('19');
                  setOdooEdition('enterprise');
                  setSslMethod('letsencrypt');
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reinicio */}
      {restartModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <RefreshCw className="w-16 h-16 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Reiniciando: {restartModal.instanceName}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {restartModal.status}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de log de actualización */}
      <UpdateLogModal 
        updateLog={updateLog}
        updateLogRef={updateLogRef}
        onClose={closeUpdateLog}
      />

      {/* Modal de log de creación */}
      <CreationLogModal 
        creationLog={creationLog}
        creationLogRef={creationLogRef}
        onClose={closeCreationLog}
      />

      {/* Modal de logs */}
      {selectedInstance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Logs: {selectedInstance}</h3>
              <button
                onClick={() => setSelectedInstance(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Pestañas de logs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleLogTabChange('systemd')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeLogTab === 'systemd'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Systemd Journal
              </button>
              <button
                onClick={() => handleLogTabChange('odoo')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeLogTab === 'odoo'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Odoo Log
              </button>
              <button
                onClick={() => handleLogTabChange('nginx-access')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeLogTab === 'nginx-access'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Nginx Access
              </button>
              <button
                onClick={() => handleLogTabChange('nginx-error')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeLogTab === 'nginx-error'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Nginx Error
              </button>
              <button
                onClick={() => handleLogTabChange('git-deploy')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeLogTab === 'git-deploy'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Git/Deploy
              </button>
            </div>
            
            {/* Contenido del log */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {logsLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto flex-1 text-sm font-mono">
                  {logs}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, instanceName: null, neutralize: true })}
        onConfirm={() => handleAction(confirmModal.action, confirmModal.instanceName)}
        title={getConfirmTitle(confirmModal.action)}
        message={getConfirmMessage(confirmModal.action, confirmModal.instanceName)}
        confirmText="Confirmar"
        cancelText="Cancelar"
        type={confirmModal.action === 'delete' ? 'danger' : 'warning'}
        showNeutralizeOption={confirmModal.action === 'update-db'}
        neutralize={confirmModal.neutralize}
        onNeutralizeChange={(value) => setConfirmModal({ ...confirmModal, neutralize: value })}
      />

      {/* Toast de notificaciones */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Modal de GitHub */}
      <GitHubModal
        isOpen={githubModal.show}
        onClose={() => setGithubModal({ show: false, instanceName: '' })}
        instanceName={githubModal.instanceName}
        onSuccess={() => {
          setToast({ show: true, message: 'GitHub conectado exitosamente', type: 'success' });
        }}
      />

      {/* Modal de eliminación de producción con doble confirmación */}
      {deleteProductionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Eliminar Instancia de Producción
              </h3>
            </div>

            {deleteProductionModal.step === 1 ? (
              <>
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
                    ⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Estás a punto de eliminar la instancia de producción <strong>{deleteProductionModal.instanceName}</strong>.
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                    Esto eliminará:
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside mt-1 space-y-1">
                    <li>La base de datos completa</li>
                    <li>Todos los archivos y código</li>
                    <li>El filestore (imágenes, PDFs, etc.)</li>
                    <li>La configuración de Nginx</li>
                    <li>El servicio systemd</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteProductionModal({ show: false, instanceName: '', confirmation: '', step: 1 })}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setDeleteProductionModal({ ...deleteProductionModal, step: 2 })}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Para confirmar la eliminación, escribe exactamente:
                </p>
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <code className="text-sm font-mono text-gray-900 dark:text-white">
                    BORRAR{deleteProductionModal.instanceName}
                  </code>
                </div>
                <input
                  type="text"
                  value={deleteProductionModal.confirmation}
                  onChange={(e) => setDeleteProductionModal({ ...deleteProductionModal, confirmation: e.target.value })}
                  placeholder={`BORRAR${deleteProductionModal.instanceName}`}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteProductionModal({ show: false, instanceName: '', confirmation: '', step: 1 })}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDeleteProduction}
                    disabled={actionLoading[`delete-prod-${deleteProductionModal.instanceName}`] || deleteProductionModal.confirmation !== `BORRAR${deleteProductionModal.instanceName}`}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading[`delete-prod-${deleteProductionModal.instanceName}`] ? 'Eliminando...' : 'Eliminar Definitivamente'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getConfirmTitle(action) {
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

function getConfirmMessage(action, instanceName) {
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

function InstanceCard({ instance, onAction, onViewLogs, onGitHub, actionLoading, isProduction }) {
  const statusColor = instance.status === 'active' ? 'text-green-600' : 'text-red-600';
  const statusBg = instance.status === 'active' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900';
  const [currentCommit, setCurrentCommit] = useState(null);
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Cargar commit actual cuando el componente se monta
  useEffect(() => {
    loadCurrentCommit();
  }, [instance.name]);

  const loadCurrentCommit = async () => {
    setLoadingCommit(true);
    try {
      const response = await github.getCurrentCommit(instance.name);
      if (response.data.success) {
        setCurrentCommit(response.data.commit);
      }
    } catch (error) {
      // Silenciosamente fallar si no hay config de Git
      console.log('No Git config for', instance.name);
    } finally {
      setLoadingCommit(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow relative">
      {/* Botón GitHub en esquina superior derecha - para todas las instancias */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        <button
          onClick={() => onGitHub(instance.name)}
          title="Conectar con GitHub para control de versiones"
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
        >
          <Github className="w-4 h-4" />
          <span className="hidden sm:inline">GitHub</span>
        </button>
        
        {/* Mostrar commit actual si existe */}
        {currentCommit && (
          <div className="flex items-center gap-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            <GitCommit className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            <span className="font-mono text-gray-700 dark:text-gray-300" title={currentCommit.message}>
              {currentCommit.short_hash}
            </span>
          </div>
        )}
      </div>
      
      {/* Header con info */}
      <div className="flex items-start gap-3 mb-4 pr-24">
        <div className={`${statusBg} p-2 rounded-lg flex-shrink-0`}>
          <Server className={`w-6 h-6 ${statusColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900 dark:text-white">{instance.name}</h4>
            <span className={`px-2 py-1 text-xs rounded-full ${statusBg} ${statusColor}`}>
              {instance.status}
            </span>
          </div>
          <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            {instance.domain && (
              <p className="truncate">🌐 <a href={`https://${instance.domain}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{instance.domain}</a></p>
            )}
            {instance.port && <p>🔌 Puerto: {instance.port}</p>}
            {instance.database && <p className="truncate">🗄️ BD: {instance.database}</p>}
          </div>
        </div>
      </div>

      {/* Botones de acción - responsive */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onAction('restart', instance.name)}
          disabled={actionLoading[`restart-${instance.name}`]}
          title="Reiniciar el servicio Odoo de esta instancia"
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${actionLoading[`restart-${instance.name}`] ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Reiniciar</span>
        </button>
        
        {!isProduction && (
          <>
            <button
              onClick={() => onAction('update-db', instance.name)}
              disabled={actionLoading[`update-db-${instance.name}`]}
              title="Actualizar la base de datos desde producción (incluye filestore)"
              className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">BD</span>
            </button>
            <button
              onClick={() => onAction('update-files', instance.name)}
              disabled={actionLoading[`update-files-${instance.name}`]}
              title="Actualizar el código fuente de Odoo desde producción"
              className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Archivos</span>
            </button>
            <button
              onClick={() => onAction('sync-filestore', instance.name)}
              disabled={actionLoading[`sync-filestore-${instance.name}`]}
              title="Sincronizar solo el filestore (imágenes, PDFs, assets) desde producción"
              className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <FolderSync className="w-4 h-4" />
              <span className="hidden sm:inline">Filestore</span>
            </button>
            <button
              onClick={() => onAction('regenerate-assets', instance.name)}
              disabled={actionLoading[`regenerate-assets-${instance.name}`]}
              title="Regenerar assets (CSS, JS, iconos) de Odoo"
              className="flex items-center gap-2 px-3 py-2 text-sm text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Assets</span>
            </button>
            <button
              onClick={() => onAction('delete', instance.name)}
              disabled={actionLoading[`delete-${instance.name}`]}
              title="Eliminar permanentemente esta instancia de desarrollo"
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          </>
        )}
        
        <button
          onClick={() => onViewLogs(instance.name)}
          title="Ver los logs del servicio systemd"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Logs</span>
        </button>
        
        {isProduction && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              title="Opciones de la instancia"
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <>
                {/* Overlay para cerrar el menú al hacer clic fuera */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                
                {/* Menú desplegable */}
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      window.location.href = '/backups-v2';
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded-t-lg"
                  >
                    <Database className="w-4 h-4" />
                    <span>Configurar Backups</span>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onAction('delete-production', instance.name);
                    }}
                    disabled={actionLoading[`delete-prod-${instance.name}`]}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Instancia</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}