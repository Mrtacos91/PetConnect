export const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // This is a placeholder. In a real app, you'd integrate with a notification system
  // like react-toastify or your custom notification component
  console[type === 'error' ? 'error' : 'log'](`${type.toUpperCase()}: ${message}`);
  
  // Example with a browser alert for demo purposes
  alert(`${type.toUpperCase()}: ${message}`);
};
