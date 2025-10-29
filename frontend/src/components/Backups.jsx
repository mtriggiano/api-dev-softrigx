import { useState, useEffect } from 'react';
import { Database, AlertCircle, ExternalLink } from 'lucide-react';

export default function Backups() {
  const [backupInfo, setBackupInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBackupInfo();
  }, []);

  const fetchBackupInfo = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/backup/info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setBackupInfo(data);
    } catch (error) {
      console.error('Error fetching backup info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBackupManager = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/backup/manager', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        // Abrir en nueva pestaña con el HTML recibido
        const newWindow = window.open('', '_blank');
        newWindow.document.write(html);
        newWindow.document.close();
      } else {
        alert('Error al acceder al gestor de backups');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al acceder al gestor de backups');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
            <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestor de Backups</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Administra las bases de datos de Odoo</p>
          </div>
        </div>
      </div>

      {/* Información */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Puedes crear, duplicar, eliminar y respaldar bases de datos</li>
              <li>Los backups se descargan automáticamente a tu computadora</li>
              <li>Asegúrate de tener la contraseña maestra de Odoo</li>
              <li>Esta página accede directamente al gestor de Odoo en el puerto 8069</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botón para abrir el gestor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="text-center">
            <Database className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Acceder al Gestor de Backups
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              El gestor de backups se abrirá en una nueva pestaña y te permitirá administrar
              las bases de datos de la instancia de <strong>producción</strong> de Odoo.
            </p>
            
            {backupInfo && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>URL de producción:</strong>
                  <br />
                  <code className="text-blue-600 dark:text-blue-400">{backupInfo.full_url}</code>
                </p>
              </div>
            )}
            
            <button
              onClick={handleOpenBackupManager}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Abrir Gestor de Backups
            </button>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              🔒 Necesitarás la contraseña maestra de Odoo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
