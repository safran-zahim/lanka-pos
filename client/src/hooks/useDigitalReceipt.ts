import { useState } from 'react';
import { db } from '../db/db';

interface SendReceiptResult {
    success: boolean;
    message: string;
}

export const useDigitalReceipt = () => {
    const [sending, setSending] = useState(false);

    const sendReceipt = async (transactionId: number, customerPhone: string, receiptData: any): Promise<SendReceiptResult> => {
        setSending(true);
        try {
            // Fetch settings
            const settings = await db.settings.toArray();
            const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, any>);

            const enabled = settingsMap['enableDigitalReceipts'];
            const apiUrl = settingsMap['whatsappApiUrl'];
            const apiKey = settingsMap['whatsappApiKey'];

            if (!enabled) {
                return { success: false, message: 'Digital receipts are disabled.' };
            }

            if (!apiUrl || !apiKey) {
                return { success: false, message: 'Digital receipt API is not configured.' };
            }

            // Simulate API call
            console.log(`Sending receipt for transaction ${transactionId} to ${customerPhone} via ${apiUrl}`);
            console.log('Receipt Data:', receiptData);

            // In a real app, we would make a POST request here
            // const response = await fetch(apiUrl, {
            //     method: 'POST',
            //     headers: {
            //         'Authorization': `Bearer ${apiKey}`,
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify({
            //         phone: customerPhone,
            //         transactionId,
            //         amount: receiptData.totalAmount,
            //         // ... other data
            //     })
            // });

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSending(false);
            return { success: true, message: 'Digital receipt sent successfully!' };

        } catch (error) {
            console.error('Failed to send digital receipt:', error);
            setSending(false);
            return { success: false, message: 'Failed to send receipt. Check console for details.' };
        }
    };

    return { sendReceipt, sending };
};
