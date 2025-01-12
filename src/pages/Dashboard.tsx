import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import { Download, Trash2 } from 'lucide-react';
import { changeAdminPassword } from '../api';

interface Conversation {
  query: string;
  response: any;
}

interface ChatStat {
  id: number;
  userName: string;
  phoneNumber: string;
  totalConsultas: number;
  fechaUltimaConsulta: string;
  fechaPrimeraConsulta: string;
  conversations: Conversation[];
}

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Verificar que el usuario esté autenticado
      if (!AuthService.isAuthenticated()) {
        setError('No hay sesión activa. Por favor, inicie sesión nuevamente.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      await changeAdminPassword(currentPassword, newPassword);
      setSuccess('Contraseña actualizada correctamente');
      setError('');
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setSuccess('');
      }, 2000);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Sesión expirada o contraseña actual incorrecta');
        if (!AuthService.isAuthenticated()) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } else {
        setError(error.response?.data?.message || 'Error al cambiar la contraseña. Verifica tus datos.');
      }
      setSuccess('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Cambiar Contraseña</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Contraseña Actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          {success && <p className="text-green-500 mb-2">{success}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ChatStat[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState('');
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await AuthService.getStats();
        console.log('Stats response:', response);
        
        // Extraer el array de datos de la respuesta
        const chatData = response.data.map((item: any) => ({
          id: item.id,
          userName: item.userName,
          phoneNumber: item.phoneNumber,
          totalConsultas: item.queries.length,
          fechaUltimaConsulta: item.updatedAt,
          fechaPrimeraConsulta: item.createdAt,
          conversations: item.queries.map((query: string, index: number) => ({
            query,
            response: item.responses[index] || ''
          }))
        }));
        
        setStats(chatData);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching stats:', error);
        if (error instanceof Error && error.message === 'Sesión expirada') {
          navigate('/admin');
        } else {
          setError(error instanceof Error ? error.message : 'Error al cargar estadísticas');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Actualizar cada 5 minutos en lugar de cada 30 segundos
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSearch = () => {
    if (!searchPhone) {
      return;
    }
    const filtered = stats.filter(stat => 
      stat.phoneNumber.includes(searchPhone)
    );
    setStats(filtered);
  };

  const resetSearch = async () => {
    setSearchPhone('');
    try {
      const response = await AuthService.getStats();
      const chatData = response.data.map((item: any) => ({
        id: item.id,
        userName: item.userName,
        phoneNumber: item.phoneNumber,
        totalConsultas: item.queries.length,
        fechaUltimaConsulta: item.updatedAt,
        fechaPrimeraConsulta: item.createdAt,
        conversations: item.queries.map((query: string, index: number) => ({
          query,
          response: item.responses[index] || ''
        }))
      }));
      setStats(chatData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error resetting search:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:3000/export/chat-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al exportar los datos');
      }

      // Obtener el blob del CSV
      const blob = await response.blob();
      
      // Crear URL del blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento <a> temporal
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chat_history.csv';
      
      // Añadir al documento y hacer clic
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('¿Estás seguro de que deseas limpiar todo el historial? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      await AuthService.clearHistory();
      
      // Actualizar la vista después de limpiar
      const response = await AuthService.getStats();
      const chatData = response.data.map((item: any) => ({
        id: item.id,
        userName: item.userName,
        phoneNumber: item.phoneNumber,
        totalConsultas: item.queries.length,
        fechaUltimaConsulta: item.updatedAt,
        fechaPrimeraConsulta: item.createdAt,
        conversations: item.queries.map((query: string, index: number) => ({
          query,
          response: item.responses[index] || ''
        }))
      }));
      
      setStats(chatData);
      setLastUpdate(new Date());
      alert('Historial limpiado exitosamente');
    } catch (error) {
      console.error('Error al limpiar el historial:', error);
      alert('Error al limpiar el historial: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button
          onClick={() => navigate('/admin')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Volver al login
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
          <p className="text-gray-600">
            Última actualización: {formatDate(lastUpdate.toISOString())}
          </p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2"
            disabled={loading}
          >
            <Download size={20} />
            Exportar Historial
          </button>
          <button
            onClick={handleClearHistory}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2 disabled:opacity-50"
            disabled={loading}
          >
            <Trash2 size={20} />
            {loading ? 'Limpiando...' : 'Limpiar Historial'}
          </button>
          <button
            onClick={() => {
              AuthService.logout();
              navigate('/admin');
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Cerrar Sesión
          </button>
          <button
            onClick={() => setIsChangePasswordModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Cambiar Contraseña
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          placeholder="Buscar por teléfono"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Buscar
        </button>
        <button
          onClick={resetSearch}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Resetear
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {stats.map((stat) => (
            <div key={stat.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold mb-2">{stat.userName}</h2>
                  <p className="text-gray-600">{stat.phoneNumber}</p>
                  <p className="text-gray-600">Total consultas: {stat.totalConsultas}</p>
                  <p className="text-gray-600">
                    Primera consulta: {formatDate(stat.fechaPrimeraConsulta)}
                  </p>
                  <p className="text-gray-600">
                    Última consulta: {formatDate(stat.fechaUltimaConsulta)}
                  </p>
                </div>
                <button
                  onClick={() => toggleExpanded(stat.id)}
                  className="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200"
                >
                  {expandedItems[stat.id] ? 'Ocultar' : 'Ver consultas'}
                </button>
              </div>

              {expandedItems[stat.id] && stat.conversations && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Historial de Consultas</h3>
                  <div className="space-y-4">
                    {stat.conversations.map((conv, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded">
                        <div className="mb-2">
                          <span className="font-medium">Consulta:</span>
                          <p className="ml-4 text-gray-700">{conv.query}</p>
                        </div>
                        <div>
                          <span className="font-medium">Respuesta:</span>
                          <p className="ml-4 text-gray-700 whitespace-pre-wrap">
                            {typeof conv.response === 'string' 
                              ? conv.response 
                              : JSON.stringify(conv.response, null, 2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
