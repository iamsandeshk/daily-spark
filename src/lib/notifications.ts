import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const setupNotifications = async () => {
  if (Capacitor.getPlatform() === 'web') return;

  // Request permissions
  let permStatus = await LocalNotifications.checkPermissions();
  if (permStatus.display !== 'granted') {
    permStatus = await LocalNotifications.requestPermissions();
  }

  if (permStatus.display !== 'granted') {
    console.warn('Notification permissions not granted');
    return;
  }
};

export const scheduleResetReminder = async (hour: number, minute: number) => {
  if (Capacitor.getPlatform() === 'web') return;
  
  await setupNotifications();

  // Clear existing reminders
  await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

  // Schedule new reminder for the reset time
  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Daily Reset Time!',
        body: 'Time to plan your day and start your routines.',
        id: 1,
        schedule: { 
          on: { 
            hour, 
            minute 
          }, 
          allowWhileIdle: true 
        },
        actionTypeId: '',
        extra: null
      }
    ]
  });
};
