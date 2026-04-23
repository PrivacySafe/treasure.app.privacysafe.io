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
export const en = {
  app: {
    title: 'Treasure',
    exit: 'Exit',
    status: {
      label: 'Status',
      online: 'Online',
      offline: 'Offline',
    },
  },
  list: {
    create: 'New Record',
    createGroup: 'New Group',
    editGroup: 'Edit Group',
    addToFavorites: 'Add To Favorites',
    removeFromFavorites: 'Remove from Favorites',
    copyUsername: 'Copy Username',
    copyRecord: 'Copy Record',
    all: 'All Records',
    favorites: 'Favorites',
    search: 'Search records',
    noData: 'No records here',
    notifications: {
      success: {
        saving: 'The {entity} was saved successfully.',
        deleting: 'The {entity} was deleted successfully.',
      },
      error: {
        saving: `Oops. Error saving {entity} '{name}'. Try again later, please.`,
        deleting: `Oops. Error deleting {entity} '{name}. Try again later, please.'`,
      },
      warning: {
        delete: 'You cannot delete the group. There are records in this group.',
      },
    },
  },
  recordDialog: {
    title: {
      add: 'Add New Record',
      edit: 'The Record Details',
    },
    btn: {
      close: 'Close',
      create: 'Create',
      discard: 'Discard',
      save: 'Save Changes',
      delete: 'Delete The Record',
    },
    form: {
      fields: {
        name: {
          label: 'Service name',
          placeholder: 'Enter the current record name',
        },
        resource: {
          label: 'Resource',
          placeholder: 'Enter the current record resource name or domain',
          required: 'The resource field cannot be empty. ',
          unique: 'There is already a record with the same values in fields resource and username. ',
        },
        username: {
          label: 'Username',
          placeholder: 'Enter the user name for the selected resource',
          required: 'The username field cannot be empty. ',
          unique: 'There is already a record with the same values in fields username and resource. ',
        },
        password: {
          label: 'Password',
          placeholder: 'Enter the password',
          required: 'The password field cannot be empty. ',
        },
        group: {
          label: 'Group',
          placeholder: 'Select the group',
        },
      },
      btns: {
        generate: 'Generate password',
      },
    },
  },
  groupDialog: {
    title: {
      add: 'Add New Group',
      edit: 'The Group Details',
    },
    btn: {
      close: 'Close',
      create: 'Create',
      save: 'Save Changes',
      delete: 'Delete The Group',
    },
    form: {
      fields: {
        name: {
          label: 'Group Name',
          placeholder: 'Enter the group name',
          required: 'The group name field cannot be empty. ',
          unique: 'There is already a group with the same name. ',
        },
        description: {
          label: 'Group Description',
          placeholder: 'Enter the group description',
        },
      },
    },
  },
  confirmationDeleteGroupDialog: {
    title: 'Delete Group',
    text: 'Are you sure you want to delete this group?',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
  },
  confirmationDeleteRecordDialog: {
    title: 'Delete Record',
    text: 'Are you sure you want to delete this record?',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
  },
  treasuresTable: {
    header: {
      name: 'Name',
      sync: 'Sync',
      username: 'Username',
      password: 'Password',
    },
    nodata: 'No records in current group.',
    row: {
      copiedBtn: 'Copied',
      duplicateTooltip: 'There is another record with the same `resource` and `username` values',
    },
  },
};
