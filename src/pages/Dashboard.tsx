import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';

interface Conversation {
  query: string;
  response: any;
}

interface ChatStat {
  date: string;
  userId: string;
  phoneNumber: string;
  conversations: Conversation[];
  count: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<ChatStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndFetchStats = async () => {
      try {
        const isAuthenticated = await AuthService.verifyToken();
        if (!isAuthenticated) {
          AuthService.logout();
          navigate('/admin');
          return;
        }

        const data = await AuthService.getStats();
        setStats(data);
      } catch (error) {
        if (error instanceof Error && error.message === 'Sesión expirada') {
          navigate('/admin');
        } else {
          setError(error instanceof Error ? error.message : 'Error al cargar estadísticas');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchStats();
  }, [navigate]);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/admin');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      time: date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const toggleExpand = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const formatResponse = (response: any) => {
    if (typeof response === 'string') {
      try {
        response = JSON.parse(response);
      } catch {
        return response;
      }
    }

    if (Array.isArray(response)) {
      return response.map((item, index) => (
        <div key={index} className="mb-2">
          {Object.entries(item).map(([key, value]) => (
            <div key={key} className="ml-2">
              <span className="font-medium">{key}:</span> {String(value)}
            </div>
          ))}
        </div>
      ));
    }

    return JSON.stringify(response, null, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold">Panel de Control</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Historial de Conversaciones
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Historial detallado de conversaciones por usuario
              </p>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {stats.map((stat, index) => {
                  const { date, time } = formatDateTime(stat.date);
                  const isExpanded = expandedItem === index;

                  return (
                    <li 
                      key={index} 
                      className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleExpand(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-gray-900">
                            Usuario: {stat.userId}
                          </p>
                          <p className="text-sm text-gray-500">
                            Teléfono: {stat.phoneNumber}
                          </p>
                        </div>
                        <div className="flex flex-col text-right">
                          <p className="text-sm text-gray-900">
                            {date}
                          </p>
                          <p className="text-sm text-gray-500">
                            {time}
                          </p>
                          <p className="text-sm font-medium text-indigo-600">
                            Mensajes: {stat.count}
                          </p>
                        </div>
                      </div>
                      
                      {/* Conversaciones expandibles */}
                      {isExpanded && stat.conversations && (
                        <div className="mt-4 space-y-4">
                          {stat.conversations.map((conv, convIndex) => (
                            <div key={convIndex} className="bg-gray-50 rounded-lg p-4">
                              <div className="mb-3">
                                <div className="flex items-start space-x-2">
                                  <div className="flex-shrink-0">
                                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                      <span className="text-sm font-medium text-gray-700">U</span>
                                    </div>
                                  </div>
                                  <div className="flex-1 bg-blue-100 rounded-lg p-3">
                                    <p className="text-sm text-gray-900">{conv.query}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="flex items-start space-x-2">
                                  <div className="flex-shrink-0">
                                    <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                      <span className="text-sm font-medium text-white">B</span>
                                    </div>
                                  </div>
                                  <div className="flex-1 bg-indigo-50 rounded-lg p-3">
                                    <div className="text-sm text-gray-900">
                                      {formatResponse(conv.response)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
