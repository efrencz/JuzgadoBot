import React from 'react';
import { Clock, Link } from 'lucide-react';

interface EventCardProps {
  actividad: string;
  horaInicio: string;
  enlaceAudiencia: string;
}

const EventCard: React.FC<EventCardProps> = ({ actividad, horaInicio, enlaceAudiencia }) => {
  return (
    <div className="event-card">
      <h3 className="event-title">{actividad}</h3>
      <div className="event-time">
        <Clock size={16} />
        <span>{horaInicio}</span>
      </div>
      <a 
        href={enlaceAudiencia} 
        target="_blank" 
        rel="noopener noreferrer"
        className="event-link"
      >
        <Link size={16} />
        <span>Ver audiencia</span>
      </a>

      <style jsx>{`
        .event-card {
          background: white;
          border-radius: 8px;
          padding: 16px;
          margin: 12px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .event-card:hover {
          transform: translateY(-2px);
        }
        .event-title {
          margin: 0 0 12px 0;
          font-size: 1.1rem;
          color: #2c3e50;
        }
        .event-time {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          margin-bottom: 12px;
        }
        .event-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #3498db;
          text-decoration: none;
          padding: 8px 16px;
          background: #f8f9fa;
          border-radius: 4px;
          width: fit-content;
        }
        .event-link:hover {
          background: #e9ecef;
        }
      `}</style>
    </div>
  );
};

export default EventCard;
