import {
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class TelegramClientApi implements ICredentialType {
    name = 'telegramClientApi';
    displayName = 'Telegram Client API';
    documentationUrl = 'https://core.telegram.org/api';
    
    properties: INodeProperties[] = [
        {
            displayName: 'API ID',
            name: 'apiId',
            type: 'number',
            default: '',
            required: true,
            description: 'API ID from my.telegram.org',
        },
        {
            displayName: 'API Hash',
            name: 'apiHash',
            type: 'string',
            default: '',
            required: true,
            description: 'API Hash from my.telegram.org',
            typeOptions: {
                password: true,
            },
        },
        {
            displayName: 'Phone Number',
            name: 'phoneNumber',
            type: 'string',
            default: '',
            required: true,
            placeholder: '+1234567890',
            description: 'Phone number in international format',
        },
        {
            displayName: 'Password (2FA)',
            name: 'password',
            type: 'string',
            default: '',
            required: false,
            description: '2FA password if enabled',
            typeOptions: {
                password: true,
            },
        },
        {
            displayName: 'Session String',
            name: 'session',
            type: 'string',
            default: '',
            required: false,
            description: 'Session string for reusing existing sessions. Will be auto-populated after first login.',
            typeOptions: {
                password: true,
            },
        },
    ];
}