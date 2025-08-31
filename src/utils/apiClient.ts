import { $fc as $apiFc } from 'src/app/api/frourio.client';

export const apiClient = $apiFc({ init: { credentials: 'same-origin' } });
