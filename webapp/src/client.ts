import { type AppType } from '@server';
import { hc } from 'hono/client';

import {
  showErrorNotification,
  showSuccessNotification,
} from 'components/notification/notification';

import { endUserSession } from 'utils/auth';

export const client = hc<AppType>('/', {
  init: {
    credentials: 'include',
  },
  fetch: async (input: RequestInfo | URL, requestInit?: RequestInit) => {
    const response = await fetch(input, requestInit);
    const clone = response.clone();

    const responseStatus = response.status;
    if (responseStatus === 401) {
      endUserSession();
    }

    let json: { message?: string } = {};

    const contentType = response.headers.get('Content-Type') ?? '';

    if (contentType.includes('application/json')) {
      json = (await response.json()) as { message?: string };
    }

    const message = json.message;

    if (message) {
      (response.ok ? showSuccessNotification : showErrorNotification)({
        message,
      });
    }

    return clone;
  },
});
