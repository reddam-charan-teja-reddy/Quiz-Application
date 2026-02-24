import fs from 'node:fs';

import { sharedUserFilePath } from './shared-user.js';

export default async function globalSetup() {
  const sharedUser = {
    username: `e2e_user_${Date.now()}`,
    password: 'testpass123',
  };

  fs.writeFileSync(sharedUserFilePath, JSON.stringify(sharedUser), 'utf8');
}
