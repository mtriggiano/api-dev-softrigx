import { useState, useEffect } from 'react';
import { Github, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import { github } from '../lib/api';

export default function GitHubModal({ isOpen, onClose, instanceName, onSuccess }) {
  const [step, setStep] = useState('input'); // input, verifying, configuring, success, error, git-actions
  const [githubToken, setGithubToken] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [githubUser, setGithubUser] = useState(null);
  const [existingConfig, setExistingConfig] = useState(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [gitStatus, setGitStatus] = useState(null);
  const [gitLoading, setGitLoading] = useState(false);
  const [gitSuccess, setGitSuccess] = useState('');

  useEffect(() => {
    if (isOpen && instanceName) {
      checkExistingConfig();
    }
  }, [isOpen, instanceName]);

  const checkExistingConfig = async () => {
    try {
      const response = await github.getConfig(instanceName);
      if (response.data.success && response.data.config) {
        setExistingConfig(response.data.config);
        setStep('git-actions');
        loadGitStatus();
      }
    } catch (error) {
      // No hay configuración existente, continuar normal
      setExistingConfig(null);
    }
  };

  const loadGitStatus = async () => {
    try {
      const response = await github.getStatus(instanceName);
      if (response.data.success) {
        setGitStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading git status:', error);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setError('Debes ingresar un mensaje de commit');
      return;
    }

    setGitLoading(true);
    setError('');
    setGitSuccess('');

    try {
      const response = await github.commit(instanceName, commitMessage);
      if (response.data.success) {
        setGitSuccess('Commit creado exitosamente');
        setCommitMessage('');
        loadGitStatus();
      } else {
        setError(response.data.error || 'Error al crear commit');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear commit');
    } finally {
      setGitLoading(false);
    }
  };

  const handlePush = async () => {
    setGitLoading(true);
    setError('');
    setGitSuccess('');

    try {
      const response = await github.push(instanceName);
      if (response.data.success) {
        setGitSuccess('Push realizado exitosamente');
        loadGitStatus();
      } else {
        setError(response.data.error || 'Error al hacer push');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al hacer push');
    } finally {
      setGitLoading(false);
    }
  };

  const handlePull = async () => {
    setGitLoading(true);
    setError('');
    setGitSuccess('');

    try {
      const response = await github.pull(instanceName);
      if (response.data.success) {
        setGitSuccess('Pull realizado exitosamente');
        loadGitStatus();
      } else {
        setError(response.data.error || 'Error al hacer pull');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al hacer pull');
    } finally {
      setGitLoading(false);
    }
  };

  const parseRepoUrl = (url) => {
    // Soporta: https://github.com/owner/repo o github.com/owner/repo
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (match) {
      return {
        owner: match[1],
        name: match[2]
      };
    }
    return null;
  };

  const handleConnect = async () => {
    // Limpiar espacios en blanco del token y URL
    const cleanToken = githubToken.trim();
    const cleanUrl = repoUrl.trim();
    
    if (!cleanToken || !cleanUrl) {
      setError('Debes completar todos los campos');
      return;
    }

    const repo = parseRepoUrl(cleanUrl);
    if (!repo) {
      setError('URL de repositorio inválida. Usa el formato: https://github.com/usuario/repositorio');
      return;
    }

    setLoading(true);
    setError('');
    setStep('verifying');

    try {
      // 1. Verificar token
      const verifyResponse = await github.verifyToken(cleanToken);
      if (!verifyResponse.data.success) {
        throw new Error('Token de GitHub inválido');
      }
      
      setGithubUser(verifyResponse.data);
      setStep('configuring');

      // 2. Crear configuración
      const configData = {
        instance_name: instanceName,
        github_token: cleanToken,
        repo_owner: repo.owner,
        repo_name: repo.name,
        repo_branch: instanceName, // Usar el nombre de la instancia como rama
        local_path: `/home/go/apps/develop/odoo-enterprise/${instanceName}/custom_addons`
      };

      const configResponse = await github.createConfig(configData);
      if (!configResponse.data.success) {
        throw new Error('Error al crear la configuración');
      }

      // 3. Inicializar repositorio
      const initResponse = await github.initRepo(instanceName);
      if (!initResponse.data.success) {
        const errorMsg = initResponse.data.error || 'Error al inicializar el repositorio';
        throw new Error(errorMsg);
      }

      setStep('success');
      setTimeout(() => {
        onSuccess && onSuccess();
        handleClose();
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al conectar con GitHub');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setGithubToken('');
    setRepoUrl('');
    setError('');
    setGithubUser(null);
    setExistingConfig(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gray-900 dark:bg-gray-700 p-2 rounded-lg">
            <Github className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {step === 'git-actions' ? 'Control de Versiones Git' : 'Conectar con GitHub'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Instancia: {instanceName}
            </p>
          </div>
        </div>

        {/* Controles Git */}
        {step === 'git-actions' && existingConfig && (
          <div className="space-y-4">
            {/* Info del repositorio */}
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  {existingConfig.repo_owner}/{existingConfig.repo_name} • {existingConfig.repo_branch}
                </span>
              </div>
            </div>

            {/* Estado del repositorio */}
            {gitStatus && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Estado del repositorio
                </p>
                {gitStatus.has_changes ? (
                  <div className="space-y-1">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {gitStatus.changes.length} archivo(s) modificado(s)
                    </p>
                    <div className="max-h-24 overflow-y-auto text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
                      {gitStatus.changes.slice(0, 5).map((change, idx) => (
                        <div key={idx}>• {change.file}</div>
                      ))}
                      {gitStatus.changes.length > 5 && (
                        <div className="text-blue-500">... y {gitStatus.changes.length - 5} más</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    No hay cambios pendientes
                  </p>
                )}
              </div>
            )}

            {/* Mensajes de éxito/error */}
            {gitSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {gitSuccess}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            {/* Commit */}
            {gitStatus && gitStatus.has_changes && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mensaje del commit
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Descripción de los cambios..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleCommit()}
                />
                <button
                  onClick={handleCommit}
                  disabled={gitLoading || !commitMessage.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {gitLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Commit (git add . && git commit)'
                  )}
                </button>
              </div>
            )}

            {/* Botones Push/Pull */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePush}
                disabled={gitLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {gitLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  '↑ Push'
                )}
              </button>
              <button
                onClick={handlePull}
                disabled={gitLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {gitLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  '↓ Pull'
                )}
              </button>
            </div>

            {/* Botón Cerrar */}
            <button
              onClick={handleClose}
              className="w-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Formulario de entrada */}
        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Token de GitHub
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Genera un token en GitHub Settings → Developer settings → Personal access tokens
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL del Repositorio
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/usuario/repositorio"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Se creará automáticamente una rama llamada <strong>{instanceName}</strong> en tu repositorio
                  y se conectará la carpeta custom_addons.
                </span>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConnect}
                disabled={loading}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    Conectar
                  </>
                )}
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Verificando token */}
        {step === 'verifying' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">Verificando token de GitHub...</p>
          </div>
        )}

        {/* Configurando */}
        {step === 'configuring' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Configurando repositorio...</p>
            {githubUser && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Usuario: {githubUser.username}
              </p>
            )}
          </div>
        )}

        {/* Éxito */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3 mb-4">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold text-lg mb-2">
              ¡Conectado exitosamente!
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
              Tu repositorio está listo para usar con la rama <strong>{instanceName}</strong>
            </p>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4">
              <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-3 mb-4">
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-gray-900 dark:text-white font-semibold text-lg mb-2">
                Error al conectar
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                {error}
              </p>
            </div>
            <button
              onClick={() => setStep('input')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
