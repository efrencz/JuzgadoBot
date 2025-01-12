import { sendQuery, endChat } from './src/services/api.ts';

async function testChat() {
  const userId = "test_user";
  const phoneNumber = "1234567890";

  try {
    // Simular algunas consultas
    console.log("Enviando consultas...");
    await sendQuery("Hola, ¿cómo estás?", undefined, userId, phoneNumber);
    await sendQuery("¿Qué tiempo hace hoy?", undefined, userId, phoneNumber);
    await sendQuery("Gracias por tu ayuda", undefined, userId, phoneNumber);

    // Finalizar el chat
    console.log("Finalizando chat...");
    await endChat(userId, phoneNumber);
    
    console.log("Prueba completada exitosamente");
  } catch (error) {
    console.error("Error durante la prueba:", error);
  }
}

testChat();
