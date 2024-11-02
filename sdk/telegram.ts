import { MTProto } from '@mtproto/core';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

// Interfaces for document attributes and other types
interface DocumentAttributeVideo {
    _: 'documentAttributeVideo';
    supportsStreaming?: boolean;
    duration: number;
    w: number;
    h: number;
}

interface DocumentAttributeAudio {
    _: 'documentAttributeAudio';
    voice: boolean;
    duration: number;
}

interface Message {
    id: number;
    date: number;
    text: string;
    fromId?: string | number;
    media?: any;
}

interface ChatMember {
    id: string | number;
    firstName?: string;
    lastName?: string;
    username?: string;
    phone?: string;
    bot?: boolean;
    scam?: boolean;
    fake?: boolean;
}

export class StringSession {
    private session: string;

    constructor(string: string = '') {
        this.session = string;
    }

    save(): string {
        return this.session;
    }

    load(session: string): void {
        this.session = session;
    }
}

export class TelegramClient {
    public mtproto: MTProto;
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
        this.mtproto = new MTProto({
            api_id: apiId,
            api_hash: apiHash,
            storageOptions: {
                path: path.resolve(__dirname, './storage'),
            }
        });
    }

    async connect(): Promise<void> {
        try {
            await this.mtproto.call('users.getFullUser', {
                id: {
                    _: 'inputUserSelf'
                }
            });
            this.connected = true;
        } catch (error) {
            throw new Error('Failed to connect: ' + (error as Error).message);
        }
    }

    async disconnect(): Promise<void> {
        this.connected = false;
    }

    async sendMessage(
        chatId: string | number,
        options: {
            message: string;
            replyTo?: number;
            silent?: boolean;
            parseMode?: string;
            [key: string]: any;
        }
    ): Promise<Message> {
        try {
            const peer = await this.resolvePeer(chatId);
            const result = await this.mtproto.call('messages.sendMessage', {
                peer: peer,
                message: options.message,
                random_id: Math.ceil(Math.random() * 0xFFFFFFFF),
                silent: options.silent,
                reply_to_msg_id: options.replyTo,
            });

            return {
                id: result.updates?.[0]?.id || 0,
                date: result.updates?.[0]?.date || Date.now() / 1000,
                text: options.message,
            };
        } catch (error) {
            throw new Error('Failed to send message: ' + (error as Error).message);
        }
    }

    async sendFile(
        chatId: string | number,
        options: {
            file: string | Buffer;
            caption?: string;
            silent?: boolean;
            forceDocument?: boolean;
            attributes?: Array<DocumentAttributeVideo | DocumentAttributeAudio>;
            mimeType?: string;
        }
    ): Promise<Message> {
        try {
            const peer = await this.resolvePeer(chatId);
            let fileData: Buffer;

            if (typeof options.file === 'string') {
                fileData = await fsPromises.readFile(options.file);
            } else {
                fileData = options.file;
            }

            const fileName = typeof options.file === 'string' ? path.basename(options.file) : 'file';

            const uploadResult = await this.mtproto.call('upload.saveFile', {
                file: {
                    _: 'inputFile',
                    name: fileName,
                    md5_checksum: '',
                    parts: Math.ceil(fileData.length / 524288), // 512KB chunks
                    bytes: fileData
                }
            });

            const mediaInput = {
                _: 'inputMediaUploadedDocument',
                file: uploadResult,
                mime_type: options.mimeType || 'application/octet-stream',
                attributes: [
                    {
                        _: 'documentAttributeFilename',
                        file_name: fileName
                    },
                    ...(options.attributes || [])
                ],
                force_file: options.forceDocument
            };

            const result = await this.mtproto.call('messages.sendMedia', {
                peer: peer,
                media: mediaInput,
                message: options.caption || '',
                random_id: Math.ceil(Math.random() * 0xFFFFFFFF),
                silent: options.silent,
            });

            return {
                id: result.updates?.[0]?.id || 0,
                date: result.updates?.[0]?.date || Date.now() / 1000,
                text: options.caption || '',
            };
        } catch (error) {
            throw new Error('Failed to send file: ' + (error as Error).message);
        }
    }

    async getMessages(
        chatId: string | number,
        options: {
            limit?: number;
            search?: string;
        } = {}
    ): Promise<Message[]> {
        try {
            const peer = await this.resolvePeer(chatId);
            const result = await this.mtproto.call('messages.getHistory', {
                peer: peer,
                limit: options.limit || 100,
                offset_id: 0,
                offset_date: 0,
                add_offset: 0,
                max_id: 0,
                min_id: 0,
                hash: 0,
            });

            return result.messages.map((msg: any) => ({
                id: msg.id,
                date: msg.date,
                text: msg.message,
                fromId: msg.from_id,
            }));
        } catch (error) {
            throw new Error('Failed to get messages: ' + (error as Error).message);
        }
    }

    async deleteMessages(
        chatId: string | number,
        messageIds: number[],
        options: {
            revoke?: boolean;
        } = {}
    ): Promise<void> {
        try {
            const peer = await this.resolvePeer(chatId);
            await this.mtproto.call('messages.deleteMessages', {
                id: messageIds,
                revoke: options.revoke
            });
        } catch (error) {
            throw new Error('Failed to delete messages: ' + (error as Error).message);
        }
    }

    async getParticipants(
        chatId: string | number,
        options: {
            limit?: number;
        } = {}
    ): Promise<ChatMember[]> {
        try {
            const peer = await this.resolvePeer(chatId);
            const result = await this.mtproto.call('channels.getParticipants', {
                channel: peer,
                filter: { _: 'channelParticipantsRecent' },
                offset: 0,
                limit: options.limit || 100,
                hash: 0,
            });

            return result.users.map((user: any) => ({
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                phone: user.phone,
                bot: user.bot,
                scam: user.scam,
                fake: user.fake,
            }));
        } catch (error) {
            throw new Error('Failed to get participants: ' + (error as Error).message);
        }
    }

    async getEntity(userId: string | number): Promise<any> {
        try {
            const inputUser = await this.resolvePeer(userId);
            const result = await this.mtproto.call('users.getFullUser', {
                id: inputUser,
            });

            const user = result.user;
            return {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                phone: user.phone,
                bot: user.bot,
                verified: user.verified,
                restricted: user.restricted,
                scam: user.scam,
                fake: user.fake,
            };
        } catch (error) {
            throw new Error('Failed to get user info: ' + (error as Error).message);
        }
    }

    async forwardMessages(
        toChatId: string | number,
        options: {
            messages: number[];
            fromPeer: string | number;
        }
    ): Promise<Message[]> {
        try {
            const fromPeer = await this.resolvePeer(options.fromPeer);
            const toPeer = await this.resolvePeer(toChatId);

            const result = await this.mtproto.call('messages.forwardMessages', {
                from_peer: fromPeer,
                to_peer: toPeer,
                id: options.messages,
                random_id: options.messages.map(() => Math.ceil(Math.random() * 0xFFFFFFFF)),
            });

            return result.updates
                .filter((update: any) => update._ === 'updateMessageID')
                .map((update: any) => ({
                    id: update.id,
                    date: Math.floor(Date.now() / 1000),
                }));
        } catch (error) {
            throw new Error('Failed to forward messages: ' + (error as Error).message);
        }
    }

    async joinChannel(chatId: string | number): Promise<void> {
        const peer = await this.resolvePeer(chatId);
        await this.mtproto.call('channels.joinChannel', {
            channel: peer,
        });
    }

    async leaveChannel(chatId: string | number): Promise<void> {
        const peer = await this.resolvePeer(chatId);
        await this.mtproto.call('channels.leaveChannel', {
            channel: peer,
        });
    }

    private async resolvePeer(chatId: string | number): Promise<any> {
        try {
            if (typeof chatId === 'string' && chatId.startsWith('@')) {
                const result = await this.mtproto.call('contacts.resolveUsername', {
                    username: chatId.slice(1),
                });
                return {
                    _: 'inputPeerUser',
                    user_id: result.users[0].id,
                    access_hash: result.users[0].access_hash,
                };
            } else {
                return {
                    _: 'inputPeerChat',
                    chat_id: Number(chatId),
                };
            }
        } catch (error) {
            throw new Error('Failed to resolve peer: ' + (error as Error).message);
        }
    }
}

// Helper functions for creating document attributes
export const createDocumentAttributes = {
    video: (params: Partial<DocumentAttributeVideo>): DocumentAttributeVideo => ({
        _: 'documentAttributeVideo',
        duration: params.duration || 0,
        w: params.w || 0,
        h: params.h || 0,
        supportsStreaming: params.supportsStreaming || false,
    }),

    audio: (params: Partial<DocumentAttributeAudio>): DocumentAttributeAudio => ({
        _: 'documentAttributeAudio',
        voice: params.voice || false,
        duration: params.duration || 0,
    }),
};

// Export all interfaces
export type { DocumentAttributeVideo, DocumentAttributeAudio, Message, ChatMember };