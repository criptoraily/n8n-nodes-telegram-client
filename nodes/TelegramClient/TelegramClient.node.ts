import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IDataObject,
    ICredentialDataDecryptedObject,
} from 'n8n-workflow';
import { 
    TelegramClient as TgramClient, 
    createDocumentAttributes,
    type Message,
    type ChatMember,
    type DocumentAttributeVideo,
    type DocumentAttributeAudio,
} from '../../sdk/telegram';
import { StringSession } from '../../sdk/telegram';

export class TelegramClient implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Telegram Client',
        name: 'telegramClient',
        icon: 'file:telegrams.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Use Telegram Client API',
        defaults: {
            name: 'Telegram Client'
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'telegramClientApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Send Message',
                        value: 'sendMessage',
                        description: 'Send a text message',
                        action: 'Send a text message',
                    },
                    {
                        name: 'Send Media Message',
                        value: 'sendMediaMessage',
                        description: 'Send a media message (photo, video, etc.)',
                        action: 'Send a media message',
                    },
                    {
                        name: 'Send File',
                        value: 'sendFile',
                        description: 'Send any type of file',
                        action: 'Send a file',
                    },
                    {
                        name: 'Reply To Message',
                        value: 'replyToMessage',
                        description: 'Reply to a specific message',
                        action: 'Reply to a message',
                    },
                    {
                        name: 'Forward Message',
                        value: 'forwardMessage',
                        description: 'Forward a message to another chat',
                        action: 'Forward a message',
                    },
                    {
                        name: 'Delete Messages',
                        value: 'deleteMessages',
                        description: 'Delete one or more messages',
                        action: 'Delete messages',
                    },
                    {
                        name: 'Get Message History',
                        value: 'getMessageHistory',
                        description: 'Get chat message history',
                        action: 'Get message history',
                    },
                    {
                        name: 'Get Chat Members',
                        value: 'getChatMembers',
                        description: 'Get all members of a chat',
                        action: 'Get chat members',
                    },
                    {
                        name: 'Join Chat',
                        value: 'joinChat',
                        description: 'Join a chat or channel',
                        action: 'Join a chat',
                    },
                    {
                        name: 'Leave Chat',
                        value: 'leaveChat',
                        description: 'Leave a chat or channel',
                        action: 'Leave a chat',
                    },
                    {
                        name: 'Get User Info',
                        value: 'getUserInfo',
                        description: 'Get information about a user',
                        action: 'Get user information',
                    },
                    {
                        name: 'Search Messages',
                        value: 'searchMessages',
                        description: 'Search for messages globally or in a specific chat',
                        action: 'Search messages',
                    },
                ],
                default: 'sendMessage',
            },
            {
                displayName: 'Chat ID',
                name: 'chatId',
                type: 'string',
                default: '',
                required: true,
                description: 'Chat/Channel ID or username (e.g., @username or -100xxxx)',
                displayOptions: {
                    show: {
                        operation: [
                            'sendMessage',
                            'sendMediaMessage',
                            'sendFile',
                            'replyToMessage',
                            'forwardMessage',
                            'deleteMessages',
                            'getMessageHistory',
                            'getChatMembers',
                            'joinChat',
                            'leaveChat',
                            'searchMessages',
                        ],
                    },
                },
            },
            {
                displayName: 'User ID',
                name: 'userId',
                type: 'string',
                default: '',
                required: true,
                description: 'User ID or username to get information about',
                displayOptions: {
                    show: {
                        operation: [
                            'getUserInfo',
                        ],
                    },
                },
            },
            {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: '',
                description: 'Text of the message to send',
                displayOptions: {
                    show: {
                        operation: [
                            'sendMessage',
                            'replyToMessage',
                        ],
                    },
                },
                required: true,
            },
            {
                displayName: 'File Path Or URL',
                name: 'filePath',
                type: 'string',
                default: '',
                description: 'Path or URL of the file to send',
                displayOptions: {
                    show: {
                        operation: [
                            'sendMediaMessage',
                            'sendFile',
                        ],
                    },
                },
                required: true,
            },
            {
                displayName: 'Media Type',
                name: 'mediaType',
                type: 'options',
                displayOptions: {
                    show: {
                        operation: [
                            'sendMediaMessage',
                        ],
                    },
                },
                options: [
                    {
                        name: 'Photo',
                        value: 'photo',
                    },
                    {
                        name: 'Video',
                        value: 'video',
                    },
                    {
                        name: 'Audio',
                        value: 'audio',
                    },
                    {
                        name: 'Voice',
                        value: 'voice',
                    },
                    {
                        name: 'Document',
                        value: 'document',
                    },
                ],
                default: 'photo',
                required: true,
            },
            {
                displayName: 'Message ID',
                name: 'messageId',
                type: 'number',
                default: 0,
                description: 'ID of the message',
                displayOptions: {
                    show: {
                        operation: [
                            'replyToMessage',
                            'forwardMessage',
                            'deleteMessages',
                        ],
                    },
                },
                required: true,
            },
            {
                displayName: 'To Chat ID',
                name: 'toChatId',
                type: 'string',
                default: '',
                description: 'Chat ID to forward the message to',
                displayOptions: {
                    show: {
                        operation: [
                            'forwardMessage',
                        ],
                    },
                },
                required: true,
            },
            {
                displayName: 'Search Query',
                name: 'query',
                type: 'string',
                default: '',
                description: 'Text to search for in messages',
                displayOptions: {
                    show: {
                        operation: [
                            'searchMessages',
                        ],
                    },
                },
                required: true,
            },
            {
                displayName: 'Options',
                name: 'options',
                type: 'collection',
                placeholder: 'Add Option',
                default: {},
                options: [
                    {
                        displayName: 'Silent',
                        name: 'silent',
                        type: 'boolean',
                        default: false,
                        description: 'Send message silently without notification',
                    },
                    {
                        displayName: 'Caption',
                        name: 'caption',
                        type: 'string',
                        default: '',
                        description: 'Caption for media messages',
                    },
                    {
                        displayName: 'Parse Mode',
                        name: 'parseMode',
                        type: 'options',
                        options: [
                            {
                                name: 'None',
                                value: 'none',
                            },
                            {
                                name: 'Markdown',
                                value: 'markdown',
                            },
                            {
                                name: 'HTML',
                                value: 'html',
                            },
                        ],
                        default: 'none',
                        description: 'How to parse the message text',
                    },
                    {
                        displayName: 'Limit',
                        name: 'limit',
                        type: 'number',
                        default: 100,
                        description: 'Maximum number of items to return',
                    },
                ],
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const credentials = await this.getCredentials('telegramClientApi');

        if (!credentials) {
            throw new Error('No credentials provided');
        }

        const client = new TgramClient(
            new StringSession(credentials.session as string),
            credentials.apiId as number,
            credentials.apiHash as string,
            {
                connectionRetries: 5,
                useWSS: true,
            }
        );

        try {
            await client.connect();

            for (let i = 0; i < items.length; i++) {
                const operation = this.getNodeParameter('operation', i) as string;
                
                try {
                    switch (operation) {
                        case 'sendMessage': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                            const messageText = this.getNodeParameter('messageText', i) as string;
                            const options = this.getNodeParameter('options', i, {}) as IDataObject;

                            const result = await client.sendMessage(chatId, {
                                message: messageText,
                                silent: options.silent as boolean,
                                parseMode: options.parseMode as string === 'none' ? undefined : options.parseMode as string,
                            });

                            returnData.push({
                                json: {
                                    success: true,
                                    messageId: result.id,
                                    date: result.date,
                                    text: messageText,
                                }
                            });
                            break;
                        }

                        case 'sendMediaMessage': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                            const filePath = this.getNodeParameter('filePath', i) as string;
                            const mediaType = this.getNodeParameter('mediaType', i) as string;
                            const options = this.getNodeParameter('options', i, {}) as IDataObject;

                            let attributes: Array<DocumentAttributeVideo | DocumentAttributeAudio> = [];

                            if (mediaType === 'video') {
                                attributes.push(createDocumentAttributes.video({
                                    supportsStreaming: true,
                                }));
                            } else if (mediaType === 'audio') {
                                attributes.push(createDocumentAttributes.audio({
                                    voice: false,
                                }));
                            } else if (mediaType === 'voice') {
                                attributes.push(createDocumentAttributes.audio({
                                    voice: true,
                                }));
                            }

                            const result = await client.sendFile(chatId, {
                                file: filePath,
                                caption: options.caption as string,
                                silent: options.silent as boolean,
                                forceDocument: mediaType === 'document',
                                attributes,
                            });

                            returnData.push({
                                json: {
                                    success: true,
                                    messageId: result.id,
                                    date: result.date,
                                    mediaType,
                                }
                            });
                            break;
                        }

                        case 'getMessageHistory': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                            const options = this.getNodeParameter('options', i, {}) as IDataObject;
                            const limit = (options.limit as number) || 100;

                            const messages = await client.getMessages(chatId, {
                                limit,
                            });

                            returnData.push({
                                json: {
                                    success: true,
                                    messages: messages,
                                }
                            });
                            break;
                        }

                        case 'deleteMessages': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                            const messageId = this.getNodeParameter('messageId', i) as number;

                            await client.deleteMessages(chatId, [messageId], {
                                revoke: true,
                            });

                            returnData.push({
                                json: {
                                    success: true,
                                    deletedMessageId: messageId,
                                }
                            });
                            break;
                        }

                        case 'getChatMembers': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                            const options = this.getNodeParameter('options', i, {}) as IDataObject;
                            const limit = (options.limit as number) || 100;

                            const participants = await client.getParticipants(chatId, {
                                limit,
                            });

                            returnData.push({
                                json: {
                                    success: true,
                                    members: participants,
                                }
                            });
                            break;
                        }

                        case 'getUserInfo': {
                            const userId = this.getNodeParameter('userId', i) as string;
                            const user = await client.getEntity(userId);
                            
                            returnData.push({
                                json: {
                                    success: true,
                                    user,
                                }
                            });
                            break;
                        }

                        case 'searchMessages': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                            const query = this.getNodeParameter('query', i) as string;
                            const options = this.getNodeParameter('options', i, {}) as IDataObject;
                            const limit = (options.limit as number) || 100;

                            const messages = await client.getMessages(chatId, {
                                search: query,
                                limit,
                            });

                            returnData.push({
                                json: {
                                    success: true,
                                    messages,
                                }
                            });
                            break;
                        }

                        case 'forwardMessage': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                            const messageId = this.getNodeParameter('messageId', i) as number;
                            const toChatId = this.getNodeParameter('toChatId', i) as string;
                            
                            const results = await client.forwardMessages(toChatId, {
                                messages: [messageId],
                                fromPeer: chatId,
                            });
                            
                            returnData.push({
                                json: {
                                    success: true,
                                    originalMessageId: messageId,
                                    forwardedMessages: results,
                                    fromChatId: chatId,
                                    toChatId,
                                }
                            });
                            break;
                        }
                        case 'replyToMessage': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                            const messageText = this.getNodeParameter('messageText', i) as string;
                            const replyToMessageId = this.getNodeParameter('messageId', i) as number;
                            const options = this.getNodeParameter('options', i, {}) as IDataObject;

                            const result = await client.sendMessage(chatId, {
                                message: messageText,
                                replyTo: replyToMessageId,
                                silent: options.silent as boolean,
                                parseMode: options.parseMode as string === 'none' ? undefined : options.parseMode as string,
                            });

                            returnData.push({
                                json: {
                                    success: true,
                                    messageId: result.id,
                                    replyToMessageId,
                                    date: result.date,
                                    text: messageText,
                                }
                            });
                            break;
                        }

                        case 'sendFile': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                            const filePath = this.getNodeParameter('filePath', i) as string;
                            const options = this.getNodeParameter('options', i, {}) as IDataObject;

                            const result = await client.sendFile(chatId, {
                                file: filePath,
                                caption: options.caption as string,
                                silent: options.silent as boolean,
                                forceDocument: true,
                            });

                            returnData.push({
                                json: {
                                    success: true,
                                    messageId: result.id,
                                    date: result.date,
                                    filePath,
                                }
                            });
                            break;
                        }

                        case 'joinChat': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                            
                            await client.joinChannel(chatId);
                            
                            returnData.push({
                                json: {
                                    success: true,
                                    joined: true,
                                    chatId,
                                }
                            });
                            break;
                        }
                        
                        case 'leaveChat': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                            
                            await client.leaveChannel(chatId);
                            
                            returnData.push({
                                json: {
                                    success: true,
                                    left: true,
                                    chatId,
                                }
                            });
                            break;
                        }
                        default: {
                            throw new Error(`Operation "${operation}" is not supported`);
                        }
                    }
                } catch (error: unknown) {
                    if (this.continueOnFail()) {
                        returnData.push({
                            json: {
                                success: false,
                                error: error instanceof Error ? error.message : 'An unknown error occurred',
                                operation,
                            }
                        });
                        continue;
                    }
                    throw error instanceof Error ? error : new Error('An unknown error occurred');
                }
            }
        } finally {
            if (client?.connected) {
                try {
                    await client.disconnect();
                } catch (error) {
                    console.error('Error disconnecting client:', error);
                }
            }
        }

        return [returnData];
    }

    async authenticate(credentials: ICredentialDataDecryptedObject): Promise<any> {
        const client = new TgramClient(
            new StringSession(credentials.session as string),
            credentials.apiId as number,
            credentials.apiHash as string,
            {
                connectionRetries: 5,
                useWSS: true,
            }
        );

        try {
            await client.connect();
            return client;
        } catch (error) {
            throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}