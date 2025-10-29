import { useState, useEffect } from 'react';
import { metrics } from '../lib/api';
import { Cpu, HardDrive, Activity, Network, Clock, Server } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatUptime } from '../lib/utils';

export default function Dashboard() {
  const [currentMetrics, setCurrentMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const [current, hist] = await Promise.all([
        metrics.getCurrent(),
        metrics.getHistory(60)
      ]);
      setCurrentMetrics(current.data);
      setHistory(hist.data.metrics || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentMetrics) {
    return <div className="text-center text-gray-600 dark:text-gray-300">No hay datos disponibles</div>;
  }

  const { cpu, memory, disk, network, system } = currentMetrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Estado del Servidor</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{system.hostname}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Clock className="w-5 h-5" />
              <span>Uptime: {system.uptime_formatted}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{system.platform} {system.platform_release}</p>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Cpu className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">CPU</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{cpu.percent}%</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Cores</span>
              <span className="font-medium">{cpu.count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${cpu.percent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* RAM */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">RAM</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{memory.percent}%</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Usado</span>
              <span className="font-medium">{memory.used_gb} GB / {memory.total_gb} GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${memory.percent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Disco */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <HardDrive className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Disco</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {disk[0]?.percent || 0}%
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Usado</span>
              <span className="font-medium">
                {disk[0]?.used_gb || 0} GB / {disk[0]?.total_gb || 0} GB
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${disk[0]?.percent || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Red */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Network className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Red</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {network.speed_mbps_recv.toFixed(2)} MB/s
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">↓ Recibido</span>
              <span className="font-medium">{network.mb_recv} MB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">↑ Enviado</span>
              <span className="font-medium">{network.mb_sent} MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">CPU - Últimos 60 minutos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleTimeString('es-AR')}
                formatter={(value) => [`${value}%`, 'CPU']}
              />
              <Line type="monotone" dataKey="cpu_percent" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* RAM History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">RAM - Últimos 60 minutos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleTimeString('es-AR')}
                formatter={(value) => [`${value}%`, 'RAM']}
              />
              <Line type="monotone" dataKey="ram_percent" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Discos */}
      {disk.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Particiones de Disco</h3>
          <div className="space-y-4">
            {disk.map((partition, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{partition.mountpoint}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{partition.device} ({partition.fstype})</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{partition.percent}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {partition.used_gb} GB / {partition.total_gb} GB
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${partition.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
