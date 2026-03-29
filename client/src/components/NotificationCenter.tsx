import { useState, useRef, useEffect } from 'react';
import { Bell, CheckSquare, Trash2, Info, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import type { AppNotification } from '../store/useNotificationStore';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';

export const NotificationCenter = () => {
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-emerald-500 shrink-0" size={16} />;
            case 'warning': return <AlertTriangle className="text-amber-500 shrink-0" size={16} />;
            case 'error':   return <AlertOctagon  className="text-red-500 shrink-0"   size={16} />;
            default:        return <Info           className="text-primary shrink-0"  size={16} />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell trigger */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="relative h-9 w-9 p-0 rounded-full"
                title="Notifications"
                type="button"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                    <Card className="shadow-xl overflow-hidden max-h-[480px] flex flex-col gap-0 py-0">
                        {/* Header */}
                        <CardHeader className="px-4 py-3 border-b flex-row items-center justify-between border-b-border">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                Notifications
                                {unreadCount > 0 && (
                                    <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                                        {unreadCount} new
                                    </Badge>
                                )}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAllAsRead()}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                    title="Mark all as read"
                                    type="button"
                                >
                                    <CheckSquare size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearAll()}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                    title="Clear all"
                                    type="button"
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </CardHeader>

                        {/* Body */}
                        <CardContent className="px-0 overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                                    <Bell size={40} className="opacity-30" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => {
                                                markAsRead(n.id);
                                                if (n.link) {
                                                    navigate(n.link);
                                                    setIsOpen(false);
                                                }
                                            }}
                                            className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors hover:bg-muted/60 ${!n.read ? 'bg-primary/5' : ''}`}
                                        >
                                            <div className="mt-0.5">{getIcon(n.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold leading-tight truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {n.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                                    {n.message}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/70 mt-1.5 font-medium">
                                                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {!n.read && (
                                                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>

                        {notifications.length > 0 && (
                            <CardFooter className="px-4 py-2 justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsOpen(false)}
                                    className="text-xs text-muted-foreground h-7"
                                    type="button"
                                >
                                    Close Panel
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};
