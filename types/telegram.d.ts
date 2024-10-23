declare module 'telegram/tl' {
    class DocumentAttributeVideo {
        constructor(options: {
            supportsStreaming?: boolean;
            duration?: number;
            w?: number;
            h?: number;
        });
    }

    class DocumentAttributeAudio {
        constructor(options: {
            voice?: boolean;
            duration?: number;
        });
    }

    class JoinChannel {
        constructor(options: {
            channel: any;
        });
    }

    class LeaveChannel {
        constructor(options: {
            channel: any;
        });
    }

    // הגדרת namespace channels
    namespace channels {
        export { JoinChannel, LeaveChannel };
    }

    // הגדרת namespace Api
    export const Api: {
        DocumentAttributeVideo: typeof DocumentAttributeVideo;
        DocumentAttributeAudio: typeof DocumentAttributeAudio;
        channels: typeof channels;
    };
}

declare module 'telegram' {
    export class TelegramClient {
        constructor(
            session: any,
            apiId: number,
            apiHash: string,
            options?: {
                connectionRetries?: number;
                useWSS?: boolean;
                [key: string]: any;
            }
        );

        connect(): Promise<void>;
        disconnect(): Promise<void>;
        sendMessage(
            entity: string | number,
            options: {
                message: string;
                replyTo?: number;
                silent?: boolean;
                parseMode?: string;
                [key: string]: any;
            }
        ): Promise<any>;
        
        getMessages(
            entity: string | number,
            options?: {
                limit?: number;
                search?: string;
                [key: string]: any;
            }
        ): Promise<any[]>;

        getParticipants(
            entity: string | number,
            options?: {
                limit?: number;
                [key: string]: any;
            }
        ): Promise<any[]>;

        getEntity(entity: string | number): Promise<any>;

        invoke<T>(request: any): Promise<T>;

        sendFile(
            entity: string | number,
            options: {
                file: string;
                caption?: string;
                silent?: boolean;
                forceDocument?: boolean;
                attributes?: any[];
                [key: string]: any;
            }
        ): Promise<any>;

        deleteMessages(
            entity: string | number,
            messageIds: number[],
            options?: {
                revoke?: boolean;
                [key: string]: any;
            }
        ): Promise<void>;

        forwardMessages(
            entity: string | number,
            options: {
                messages: number[];
                fromPeer: string | number;
                [key: string]: any;
            }
        ): Promise<any[]>;

        getInputEntity(entity: string | number): Promise<any>;

        connected: boolean;
    }
}

declare module 'telegram/sessions' {
    export class StringSession {
        constructor(string?: string);
        save(): string;
    }
}