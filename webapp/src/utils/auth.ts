import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

import { USER_COOKIE_NAME } from '@cs4211/common/const';
import {
  type UserJwtPayloadSchema,
  userJwtPayloadSchema,
} from '@cs4211/common/schemas';

export function isUserAuthenticated() {
  return getUserSession() !== null;
}

export function endUserSession() {
  try {
    Cookies.remove(USER_COOKIE_NAME);
  } catch (error) {
    console.error('Error removing user cookie:', error);
  }
  location.reload();
}

function getUserSession(): UserJwtPayloadSchema | null {
  try {
    const cookie = Cookies.get(USER_COOKIE_NAME);
    if (!cookie) return null;
    const userSession = userJwtPayloadSchema.parse(jwtDecode(cookie));
    return userSession;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}
