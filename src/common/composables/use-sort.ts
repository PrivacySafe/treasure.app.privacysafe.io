/*
 Copyright (C) 2026 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
*/
import { useRouter } from 'vue-router';
import { APP_ROUTES } from '@/common/constants';
import type { TreasureRecord } from '@types';

export function useSort() {
  const router = useRouter();

  async function changeSort<T extends TreasureRecord>({ field, direction }: { field: keyof T; direction: 'asc' | 'desc' }) {
    const newRouterData = {
      name: APP_ROUTES.RECORD_LIST,
      query: {
        sortBy: field as string,
        sortOrder: direction,
      },
    };
    return router.push(newRouterData);
  }

  function sortTreasuresTableData(
    a: TreasureRecord,
    b: TreasureRecord,
    field: keyof TreasureRecord,
    direction: 'asc' | 'desc',
  ) {
    if (!['name', 'username'].includes(field as keyof TreasureRecord as string)) {
      return 0;
    }

    const aValue = field === 'username' ? a.username : `${a.name || a.resource}${a.resource}`;
    const bValue = field === 'username' ? b.username : `${b.name || b.resource}${b.resource}`;

    return aValue.toLowerCase() > bValue.toLowerCase()
      ? direction === 'desc'
        ? 1
        : -1
      : direction === 'desc'
        ? -1
        : 1;
  }

  return {
    changeSort,
    sortTreasuresTableData,
  };
}
