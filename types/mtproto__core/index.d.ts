declare module '@mtproto/core' {
    export interface MTProtoOptions {
        api_id: number;
        api_hash: string;
        storageOptions?: {
            path: string;
        };
        customLocalStorage?: {
            get: () => Promise<string>;
            set: (session: string) => Promise<void>;
        };
        test?: boolean;
        dev?: boolean;
    }

    export interface MTProtoError {
        error_code: number;
        error_message: string;
    }

    export class MTProto {
        constructor(options: MTProtoOptions);

        call<T = any>(
            method: string,
            params?: Record<string, any>,
            options?: {
                dcId?: number;
                timeout?: number;
                signal?: AbortSignal;
            }
        ): Promise<T>;

        updates: {
            on(
                event: string,
                callback: (update: any) => void
            ): void;
            off(
                event: string,
                callback?: (update: any) => void
            ): void;
        };

        setDefaultDc(dcId: number): void;
    }

    export interface UpdatesState {
        seq: number;
        pts: number;
        date: number;
    }

    export interface Update {
        _: string;
        pts?: number;
        pts_count?: number;
        [key: string]: any;
    }

    export interface Message {
        _: 'message';
        id: number;
        from_id: {
            _: string;
            user_id: number;
        };
        peer_id: {
            _: string;
            [key: string]: any;
        };
        date: number;
        message: string;
        media?: any;
        reply_to?: {
            reply_to_msg_id: number;
        };
    }

    export interface User {
        _: 'user';
        id: number;
        access_hash: string;
        first_name?: string;
        last_name?: string;
        username?: string;
        phone?: string;
        photo?: any;
    }

    export interface Chat {
        _: 'chat' | 'channel';
        id: number;
        title: string;
        photo?: any;
        participants_count?: number;
        date: number;
        version: number;
        migrated_to?: any;
        admin_rights?: any;
        default_banned_rights?: any;
        access_hash?: string;
    }
}