import { useState, useEffect } from 'react';
import { logs } from '../lib/api';
import { FileText, Filter, Download } from 'lucide-react';
import { formatDate } from '../lib/utils';

export default function Logs() {
  const [logList, setLogList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    instance: '',
    action: '',
    hours: 24
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      const params = {};
      if (filters.instance) params.instance = filters.instance;
      if (filters.action) params.action = filters.action;
      if (filters.hours) params.hours = filters.hours;

      const response = await logs.list(params);
      setLogList(response.data.logs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await logs.getStats(filters.hours);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      create_instance: 'bg-blue-100 text-blue-800',
      delete_instance: 'bg-red-100 text-red-800',
      update_db: 'bg-green-100 text-green-800',
      update_files: 'bg-purple-100 text-purple-800',
      restart_instance: 'bg-yellow-100 text-yellow-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    return status === 'success' ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Logs de Acciones</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Historial de operaciones realizadas en el servidor</p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Total de Acciones</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Exitosas</p>
            <p className="text-2xl font-bold text-green-600">{stats.success}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Errores</p>
            <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Tasa de Éxito</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instancia</label>
            <input
              type="text"
              value={filters.instance}
              onChange={(e) => setFilters({ ...filters, instance: e.target.value })}
              placeholder="Nombre de instancia"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Acción</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              <option value="create_instance">Crear Instancia</option>
              <option value="delete_instance">Eliminar Instancia</option>
              <option value="update_db">Actualizar BD</option>
              <option value="update_files">Actualizar Archivos</option>
              <option value="restart_instance">Reiniciar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Período</label>
            <select
              value={filters.hours}
              onChange={(e) => setFilters({ ...filters, hours: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">Última hora</option>
              <option value="6">Últimas 6 horas</option>
              <option value="24">Últimas 24 horas</option>
              <option value="72">Últimos 3 días</option>
              <option value="168">Última semana</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Registros ({logList.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {logList.length === 0 ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-300">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No hay logs para mostrar con los filtros seleccionados</p>
            </div>
          ) : (
            logList.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 dark:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      {log.instance_name && (
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {log.instance_name}
                        </span>
                      )}
                      <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                        {log.status === 'success' ? '✓' : '✗'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{log.details}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>👤 {log.username}</span>
                      <span>🕐 {formatDate(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
