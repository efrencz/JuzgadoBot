export interface ChatMessageType {
  role: 'user' | 'bot';
  content: string | any; // Permitir tanto strings como objetos
}

export interface SearchResult {
  source: 'Hoja 1' | 'Hoja 3';
  radicado: string;
  predio: string;
  municipio: string;
  solicitante: string;
  opositor?: string;
  estado?: string;
  ultimaActuacion?: string;
  fechaProvidencia?: string;
  fechaNotificacion?: string;
  diasUltimaActuacion?: string;
  enlace?: string;
  sustanciador?: string;
  fechaSentencia?: string;
  enlaceSentencia?: string;
}
