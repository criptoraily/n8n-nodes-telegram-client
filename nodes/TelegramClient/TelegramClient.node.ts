import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IDataObject,
} from 'n8n-workflow';
import { TelegramClient as TgramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as tl from 'telegram/tl';


export class TelegramClient implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Telegram Client',
        name: 'telegramClient',
        icon: 'file:telegram.svg',
        group: ['communication'],
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
                    },
                    {
                        name: 'Send Media Message',
                        value: 'sendMediaMessage',
                        description: 'Send a media message (photo, video, etc.)',
                    },
                    {
                        name: 'Send File',
                        value: 'sendFile',
                        description: 'Send any type of file',
                    },
                    {
                        name: 'Reply To Message',
                        value: 'replyToMessage',
                        description: 'Reply to a specific message',
                    },
                    {
                        name: 'Forward Message',
                        value: 'forwardMessage',
                        description: 'Forward a message to another chat',
                    },
                    {
                        name: 'Delete Messages',
                        value: 'deleteMessages',
                        description: 'Delete one or more messages',
                    },
                    {
                        name: 'Get Message History',
                        value: 'getMessageHistory',
                        description: 'Get chat message history',
                    },
                    {
                        name: 'Get Chat Members',
                        value: 'getChatMembers',
                        description: 'Get all members of a chat',
                    },
                    {
                        name: 'Join Chat',
                        value: 'joinChat',
                        description: 'Join a chat or channel',
                    },
                    {
                        name: 'Leave Chat',
                        value: 'leaveChat',
                        description: 'Leave a chat or channel',
                    },
                    {
                        name: 'Get User Info',
                        value: 'getUserInfo',
                        description: 'Get information about a user',
                    },
                    {
                        name: 'Search Messages',
                        value: 'searchMessages',
                        description: 'Search for messages globally or in a specific chat',
                    },
                ],
                default: 'sendMessage',
            },
            {
                displayName: 'Chat ID',
                name: 'chatId',
                type: 'string',
                required: true,
                default: '',
                description: 'Chat/Channel ID or username',
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
            // Message Text
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
            // Media Parameters
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
            // Message IDs for operations that need them
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
            // Additional Options
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
                        description: 'Send message silently',
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
                    },
                    {
                        displayName: 'Limit',
                        name: 'limit',
                        type: 'number',
                        default: 100,
                        description: 'Maximum number of messages to get',
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

                            const sendOptions: any = {
                                file: filePath,
                                caption: options.caption as string,
                                silent: options.silent as boolean,
                                forceDocument: mediaType === 'document',
                            };

                            if (mediaType === 'video') {
                                sendOptions.attributes = [
                                    new tl.Api.DocumentAttributeVideo({
                                        supportsStreaming: true,
                                        duration: 0,
                                        w: 0,
                                        h: 0,
                                    })
                                ];
                            } else if (mediaType === 'audio') {
                                sendOptions.attributes = [
                                    new tl.Api.DocumentAttributeAudio({
                                        voice: false,
                                        duration: 0,
                                    })
                                ];
                            } else if (mediaType === 'voice') {
                                sendOptions.attributes = [
                                    new tl.Api.DocumentAttributeAudio({
                                        voice: true,
                                        duration: 0,
                                    })
                                ];
                            }

                            const result = await client.sendFile(chatId, sendOptions);

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
                                    messages: messages.map(message => ({
                                        id: message.id,
                                        date: message.date,
                                        text: message.text,
                                        fromId: message.fromId,
                                        media: message.media ? {
                                            type: message.media.className,
                                        } : null,
                                    })),
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
                                    members: participants.map(participant => ({
                                        id: participant.id,
                                        firstName: participant.firstName,
                                        lastName: participant.lastName,
                                        username: participant.username,
                                        phone: participant.phone,
                                        bot: participant.bot,
                                        scam: participant.scam,
                                        fake: participant.fake,
                                    })),
                                    total: participants.length,
                                }
                            });
                            break;
                        }

                        case 'joinChat': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                    
                            await client.invoke(new tl.Api.channels.JoinChannel({
                                channel: await client.getInputEntity(chatId),
                            }));
                    
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
                    
                            await client.invoke(new tl.Api.channels.LeaveChannel({
                                channel: await client.getInputEntity(chatId),
                            }));
                    
                            returnData.push({
                                json: {
                                    success: true,
                                    left: true,
                                    chatId,
                                }
                            });
                            break;
                        }

                        case 'getUserInfo': {
                            const userId = this.getNodeParameter('userId', i) as string;
                            
                            try {
                                // קבלת הישות
                                const entity = await client.getEntity(userId);
                        
                                // בדיקה האם זו ישות מסוג User באמצעות המאפיינים הזמינים
                                if ('firstName' in entity || 'username' in entity) {
                                    returnData.push({
                                        json: {
                                            success: true,
                                            user: {
                                                id: String(entity.id || ''),
                                                firstName: (entity as any).firstName || '',
                                                lastName: (entity as any).lastName || '',
                                                username: (entity as any).username || '',
                                                phone: (entity as any).phone || '',
                                                bot: Boolean((entity as any).bot),
                                                verified: Boolean((entity as any).verified),
                                                restricted: Boolean((entity as any).restricted),
                                                scam: Boolean((entity as any).scam),
                                                fake: Boolean((entity as any).fake),
                                            }
                                        }
                                    });
                                } else {
                                    throw new Error('The provided ID is not a valid user');
                                }
                            } catch (error) {
                                if (this.continueOnFail()) {
                                    returnData.push({
                                        json: {
                                            success: false,
                                            error: error instanceof Error ? error.message : 'Failed to get user info',
                                            operation: 'getUserInfo',
                                        }
                                    });
                                    continue;
                                }
                                throw error;
                            }
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
                                    messages: messages.map(message => ({
                                        id: message.id,
                                        date: message.date,
                                        text: message.text,
                                        fromId: message.fromId,
                                    })),
                                    total: messages.length,
                                }
                            });
                            break;
                        }

                        case 'forwardMessage': {
                            const chatId = this.getNodeParameter('chatId', i) as string;
                            const messageId = this.getNodeParameter('messageId', i) as number;
                            const toChatId = this.getNodeParameter('toChatId', i) as string;

                            const result = await client.forwardMessages(toChatId, {
                                messages: [messageId],
                                fromPeer: chatId,
                            });

                            returnData.push({
                                json: {
                                    success: true,
                                    originalMessageId: messageId,
                                    forwardedMessageId: result[0].id,
                                    fromChatId: chatId,
                                    toChatId,
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
        } catch (error) {
            if (this.continueOnFail()) {
                return [returnData];
            }
            throw error;
        } finally {
            // Always disconnect the client when done
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
}