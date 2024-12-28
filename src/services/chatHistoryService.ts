interface ChatHistoryData {
  userId: string;
  phoneNumber: string;
  query: string;
}

export const saveChatHistory = async (data: ChatHistoryData): Promise<void> => {
  try {
    const response = await fetch('/api/chat-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        chatDate: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save chat history');
    }
  } catch (error) {
    console.error('Error saving chat history:', error);
    throw error;
  }
};
