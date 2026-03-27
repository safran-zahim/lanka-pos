import { Prisma } from '@prisma/client';
import prisma from './prisma';

interface AuditLogData {
    staffId?: number;
    staffName?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValue?: any;
    newValue?: any;
    note?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Logs an action to the AuditLog table.
 * Supports being run inside a Prisma transaction.
 */
export const logAudit = async (
    tx: Prisma.TransactionClient | typeof prisma,
    data: AuditLogData
) => {
    try {
        await (tx as any).auditLog.create({
            data: {
                staffId: data.staffId,
                staffName: data.staffName,
                action: data.action,
                resourceType: data.resourceType,
                resourceId: data.resourceId,
                oldValue: data.oldValue,
                newValue: data.newValue,
                note: data.note,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    } catch (error) {
        console.error('Failed to log audit:', error);
        // We generally don't want to crash the main operation just because auditing failed,
        // unless it's a strict requirement. For now, we just log the error.
    }
};
