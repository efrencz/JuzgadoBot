import React, { useState, useEffect } from 'react';
import EventCalendar from '../components/EventCalendar';
import EventCard from '../components/EventCard';
import { format, parseISO, startOfDay, isEqual } from 'date-fns';
import { es } from 'date-fns/locale';
import { getEvents } from '../services/api';

interface Event {
  actividad: string;
  horaInicio: string;
  enlaceAudiencia: string;
  fecha: string; // Fecha en formato ISO
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await getEvents();
      console.log('Eventos recibidos del servidor:', response);

      if (!response.events) {
        console.error('Respuesta del servidor sin eventos:', response);
        throw new Error('Formato de respuesta inválido');
      }

      setEvents(response.events);
      console.log('Eventos guardados en el estado:', response.events);
      setError(null);
    } catch (err) {
      console.error('Error detallado al cargar eventos:', err);
      setError('Error al cargar los eventos. Por favor, intente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    try {
      if (!event.fecha) {
        console.warn('Evento sin fecha:', event);
        return false;
      }

      // Usar la fecha ISO directamente
      const eventDate = startOfDay(new Date(event.fecha));
      const selectedDateStart = startOfDay(selectedDate);
      
      console.log('Comparando fechas:', {
        evento: format(eventDate, 'yyyy-MM-dd'),
        seleccionada: format(selectedDateStart, 'yyyy-MM-dd'),
        coincide: isEqual(eventDate, selectedDateStart)
      });

      return isEqual(eventDate, selectedDateStart);
    } catch (error) {
      console.error('Error al comparar fechas:', error, 'para el evento:', event);
      return false;
    }
  });

  console.log('Eventos filtrados para la fecha seleccionada:', {
    fecha: format(selectedDate, 'yyyy-MM-dd'),
    eventos: filteredEvents
  });

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">CALENDARIO</h1>
        <p className="text-gray-600">
          {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="calendar-container">
          <EventCalendar
            events={events}
            onDateSelect={(date) => {
              console.log('Nueva fecha seleccionada:', format(date, 'yyyy-MM-dd'));
              setSelectedDate(date);
            }}
            selectedDate={selectedDate}
          />
        </div>

        <div className="events-list bg-gray-50 p-6 rounded-lg">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando eventos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredEvents.map((event, index) => (
                <EventCard
                  key={index}
                  actividad={event.actividad}
                  horaInicio={event.horaInicio}
                  enlaceAudiencia={event.enlaceAudiencia}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No hay eventos programados para este día</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
