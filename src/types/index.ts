export interface ExcelRow {
  radicado: string;
  fecha: string;
  asunto: string;
  asignadoA: string;
  vencimiento: string;
  respuesta: string;
  estado: string;
  enlace: string;
}

export interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
}