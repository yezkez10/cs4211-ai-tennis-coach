import {
  type NotificationData,
  type NotificationsStore,
  showNotification,
} from '@mantine/notifications';
import { IconCheck, IconInfoSmall, IconX } from '@tabler/icons-react';

import {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_SUCCESS_MESSAGE,
} from '@cs4211/common/const';

import { theme } from 'theme';

export function showInfomationNotification(
  notificationData: NotificationData,
  store?: NotificationsStore,
): void {
  showNotification(
    {
      ...notificationData,
      message: notificationData.message,
      title: notificationData.title ?? 'Information',
      color: notificationData.color ?? theme.primaryColor,
      icon: <IconInfoSmall />,
    },
    store,
  );
}

export function showSuccessNotification(
  notificationData: NotificationData = {
    message: DEFAULT_SUCCESS_MESSAGE,
  },
  store?: NotificationsStore,
): void {
  showNotification(
    {
      ...notificationData,
      message: notificationData.message ?? DEFAULT_SUCCESS_MESSAGE,
      title: notificationData.title ?? 'Success',
      color: notificationData.color ?? 'teal',
      icon: <IconCheck />,
    },
    store,
  );
}

export function showErrorNotification(
  notificationData: NotificationData = {
    message: DEFAULT_ERROR_MESSAGE,
  },
  store?: NotificationsStore,
): void {
  showNotification(
    {
      ...notificationData,
      message: notificationData.message ?? DEFAULT_ERROR_MESSAGE,
      title: notificationData.title ?? 'Error',
      color: notificationData.color ?? 'red',
      icon: <IconX />,
    },
    store,
  );
}
