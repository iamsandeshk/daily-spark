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

export const scheduleStreakReminder = async (resetHour: number, resetMinute: number, completed: number, total: number) => {
  if (Capacitor.getPlatform() === 'web') return;
  await setupNotifications();
  await LocalNotifications.cancel({ notifications: [{ id: 3 }] });

  // Only trigger if no tasks have been completed today, and there are tasks to do
  if (total === 0 || completed > 0) return;

  let stHour = resetHour - 3;
  if (stHour < 0) stHour += 24;

  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Streak Warning!',
        body: "Don't break your streak! You haven't completed any tasks today. You have 3 hours left before your day resets!",
        id: 3,
        schedule: { 
          on: { 
            hour: stHour, 
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

export const cancelStreakReminder = async () => {
  if (Capacitor.getPlatform() === 'web') return;
  await LocalNotifications.cancel({ notifications: [{ id: 3 }] });
};

export const scheduleStreakGoalNotification = async (streakGoal: number) => {
  if (Capacitor.getPlatform() === 'web') return;
  await setupNotifications();

  // Clear existing streak goal notification
  await LocalNotifications.cancel({ notifications: [{ id: 4 }] });

  // Schedule 2 hours in the future
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Streak Goal Achieved! 🎉',
        body: `Unbelievable! You've successfully hit your ${streakGoal}-day streak goal! Keep this momentum going! 🔥`,
        id: 4,
        schedule: {
          at: twoHoursFromNow,
          allowWhileIdle: true
        },
        actionTypeId: '',
        extra: null
      }
    ]
  });
};

export const cancelStreakGoalNotification = async () => {
  if (Capacitor.getPlatform() === 'web') return;
  await LocalNotifications.cancel({ notifications: [{ id: 4 }] });
};
