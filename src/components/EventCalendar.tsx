import React from 'react';
import Calendar from 'react-calendar';
import { format, parseISO, isEqual, startOfDay } from 'date-fns';
import 'react-calendar/dist/Calendar.css';

interface Event {
  actividad: string;
  horaInicio: string;
  enlaceAudiencia: string;
  fecha: string; // Fecha en formato ISO
}

interface EventCalendarProps {
  events: Event[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ events, onDateSelect, selectedDate }) => {
  // Función para verificar si una fecha tiene eventos
  const tileClassName = ({ date }: { date: Date }) => {
    const hasEvent = events.some(event => {
      try {
        if (!event.fecha) {
          console.warn('Evento sin fecha:', event);
          return false;
        }
        
        // La fecha ya viene en formato ISO, así que podemos usarla directamente
        const eventDate = startOfDay(new Date(event.fecha));
        const tileDate = startOfDay(date);
        
        const result = isEqual(eventDate, tileDate);
        if (result) {
          console.log('Evento encontrado para la fecha:', {
            fecha: event.fecha,
            actividad: event.actividad
          });
        }
        return result;
      } catch (error) {
        console.error('Error al comparar fechas en tileClassName:', error, 'para el evento:', event);
        return false;
      }
    });

    return hasEvent ? 'has-event' : '';
  };

  return (
    <div className="calendar-wrapper">
      <Calendar
        onChange={onDateSelect}
        value={selectedDate}
        tileClassName={tileClassName}
        locale="es-ES"
      />
      <style>
        {`
          .calendar-wrapper {
            max-width: 100%;
            margin: auto;
          }
          .react-calendar {
            width: 100%;
            border: none;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 16px;
          }
          .react-calendar__tile {
            padding: 1em 0.5em;
            position: relative;
          }
          .has-event {
            background-color: #e3f2fd;
            color: #1976d2;
            font-weight: bold;
          }
          .has-event:hover {
            background-color: #bbdefb !important;
          }
          .react-calendar__tile--active {
            background-color: #1976d2 !important;
            color: white !important;
          }
          .react-calendar__tile--now {
            background-color: #f5f5f5;
          }
          .react-calendar__navigation button {
            font-size: 1.2em;
            padding: 8px;
          }
          .react-calendar__navigation button:hover {
            background-color: #f5f5f5;
          }
          .react-calendar__month-view__weekdays__weekday {
            padding: 8px 0;
            text-transform: uppercase;
            font-size: 0.8em;
            font-weight: bold;
            color: #666;
          }
        `}
      </style>
    </div>
  );
};

export default EventCalendar;
