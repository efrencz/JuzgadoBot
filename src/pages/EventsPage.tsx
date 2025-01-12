import React, { useState, useEffect } from 'react';
import EventCalendar from '../components/EventCalendar';
import EventCard from '../components/EventCard';
import { format, parseISO, startOfDay, isEqual, isValid, utcToZonedTime, zonedTimeToUtc } from 'date-fns';
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
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return startOfDay(today);
  });
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEvents();
      
      if (!response || !response.events) {
        throw new Error('No se pudieron cargar los eventos');
      }

      setEvents(response.events);
      console.log('Eventos cargados:', response.events);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
      setError('No se pudieron cargar los eventos. Por favor, intente más tarde.');
      setEvents([{
        fecha: new Date().toISOString(),
        actividad: "Error al cargar eventos",
        horaInicio: "",
        enlaceAudiencia: ""
      }]);
    } finally {
      setLoading(false);
    }
  };

  const filterEventsByDate = (events: Event[], selectedDate: Date) => {
    // Convertir la fecha seleccionada a formato YYYY-MM-DD
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const selectedDateStr = `${year}-${month}-${day}`;
    
    console.log('=== FILTRANDO EVENTOS ===');
    console.log('Fecha seleccionada:', selectedDateStr);
    console.log('Eventos disponibles:', events.map(e => ({
      actividad: e.actividad,
      fecha: e.fecha
    })));
    
    const filteredEvents = events.filter(event => {
      if (!event.fecha) return false;
      
      // Extraer solo la fecha del evento (puede venir con hora)
      const eventDate = event.fecha.split(' ')[0];
      const matches = eventDate === selectedDateStr;
      
      console.log('Comparando:', {
        actividad: event.actividad,
        fechaEvento: eventDate,
        fechaBuscada: selectedDateStr,
        coincide: matches
      });
      
      return matches;
    });
    
    console.log('Eventos encontrados:', filteredEvents);
    return filteredEvents;
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      const filtered = filterEventsByDate(events, selectedDate);
      setFilteredEvents(filtered);
    }
  }, [events, selectedDate]);

  const handleDateChange = (date: Date) => {
    console.log('Nueva fecha seleccionada:', {
      fecha: date.toISOString(),
      componentes: {
        año: date.getFullYear(),
        mes: date.getMonth() + 1,
        día: date.getDate()
      }
    });
    
    setSelectedDate(date);
    const filtered = filterEventsByDate(events, date);
    setFilteredEvents(filtered);
  };

  console.log('Eventos filtrados para la fecha seleccionada:', {
    fecha: format(selectedDate, 'yyyy-MM-dd'),
    total: events.length,
    filtrados: filteredEvents.length,
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
            onDateSelect={handleDateChange}
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
