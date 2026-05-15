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

  // Schedule new reminder for the reminder time
  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Daily Reminder!',
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

export const scheduleEveningReminder = async (resetHour: number, resetMinute: number, completed: number, total: number) => {
  if (Capacitor.getPlatform() === 'web') return;
  await setupNotifications();
  await LocalNotifications.cancel({ notifications: [{ id: 2 }] });

  if (total === 0) return;

  let evHour = resetHour - 4;
  if (evHour < 0) evHour += 24;
  
  const allDone = completed >= total;
  const body = allDone 
    ? 'All tasks completed, great job today!' 
    : `${total - completed} out of ${total} tasks left to complete. Let's finish strong!`;

  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Evening Check-in',
        body,
        id: 2,
        schedule: { 
          on: { 
            hour: evHour, 
            minute: resetMinute 
          }, 
          allowWhileIdle: true 
        },
        actionTypeId: '',
        extra: null
      }
    ]
  });
};

export const cancelResetReminder = async () => {
  if (Capacitor.getPlatform() === 'web') return;
  await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
};

export const cancelEveningReminder = async () => {
  if (Capacitor.getPlatform() === 'web') return;
  await LocalNotifications.cancel({ notifications: [{ id: 2 }] });
};
