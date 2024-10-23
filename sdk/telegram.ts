import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';

export class StringSession {
    private session: string;

    constructor(string: string = '') {
        this.session = string;
    }

    save(): string {
        return this.session;
    }
}

export class TelegramClient {
    private api: AxiosInstance;
    private session: StringSession;
    private apiId: number;
    private apiHash: string;
    public connected: boolean = false;

    constructor(
        session: StringSession,
        apiId: number,
        apiHash: string,
        options: {
            connectionRetries?: number;
            useWSS?: boolean;
            [key: string]: any;
        } = {}
    ) {
        this.session = session;
        this.apiId = apiId;
        this.apiHash = apiHash;
        this.api = axios.create({
            baseURL: 'https://api.telegram.org',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async connect(): Promise<void> {
        this.connected = true;
    }

    async disconnect(): Promise<void> {
        this.connected = false;
    }

    async sendMessage(
        entity: string | number,
        options: {
            message: string;
            replyTo?: number;
            silent?: boolean;
            parseMode?: string;
            [key: string]: any;
        }
    ): Promise<any> {
        const params = {
            chat_id: entity,
            text: options.message,
            parse_mode: options.parseMode,
            reply_to_message_id: options.replyTo,
            disable_notification: options.silent
        };

        const response = await this.api.post(`/bot${this.apiHash}/sendMessage`, params);
        return {
            id: response.data.result.message_id,
            date: new Date(response.data.result.date * 1000),
            text: options.message
        };
    }

    async sendFile(
        entity: string | number,
        options: {
            file: string | Buffer;
            caption?: string;
            silent?: boolean;
            forceDocument?: boolean;
            attributes?: any[];
            [key: string]: any;
        }
    ): Promise<any> {
        const formData = new FormData();
        
        if (typeof options.file === 'string') {
            formData.append('document', createReadStream(options.file));
        } else if (Buffer.isBuffer(options.file)) {
            formData.append('document', options.file, { filename: 'file' });
        }

        formData.append('chat_id', entity.toString());
        if (options.caption) formData.append('caption', options.caption);
        if (options.silent) formData.append('disable_notification', 'true');

        const response = await this.api.post(
            `/bot${this.apiHash}/sendDocument`,
            formData,
            {
                headers: { ...formData.getHeaders() }
            }
        );

        return {
            id: response.data.result.message_id,
            date: new Date(response.data.result.date * 1000)
        };
    }

    async getMessages(
        entity: string | number,
        options: {
            limit?: number;
            search?: string;
            [key: string]: any;
        } = {}
    ): Promise<any[]> {
        const params = {
            chat_id: entity,
            limit: options.limit || 100
        };

        const response = await this.api.get(`/bot${this.apiHash}/getUpdates`, { params });
        return response.data.result.map((msg: any) => ({
            id: msg.message_id,
            date: new Date(msg.date * 1000),
            text: msg.text,
            fromId: msg.from.id
        }));
    }

    async getParticipants(
        entity: string | number,
        options: {
            limit?: number;
            [key: string]: any;
        } = {}
    ): Promise<any[]> {
        const response = await this.api.get(`/bot${this.apiHash}/getChatMembers`, {
            params: {
                chat_id: entity
            }
        });

        return response.data.result.map((member: any) => ({
            id: member.user.id,
            firstName: member.user.first_name,
            lastName: member.user.last_name,
            username: member.user.username,
            bot: member.user.is_bot
        }));
    }

    async deleteMessages(
        entity: string | number,
        messageIds: number[],
        options: {
            revoke?: boolean;
            [key: string]: any;
        } = {}
    ): Promise<void> {
        await Promise.all(
            messageIds.map(id =>
                this.api.post(`/bot${this.apiHash}/deleteMessage`, {
                    chat_id: entity,
                    message_id: id
                })
            )
        );
    }

    async getInputEntity(entity: string | number): Promise<any> {
        const response = await this.api.get(`/bot${this.apiHash}/getChat`, {
            params: { chat_id: entity }
        });
        return response.data.result;
    }

    /**
     * Get information about a user or chat
     */
    async getEntity(userId: string | number): Promise<any> {
        try {
            const response = await this.api.get(`/bot${this.apiHash}/getUser`, {
                params: { user_id: userId }
            });
            
            const user = response.data.result;
            return {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                phone: user.phone_number,
                bot: user.is_bot,
                verified: user.is_verified,
                restricted: user.is_restricted,
                scam: user.is_scam,
                fake: user.is_fake
            };
        } catch (error) {
            throw new Error('Failed to get user information');
        }
    }

    /**
     * Forward messages to another chat
     */
    async forwardMessages(
        toChatId: string | number,
        options: {
            messages: number[];
            fromPeer: string | number;
            [key: string]: any;
        }
    ): Promise<any[]> {
        const results = await Promise.all(
            options.messages.map(async messageId => {
                const response = await this.api.post(`/bot${this.apiHash}/forwardMessage`, {
                    chat_id: toChatId,
                    from_chat_id: options.fromPeer,
                    message_id: messageId
                });

                return {
                    id: response.data.result.message_id,
                    date: new Date(response.data.result.date * 1000)
                };
            })
        );

        return results;
    }

    /**
     * Search for messages in a chat
     */
    async searchMessages(
        chatId: string | number,
        query: string,
        options: {
            limit?: number;
            [key: string]: any;
        } = {}
    ): Promise<any[]> {
        const response = await this.api.get(`/bot${this.apiHash}/searchMessages`, {
            params: {
                chat_id: chatId,
                query,
                limit: options.limit || 100
            }
        });

        return response.data.result.map((msg: any) => ({
            id: msg.message_id,
            date: new Date(msg.date * 1000),
            text: msg.text,
            fromId: msg.from.id
        }));
    }

    /**
     * Edit a message
     */
    async editMessage(
        entity: string | number,
        messageId: number,
        text: string,
        options: {
            parseMode?: string;
            [key: string]: any;
        } = {}
    ): Promise<any> {
        const response = await this.api.post(`/bot${this.apiHash}/editMessageText`, {
            chat_id: entity,
            message_id: messageId,
            text,
            parse_mode: options.parseMode
        });

        return {
            id: response.data.result.message_id,
            text: response.data.result.text,
            date: new Date(response.data.result.date * 1000)
        };
    }

    /**
     * Get chat information
     */
    async getChat(chatId: string | number): Promise<any> {
        const response = await this.api.get(`/bot${this.apiHash}/getChat`, {
            params: { chat_id: chatId }
        });

        const chat = response.data.result;
        return {
            id: chat.id,
            title: chat.title,
            type: chat.type,
            username: chat.username,
            firstName: chat.first_name,
            lastName: chat.last_name,
            description: chat.description,
            memberCount: chat.member_count
        };
    }

    /**
     * Pin a message in a chat
     */
    async pinMessage(
        chatId: string | number,
        messageId: number,
        options: {
            silent?: boolean;
            [key: string]: any;
        } = {}
    ): Promise<boolean> {
        await this.api.post(`/bot${this.apiHash}/pinChatMessage`, {
            chat_id: chatId,
            message_id: messageId,
            disable_notification: options.silent
        });

        return true;
    }

    /**
     * Unpin a message in a chat
     */
    async unpinMessage(
        chatId: string | number,
        messageId?: number
    ): Promise<boolean> {
        if (messageId) {
            await this.api.post(`/bot${this.apiHash}/unpinChatMessage`, {
                chat_id: chatId,
                message_id: messageId
            });
        } else {
            await this.api.post(`/bot${this.apiHash}/unpinAllChatMessages`, {
                chat_id: chatId
            });
        }

        return true;
    }

    /**
     * Get chat administrators
     */
    async getAdministrators(chatId: string | number): Promise<any[]> {
        const response = await this.api.get(`/bot${this.apiHash}/getChatAdministrators`, {
            params: { chat_id: chatId }
        });

        return response.data.result.map((admin: any) => ({
            userId: admin.user.id,
            username: admin.user.username,
            firstName: admin.user.first_name,
            lastName: admin.user.last_name,
            status: admin.status,
            isOwner: admin.status === 'creator',
            canEdit: admin.can_edit_messages,
            canDelete: admin.can_delete_messages,
            canManageChat: admin.can_manage_chat
        }));
    }

    invoke(request: any): Promise<any> {
        if (request && request.className) {
            switch (request.className) {
                case 'channels.JoinChannel':
                    return this.api.post(`/bot${this.apiHash}/joinChat`, {
                        chat_id: request.channel
                    });
                case 'channels.LeaveChannel':
                    return this.api.post(`/bot${this.apiHash}/leaveChat`, {
                        chat_id: request.channel
                    });
                default:
                    throw new Error(`Unknown request type: ${request.className}`);
            }
        }
        throw new Error('Invalid request format');
    }
}

export const Api = {
    DocumentAttributeVideo: class {
        constructor(params: any) {
            return { ...params, className: 'DocumentAttributeVideo' };
        }
    },
    DocumentAttributeAudio: class {
        constructor(params: any) {
            return { ...params, className: 'DocumentAttributeAudio' };
        }
    },
    channels: {
        JoinChannel: class {
            constructor(params: any) {
                return { ...params, className: 'channels.JoinChannel' };
            }
        },
        LeaveChannel: class {
            constructor(params: any) {
                return { ...params, className: 'channels.LeaveChannel' };
            }
        }
    }
};