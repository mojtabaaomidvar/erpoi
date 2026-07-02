// src/shared/authorization/components/UserRoleManager.tsx

import { useState } from 'react';
import { Role } from '../types';
import { ROLES } from '../roles';
import { useRole } from '../hooks/useRole';
import { Users } from '@pages/Users';

export function UserRoleManager() {
  return <Users />;
}